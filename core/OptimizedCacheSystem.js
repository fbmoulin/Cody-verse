const BaseService = require('./BaseService');
const NodeCache = require('node-cache');
const LRUCache = require('lru-cache');
const sizeof = require('object-sizeof');

/**
 * Optimized Cache System - Memory-efficient multi-tier caching
 */
class OptimizedCacheSystem extends BaseService {
  constructor() {
    super('OptimizedCacheSystem');
    this.initializeCaches();
    this.setupMemoryOptimization();
  }

  initializeCaches() {
    // Tier 1: Ultra-fast cache for frequently accessed small data
    this.fastCache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60, // Check every minute
      useClones: false, // Save memory by avoiding clones
      deleteOnExpire: true,
      maxKeys: 500 // Limit to 500 keys
    });

    // Tier 2: LRU cache for larger data with size-based eviction
    this.lruCache = new LRUCache({
      max: 1000, // Maximum 1000 items
      maxSize: 25 * 1024 * 1024, // 25MB max size
      sizeCalculation: (value) => {
        try {
          return sizeof(value);
        } catch (error) {
          return JSON.stringify(value).length * 2; // Fallback estimation
        }
      },
      ttl: 1000 * 60 * 10, // 10 minutes TTL
      allowStale: false,
      updateAgeOnGet: false,
      updateAgeOnHas: false
    });

    // Tier 3: Long-term cache for static data
    this.staticCache = new NodeCache({
      stdTTL: 3600, // 1 hour
      checkperiod: 300, // Check every 5 minutes
      useClones: false,
      deleteOnExpire: true,
      maxKeys: 200
    });

    // Memory usage tracking
    this.memoryTracker = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      evictions: 0,
      lastCleanup: Date.now()
    };

    console.log('Optimized cache system initialized with three-tier architecture');
  }

  setupMemoryOptimization() {
    // Aggressive cleanup when memory is high
    setInterval(() => {
      const memUsage = this.getMemoryUsage();
      if (memUsage.usagePercentage > 85) {
        this.performMemoryOptimization();
      }
    }, 15000); // Check every 15 seconds

    // Regular maintenance
    setInterval(() => {
      this.performMaintenance();
    }, 300000); // Every 5 minutes

    // Register cache event handlers for monitoring
    this.fastCache.on('expired', (key, value) => {
      this.memoryTracker.evictions++;
    });

    this.fastCache.on('del', (key, value) => {
      this.memoryTracker.evictions++;
    });
  }

  // Intelligent cache retrieval with tier promotion
  get(key, category = 'general') {
    this.memoryTracker.totalRequests++;
    
    // Try fast cache first
    let value = this.fastCache.get(key);
    if (value !== undefined) {
      this.memoryTracker.cacheHits++;
      return value;
    }

    // Try LRU cache
    value = this.lruCache.get(key);
    if (value !== undefined) {
      this.memoryTracker.cacheHits++;
      // Promote to fast cache if small enough
      const size = sizeof(value);
      if (size < 1024) { // 1KB threshold
        this.fastCache.set(key, value, 300);
      }
      return value;
    }

    // Try static cache for configuration data
    if (category === 'static' || category === 'config') {
      value = this.staticCache.get(key);
      if (value !== undefined) {
        this.memoryTracker.cacheHits++;
        return value;
      }
    }

    this.memoryTracker.cacheMisses++;
    return null;
  }

  // Intelligent cache storage with tier selection
  set(key, value, ttl = null, category = 'general') {
    try {
      const size = sizeof(value);
      
      // Route to appropriate cache based on size and category
      if (category === 'static' || category === 'config') {
        this.staticCache.set(key, value, ttl || 3600);
      } else if (size < 1024) { // Small objects (< 1KB)
        this.fastCache.set(key, value, ttl || 300);
      } else if (size < 100 * 1024) { // Medium objects (< 100KB)
        this.lruCache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
      } else {
        // Large objects get special handling
        console.warn(`Large object (${Math.round(size/1024)}KB) cached with short TTL: ${key}`);
        this.lruCache.set(key, value, { ttl: 60000 }); // 1 minute for large objects
        
        // Trigger immediate cleanup if needed
        setTimeout(() => this.checkMemoryPressure(), 1000);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error.message);
    }
  }

  // Delete from all cache tiers
  delete(key) {
    this.fastCache.del(key);
    this.lruCache.delete(key);
    this.staticCache.del(key);
  }

  // Memory pressure management
  checkMemoryPressure() {
    const memUsage = this.getMemoryUsage();
    if (memUsage.usagePercentage > 90) {
      console.log('High memory pressure detected, performing emergency cleanup');
      this.emergencyCleanup();
    }
  }

  emergencyCleanup() {
    // Clear fast cache completely
    this.fastCache.flushAll();
    
    // Reduce LRU cache by 50%
    const currentSize = this.lruCache.size;
    const targetSize = Math.floor(currentSize * 0.5);
    
    for (const key of this.lruCache.keys()) {
      if (this.lruCache.size <= targetSize) break;
      this.lruCache.delete(key);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    this.memoryTracker.lastCleanup = Date.now();
    console.log(`Emergency cleanup completed. LRU cache reduced to ${this.lruCache.size} items`);
  }

  performMemoryOptimization() {
    const startUsage = this.getMemoryUsage();
    
    // 1. Clear expired entries
    this.fastCache.flushAll();
    
    // 2. Trim LRU cache if over size limit
    if (this.lruCache.calculatedSize > this.lruCache.maxSize * 0.8) {
      const targetSize = Math.floor(this.lruCache.size * 0.7);
      for (const key of this.lruCache.keys()) {
        if (this.lruCache.size <= targetSize) break;
        this.lruCache.delete(key);
      }
    }
    
    // 3. Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const endUsage = this.getMemoryUsage();
    const saved = startUsage.usagePercentage - endUsage.usagePercentage;
    
    if (saved > 1) {
      console.log(`Memory optimization saved ${saved.toFixed(1)}% (${startUsage.usagePercentage}% → ${endUsage.usagePercentage}%)`);
    }
    
    this.memoryTracker.lastCleanup = Date.now();
  }

  performMaintenance() {
    // Remove any corrupted cache entries
    try {
      // Validate LRU cache entries
      let removedCount = 0;
      for (const [key, value] of this.lruCache.entries()) {
        try {
          JSON.stringify(value); // Test if value is serializable
        } catch (error) {
          this.lruCache.delete(key);
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        console.log(`Maintenance: Removed ${removedCount} corrupted cache entries`);
      }
    } catch (error) {
      console.error('Cache maintenance error:', error.message);
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      usagePercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      rss: usage.rss,
      external: usage.external
    };
  }

  // Cache statistics
  getStats() {
    const memUsage = this.getMemoryUsage();
    const hitRate = this.memoryTracker.totalRequests > 0 
      ? Math.round((this.memoryTracker.cacheHits / this.memoryTracker.totalRequests) * 100)
      : 0;

    return {
      memory: memUsage,
      performance: {
        totalRequests: this.memoryTracker.totalRequests,
        cacheHits: this.memoryTracker.cacheHits,
        cacheMisses: this.memoryTracker.cacheMisses,
        hitRate: `${hitRate}%`,
        evictions: this.memoryTracker.evictions,
        lastCleanup: new Date(this.memoryTracker.lastCleanup).toISOString()
      },
      caches: {
        fastCache: {
          keys: this.fastCache.keys().length,
          stats: this.fastCache.getStats()
        },
        lruCache: {
          size: this.lruCache.size,
          calculatedSize: Math.round(this.lruCache.calculatedSize / 1024), // KB
          maxSize: Math.round(this.lruCache.maxSize / 1024) // KB
        },
        staticCache: {
          keys: this.staticCache.keys().length,
          stats: this.staticCache.getStats()
        }
      }
    };
  }

  // Graceful shutdown
  cleanup() {
    this.fastCache.flushAll();
    this.lruCache.clear();
    this.staticCache.flushAll();
    console.log('Optimized cache system cleanup completed');
  }
}

module.exports = OptimizedCacheSystem;