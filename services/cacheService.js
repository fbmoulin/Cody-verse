class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    this.defaultTTL = 300000; // 5 minutes
    this.maxSize = 1000;
  }

  set(key, value, ttl = this.defaultTTL) {
    try {
      // Evict oldest entries if cache is full
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }

      // Clear existing timer if any
      this.clearTimer(key);

      // Store value with metadata
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccess: Date.now()
      });

      // Set expiration timer
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key);
        }, ttl);
        this.timers.set(key, timer);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  get(key) {
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Update access metadata
      entry.accessCount++;
      entry.lastAccess = Date.now();
      this.cache.set(key, entry);

      this.stats.hits++;
      return entry.value;
    } catch (error) {
      console.error('Cache get error:', error.message);
      this.stats.misses++;
      return null;
    }
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    try {
      this.clearTimer(key);
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.deletes++;
      }
      return deleted;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  clear() {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return false;
    }
  }

  clearTimer(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100),
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // Utility methods for common patterns
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    let value = this.get(key);
    if (value !== null) {
      return value;
    }

    try {
      value = await fetchFunction();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error('Cache getOrSet error:', error.message);
      throw error;
    }
  }

  setJSON(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      return this.set(key, serialized, ttl);
    } catch (error) {
      console.error('Cache setJSON error:', error.message);
      return false;
    }
  }

  getJSON(key) {
    try {
      const value = this.get(key);
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error('Cache getJSON error:', error.message);
      return null;
    }
  }

  // Namespace support
  setNamespaced(namespace, key, value, ttl = this.defaultTTL) {
    return this.set(`${namespace}:${key}`, value, ttl);
  }

  getNamespaced(namespace, key) {
    return this.get(`${namespace}:${key}`);
  }

  deleteNamespaced(namespace, key) {
    return this.delete(`${namespace}:${key}`);
  }

  clearNamespace(namespace) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  // Cache warming
  async warmCache(patterns) {
    const promises = patterns.map(async pattern => {
      try {
        const value = await pattern.fetchFunction();
        this.set(pattern.key, value, pattern.ttl);
      } catch (error) {
        console.error(`Cache warming failed for ${pattern.key}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
  }
}

module.exports = new CacheService();