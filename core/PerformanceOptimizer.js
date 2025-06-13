const BaseService = require('./BaseService');
const OptimizedCacheManager = require('./OptimizedCacheManager');

class PerformanceOptimizer extends BaseService {
  constructor() {
    super('PerformanceOptimizer');
    this.cache = new OptimizedCacheManager();
    this.queryMetrics = new Map();
    this.requestMetrics = new Map();
    this.optimizationRules = new Map();
    
    this.initializeOptimizationRules();
  }

  initializeOptimizationRules() {
    // Database query optimization rules
    this.optimizationRules.set('courses', {
      cacheTime: 600000, // 10 minutes
      enablePrefetch: true,
      batchSize: 50
    });

    this.optimizationRules.set('lessons', {
      cacheTime: 300000, // 5 minutes
      enablePrefetch: true,
      batchSize: 20
    });

    this.optimizationRules.set('gamification', {
      cacheTime: 120000, // 2 minutes
      enablePrefetch: false,
      batchSize: 10
    });

    this.optimizationRules.set('age_adaptation', {
      cacheTime: 900000, // 15 minutes
      enablePrefetch: true,
      batchSize: 100
    });
  }

  async optimizeQuery(queryType, queryFunction, cacheKey, ...args) {
    const rules = this.optimizationRules.get(queryType) || { cacheTime: 300000 };
    
    const startTime = Date.now();
    
    try {
      const result = await this.cache.getOrSet(
        cacheKey,
        () => queryFunction(...args),
        rules.cacheTime
      );

      this.recordQueryMetrics(queryType, Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.recordQueryMetrics(queryType, Date.now() - startTime, false);
      throw error;
    }
  }

  recordQueryMetrics(queryType, duration, success) {
    if (!this.queryMetrics.has(queryType)) {
      this.queryMetrics.set(queryType, {
        totalQueries: 0,
        totalDuration: 0,
        successCount: 0,
        errorCount: 0,
        avgDuration: 0
      });
    }

    const metrics = this.queryMetrics.get(queryType);
    metrics.totalQueries++;
    metrics.totalDuration += duration;
    
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }
    
    metrics.avgDuration = metrics.totalDuration / metrics.totalQueries;
  }

  async batchOptimize(operations) {
    const results = await Promise.allSettled(operations.map(op => op()));
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch operation ${index} failed:`, result.reason);
        return null;
      }
    });
  }

  createOptimizedMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endpoint = `${req.method} ${req.path}`;
        
        if (!this.requestMetrics.has(endpoint)) {
          this.requestMetrics.set(endpoint, {
            count: 0,
            totalDuration: 0,
            avgDuration: 0,
            statusCodes: {}
          });
        }
        
        const metrics = this.requestMetrics.get(endpoint);
        metrics.count++;
        metrics.totalDuration += duration;
        metrics.avgDuration = metrics.totalDuration / metrics.count;
        
        const statusCode = res.statusCode;
        metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
        
        // Log slow requests
        if (duration > 200) {
          console.warn(`Slow request detected: ${endpoint} took ${duration}ms`);
        }
      });
      
      next();
    };
  }

  getPerformanceReport() {
    const cacheStats = this.cache.getStats();
    
    const queryReport = {};
    for (const [type, metrics] of this.queryMetrics.entries()) {
      queryReport[type] = {
        ...metrics,
        successRate: (metrics.successCount / metrics.totalQueries * 100).toFixed(2)
      };
    }
    
    const requestReport = {};
    for (const [endpoint, metrics] of this.requestMetrics.entries()) {
      requestReport[endpoint] = metrics;
    }
    
    return {
      cache: cacheStats,
      queries: queryReport,
      requests: requestReport,
      timestamp: new Date().toISOString()
    };
  }

  async preloadCriticalData() {
    const criticalData = {
      'courses_all': {
        value: await this.loadCourses(),
        ttl: 600000
      },
      'age_profiles': {
        value: await this.loadAgeProfiles(),
        ttl: 900000
      }
    };
    
    this.cache.warmup(criticalData);
  }

  async loadCourses() {
    // This would typically call the database
    return [];
  }

  async loadAgeProfiles() {
    return {
      child: { language: 'simple', ui: 'colorful' },
      teen: { language: 'casual', ui: 'modern' },
      adult: { language: 'professional', ui: 'clean' }
    };
  }

  optimizeForProduction() {
    // Enable gzip compression hints
    process.env.ENABLE_COMPRESSION = 'true';
    
    // Set optimal cache headers
    this.defaultCacheHeaders = {
      'Cache-Control': 'public, max-age=300',
      'ETag': true,
      'Last-Modified': true
    };
    
    // Enable connection pooling optimizations
    process.env.DB_POOL_SIZE = '10';
    process.env.DB_IDLE_TIMEOUT = '30000';
    
    console.log('Production optimizations enabled');
  }

  clearMetrics() {
    this.queryMetrics.clear();
    this.requestMetrics.clear();
    this.cache.clear();
  }
}

module.exports = PerformanceOptimizer;