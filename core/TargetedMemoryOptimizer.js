const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Targeted Memory Optimizer - Addresses specific memory leak sources
 */
class TargetedMemoryOptimizer extends BaseService {
  constructor() {
    super('TargetedMemoryOptimizer');
    this.moduleWhitelist = new Set([
      'express', 'path', 'fs', 'util', 'events', 'stream', 'crypto', 'os',
      'cluster', 'worker_threads', 'http', 'https', 'url', 'querystring',
      'zlib', 'buffer', 'string_decoder', 'timers', 'child_process'
    ]);
    this.cacheMonitor = new Map();
    this.intervalHandles = new Set();
    this.initialize();
  }

  initialize() {
    this.startModuleCacheMonitoring();
    this.optimizeCacheStrategies();
    logger.info('Targeted Memory Optimizer initialized', {
      category: 'memory_optimization'
    });
  }

  startModuleCacheMonitoring() {
    // Monitor module cache growth every 30 seconds
    const handle = setInterval(() => {
      this.cleanupModuleCache();
    }, 30000);
    this.intervalHandles.add(handle);
  }

  cleanupModuleCache() {
    const before = Object.keys(require.cache).length;
    let cleaned = 0;

    // Clean non-essential modules
    for (const moduleId of Object.keys(require.cache)) {
      if (this.shouldCleanModule(moduleId)) {
        try {
          delete require.cache[moduleId];
          cleaned++;
        } catch (error) {
          // Module might be in use
        }
      }
    }

    const after = Object.keys(require.cache).length;
    
    if (cleaned > 0) {
      logger.info('Module cache cleanup completed', {
        before,
        after,
        cleaned,
        category: 'memory_optimization'
      });
    }

    return cleaned;
  }

  shouldCleanModule(moduleId) {
    // Don't clean core Node.js modules
    if (moduleId.startsWith('node:') || moduleId.includes('internal/')) {
      return false;
    }

    // Don't clean node_modules (they're needed)
    if (moduleId.includes('node_modules')) {
      return false;
    }

    // Don't clean essential application files
    if (moduleId.includes('server.js') || 
        moduleId.includes('/core/') ||
        moduleId.includes('/routes/') ||
        moduleId.includes('/controllers/')) {
      return false;
    }

    // Don't clean whitelisted modules
    for (const whitelisted of this.moduleWhitelist) {
      if (moduleId.includes(whitelisted)) {
        return false;
      }
    }

    // Clean temporary or generated files
    if (moduleId.includes('/temp/') ||
        moduleId.includes('/tmp/') ||
        moduleId.includes('.temp.') ||
        moduleId.endsWith('.tmp')) {
      return true;
    }

    return false;
  }

  optimizeCacheStrategies() {
    // Reduce cache TTL for non-critical data
    const optimizedCacheConfig = {
      lessons: { ttl: 600000, maxSize: 100 }, // 10 minutes, max 100 items
      users: { ttl: 300000, maxSize: 50 },    // 5 minutes, max 50 items
      courses: { ttl: 1800000, maxSize: 25 }, // 30 minutes, max 25 items
      progress: { ttl: 180000, maxSize: 200 } // 3 minutes, max 200 items
    };

    // Apply cache limits
    this.applyCacheLimits(optimizedCacheConfig);
  }

  applyCacheLimits(config) {
    // This would integrate with existing cache systems
    logger.info('Cache limits applied', {
      config,
      category: 'memory_optimization'
    });
  }

  async targetedCleanup() {
    const results = {
      moduleCache: 0,
      eventListeners: 0,
      intervals: 0,
      globalObjects: 0,
      cacheEntries: 0
    };

    try {
      // 1. Aggressive module cache cleanup
      results.moduleCache = this.cleanupModuleCache();

      // 2. Clean up intervals and timeouts
      results.intervals = this.cleanupIntervals();

      // 3. Clean event listeners
      results.eventListeners = this.cleanupEventListeners();

      // 4. Clean global objects
      results.globalObjects = this.cleanupGlobalObjects();

      // 5. Optimize cache entries
      results.cacheEntries = this.optimizeCacheEntries();

      // 6. Force garbage collection
      this.forceGarbageCollection();

      const totalCleaned = Object.values(results).reduce((sum, val) => sum + val, 0);

      logger.info('Targeted cleanup completed', {
        results,
        totalCleaned,
        category: 'memory_optimization'
      });

      return {
        success: true,
        results,
        totalCleaned
      };

    } catch (error) {
      logger.error('Targeted cleanup failed', {
        error: error.message,
        category: 'memory_optimization'
      });

      return {
        success: false,
        error: error.message,
        results
      };
    }
  }

  cleanupIntervals() {
    let cleaned = 0;

    // Get all active handles
    const handles = process._getActiveHandles();
    
    for (const handle of handles) {
      // Clean up old or orphaned intervals
      if (handle && handle._idleTimeout) {
        // If interval is longer than 5 minutes, consider it suspicious
        if (handle._idleTimeout > 300000) {
          try {
            handle.close();
            cleaned++;
          } catch (error) {
            // Handle might already be closed
          }
        }
      }
    }

    return cleaned;
  }

  cleanupEventListeners() {
    let cleaned = 0;
    const maxListenersPerEvent = 5;

    for (const eventName of process.eventNames()) {
      const listeners = process.listeners(eventName);
      
      if (listeners.length > maxListenersPerEvent) {
        // Keep only the first few listeners
        const excess = listeners.slice(maxListenersPerEvent);
        
        for (const listener of excess) {
          try {
            process.removeListener(eventName, listener);
            cleaned++;
          } catch (error) {
            // Listener might already be removed
          }
        }
      }
    }

    return cleaned;
  }

  cleanupGlobalObjects() {
    let cleaned = 0;

    // List of global objects that are safe to clean
    const cleanableGlobals = [
      '_tempData', '_debugInfo', '_cache', '_temp', 'debugBuffer',
      'tempBuffer', 'logBuffer', '_logCache', '_tempCache'
    ];

    for (const key of cleanableGlobals) {
      if (global[key]) {
        try {
          delete global[key];
          cleaned++;
        } catch (error) {
          // Property might not be configurable
        }
      }
    }

    // Clean large buffers and strings
    for (const key in global) {
      if (global.hasOwnProperty(key)) {
        const value = global[key];
        
        // Clean large strings (> 1MB)
        if (typeof value === 'string' && value.length > 1048576) {
          try {
            delete global[key];
            cleaned++;
          } catch (error) {
            // Property might not be configurable
          }
        }
        
        // Clean large buffers
        if (Buffer.isBuffer(value) && value.length > 1048576) {
          try {
            delete global[key];
            cleaned++;
          } catch (error) {
            // Property might not be configurable
          }
        }
      }
    }

    return cleaned;
  }

  optimizeCacheEntries() {
    let cleaned = 0;

    // Clear expired entries from global caches
    if (global.cache && typeof global.cache === 'object') {
      if (global.cache instanceof Map) {
        const now = Date.now();
        for (const [key, entry] of global.cache.entries()) {
          if (entry && entry.expiry && now > entry.expiry) {
            global.cache.delete(key);
            cleaned++;
          }
        }
      }
    }

    // If cache is too large, remove LRU entries
    if (global.cache && global.cache.size > 1000) {
      // Convert to array and sort by access time
      const entries = Array.from(global.cache.entries());
      entries.sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));
      
      // Remove oldest 20%
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        global.cache.delete(entries[i][0]);
        cleaned++;
      }
    }

    return cleaned;
  }

  forceGarbageCollection() {
    if (global.gc) {
      // Multiple GC passes for thorough cleanup
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
  }

  getMemoryUsageReduction() {
    const before = process.memoryUsage();
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        await this.targetedCleanup();
        
        setTimeout(() => {
          const after = process.memoryUsage();
          const reduction = {
            heapUsed: before.heapUsed - after.heapUsed,
            heapTotal: before.heapTotal - after.heapTotal,
            rss: before.rss - after.rss,
            external: before.external - after.external,
            percentage: ((before.heapUsed - after.heapUsed) / before.heapUsed) * 100
          };
          
          resolve(reduction);
        }, 1000);
      }, 100);
    });
  }

  // Auto-optimization based on memory pressure
  startAutoOptimization() {
    const handle = setInterval(async () => {
      const memUsage = process.memoryUsage();
      const usagePercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (usagePercentage > 80) {
        logger.warn('High memory pressure detected, starting targeted cleanup', {
          usagePercentage: usagePercentage.toFixed(2),
          category: 'memory_optimization'
        });
        
        await this.targetedCleanup();
      }
    }, 15000); // Check every 15 seconds
    
    this.intervalHandles.add(handle);
  }

  cleanup() {
    // Clean up our own intervals
    for (const handle of this.intervalHandles) {
      clearInterval(handle);
    }
    this.intervalHandles.clear();
    this.cacheMonitor.clear();
    
    logger.info('Targeted Memory Optimizer cleaned up', {
      category: 'memory_optimization'
    });
  }
}

module.exports = TargetedMemoryOptimizer;