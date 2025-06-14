const BaseService = require('./BaseService');
const OptimizedCacheManager = require('./OptimizedCacheManager');

class EnhancedPerformanceOptimizer extends BaseService {
  constructor() {
    super('EnhancedPerformanceOptimizer');
    this.cache = new OptimizedCacheManager();
    this.queryMetrics = new Map();
    this.requestMetrics = new Map();
    this.optimizationRules = new Map();
    this.compressionSettings = new Map();
    this.prefetchQueue = new Set();
    
    this.initializeOptimizationRules();
    this.initializeCompressionSettings();
  }

  initializeOptimizationRules() {
    // Enhanced database query optimization rules
    this.optimizationRules.set('courses', {
      cacheTime: 900000, // 15 minutes - courses don't change often
      enablePrefetch: true,
      batchSize: 100,
      compressionEnabled: true,
      priority: 'high'
    });

    this.optimizationRules.set('lessons', {
      cacheTime: 600000, // 10 minutes
      enablePrefetch: true,
      batchSize: 50,
      compressionEnabled: true,
      priority: 'high'
    });

    this.optimizationRules.set('gamification', {
      cacheTime: 180000, // 3 minutes - more frequent updates needed
      enablePrefetch: false,
      batchSize: 25,
      compressionEnabled: false, // Real-time data
      priority: 'medium'
    });

    this.optimizationRules.set('user_progress', {
      cacheTime: 120000, // 2 minutes
      enablePrefetch: false,
      batchSize: 10,
      compressionEnabled: false,
      priority: 'high'
    });

    this.optimizationRules.set('age_adaptation', {
      cacheTime: 1800000, // 30 minutes - static content
      enablePrefetch: true,
      batchSize: 200,
      compressionEnabled: true,
      priority: 'low'
    });

    this.optimizationRules.set('study_techniques', {
      cacheTime: 3600000, // 1 hour - educational content
      enablePrefetch: true,
      batchSize: 75,
      compressionEnabled: true,
      priority: 'medium'
    });
  }

  initializeCompressionSettings() {
    this.compressionSettings.set('json', {
      threshold: 1024, // Compress responses > 1KB
      level: 6, // Balanced compression
      chunkSize: 16384
    });

    this.compressionSettings.set('html', {
      threshold: 512,
      level: 9, // Maximum compression for HTML
      chunkSize: 8192
    });
  }

  async optimizeQuery(queryType, queryFunction, cacheKey, ...args) {
    const rules = this.optimizationRules.get(queryType) || { 
      cacheTime: 300000, 
      priority: 'medium',
      compressionEnabled: false 
    };
    
    const startTime = performance.now();
    
    try {
      // Check if data should be prefetched
      if (rules.enablePrefetch && !this.prefetchQueue.has(cacheKey)) {
        this.schedulePrefetch(queryType, queryFunction, cacheKey, ...args);
      }

      const result = await this.cache.getOrSet(
        cacheKey,
        async () => {
          const data = await queryFunction(...args);
          return this.optimizeDataStructure(data, rules);
        },
        rules.cacheTime
      );

      const duration = performance.now() - startTime;
      this.recordQueryMetrics(queryType, duration, true, rules.priority);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordQueryMetrics(queryType, duration, false, rules.priority);
      throw error;
    }
  }

  optimizeDataStructure(data, rules) {
    if (!data) return data;

    // Remove null/undefined fields to reduce payload
    const optimized = this.removeEmptyFields(data);

    // Apply compression if enabled
    if (rules.compressionEnabled && typeof optimized === 'object') {
      return this.compressData(optimized);
    }

    return optimized;
  }

  removeEmptyFields(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyFields(item)).filter(item => item != null);
    }

    if (obj && typeof obj === 'object') {
      const cleaned = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value != null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
          cleaned[key] = this.removeEmptyFields(value);
        }
      });
      return cleaned;
    }

    return obj;
  }

  compressData(data) {
    // Simple data structure optimization
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item && typeof item === 'object') {
          // Sort keys for better compression
          const sorted = {};
          Object.keys(item).sort().forEach(key => {
            sorted[key] = item[key];
          });
          return sorted;
        }
        return item;
      });
    }
    return data;
  }

  schedulePrefetch(queryType, queryFunction, cacheKey, ...args) {
    this.prefetchQueue.add(cacheKey);
    
    // Prefetch after a short delay to not block current request
    setTimeout(async () => {
      try {
        if (!this.cache.get(cacheKey)) {
          await this.optimizeQuery(queryType, queryFunction, cacheKey, ...args);
        }
      } catch (error) {
        console.warn(`Prefetch failed for ${cacheKey}:`, error.message);
      } finally {
        this.prefetchQueue.delete(cacheKey);
      }
    }, 100);
  }

  recordQueryMetrics(queryType, duration, success, priority = 'medium') {
    if (!this.queryMetrics.has(queryType)) {
      this.queryMetrics.set(queryType, {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        priority
      });
    }

    const metrics = this.queryMetrics.get(queryType);
    metrics.totalQueries++;
    metrics.totalDuration += duration;

    if (success) {
      metrics.successfulQueries++;
    } else {
      metrics.failedQueries++;
    }

    metrics.avgDuration = metrics.totalDuration / metrics.totalQueries;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.minDuration = Math.min(metrics.minDuration, duration);

    // Alert if performance degrades
    if (duration > 1000 && priority === 'high') {
      console.warn(`Slow query detected: ${queryType} took ${duration.toFixed(2)}ms`);
    }
  }

  async batchOptimize(operations) {
    const results = [];
    const batchSize = 5; // Process 5 operations concurrently
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchPromises = batch.map(async (op) => {
        try {
          return await this.optimizeQuery(op.type, op.function, op.cacheKey, ...op.args);
        } catch (error) {
          return { error: error.message, operation: op.type };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  createOptimizedMiddleware() {
    const self = this;
    return (req, res, next) => {
      const startTime = performance.now();
      
      // Add compression headers
      res.setHeader('Vary', 'Accept-Encoding');
      
      // Optimize response based on content type
      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(data) {
        const contentType = res.getHeader('content-type') || '';
        
        if (contentType.includes('application/json')) {
          try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            const optimizedData = self.removeEmptyFields(parsedData);
            data = JSON.stringify(optimizedData);
          } catch (e) {
            // Keep original data if parsing fails
          }
        }
        
        const duration = performance.now() - startTime;
        self.recordRequestMetrics(req.path, duration);
        
        return originalSend.call(this, data);
      };

      res.json = function(data) {
        try {
          const optimizedData = self.removeEmptyFields(data);
          const duration = performance.now() - startTime;
          self.recordRequestMetrics(req.path, duration);
          return originalJson.call(this, optimizedData);
        } catch (e) {
          const duration = performance.now() - startTime;
          self.recordRequestMetrics(req.path, duration);
          return originalJson.call(this, data);
        }
      };
      
      next();
    };
  }

  recordRequestMetrics(path, duration) {
    if (!this.requestMetrics.has(path)) {
      this.requestMetrics.set(path, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0
      });
    }

    const metrics = this.requestMetrics.get(path);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.count;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
  }

  getPerformanceReport() {
    const cacheStats = this.cache.getStats();
    
    return {
      cache: cacheStats,
      queries: Object.fromEntries(this.queryMetrics),
      requests: Object.fromEntries(this.requestMetrics),
      optimization: {
        prefetchQueueSize: this.prefetchQueue.size,
        totalOptimizationRules: this.optimizationRules.size,
        timestamp: new Date().toISOString()
      }
    };
  }

  async preloadCriticalData() {
    const criticalOperations = [
      { type: 'courses', function: this.loadCourses.bind(this), cacheKey: 'all_courses', args: [] },
      { type: 'age_adaptation', function: this.loadAgeProfiles.bind(this), cacheKey: 'age_profiles', args: [] }
    ];

    console.log('Preloading critical data...');
    const results = await this.batchOptimize(criticalOperations);
    console.log(`Preloaded ${results.filter(r => !r.error).length} critical datasets`);
    
    return results;
  }

  async loadCourses() {
    // This would connect to your actual course loading logic
    return { courses: 'loaded from database' };
  }

  async loadAgeProfiles() {
    // This would connect to your actual age profile loading logic
    return { profiles: 'loaded from database' };
  }

  optimizeForProduction() {
    // Increase cache sizes for production
    this.cache.maxSize = 5000;
    
    // Reduce cleanup interval for better memory management
    this.cache.cleanupInterval = 30000; // 30 seconds
    
    // Enable more aggressive prefetching
    this.optimizationRules.forEach((rules, key) => {
      if (rules.priority === 'high') {
        rules.enablePrefetch = true;
        rules.cacheTime *= 1.5; // Increase cache time for high priority items
      }
    });

    console.log('Performance optimizer configured for production');
  }

  clearMetrics() {
    this.queryMetrics.clear();
    this.requestMetrics.clear();
    this.prefetchQueue.clear();
  }
}

module.exports = EnhancedPerformanceOptimizer;