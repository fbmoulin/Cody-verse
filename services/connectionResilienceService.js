const { Pool } = require('pg');

class ConnectionResilienceService {
  constructor() {
    this.primaryPool = null;
    this.fallbackConnections = new Map();
    this.circuitBreaker = {
      isOpen: false,
      failures: 0,
      lastFailure: null,
      threshold: 5,
      timeout: 30000
    };
    this.connectionHealth = {
      primary: true,
      lastCheck: Date.now(),
      checkInterval: 10000
    };
  }

  async initializeResilientConnection() {
    const baseConfig = {
      connectionString: process.env.DATABASE_URL,
      max: 15,
      min: 3,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 8000,
      query_timeout: 6000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
      ssl: { rejectUnauthorized: false }
    };

    this.primaryPool = new Pool(baseConfig);
    
    this.setupConnectionMonitoring();
    await this.validatePrimaryConnection();
    this.startHealthChecking();
    
    const logger = require('../server/logger');
    logger.info('Resilient database connection initialized');
  }

  setupConnectionMonitoring() {
    this.primaryPool.on('error', (err) => {
      this.handleConnectionError(err);
    });

    this.primaryPool.on('connect', () => {
      this.connectionHealth.primary = true;
      this.resetCircuitBreaker();
    });
  }

  async validatePrimaryConnection() {
    try {
      const client = await this.primaryPool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  handleConnectionError(error) {
    this.connectionHealth.primary = false;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      
      const logger = require('../server/logger');
      logger.error('Circuit breaker opened due to connection failures', {
        failures: this.circuitBreaker.failures,
        error: error.message
      });
    }
  }

  resetCircuitBreaker() {
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.lastFailure = null;
  }

  startHealthChecking() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.connectionHealth.checkInterval);
  }

  async performHealthCheck() {
    try {
      const client = await this.primaryPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.connectionHealth.primary = true;
      this.connectionHealth.lastCheck = Date.now();
      
      if (this.circuitBreaker.isOpen) {
        const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailure;
        if (timeSinceFailure > this.circuitBreaker.timeout) {
          this.resetCircuitBreaker();
          
          const logger = require('../server/logger');
          logger.info('Circuit breaker reset - connection restored');
        }
      }
    } catch (error) {
      this.connectionHealth.primary = false;
      
      const logger = require('../server/logger');
      logger.warn('Health check failed', { error: error.message });
    }
  }

  async executeQuery(sql, params = []) {
    if (this.circuitBreaker.isOpen) {
      throw new Error('Circuit breaker is open - database unavailable');
    }

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.primaryPool.connect();
        
        try {
          const result = await client.query(sql, params);
          client.release();
          return result;
        } catch (queryError) {
          client.release(true); // Release with error flag
          throw queryError;
        }
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const logger = require('../server/logger');
          logger.warn(`Query retry attempt ${attempt}`, {
            error: error.message,
            sql: sql.substring(0, 50)
          });
        }
      }
    }

    this.handleConnectionError(lastError);
    throw lastError;
  }

  async transaction(callback) {
    if (this.circuitBreaker.isOpen) {
      throw new Error('Circuit breaker is open - database unavailable');
    }

    const client = await this.primaryPool.connect();
    
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

  getConnectionStatus() {
    return {
      primary: this.connectionHealth.primary,
      circuitBreaker: {
        isOpen: this.circuitBreaker.isOpen,
        failures: this.circuitBreaker.failures
      },
      poolStats: {
        totalConnections: this.primaryPool?.totalCount || 0,
        idleConnections: this.primaryPool?.idleCount || 0,
        waitingClients: this.primaryPool?.waitingCount || 0
      },
      lastHealthCheck: this.connectionHealth.lastCheck
    };
  }

  async gracefulShutdown() {
    if (this.primaryPool) {
      await this.primaryPool.end();
    }
    
    for (const [key, pool] of this.fallbackConnections) {
      await pool.end();
    }
    
    const logger = require('../server/logger');
    logger.info('Database connections closed gracefully');
  }
}

module.exports = new ConnectionResilienceService();