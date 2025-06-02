const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl,
      max: 10,
      min: 2,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
      acquireTimeoutMillis: 5000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 1000,
      statement_timeout: 10000,
      query_timeout: 8000
    });

    this.migrationState = {
      isInitialized: false,
      currentVersion: 0,
      availableMigrations: []
    };

    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async initialize() {
    try {
      console.log('Initializing database manager...');
      
      await this.testConnection();
      await this.setupMigrationsTable();
      await this.discoverMigrations();
      await this.runPendingMigrations();
      await this.validateSchema();
      
      this.migrationState.isInitialized = true;
      console.log('Database manager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize database manager:', error);
      throw error;
    }
  }

  async testConnection() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      console.log(`Database connected: ${result.rows[0].current_time}`);
      console.log(`PostgreSQL version: ${result.rows[0].db_version.split(' ')[1]}`);
      return true;
    } finally {
      client.release();
    }
  }

  async setupMigrationsTable() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          execution_time_ms INTEGER,
          checksum VARCHAR(64)
        )
      `);
      console.log('Migration tracking table ready');
    } finally {
      client.release();
    }
  }

  async discoverMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    try {
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => {
          const [version, ...nameParts] = file.replace('.sql', '').split('_');
          return {
            version,
            name: nameParts.join('_'),
            filename: file,
            path: path.join(migrationsDir, file)
          };
        });

      this.migrationState.availableMigrations = migrationFiles;
      console.log(`Discovered ${migrationFiles.length} migration files`);
      
      return migrationFiles;
    } catch (error) {
      console.warn('No migrations directory found, creating it...');
      await fs.mkdir(migrationsDir, { recursive: true });
      return [];
    }
  }

  async getExecutedMigrations() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT version FROM schema_migrations ORDER BY version');
      return result.rows.map(row => row.version);
    } finally {
      client.release();
    }
  }

  async runPendingMigrations() {
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = this.migrationState.availableMigrations
      .filter(migration => !executedMigrations.includes(migration.version));

    if (pendingMigrations.length === 0) {
      console.log('All migrations are up to date');
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }

    console.log('All pending migrations completed');
  }

  async executeMigration(migration) {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      console.log(`Executing migration ${migration.version}: ${migration.name}`);
      
      const migrationSQL = await fs.readFile(migration.path, 'utf8');
      
      const checksum = require('crypto')
        .createHash('sha256')
        .update(migrationSQL)
        .digest('hex')
        .substring(0, 16);
      
      await client.query('BEGIN');
      
      try {
        await client.query(migrationSQL);
        
        const executionTime = Date.now() - startTime;
        await client.query(
          'INSERT INTO schema_migrations (version, name, execution_time_ms, checksum) VALUES ($1, $2, $3, $4)',
          [migration.version, migration.name, executionTime, checksum]
        );
        
        await client.query('COMMIT');
        console.log(`Migration ${migration.version} completed in ${executionTime}ms`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async validateSchema() {
    const client = await this.pool.connect();
    try {
      const criticalTables = [
        'users', 'course_modules', 'lessons', 
        'user_module_progress', 'user_lesson_progress',
        'achievements', 'user_achievements', 'cody_interactions'
      ];

      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name = ANY($1)
      `;
      
      const result = await client.query(tableCheckQuery, [criticalTables]);
      const existingTables = result.rows.map(row => row.table_name);
      const missingTables = criticalTables.filter(table => !existingTables.includes(table));

      if (missingTables.length > 0) {
        throw new Error(`Missing critical tables: ${missingTables.join(', ')}`);
      }

      console.log('Schema validation passed');
      return true;
      
    } finally {
      client.release();
    }
  }

  async query(text, params = []) {
    const start = Date.now();
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', {
        query: text.substring(0, 100),
        params: params.slice(0, 5),
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getHealthStatus() {
    try {
      const client = await this.pool.connect();
      const startTime = Date.now();
      
      try {
        await client.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        const poolInfo = {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        };
        
        return {
          status: 'healthy',
          responseTime,
          pool: poolInfo,
          migrations: {
            initialized: this.migrationState.isInitialized,
            currentVersion: this.migrationState.currentVersion,
            availableMigrations: this.migrationState.availableMigrations.length
          }
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        }
      };
    }
  }

  async close() {
    try {
      await this.pool.end();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

module.exports = DatabaseManager;