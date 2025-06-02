const logger = require('../../server/logger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  // Set data in cache
  set(key, data, ttl = this.defaultTTL) {
    try {
      const expiryTime = Date.now() + ttl;
      this.cache.set(key, data);
      this.ttlMap.set(key, expiryTime);
      
      logger.info('Cache set', { key, ttl, dataType: typeof data });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }
  
  // Get data from cache
  get(key) {
    try {
      if (!this.cache.has(key)) {
        return null;
      }
      
      const expiryTime = this.ttlMap.get(key);
      if (expiryTime && Date.now() > expiryTime) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        logger.info('Cache expired', { key });
        return null;
      }
      
      const data = this.cache.get(key);
      logger.info('Cache hit', { key, dataType: typeof data });
      return data;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }
  
  // Remove item from cache
  remove(key) {
    try {
      const removed = this.cache.delete(key);
      this.ttlMap.delete(key);
      logger.info('Cache remove', { key, removed });
      return removed;
    } catch (error) {
      logger.error('Cache remove error', { key, error: error.message });
      return false;
    }
  }
  
  // Clear all cache
  clear() {
    try {
      this.cache.clear();
      this.ttlMap.clear();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
      return false;
    }
  }
  
  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, expiryTime] of this.ttlMap.entries()) {
      if (now > expiryTime) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info('Cache cleanup completed', { cleanedCount });
    }
  }
  
  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    };
  }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;