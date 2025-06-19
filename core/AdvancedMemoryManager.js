const BaseService = require('./BaseService');
const NodeCache = require('node-cache');
const LRUCache = require('lru-cache');
const sizeof = require('object-sizeof');

/**
 * Advanced Memory Manager - Comprehensive memory optimization and monitoring
 */
class AdvancedMemoryManager extends BaseService {
  constructor() {
    super('AdvancedMemoryManager');
    this.initialize();
  }

  initialize() {
    // High-performance LRU cache with size limits
    this.lruCache = new LRUCache({
      max: 500, // Maximum 500 items
      maxSize: 50 * 1024 * 1024, // 50MB max size
      sizeCalculation: (value) => sizeof(value),
      ttl: 1000 * 60 * 15, // 15 minutes TTL
      allowStale: false,
      updateAgeOnGet: false,
      updateAgeOnHas: false
    });

    // Fast access cache for frequently used data
    this.nodeCache = new NodeCache({
      stdTTL: 600, // 10 minutes default TTL
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Don't clone objects (saves memory)
      deleteOnExpire: true,
      maxKeys: 1000 // Maximum 1000 keys
    });

    // Memory monitoring
    this.memoryStats = {
      peak: 0,
      average: 0,
      samples: [],
      maxSamples: 100
    };

    // Cleanup registry for weak references
    this.cleanupTasks = new Set();
    this.largeObjectRegistry = new WeakMap();

    // Start monitoring
    this.startMemoryMonitoring();
    this.setupAutomaticCleanup();

    console.log('Advanced Memory Manager initialized with multi-tier caching');
  }

  // Multi-tier caching strategy
  async get(key, fetchFunction = null) {
    // Try fast cache first
    let value = this.nodeCache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try LRU cache
    value = this.lruCache.get(key);
    if (value !== undefined) {
      // Promote to fast cache if frequently accessed
      this.nodeCache.set(key, value, 300); // 5 minute TTL in fast cache
      return value;
    }

    // Fetch from source if function provided
    if (fetchFunction && typeof fetchFunction === 'function') {
      try {
        value = await fetchFunction();
        if (value !== undefined) {
          this.set(key, value);
        }
        return value;
      } catch (error) {
        console.error(`Error fetching data for key ${key}:`, error.message);
        return null;
      }
    }

    return null;
  }

  set(key, value, ttl = null) {
    const size = sizeof(value);
    
    // Store in appropriate cache based on size and access pattern
    if (size < 1024) { // Small objects go to fast cache
      this.nodeCache.set(key, value, ttl || 600);
    } else if (size < 1024 * 1024) { // Medium objects go to LRU
      this.lruCache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
    } else {
      // Large objects get special handling
      console.warn(`Large object detected (${size} bytes) for key: ${key}`);
      this.handleLargeObject(key, value, size);
    }
  }

  handleLargeObject(key, value, size) {
    // Store large objects with shorter TTL and immediate cleanup
    const shortTTL = 300; // 5 minutes for large objects
    this.lruCache.set(key, value, { ttl: shortTTL * 1000 });
    
    // Register for cleanup
    this.largeObjectRegistry.set(value, { key, size, timestamp: Date.now() });
    
    // Schedule immediate cleanup if memory is high
    const memUsage = this.getCurrentMemoryUsage();
    if (memUsage.usagePercentage > 80) {
      setTimeout(() => this.aggressiveCleanup(), 1000);
    }
  }

  delete(key) {
    this.nodeCache.del(key);
    this.lruCache.delete(key);
  }

  clear() {
    this.nodeCache.flushAll();
    this.lruCache.clear();
  }

  // Memory monitoring
  startMemoryMonitoring() {
    setInterval(() => {
      const usage = this.getCurrentMemoryUsage();
      this.updateMemoryStats(usage);
      
      // Trigger cleanup if memory usage is high
      if (usage.usagePercentage > 85) {
        this.performCleanup();
      }
    }, 10000); // Check every 10 seconds
  }

  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      usagePercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      timestamp: Date.now()
    };
  }

  updateMemoryStats(usage) {
    this.memoryStats.samples.push(usage);
    
    // Keep only recent samples
    if (this.memoryStats.samples.length > this.memoryStats.maxSamples) {
      this.memoryStats.samples.shift();
    }
    
    // Update peak
    if (usage.usagePercentage > this.memoryStats.peak) {
      this.memoryStats.peak = usage.usagePercentage;
    }
    
    // Calculate average
    const total = this.memoryStats.samples.reduce((sum, sample) => sum + sample.usagePercentage, 0);
    this.memoryStats.average = Math.round(total / this.memoryStats.samples.length);
  }

  // Intelligent cleanup strategies
  performCleanup() {
    const startUsage = this.getCurrentMemoryUsage();
    console.log(`Starting memory cleanup at ${startUsage.usagePercentage}% usage`);
    
    // 1. Clear expired cache entries
    this.nodeCache.flushAll();
    
    // 2. Trim LRU cache by 25%
    const currentSize = this.lruCache.size;
    const targetSize = Math.floor(currentSize * 0.75);
    while (this.lruCache.size > targetSize) {
      const oldestKey = this.lruCache.keys().next().value;
      if (oldestKey) {
        this.lruCache.delete(oldestKey);
      } else {
        break;
      }
    }
    
    // 3. Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const endUsage = this.getCurrentMemoryUsage();
    const saved = startUsage.usagePercentage - endUsage.usagePercentage;
    console.log(`Memory cleanup completed. Saved ${saved.toFixed(1)}% memory`);
  }

  aggressiveCleanup() {
    console.log('Performing aggressive memory cleanup');
    
    // Clear all caches
    this.clear();
    
    // Run cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error.message);
      }
    });
    
    // Force multiple GC cycles
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
  }

  setupAutomaticCleanup() {
    // Register cleanup for expired large objects
    setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      // This would need WeakRef support in newer Node.js versions
      // For now, we'll rely on cache TTL
    }, 60000); // Check every minute
  }

  // Cache statistics
  getStats() {
    const currentUsage = this.getCurrentMemoryUsage();
    
    return {
      memory: {
        current: currentUsage,
        peak: this.memoryStats.peak,
        average: this.memoryStats.average
      },
      caches: {
        nodeCache: {
          keys: this.nodeCache.keys().length,
          hits: this.nodeCache.getStats().hits,
          misses: this.nodeCache.getStats().misses,
          vsize: this.nodeCache.getStats().vsize
        },
        lruCache: {
          size: this.lruCache.size,
          calculatedSize: this.lruCache.calculatedSize,
          max: this.lruCache.max,
          maxSize: this.lruCache.maxSize
        }
      }
    };
  }

  // Register cleanup tasks
  registerCleanupTask(task) {
    if (typeof task === 'function') {
      this.cleanupTasks.add(task);
    }
  }

  unregisterCleanupTask(task) {
    this.cleanupTasks.delete(task);
  }

  // Graceful shutdown
  cleanup() {
    this.clear();
    this.cleanupTasks.clear();
    console.log('Advanced Memory Manager cleanup completed');
  }
}

module.exports = AdvancedMemoryManager;