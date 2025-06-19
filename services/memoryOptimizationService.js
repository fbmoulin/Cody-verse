const NodeCache = require('node-cache');
const LRUCache = require('lru-cache');
const sizeof = require('object-sizeof');

/**
 * Memory Optimization Service - Comprehensive memory management
 */
class MemoryOptimizationService {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Multi-tier cache system
    this.initializeCaches();
    
    // Memory monitoring
    this.memoryStats = {
      baseline: this.getCurrentMemoryUsage(),
      peak: 0,
      samples: [],
      optimizations: 0
    };

    // Start monitoring
    this.startMemoryMonitoring();
    
    console.log('Memory optimization service initialized');
  }

  initializeCaches() {
    // Fast access cache for small, frequently used data
    this.fastCache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60,
      useClones: false, // Save memory
      deleteOnExpire: true,
      maxKeys: 500
    });

    // LRU cache for larger data with intelligent eviction
    this.lruCache = new LRUCache.LRUCache({
      max: 1000,
      maxSize: 20 * 1024 * 1024, // 20MB limit
      sizeCalculation: (value) => {
        try {
          return sizeof(value);
        } catch (error) {
          return JSON.stringify(value).length * 2;
        }
      },
      ttl: 1000 * 60 * 15, // 15 minutes
      allowStale: false
    });

    // Track cache performance
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryRecovered: 0
    };
  }

  startMemoryMonitoring() {
    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    // Maintenance every 5 minutes
    this.maintenanceInterval = setInterval(() => {
      this.performMaintenance();
    }, 300000);
  }

  checkMemoryUsage() {
    const usage = this.getCurrentMemoryUsage();
    this.memoryStats.samples.push(usage);

    // Keep only last 20 samples (10 minutes of data)
    if (this.memoryStats.samples.length > 20) {
      this.memoryStats.samples.shift();
    }

    // Update peak
    if (usage.usagePercentage > this.memoryStats.peak) {
      this.memoryStats.peak = usage.usagePercentage;
    }

    // Trigger optimization if memory is high
    if (usage.usagePercentage > 85) {
      this.optimizeMemory();
    }
  }

  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      usagePercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      rss: usage.rss,
      external: usage.external,
      timestamp: Date.now()
    };
  }

  optimizeMemory() {
    const startUsage = this.getCurrentMemoryUsage();
    console.log(`Starting memory optimization at ${startUsage.usagePercentage}% usage`);

    // 1. Clear expired cache entries
    this.clearExpiredEntries();

    // 2. Reduce cache sizes
    this.reduceCacheSizes();

    // 3. Force garbage collection
    this.forceGarbageCollection();

    const endUsage = this.getCurrentMemoryUsage();
    const saved = startUsage.usagePercentage - endUsage.usagePercentage;
    
    this.memoryStats.optimizations++;
    this.cacheStats.memoryRecovered += Math.max(0, startUsage.heapUsed - endUsage.heapUsed);

    console.log(`Memory optimization completed. Saved ${saved.toFixed(1)}% (${startUsage.usagePercentage}% → ${endUsage.usagePercentage}%)`);
    
    return {
      beforeOptimization: startUsage,
      afterOptimization: endUsage,
      memorySaved: saved,
      success: saved > 0
    };
  }

  clearExpiredEntries() {
    // Clear all expired entries from fast cache
    const fastCacheKeys = this.fastCache.keys();
    const beforeFast = fastCacheKeys.length;
    
    this.fastCache.flushAll();
    
    console.log(`Cleared ${beforeFast} entries from fast cache`);
  }

  reduceCacheSizes() {
    // Reduce LRU cache by 30%
    const currentSize = this.lruCache.size;
    const targetSize = Math.floor(currentSize * 0.7);
    
    let removedCount = 0;
    for (const key of this.lruCache.keys()) {
      if (this.lruCache.size <= targetSize) break;
      this.lruCache.delete(key);
      removedCount++;
    }

    this.cacheStats.evictions += removedCount;
    console.log(`Reduced LRU cache from ${currentSize} to ${this.lruCache.size} items (${removedCount} removed)`);
  }

  forceGarbageCollection() {
    if (global.gc) {
      // Run multiple GC cycles for better cleanup
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
      console.log('Forced garbage collection completed');
    } else {
      console.log('Garbage collection not available (run with --expose-gc)');
    }
  }

  performMaintenance() {
    console.log('Performing memory maintenance');

    // Remove corrupted cache entries
    this.validateCacheEntries();

    // Log memory statistics
    this.logMemoryStats();
  }

  validateCacheEntries() {
    let removedCount = 0;
    
    try {
      for (const [key, value] of this.lruCache.entries()) {
        try {
          JSON.stringify(value);
        } catch (error) {
          this.lruCache.delete(key);
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        console.log(`Maintenance: Removed ${removedCount} corrupted cache entries`);
      }
    } catch (error) {
      console.error('Cache validation error:', error.message);
    }
  }

  logMemoryStats() {
    const current = this.getCurrentMemoryUsage();
    const baseline = this.memoryStats.baseline;
    const growth = current.heapUsed - baseline.heapUsed;
    
    console.log(`Memory Stats - Current: ${current.usagePercentage}%, Peak: ${this.memoryStats.peak}%, Growth: ${Math.round(growth / 1024 / 1024)}MB`);
  }

  // Cache operations with automatic optimization
  get(key) {
    this.cacheStats.hits++;
    
    // Try fast cache first
    let value = this.fastCache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try LRU cache
    value = this.lruCache.get(key);
    if (value !== undefined) {
      // Promote to fast cache if small
      const size = sizeof(value);
      if (size < 1024) {
        this.fastCache.set(key, value, 300);
      }
      return value;
    }

    this.cacheStats.misses++;
    return null;
  }

  set(key, value, ttl = null) {
    try {
      const size = sizeof(value);
      
      if (size < 1024) {
        // Small objects go to fast cache
        this.fastCache.set(key, value, ttl || 300);
      } else if (size < 50 * 1024) {
        // Medium objects go to LRU cache
        this.lruCache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
      } else {
        // Large objects get short TTL and trigger memory check
        console.warn(`Large object cached (${Math.round(size/1024)}KB): ${key}`);
        this.lruCache.set(key, value, { ttl: 60000 }); // 1 minute
        
        // Check memory pressure
        setTimeout(() => {
          const usage = this.getCurrentMemoryUsage();
          if (usage.usagePercentage > 80) {
            this.optimizeMemory();
          }
        }, 1000);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error.message);
    }
  }

  delete(key) {
    this.fastCache.del(key);
    this.lruCache.delete(key);
  }

  clear() {
    this.fastCache.flushAll();
    this.lruCache.clear();
  }

  // Emergency cleanup for critical memory situations
  emergencyCleanup() {
    console.log('Performing emergency memory cleanup');
    
    const startUsage = this.getCurrentMemoryUsage();
    
    // Clear all caches
    this.clear();
    
    // Force aggressive garbage collection
    if (global.gc) {
      for (let i = 0; i < 5; i++) {
        global.gc();
      }
    }
    
    const endUsage = this.getCurrentMemoryUsage();
    const saved = startUsage.usagePercentage - endUsage.usagePercentage;
    
    console.log(`Emergency cleanup completed. Recovered ${saved.toFixed(1)}% memory`);
    
    return {
      memorySaved: saved,
      beforeUsage: startUsage.usagePercentage,
      afterUsage: endUsage.usagePercentage
    };
  }

  // Get comprehensive statistics
  getStats() {
    const currentUsage = this.getCurrentMemoryUsage();
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? Math.round((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100)
      : 0;

    return {
      memory: {
        current: currentUsage,
        baseline: this.memoryStats.baseline,
        peak: this.memoryStats.peak,
        optimizations: this.memoryStats.optimizations
      },
      cache: {
        hitRate: `${hitRate}%`,
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        evictions: this.cacheStats.evictions,
        memoryRecovered: Math.round(this.cacheStats.memoryRecovered / 1024 / 1024) // MB
      },
      cacheDetails: {
        fastCache: {
          keys: this.fastCache.keys().length,
          stats: this.fastCache.getStats()
        },
        lruCache: {
          size: this.lruCache.size,
          calculatedSize: Math.round(this.lruCache.calculatedSize / 1024), // KB
          maxSize: Math.round(this.lruCache.maxSize / 1024) // KB
        }
      }
    };
  }

  // Cleanup resources
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    this.clear();
    console.log('Memory optimization service cleanup completed');
  }
}

module.exports = MemoryOptimizationService;