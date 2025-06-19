const BaseService = require('./BaseService');
const { Pool } = require('pg');
const logger = require('../server/logger');

/**
 * Robust Database Manager - Enhanced database connection with resilience patterns
 */
class RobustDatabaseManager extends BaseService {
  constructor(config) {
    super('RobustDatabaseManager');
    this.config = config;
    this.pool = null;
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.healthCheckInterval = null;
    this.queryQueue = [];
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      timeout: 60000, // 1 minute
      lastFailure: null,
      state: 'closed' // closed, open, half-open
    };
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl,
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        acquireTimeoutMillis: 60000,
        // Enhanced connection options for stability
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        statement_timeout: 30000,
        query_timeout: 30000,
        application_name: 'codyverse_robust_connection',
        // Connection validation
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      });

      this.setupPoolErrorHandlers();
      await this.testConnection();
      this.startHealthChecks();
      
      logger.info('Robust database manager initialized', {
        category: 'database',
        poolSize: this.pool.totalCount,
        idleCount: this.pool.idleCount
      });

    } catch (error) {
      logger.error('Failed to initialize robust database manager', {
        error: error.message,
        category: 'database'
      });
      this.scheduleReconnection();
    }
  }

  setupPoolErrorHandlers() {
    this.pool.on('error', (err) => {
      logger.error('Database pool error', {
        error: err.message,
        category: 'database'
      });
      this.handleConnectionError(err);
    });

    this.pool.on('connect', (client) => {
      logger.info('New database client connected', {
        category: 'database',
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount
      });
    });

    this.pool.on('acquire', (client) => {
      logger.debug('Database client acquired from pool', {
        category: 'database'
      });
    });

    this.pool.on('remove', (client) => {
      logger.info('Database client removed from pool', {
        category: 'database',
        totalCount: this.pool.totalCount
      });
    });
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();
      
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.resetCircuitBreaker();
      
      logger.info('Database connection test successful', {
        category: 'database',
        serverTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0]
      });
      
      return true;
    } catch (error) {
      this.connectionState = 'error';
      this.handleConnectionError(error);
      throw error;
    }
  }

  handleConnectionError(error) {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open';
      logger.warn('Database circuit breaker opened', {
        failures: this.circuitBreaker.failures,
        category: 'database'
      });
    }

    logger.error('Database connection error', {
      error: error.message,
      failures: this.circuitBreaker.failures,
      state: this.circuitBreaker.state,
      category: 'database'
    });

    this.scheduleReconnection();
  }

  async scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', {
        attempts: this.reconnectAttempts,
        category: 'database'
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    logger.info('Scheduling database reconnection', {
      attempt: this.reconnectAttempts,
      delay: delay,
      category: 'database'
    });

    setTimeout(async () => {
      try {
        await this.reconnect();
      } catch (error) {
        logger.error('Reconnection attempt failed', {
          attempt: this.reconnectAttempts,
          error: error.message,
          category: 'database'
        });
        this.scheduleReconnection();
      }
    }, delay);
  }

  async reconnect() {
    logger.info('Attempting database reconnection', {
      attempt: this.reconnectAttempts,
      category: 'database'
    });

    if (this.pool) {
      try {
        await this.pool.end();
      } catch (error) {
        logger.warn('Error closing existing pool', { error: error.message });
      }
    }

    await this.initializeConnection();
    
    // Process queued queries if reconnection successful
    if (this.connectionState === 'connected') {
      await this.processQueuedQueries();
    }
  }

  async processQueuedQueries() {
    if (this.queryQueue.length === 0) return;

    logger.info('Processing queued database queries', {
      queueSize: this.queryQueue.length,
      category: 'database'
    });

    const queue = [...this.queryQueue];
    this.queryQueue = [];

    for (const queuedQuery of queue) {
      try {
        const result = await this.executeQuery(queuedQuery.text, queuedQuery.params);
        queuedQuery.resolve(result);
      } catch (error) {
        queuedQuery.reject(error);
      }
    }
  }

  isCircuitOpen() {
    if (this.circuitBreaker.state === 'open') {
      const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailure;
      if (timeSinceFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'half-open';
        logger.info('Database circuit breaker moved to half-open', {
          category: 'database'
        });
        return false;
      }
      return true;
    }
    return false;
  }

  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailure = null;
    this.circuitBreaker.state = 'closed';
  }

  async executeQuery(text, params = [], options = {}) {
    if (this.isCircuitOpen()) {
      const error = new Error('Database circuit breaker is open - service temporarily unavailable');
      error.code = 'CIRCUIT_OPEN';
      throw error;
    }

    // Queue query if not connected
    if (this.connectionState !== 'connected') {
      if (options.allowQueue !== false) {
        return new Promise((resolve, reject) => {
          this.queryQueue.push({
            text,
            params,
            resolve,
            reject,
            queuedAt: Date.now()
          });
          
          logger.info('Query queued due to connection issues', {
            queueSize: this.queryQueue.length,
            category: 'database'
          });
        });
      } else {
        throw new Error('Database not connected and queuing disabled');
      }
    }

    const startTime = Date.now();
    let client;

    try {
      client = await this.pool.connect();
      const result = await client.query(text, params);
      const duration = Date.now() - startTime;
      
      // Reset circuit breaker on successful query
      if (this.circuitBreaker.state === 'half-open') {
        this.resetCircuitBreaker();
        logger.info('Database circuit breaker reset after successful query', {
          category: 'database'
        });
      }

      logger.debug('Database query executed successfully', {
        duration,
        rowCount: result.rowCount,
        category: 'database'
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Database query failed', {
        error: error.message,
        duration,
        category: 'database'
      });

      this.handleConnectionError(error);
      throw error;

    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async executeTransaction(operations) {
    if (this.isCircuitOpen()) {
      throw new Error('Database circuit breaker is open - transactions unavailable');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const operation of operations) {
        const result = await client.query(operation.text, operation.params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      
      logger.info('Database transaction completed successfully', {
        operationCount: operations.length,
        category: 'database'
      });
      
      return results;

    } catch (error) {
      await client.query('ROLLBACK');
      
      logger.error('Database transaction rolled back', {
        error: error.message,
        operationCount: operations.length,
        category: 'database'
      });
      
      this.handleConnectionError(error);
      throw error;

    } finally {
      client.release();
    }
  }

  startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.warn('Database health check failed', {
          error: error.message,
          category: 'database'
        });
      }
    }, 60000); // Every minute

    logger.info('Database health checks started', {
      interval: '1 minute',
      category: 'database'
    });
  }

  async performHealthCheck() {
    try {
      const result = await this.executeQuery('SELECT 1 as health, NOW() as check_time', [], { allowQueue: false });
      
      const poolStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };

      logger.debug('Database health check passed', {
        checkTime: result.rows[0].check_time,
        poolStats,
        category: 'database'
      });

      return {
        healthy: true,
        checkTime: result.rows[0].check_time,
        poolStats
      };

    } catch (error) {
      logger.warn('Database health check failed', {
        error: error.message,
        category: 'database'
      });
      
      return {
        healthy: false,
        error: error.message,
        checkTime: new Date().toISOString()
      };
    }
  }

  getConnectionStats() {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      queuedQueries: this.queryQueue.length,
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailure: this.circuitBreaker.lastFailure
      },
      pool: this.pool ? {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      } : null
    };
  }

  async close() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      try {
        await this.pool.end();
        logger.info('Database pool closed successfully', {
          category: 'database'
        });
      } catch (error) {
        logger.error('Error closing database pool', {
          error: error.message,
          category: 'database'
        });
      }
    }

    this.connectionState = 'disconnected';
  }
}

module.exports = RobustDatabaseManager;