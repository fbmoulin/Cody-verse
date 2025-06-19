const { Pool } = require('pg');

class DatabaseConnectionPool {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000;
  }

  async initialize() {
    if (this.isInitialized) return this.pool;

    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        min: 2,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 30000,
        acquireTimeoutMillis: 15000,
        allowExitOnIdle: true,
        keepAlive: true,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      this.connectionAttempts = 0;
      console.log('Database connection pool initialized successfully');
      
      // Setup error handlers
      this.pool.on('error', this.handlePoolError.bind(this));
      this.pool.on('connect', () => {
        console.log('New database connection established');
      });

      return this.pool;
    } catch (error) {
      console.error('Failed to initialize database pool:', error.message);
      await this.handleConnectionFailure();
      throw error;
    }
  }

  async handlePoolError(error) {
    console.error('Database pool error:', error.message);
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      await this.reconnect();
    }
  }

  async handleConnectionFailure() {
    this.connectionAttempts++;
    if (this.connectionAttempts < this.maxRetries) {
      console.log(`Retrying database connection in ${this.retryDelay}ms (attempt ${this.connectionAttempts}/${this.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.initialize();
    } else {
      console.error('Max connection retries reached. Database operations will be limited.');
      this.isInitialized = false;
    }
  }

  async reconnect() {
    console.log('Attempting to reconnect to database...');
    this.isInitialized = false;
    if (this.pool) {
      await this.pool.end();
    }
    await this.initialize();
  }

  async query(text, params = []) {
    if (!this.isInitialized || !this.pool) {
      throw new Error('Database pool not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 5000) {
        console.warn(`Slow query detected: ${duration}ms - ${text.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error.message);
      if (error.code === 'ECONNRESET') {
        await this.reconnect();
        return this.query(text, params);
      }
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.isInitialized || !this.pool) {
      throw new Error('Database pool not initialized');
    }

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

  async healthCheck() {
    try {
      if (!this.pool) return { healthy: false, error: 'Pool not initialized' };
      
      const start = Date.now();
      await this.pool.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        healthy: true,
        responseTime,
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingConnections: this.pool.waitingCount
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isInitialized = false;
      console.log('Database connection pool closed');
    }
  }
}

module.exports = new DatabaseConnectionPool();