const BaseService = require('./BaseService');

class EnhancedCacheManager extends BaseService {
  constructor() {
    super('EnhancedCacheManager');
    this.cache = new Map();
    this.accessTimes = new Map();
    this.hitCounts = new Map();
    this.maxSize = 1000;
    this.defaultTTL = 300000; // 5 minutes
    this.cleanupInterval = 60000; // 1 minute
    
    this.startCleanupTimer();
  }

  // Enhanced set with LRU eviction
  set(key, value, ttl = this.defaultTTL) {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry = {
      value,
      timestamp: Date.now(),
      ttl,
      hitCount: 0
    };

    this.cache.set(key, entry);
    this.accessTimes.set(key, Date.now());
    this.hitCounts.set(key, 0);

    return true;
  }

  // Enhanced get with access tracking
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    // Update access tracking
    this.accessTimes.set(key, Date.now());
    entry.hitCount++;
    this.hitCounts.set(key, entry.hitCount);

    return entry.value;
  }

  // LRU eviction strategy
  evictLRU() {
    let oldestTime = Date.now();
    let oldestKey = null;

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Enhanced delete with cleanup
  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
    this.hitCounts.delete(key);
    return true;
  }

  // Smart cache warmer
  async warmCache(preloadData) {
    const warmupPromises = [];

    for (const [key, fetcher] of Object.entries(preloadData)) {
      if (typeof fetcher === 'function') {
        warmupPromises.push(
          this.getOrSet(key, fetcher, this.defaultTTL)
        );
      }
    }

    const results = await Promise.allSettled(warmupPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    return {
      total: warmupPromises.length,
      successful,
      failed: warmupPromises.length - successful
    };
  }

  // Get or set pattern with automatic caching
  async getOrSet(key, fetcher, ttl = this.defaultTTL) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await fetcher();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error(`Cache fetcher failed for key ${key}:`, error);
      throw error;
    }
  }

  // Pattern-based invalidation
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  // Advanced cache statistics
  getAdvancedStats() {
    const now = Date.now();
    let totalHits = 0;
    let expiredEntries = 0;
    let totalMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalHits += entry.hitCount;
      totalMemory += this.estimateEntrySize(key, entry);
      
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    const hitRate = this.calculateHitRate();
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationRate: (this.cache.size / this.maxSize) * 100,
      totalHits,
      hitRate,
      expiredEntries,
      estimatedMemoryUsage: totalMemory,
      topKeys: this.getTopKeys(5)
    };
  }

  // Calculate overall hit rate
  calculateHitRate() {
    if (this.hitCounts.size === 0) return 0;
    
    let totalHits = 0;
    let totalAccesses = 0;

    for (const hitCount of this.hitCounts.values()) {
      totalHits += hitCount;
      totalAccesses += hitCount + 1; // +1 for initial miss
    }

    return totalAccesses > 0 ? (totalHits / totalAccesses) * 100 : 0;
  }

  // Get most accessed keys
  getTopKeys(limit = 10) {
    const sorted = Array.from(this.hitCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);

    return sorted.map(([key, count]) => ({ key, hitCount: count }));
  }

  // Estimate memory usage of cache entry
  estimateEntrySize(key, entry) {
    try {
      return JSON.stringify({ key, entry }).length * 2; // Rough estimate
    } catch {
      return 100; // Fallback estimate
    }
  }

  // Automatic cleanup timer
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Enhanced cleanup with detailed reporting
  cleanup() {
    const before = this.cache.size;
    const now = Date.now();
    let expired = 0;
    let lruEvicted = 0;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        expired++;
      }
    }

    // Evict LRU entries if still over capacity
    while (this.cache.size > this.maxSize * 0.9) {
      this.evictLRU();
      lruEvicted++;
    }

    const after = this.cache.size;
    
    return {
      before,
      after,
      expired,
      lruEvicted,
      totalCleaned: before - after
    };
  }

  // Export cache state for persistence
  exportState() {
    const state = {
      cache: Array.from(this.cache.entries()),
      accessTimes: Array.from(this.accessTimes.entries()),
      hitCounts: Array.from(this.hitCounts.entries()),
      timestamp: Date.now()
    };

    return state;
  }

  // Import cache state from persistence
  importState(state) {
    if (!state || !state.cache) return false;

    try {
      this.cache = new Map(state.cache);
      this.accessTimes = new Map(state.accessTimes || []);
      this.hitCounts = new Map(state.hitCounts || []);
      
      // Clean up any expired entries from imported state
      this.cleanup();
      
      return true;
    } catch (error) {
      console.error('Failed to import cache state:', error);
      return false;
    }
  }

  // Complete cache clear
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessTimes.clear();
    this.hitCounts.clear();
    return size;
  }
}

module.exports = EnhancedCacheManager;