const { Pool } = require('pg');

class DatabaseOptimizationService {
  constructor() {
    this.connectionPool = null;
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    this.performanceMetrics = {
      queryTimes: [],
      connectionErrors: 0,
      successfulQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  async initializeOptimizedConnection() {
    const config = {
      connectionString: process.env.DATABASE_URL,
      max: 20,                    // Maximum connections in pool
      min: 5,                     // Minimum connections to maintain
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 3000, // Timeout for new connections
      statement_timeout: 15000,   // Query timeout
      query_timeout: 12000,       // Individual query timeout
      application_name: 'codyverse_optimized',
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: {
        rejectUnauthorized: false
      }
    };

    this.connectionPool = new Pool(config);
    
    // Setup connection event handlers
    this.setupConnectionHandlers();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Test initial connection
    await this.validateConnection();
    
    const logger = require('../server/logger');
    logger.info('Optimized database connection pool initialized', {
      maxConnections: config.max,
      minConnections: config.min,
      timeout: config.connectionTimeoutMillis
    });
  }

  setupConnectionHandlers() {
    this.connectionPool.on('connect', (client) => {
      const logger = require('../server/logger');
      logger.debug('New database client connected', { 
        totalCount: this.connectionPool.totalCount,
        idleCount: this.connectionPool.idleCount 
      });
    });

    this.connectionPool.on('error', (err, client) => {
      const logger = require('../server/logger');
      logger.error('Database pool error', { 
        error: err.message,
        code: err.code,
        totalCount: this.connectionPool.totalCount 
      });
      
      this.performanceMetrics.connectionErrors++;
      this.handleConnectionError(err);
    });

    this.connectionPool.on('remove', (client) => {
      const logger = require('../server/logger');
      logger.debug('Database client removed from pool', {
        totalCount: this.connectionPool.totalCount,
        idleCount: this.connectionPool.idleCount
      });
    });
  }

  async handleConnectionError(error) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      const logger = require('../server/logger');
      logger.warn(`Attempting database reconnection in ${delay}ms`, {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      
      setTimeout(async () => {
        try {
          await this.validateConnection();
          this.reconnectAttempts = 0; // Reset on successful connection
          logger.info('Database reconnection successful');
        } catch (reconnectError) {
          logger.error('Database reconnection failed', { error: reconnectError.message });
        }
      }, delay);
    } else {
      const logger = require('../server/logger');
      logger.error('Max reconnection attempts exceeded', {
        attempts: this.reconnectAttempts,
        error: error.message
      });
    }
  }

  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        const logger = require('../server/logger');
        logger.warn('Database health check failed', { error: error.message });
      }
    }, 30000); // Check every 30 seconds
  }

  async performHealthCheck() {
    const startTime = Date.now();
    
    try {
      const result = await this.connectionPool.query('SELECT 1 as health_check');
      const duration = Date.now() - startTime;
      
      this.updatePerformanceMetrics(duration, true);
      
      if (duration > 5000) { // Slow query warning
        const logger = require('../server/logger');
        logger.warn('Slow health check detected', { duration });
      }
      
      return { healthy: true, responseTime: duration };
    } catch (error) {
      this.updatePerformanceMetrics(Date.now() - startTime, false);
      throw error;
    }
  }

  async optimizedQuery(sql, params = [], cacheKey = null, cacheDuration = this.cacheTimeout) {
    const startTime = Date.now();
    
    // Check cache first
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheDuration) {
        this.performanceMetrics.cacheHits++;
        return cached.data;
      } else {
        this.queryCache.delete(cacheKey); // Remove expired cache
      }
    }

    try {
      // Execute query with retry logic
      const result = await this.executeWithRetry(sql, params);
      const duration = Date.now() - startTime;
      
      this.updatePerformanceMetrics(duration, true);
      
      // Cache successful results
      if (cacheKey && result.rows) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        this.performanceMetrics.cacheMisses++;
      }
      
      // Log slow queries
      if (duration > 1000) {
        const logger = require('../server/logger');
        logger.warn('Slow query detected', { 
          duration, 
          sql: sql.substring(0, 100),
          params: params?.length || 0 
        });
      }
      
      return result;
    } catch (error) {
      this.updatePerformanceMetrics(Date.now() - startTime, false);
      
      const logger = require('../server/logger');
      logger.error('Database query failed', { 
        error: error.message,
        sql: sql.substring(0, 100),
        duration: Date.now() - startTime 
      });
      
      throw error;
    }
  }

  async executeWithRetry(sql, params, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.connectionPool.query(sql, params);
      } catch (error) {
        lastError = error;
        
        // Don't retry on syntax errors or constraint violations
        if (error.code === '42601' || error.code === '23505' || error.code === '23503') {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = 100 * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const logger = require('../server/logger');
          logger.warn(`Query retry attempt ${attempt}`, { 
            error: error.message,
            nextRetryIn: delay * 2 
          });
        }
      }
    }
    
    throw lastError;
  }

  async transaction(callback) {
    const client = await this.connectionPool.connect();
    
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

  updatePerformanceMetrics(duration, success) {
    if (success) {
      this.performanceMetrics.successfulQueries++;
      this.performanceMetrics.queryTimes.push(duration);
      
      // Keep only last 1000 query times for memory efficiency
      if (this.performanceMetrics.queryTimes.length > 1000) {
        this.performanceMetrics.queryTimes = this.performanceMetrics.queryTimes.slice(-1000);
      }
    }
  }

  getPerformanceStats() {
    const queryTimes = this.performanceMetrics.queryTimes;
    
    if (queryTimes.length === 0) {
      return {
        avgQueryTime: 0,
        medianQueryTime: 0,
        p95QueryTime: 0,
        totalQueries: 0,
        successRate: 0,
        cacheHitRate: 0
      };
    }
    
    const sorted = [...queryTimes].sort((a, b) => a - b);
    const totalQueries = this.performanceMetrics.successfulQueries + this.performanceMetrics.connectionErrors;
    const totalCacheRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
    
    return {
      avgQueryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
      medianQueryTime: sorted[Math.floor(sorted.length / 2)],
      p95QueryTime: sorted[Math.floor(sorted.length * 0.95)],
      totalQueries: totalQueries,
      successRate: totalQueries > 0 ? (this.performanceMetrics.successfulQueries / totalQueries) : 0,
      cacheHitRate: totalCacheRequests > 0 ? (this.performanceMetrics.cacheHits / totalCacheRequests) : 0,
      poolStats: {
        totalConnections: this.connectionPool?.totalCount || 0,
        idleConnections: this.connectionPool?.idleCount || 0,
        waitingClients: this.connectionPool?.waitingCount || 0
      }
    };
  }

  async validateConnection() {
    if (!this.connectionPool) {
      throw new Error('Connection pool not initialized');
    }
    
    const result = await this.connectionPool.query('SELECT NOW() as current_time, version() as postgres_version');
    return result.rows[0];
  }

  clearCache() {
    this.queryCache.clear();
    const logger = require('../server/logger');
    logger.info('Database query cache cleared');
  }

  async gracefulShutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.connectionPool) {
      await this.connectionPool.end();
      const logger = require('../server/logger');
      logger.info('Database connection pool closed gracefully');
    }
  }

  // Optimized query builders for common operations
  async optimizedSelect(table, conditions = {}, options = {}) {
    const { 
      columns = '*', 
      limit, 
      offset, 
      orderBy, 
      cacheKey,
      cacheDuration 
    } = options;
    
    let sql = `SELECT ${columns} FROM ${table}`;
    const params = [];
    let paramCount = 0;
    
    // Build WHERE clause
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = $${++paramCount}`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }
    
    // Add ORDER BY
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    // Add LIMIT and OFFSET
    if (limit) {
      sql += ` LIMIT $${++paramCount}`;
      params.push(limit);
    }
    
    if (offset) {
      sql += ` OFFSET $${++paramCount}`;
      params.push(offset);
    }
    
    return await this.optimizedQuery(sql, params, cacheKey, cacheDuration);
  }

  async batchInsert(table, records, chunkSize = 100) {
    if (!records || records.length === 0) {
      return { insertedCount: 0 };
    }
    
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }
    
    let totalInserted = 0;
    
    for (const chunk of chunks) {
      const columns = Object.keys(chunk[0]);
      const values = chunk.map((record, index) => {
        const placeholders = columns.map((_, colIndex) => 
          `$${index * columns.length + colIndex + 1}`
        ).join(', ');
        return `(${placeholders})`;
      }).join(', ');
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values}`;
      const params = chunk.flatMap(record => Object.values(record));
      
      const result = await this.optimizedQuery(sql, params);
      totalInserted += result.rowCount;
    }
    
    return { insertedCount: totalInserted };
  }
}

module.exports = new DatabaseOptimizationService();