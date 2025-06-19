const BaseService = require('./BaseService');
const logger = require('../server/logger');
const { EventEmitter } = require('events');

/**
 * Advanced Performance Optimizer - Comprehensive performance improvements and monitoring
 */
class AdvancedPerformanceOptimizer extends BaseService {
  constructor() {
    super('AdvancedPerformanceOptimizer');
    this.eventEmitter = new EventEmitter();
    this.performanceMetrics = new Map();
    this.queryCache = new Map();
    this.responseCache = new Map();
    this.connectionPool = new Map();
    this.compressionSettings = {
      threshold: 1024, // 1KB minimum
      level: 6, // Balanced compression
      memLevel: 8
    };
    this.initializeOptimizer();
  }

  initializeOptimizer() {
    this.setupMetricsCollection();
    this.setupCacheManagement();
    this.setupCompressionOptimization();
    this.startPerformanceMonitoring();
    logger.info('Advanced Performance Optimizer initialized', {
      category: 'performance_optimization'
    });
  }

  setupMetricsCollection() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        slowRequests: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        evictions: 0,
        hitRate: 0
      },
      memory: {
        peakUsage: 0,
        averageUsage: 0,
        cleanupCycles: 0,
        leaksDetected: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connections: 0,
        poolUtilization: 0
      }
    };
  }

  setupCacheManagement() {
    // Intelligent cache with LRU eviction
    this.cache = {
      data: new Map(),
      accessTimes: new Map(),
      maxSize: 1000,
      ttl: 300000, // 5 minutes default
      
      set: (key, value, customTtl = null) => {
        const ttl = customTtl || this.cache.ttl;
        const expiry = Date.now() + ttl;
        
        if (this.cache.data.size >= this.cache.maxSize) {
          this.evictLRU();
        }
        
        this.cache.data.set(key, { value, expiry });
        this.cache.accessTimes.set(key, Date.now());
        this.metrics.cache.hits++;
      },
      
      get: (key) => {
        const item = this.cache.data.get(key);
        if (!item) {
          this.metrics.cache.misses++;
          return null;
        }
        
        if (Date.now() > item.expiry) {
          this.cache.data.delete(key);
          this.cache.accessTimes.delete(key);
          this.metrics.cache.misses++;
          return null;
        }
        
        this.cache.accessTimes.set(key, Date.now());
        this.metrics.cache.hits++;
        return item.value;
      },
      
      delete: (key) => {
        this.cache.data.delete(key);
        this.cache.accessTimes.delete(key);
      },
      
      clear: () => {
        this.cache.data.clear();
        this.cache.accessTimes.clear();
      },
      
      size: () => this.cache.data.size
    };
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.cache.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.cache.evictions++;
    }
  }

  setupCompressionOptimization() {
    this.compressionStrategies = {
      json: (data) => {
        if (typeof data === 'object') {
          return JSON.stringify(data, null, 0); // No pretty printing
        }
        return data;
      },
      
      response: (response) => {
        // Remove unnecessary fields for API responses
        const optimized = {
          success: response.success,
          data: response.data,
          message: response.message
        };
        
        if (response.timestamp) {
          optimized.timestamp = response.timestamp;
        }
        
        return optimized;
      },
      
      database: (results) => {
        // Optimize database result sets
        if (results.rows && Array.isArray(results.rows)) {
          return {
            rows: results.rows,
            rowCount: results.rowCount
          };
        }
        return results;
      }
    };
  }

  // Enhanced query optimization
  async optimizeQuery(queryKey, queryFunction, options = {}) {
    const startTime = Date.now();
    const cacheKey = `query_${queryKey}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !options.skipCache) {
      const duration = Date.now() - startTime;
      this.recordMetric('cache_hit', duration);
      return cached;
    }

    try {
      // Execute with timeout
      const timeout = options.timeout || 10000;
      const result = await Promise.race([
        queryFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]);

      const duration = Date.now() - startTime;
      
      // Cache successful results
      if (result && !options.skipCache) {
        const ttl = options.cacheTtl || this.cache.ttl;
        this.cache.set(cacheKey, result, ttl);
      }

      this.recordMetric('query_success', duration);
      this.metrics.requests.successful++;
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric('query_error', duration);
      this.metrics.requests.failed++;
      
      logger.error('Query optimization failed', {
        queryKey,
        error: error.message,
        duration,
        category: 'performance_optimization'
      });
      
      throw error;
    }
  }

  // Memory optimization
  optimizeMemoryUsage() {
    const beforeCleanup = process.memoryUsage();
    let cleanedItems = 0;

    try {
      // Clean expired cache entries
      const now = Date.now();
      for (const [key, item] of this.cache.data.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
          cleanedItems++;
        }
      }

      // Clear old performance metrics
      if (this.performanceMetrics.size > 1000) {
        const entries = Array.from(this.performanceMetrics.entries());
        entries.slice(0, 500).forEach(([key]) => {
          this.performanceMetrics.delete(key);
          cleanedItems++;
        });
      }

      // Clear response cache if too large
      if (this.responseCache.size > 500) {
        this.responseCache.clear();
        cleanedItems += 500;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const afterCleanup = process.memoryUsage();
      const memoryFreed = beforeCleanup.heapUsed - afterCleanup.heapUsed;

      this.metrics.memory.cleanupCycles++;

      logger.info('Memory optimization completed', {
        cleanedItems,
        memoryFreed,
        beforeHeap: beforeCleanup.heapUsed,
        afterHeap: afterCleanup.heapUsed,
        category: 'performance_optimization'
      });

      return {
        cleanedItems,
        memoryFreed,
        success: true
      };

    } catch (error) {
      logger.error('Memory optimization failed', {
        error: error.message,
        category: 'performance_optimization'
      });
      
      return {
        cleanedItems,
        memoryFreed: 0,
        success: false,
        error: error.message
      };
    }
  }

  // Response optimization
  optimizeResponse(data, options = {}) {
    const startTime = Date.now();
    
    try {
      let optimized = data;

      // Apply compression strategies
      if (options.compress !== false) {
        optimized = this.compressionStrategies.response(optimized);
      }

      // Remove null/undefined values
      if (options.removeEmpty !== false) {
        optimized = this.removeEmptyValues(optimized);
      }

      // Limit array sizes if specified
      if (options.maxArraySize && Array.isArray(optimized.data)) {
        if (optimized.data.length > options.maxArraySize) {
          optimized.data = optimized.data.slice(0, options.maxArraySize);
          optimized.truncated = true;
          optimized.totalCount = data.data?.length || 0;
        }
      }

      const duration = Date.now() - startTime;
      this.recordMetric('response_optimization', duration);

      return optimized;

    } catch (error) {
      logger.error('Response optimization failed', {
        error: error.message,
        category: 'performance_optimization'
      });
      return data; // Return original on error
    }
  }

  removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
      return obj.filter(item => item != null).map(item => this.removeEmptyValues(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value != null && value !== '' && value !== undefined) {
          cleaned[key] = this.removeEmptyValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  // Database connection optimization
  optimizeDatabaseConnections() {
    return {
      poolSettings: {
        max: 20, // Maximum connections
        min: 5,  // Minimum connections
        acquire: 30000, // 30 second timeout
        idle: 10000,    // 10 second idle timeout
        evict: 5000,    // Check for idle connections every 5 seconds
        handleDisconnects: true,
        reconnect: true,
        maxReconnects: 3,
        reconnectDelay: 2000
      },
      
      queryOptimization: {
        timeout: 30000, // 30 second query timeout
        retries: 3,
        retryDelay: 1000,
        batchSize: 100, // For bulk operations
        useIndexes: true,
        enableQueryCache: true
      }
    };
  }

  // Request optimization middleware
  createOptimizedMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      req.startTime = startTime;
      req.requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

      // Add performance headers
      res.setHeader('X-Request-ID', req.requestId);
      res.setHeader('X-Response-Time-Start', startTime);

      // Optimize response
      const originalJson = res.json;
      res.json = (data) => {
        const responseTime = Date.now() - startTime;
        
        // Add performance metrics
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        res.setHeader('X-Cache-Status', this.getCacheStatus(req));
        
        // Optimize response data
        const optimized = this.optimizeResponse(data, {
          compress: true,
          removeEmpty: true,
          maxArraySize: req.query.limit ? parseInt(req.query.limit) : 100
        });

        // Record metrics
        this.recordRequestMetric(req, res, responseTime);
        
        return originalJson.call(res, optimized);
      };

      next();
    };
  }

  getCacheStatus(req) {
    const cacheKey = this.generateCacheKey(req);
    return this.cache.get(cacheKey) ? 'HIT' : 'MISS';
  }

  generateCacheKey(req) {
    return `${req.method}_${req.path}_${JSON.stringify(req.query)}`;
  }

  recordRequestMetric(req, res, responseTime) {
    this.metrics.requests.total++;
    
    // Update average response time
    const totalRequests = this.metrics.requests.total;
    this.metrics.requests.averageResponseTime = 
      (this.metrics.requests.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;

    // Track slow requests
    if (responseTime > 1000) {
      this.metrics.requests.slowRequests++;
    }

    // Store detailed metrics
    this.performanceMetrics.set(req.requestId, {
      method: req.method,
      path: req.path,
      responseTime,
      statusCode: res.statusCode,
      timestamp: Date.now()
    });
  }

  recordMetric(type, duration) {
    const key = `${type}_${Date.now()}`;
    this.performanceMetrics.set(key, {
      type,
      duration,
      timestamp: Date.now()
    });
  }

  // Performance monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      this.updateMetrics();
      this.checkPerformanceThresholds();
    }, 30000); // Every 30 seconds

    logger.info('Performance monitoring started', {
      interval: '30 seconds',
      category: 'performance_optimization'
    });
  }

  updateMetrics() {
    // Update cache hit rate
    const totalCacheRequests = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = totalCacheRequests > 0 
      ? (this.metrics.cache.hits / totalCacheRequests * 100).toFixed(2)
      : 0;

    // Update memory metrics
    const memUsage = process.memoryUsage();
    this.metrics.memory.averageUsage = (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2);
    
    if (memUsage.heapUsed > this.metrics.memory.peakUsage) {
      this.metrics.memory.peakUsage = memUsage.heapUsed;
    }
  }

  checkPerformanceThresholds() {
    const memUsage = parseFloat(this.metrics.memory.averageUsage);
    
    // Auto-optimize if memory usage is high
    if (memUsage > 85) {
      logger.warn('High memory usage detected, triggering optimization', {
        memoryUsage: memUsage,
        category: 'performance_optimization'
      });
      this.optimizeMemoryUsage();
    }

    // Clear old metrics if too many
    if (this.performanceMetrics.size > 10000) {
      const oldestEntries = Array.from(this.performanceMetrics.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, 5000);
      
      oldestEntries.forEach(([key]) => {
        this.performanceMetrics.delete(key);
      });
    }
  }

  getPerformanceReport() {
    return {
      metrics: this.metrics,
      cacheStats: {
        size: this.cache.size(),
        hitRate: this.metrics.cache.hitRate,
        evictions: this.metrics.cache.evictions
      },
      memoryStats: {
        current: process.memoryUsage(),
        peak: this.metrics.memory.peakUsage,
        cleanupCycles: this.metrics.memory.cleanupCycles
      },
      recentRequests: Array.from(this.performanceMetrics.values())
        .filter(metric => metric.path)
        .slice(-10),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (parseFloat(this.metrics.cache.hitRate) < 50) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        message: 'Low cache hit rate detected - consider increasing cache TTL or size'
      });
    }

    if (this.metrics.requests.slowRequests > this.metrics.requests.total * 0.1) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'High number of slow requests - consider optimizing database queries'
      });
    }

    if (parseFloat(this.metrics.memory.averageUsage) > 80) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage - consider increasing cleanup frequency'
      });
    }

    return recommendations;
  }

  // Cleanup and shutdown
  cleanup() {
    this.cache.clear();
    this.performanceMetrics.clear();
    this.responseCache.clear();
    this.connectionPool.clear();
    
    logger.info('Performance optimizer cleaned up', {
      category: 'performance_optimization'
    });
  }
}

module.exports = AdvancedPerformanceOptimizer;