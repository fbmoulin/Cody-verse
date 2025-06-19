const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Database Optimizer - Optimizes database connections and queries for production
 */
class DatabaseOptimizer extends BaseService {
  constructor() {
    super('DatabaseOptimizer');
    this.connectionPool = null;
    this.queryCache = new Map();
    this.connectionStats = {
      created: 0,
      destroyed: 0,
      errors: 0,
      queries: 0,
      slowQueries: 0
    };
    this.config = {
      pool: {
        min: 2,
        max: 15,
        acquireTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 5000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      },
      query: {
        timeout: 10000,
        cacheEnabled: true,
        cacheTTL: 300000, // 5 minutes
        slowQueryThreshold: 1000,
        maxRetries: 3
      },
      health: {
        checkInterval: 30000,
        timeout: 5000,
        retryInterval: 10000
      }
    };
  }

  async initializeOptimizedPool() {
    try {
      logger.info('Initializing optimized database pool', {
        category: 'database_optimization',
        config: this.config.pool
      });

      // Import Drizzle and create optimized connection
      const { drizzle } = require('drizzle-orm/postgres-js');
      const postgres = require('postgres');

      // Create optimized postgres connection
      const sql = postgres(process.env.DATABASE_URL, {
        max: this.config.pool.max,
        idle_timeout: this.config.pool.idleTimeoutMillis / 1000,
        connect_timeout: this.config.pool.createTimeoutMillis / 1000,
        prepare: true, // Enable prepared statements
        transform: {
          undefined: null // Transform undefined to null
        },
        onnotice: (notice) => {
          logger.debug('PostgreSQL notice', {
            category: 'database',
            notice: notice.message
          });
        },
        connection: {
          application_name: 'codyverse-production'
        }
      });

      this.connectionPool = drizzle(sql);

      // Setup connection monitoring
      this.setupConnectionMonitoring();

      // Setup query optimization
      this.setupQueryOptimization();

      // Start health monitoring
      this.startHealthMonitoring();

      logger.info('Optimized database pool initialized successfully', {
        category: 'database_optimization'
      });

      return this.connectionPool;
    } catch (error) {
      logger.error('Failed to initialize optimized database pool', {
        category: 'database_optimization',
        error: error.message
      });
      throw error;
    }
  }

  setupConnectionMonitoring() {
    // Monitor connection lifecycle
    const originalQuery = this.connectionPool.query;
    
    this.connectionPool.query = async (...args) => {
      const startTime = Date.now();
      this.connectionStats.queries++;

      try {
        const result = await originalQuery.apply(this.connectionPool, args);
        const duration = Date.now() - startTime;

        if (duration > this.config.query.slowQueryThreshold) {
          this.connectionStats.slowQueries++;
          logger.warn('Slow query detected', {
            category: 'database_performance',
            duration,
            query: args[0]?.toString?.().substring(0, 200)
          });
        }

        return result;
      } catch (error) {
        this.connectionStats.errors++;
        logger.error('Database query error', {
          category: 'database_error',
          error: error.message,
          query: args[0]?.toString?.().substring(0, 200)
        });
        throw error;
      }
    };

    logger.info('Database connection monitoring enabled', {
      category: 'database_optimization'
    });
  }

  setupQueryOptimization() {
    // Query caching wrapper
    this.cachedQuery = async (queryKey, queryFn, ttl = this.config.query.cacheTTL) => {
      if (!this.config.query.cacheEnabled) {
        return await queryFn();
      }

      // Check cache
      const cached = this.queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < ttl) {
        logger.debug('Query cache hit', {
          category: 'database_cache',
          key: queryKey
        });
        return cached.data;
      }

      // Execute query
      const data = await queryFn();
      
      // Cache result
      this.queryCache.set(queryKey, {
        data,
        timestamp: Date.now()
      });

      // Cleanup old cache entries
      this.cleanupQueryCache();

      logger.debug('Query cached', {
        category: 'database_cache',
        key: queryKey,
        cacheSize: this.queryCache.size
      });

      return data;
    };

    // Setup cache cleanup interval
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupQueryCache();
    }, 60000); // Every minute

    logger.info('Query optimization enabled', {
      category: 'database_optimization',
      cacheEnabled: this.config.query.cacheEnabled
    });
  }

  cleanupQueryCache() {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.config.query.cacheTTL) {
        this.queryCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Query cache cleanup', {
        category: 'database_cache',
        removedEntries: removed,
        remainingEntries: this.queryCache.size
      });
    }

    // Limit cache size
    if (this.queryCache.size > 1000) {
      const entries = Array.from(this.queryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 10%
      const toRemove = Math.floor(entries.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.queryCache.delete(entries[i][0]);
      }

      logger.info('Query cache size limit reached, removed oldest entries', {
        category: 'database_cache',
        removedEntries: toRemove,
        remainingEntries: this.queryCache.size
      });
    }
  }

  startHealthMonitoring() {
    this.healthInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.health.checkInterval);

    logger.info('Database health monitoring started', {
      category: 'database_optimization',
      interval: this.config.health.checkInterval
    });
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();
      
      // Simple health check query
      await this.connectionPool.execute('SELECT 1 as health_check');
      
      const duration = Date.now() - startTime;
      
      if (duration > this.config.health.timeout) {
        logger.warn('Database health check slow', {
          category: 'database_health',
          duration
        });
      }

      // Log stats periodically
      const totalQueries = this.connectionStats.queries;
      if (totalQueries > 0 && totalQueries % 100 === 0) {
        logger.info('Database performance stats', {
          category: 'database_stats',
          ...this.connectionStats,
          cacheSize: this.queryCache.size,
          errorRate: (this.connectionStats.errors / totalQueries * 100).toFixed(2),
          slowQueryRate: (this.connectionStats.slowQueries / totalQueries * 100).toFixed(2)
        });
      }

    } catch (error) {
      logger.error('Database health check failed', {
        category: 'database_health',
        error: error.message
      });
    }
  }

  // Optimized query methods
  async executeOptimizedQuery(query, params = [], options = {}) {
    const {
      cache = true,
      cacheKey = null,
      timeout = this.config.query.timeout,
      retries = this.config.query.maxRetries
    } = options;

    const queryKey = cacheKey || this.generateQueryKey(query, params);

    if (cache) {
      return await this.cachedQuery(queryKey, async () => {
        return await this.executeWithRetry(query, params, timeout, retries);
      });
    }

    return await this.executeWithRetry(query, params, timeout, retries);
  }

  async executeWithRetry(query, params, timeout, maxRetries) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        const queryPromise = this.connectionPool.execute(query, params);
        
        return await Promise.race([queryPromise, timeoutPromise]);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          logger.warn('Query failed, retrying', {
            category: 'database_retry',
            attempt,
            maxRetries,
            backoff,
            error: error.message
          });
          
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError;
  }

  generateQueryKey(query, params) {
    const queryStr = typeof query === 'string' ? query : query.toString();
    const paramsStr = JSON.stringify(params);
    return `${queryStr}:${paramsStr}`;
  }

  // Batch operations for better performance
  async executeBatch(queries, options = {}) {
    const {
      batchSize = 50,
      concurrency = 5
    } = options;

    const results = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ query, params, options: queryOptions }, index) => {
        try {
          const result = await this.executeOptimizedQuery(query, params, queryOptions);
          return { index: i + index, result, success: true };
        } catch (error) {
          logger.error('Batch query failed', {
            category: 'database_batch',
            batchIndex: i + index,
            error: error.message
          });
          return { index: i + index, error, success: false };
        }
      });

      // Execute batch with limited concurrency
      const batchResults = await this.limitConcurrency(batchPromises, concurrency);
      results.push(...batchResults);
    }

    return results;
  }

  async limitConcurrency(promises, limit) {
    const results = [];
    const executing = [];

    for (const promise of promises) {
      const p = Promise.resolve(promise).then(result => {
        executing.splice(executing.indexOf(p), 1);
        return result;
      });

      results.push(p);

      if (promises.length >= limit) {
        executing.push(p);

        if (executing.length >= limit) {
          await Promise.race(executing);
        }
      }
    }

    return Promise.all(results);
  }

  getStats() {
    return {
      connections: this.connectionStats,
      cache: {
        size: this.queryCache.size,
        hitRate: this.calculateCacheHitRate()
      },
      config: this.config
    };
  }

  calculateCacheHitRate() {
    // This would need to be implemented with proper hit/miss tracking
    return 0;
  }

  async cleanup() {
    logger.info('Cleaning up database optimizer', {
      category: 'database_cleanup'
    });

    // Clear intervals
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }

    // Clear cache
    this.queryCache.clear();

    // Close connections would be handled by the underlying pool
    logger.info('Database optimizer cleanup completed', {
      category: 'database_cleanup'
    });
  }
}

module.exports = DatabaseOptimizer;