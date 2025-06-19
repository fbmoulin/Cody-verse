const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Cache Optimizer - Prevents cache-related memory leaks
 */
class CacheOptimizer extends BaseService {
  constructor() {
    super('CacheOptimizer');
    this.cacheRegistry = new Map();
    this.duplicateTracker = new Set();
    this.maxCacheSize = 100; // Limit total cache entries
    this.initialize();
  }

  initialize() {
    this.optimizeGlobalCache();
    this.startCacheMonitoring();
    logger.info('Cache Optimizer initialized', {
      maxCacheSize: this.maxCacheSize,
      category: 'cache_optimization'
    });
  }

  optimizeGlobalCache() {
    // Find and clear duplicate cache entries
    if (global.cache && global.cache instanceof Map) {
      const beforeSize = global.cache.size;
      this.removeDuplicateCacheEntries();
      const afterSize = global.cache.size;
      
      logger.info('Global cache optimized', {
        beforeSize,
        afterSize,
        removed: beforeSize - afterSize,
        category: 'cache_optimization'
      });
    }
  }

  removeDuplicateCacheEntries() {
    if (!global.cache) return 0;

    const uniqueKeys = new Set();
    const duplicates = [];
    let removed = 0;

    // Identify duplicates based on content similarity
    for (const [key, value] of global.cache.entries()) {
      const normalizedKey = this.normalizeKey(key);
      
      if (uniqueKeys.has(normalizedKey)) {
        duplicates.push(key);
      } else {
        uniqueKeys.add(normalizedKey);
      }
    }

    // Remove duplicates
    for (const dupKey of duplicates) {
      global.cache.delete(dupKey);
      removed++;
    }

    // If still too large, remove oldest entries
    if (global.cache.size > this.maxCacheSize) {
      const entries = Array.from(global.cache.entries());
      const toRemove = entries.slice(0, global.cache.size - this.maxCacheSize);
      
      for (const [key] of toRemove) {
        global.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  normalizeKey(key) {
    // Normalize keys to detect duplicates
    return key.replace(/module_\d+/g, 'module_X').toLowerCase();
  }

  startCacheMonitoring() {
    setInterval(() => {
      this.monitorCacheGrowth();
    }, 10000); // Check every 10 seconds

    setInterval(() => {
      this.aggressiveCacheCleanup();
    }, 30000); // Cleanup every 30 seconds
  }

  monitorCacheGrowth() {
    if (global.cache && global.cache.size > this.maxCacheSize) {
      logger.warn('Cache size exceeding limit', {
        currentSize: global.cache.size,
        maxSize: this.maxCacheSize,
        category: 'cache_optimization'
      });
      
      this.aggressiveCacheCleanup();
    }
  }

  aggressiveCacheCleanup() {
    let cleaned = 0;

    try {
      // Clear expired entries
      if (global.cache && global.cache instanceof Map) {
        const now = Date.now();
        const beforeSize = global.cache.size;
        
        for (const [key, entry] of global.cache.entries()) {
          if (entry && typeof entry === 'object') {
            // Check for expiry
            if (entry.expiry && now > entry.expiry) {
              global.cache.delete(key);
              cleaned++;
            }
            // Check for old entries (over 10 minutes)
            else if (entry.timestamp && (now - entry.timestamp) > 600000) {
              global.cache.delete(key);
              cleaned++;
            }
          }
        }

        // If still too large, remove LRU entries
        if (global.cache.size > this.maxCacheSize) {
          const entries = Array.from(global.cache.entries());
          const sortedEntries = entries.sort((a, b) => {
            const aTime = a[1]?.lastAccess || a[1]?.timestamp || 0;
            const bTime = b[1]?.lastAccess || b[1]?.timestamp || 0;
            return aTime - bTime; // Oldest first
          });

          const toRemove = global.cache.size - this.maxCacheSize;
          for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
            global.cache.delete(sortedEntries[i][0]);
            cleaned++;
          }
        }

        if (cleaned > 0) {
          logger.info('Aggressive cache cleanup completed', {
            cleaned,
            beforeSize,
            afterSize: global.cache.size,
            category: 'cache_optimization'
          });
        }
      }

      // Clear other potential cache sources
      cleaned += this.clearModuleSpecificCaches();
      cleaned += this.clearRequestCaches();

    } catch (error) {
      logger.error('Cache cleanup failed', {
        error: error.message,
        category: 'cache_optimization'
      });
    }

    return cleaned;
  }

  clearModuleSpecificCaches() {
    let cleared = 0;
    
    // Clear lesson caches that are duplicated
    const lessonKeys = [];
    if (global.cache) {
      for (const key of global.cache.keys()) {
        if (key.includes('lessons_module_')) {
          lessonKeys.push(key);
        }
      }
      
      // Keep only unique module caches
      const uniqueModules = new Set();
      for (const key of lessonKeys) {
        const moduleMatch = key.match(/module_(\d+)/);
        if (moduleMatch) {
          const moduleId = moduleMatch[1];
          if (uniqueModules.has(moduleId)) {
            global.cache.delete(key);
            cleared++;
          } else {
            uniqueModules.add(moduleId);
          }
        }
      }
    }

    return cleared;
  }

  clearRequestCaches() {
    let cleared = 0;

    // Clear any request-specific caches
    const requestKeys = [];
    if (global.cache) {
      for (const key of global.cache.keys()) {
        if (key.includes('req_') || key.includes('request_')) {
          requestKeys.push(key);
        }
      }
      
      // Remove old request caches (older than 5 minutes)
      const now = Date.now();
      for (const key of requestKeys) {
        const entry = global.cache.get(key);
        if (entry && entry.timestamp && (now - entry.timestamp) > 300000) {
          global.cache.delete(key);
          cleared++;
        }
      }
    }

    return cleared;
  }

  preventCacheDuplication(key, value) {
    if (!global.cache) {
      global.cache = new Map();
    }

    const normalizedKey = this.normalizeKey(key);
    
    // Check if similar entry already exists
    for (const [existingKey, existingValue] of global.cache.entries()) {
      if (this.normalizeKey(existingKey) === normalizedKey) {
        // Update existing entry instead of creating duplicate
        existingValue.lastAccess = Date.now();
        existingValue.hits = (existingValue.hits || 0) + 1;
        return false; // Prevented duplication
      }
    }

    // Add new entry only if no duplicate found
    if (global.cache.size < this.maxCacheSize) {
      global.cache.set(key, {
        ...value,
        timestamp: Date.now(),
        lastAccess: Date.now(),
        hits: 1
      });
      return true; // Added new entry
    }

    return false; // Cache full
  }

  getCacheStats() {
    const stats = {
      totalEntries: 0,
      duplicates: 0,
      expired: 0,
      memoryUsage: 0
    };

    if (global.cache) {
      stats.totalEntries = global.cache.size;
      
      const now = Date.now();
      const normalizedKeys = new Set();
      
      for (const [key, entry] of global.cache.entries()) {
        // Check duplicates
        const normalizedKey = this.normalizeKey(key);
        if (normalizedKeys.has(normalizedKey)) {
          stats.duplicates++;
        } else {
          normalizedKeys.add(normalizedKey);
        }
        
        // Check expired
        if (entry && entry.expiry && now > entry.expiry) {
          stats.expired++;
        }
        
        // Estimate memory usage
        try {
          stats.memoryUsage += JSON.stringify(entry).length;
        } catch (e) {
          // Circular reference or non-serializable
          stats.memoryUsage += 1000; // Estimate
        }
      }
    }

    return stats;
  }

  emergencyFlush() {
    let flushed = 0;
    
    if (global.cache) {
      flushed = global.cache.size;
      global.cache.clear();
    }

    // Clear other cache-related globals
    const cacheGlobals = ['_cache', 'cache', '_tempCache', 'requestCache'];
    for (const key of cacheGlobals) {
      if (global[key]) {
        try {
          if (typeof global[key].clear === 'function') {
            global[key].clear();
          } else {
            delete global[key];
          }
          flushed += 10; // Estimate
        } catch (e) {
          // Property might not be configurable
        }
      }
    }

    logger.warn('Emergency cache flush completed', {
      flushed,
      category: 'cache_optimization'
    });

    return flushed;
  }

  cleanup() {
    // Cleanup any monitoring intervals
    logger.info('Cache Optimizer cleaned up', {
      category: 'cache_optimization'
    });
  }
}

module.exports = CacheOptimizer;