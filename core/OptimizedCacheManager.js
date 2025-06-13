const BaseService = require('./BaseService');

class OptimizedCacheManager extends BaseService {
  constructor() {
    super('OptimizedCacheManager');
    this.cache = new Map();
    this.ttlMap = new Map();
    this.hitCount = 0;
    this.missCount = 0;
    this.maxSize = 1000;
    this.cleanupInterval = 60000; // 1 minute
    
    this.startCleanupTimer();
  }

  set(key, value, ttl = 300000) { // 5 minutes default
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    const expirationTime = Date.now() + ttl;
    this.cache.set(key, value);
    this.ttlMap.set(key, expirationTime);
  }

  get(key) {
    const expiration = this.ttlMap.get(key);
    
    if (!expiration || Date.now() > expiration) {
      this.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttlMap.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) : 0,
      hits: this.hitCount,
      misses: this.missCount,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, expiration] of this.ttlMap.entries()) {
      if (now > expiration) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }

  // Advanced caching methods
  async getOrSet(key, fetcher, ttl = 300000) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  invalidatePattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  warmup(preloadData) {
    for (const [key, { value, ttl }] of Object.entries(preloadData)) {
      this.set(key, value, ttl);
    }
  }
}

module.exports = OptimizedCacheManager;