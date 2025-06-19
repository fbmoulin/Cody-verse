const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Enhanced Memory Optimizer - Advanced memory management and leak prevention
 */
class EnhancedMemoryOptimizer extends BaseService {
  constructor() {
    super('EnhancedMemoryOptimizer');
    this.memoryStats = {
      initialHeap: 0,
      peakHeap: 0,
      cleanupCycles: 0,
      leaksDetected: 0,
      optimizationHistory: []
    };
    this.thresholds = {
      warning: 75,
      cleanup: 85,
      critical: 95
    };
    this.cleanupStrategies = new Map();
    this.monitoringInterval = null;
    this.initialize();
  }

  initialize() {
    this.memoryStats.initialHeap = process.memoryUsage().heapUsed;
    this.setupCleanupStrategies();
    this.startMonitoring();
    logger.info('Enhanced Memory Optimizer initialized', {
      initialHeap: this.memoryStats.initialHeap,
      thresholds: this.thresholds,
      category: 'memory_optimization'
    });
  }

  setupCleanupStrategies() {
    // Cache cleanup strategy
    this.cleanupStrategies.set('cache', {
      priority: 1,
      description: 'Clear expired and LRU cache entries',
      execute: () => this.cleanupCache(),
      aggressiveness: 0.3 // Remove 30% of cache
    });

    // Memory leaks cleanup
    this.cleanupStrategies.set('leaks', {
      priority: 2,
      description: 'Remove potential memory leaks',
      execute: () => this.cleanupMemoryLeaks(),
      aggressiveness: 0.5
    });

    // Large objects cleanup
    this.cleanupStrategies.set('large_objects', {
      priority: 3,
      description: 'Remove large temporary objects',
      execute: () => this.cleanupLargeObjects(),
      aggressiveness: 0.7
    });

    // Event listeners cleanup
    this.cleanupStrategies.set('listeners', {
      priority: 4,
      description: 'Remove orphaned event listeners',
      execute: () => this.cleanupEventListeners(),
      aggressiveness: 0.2
    });

    // Garbage collection
    this.cleanupStrategies.set('gc', {
      priority: 5,
      description: 'Force garbage collection',
      execute: () => this.forceGarbageCollection(),
      aggressiveness: 1.0
    });
  }

  async optimizeMemory(forceCleanup = false) {
    const beforeMemory = process.memoryUsage();
    const usagePercentage = (beforeMemory.heapUsed / beforeMemory.heapTotal) * 100;
    
    logger.info('Starting memory optimization', {
      currentUsage: usagePercentage.toFixed(2) + '%',
      heapUsed: beforeMemory.heapUsed,
      heapTotal: beforeMemory.heapTotal,
      forced: forceCleanup,
      category: 'memory_optimization'
    });

    let totalCleaned = 0;
    const results = {};

    try {
      // Determine cleanup level based on memory usage
      const cleanupLevel = this.determineCleanupLevel(usagePercentage, forceCleanup);
      
      // Execute cleanup strategies based on priority and level
      for (const [strategyName, strategy] of this.cleanupStrategies) {
        if (strategy.aggressiveness <= cleanupLevel) {
          try {
            const cleaned = await strategy.execute();
            results[strategyName] = {
              success: true,
              cleaned: cleaned || 0,
              description: strategy.description
            };
            totalCleaned += cleaned || 0;
          } catch (error) {
            results[strategyName] = {
              success: false,
              error: error.message,
              description: strategy.description
            };
            logger.error(`Cleanup strategy ${strategyName} failed`, {
              error: error.message,
              category: 'memory_optimization'
            });
          }
        }
      }

      const afterMemory = process.memoryUsage();
      const memoryFreed = beforeMemory.heapUsed - afterMemory.heapUsed;
      const finalUsage = (afterMemory.heapUsed / afterMemory.heapTotal) * 100;

      // Update statistics
      this.memoryStats.cleanupCycles++;
      this.memoryStats.optimizationHistory.push({
        timestamp: Date.now(),
        beforeUsage: usagePercentage,
        afterUsage: finalUsage,
        memoryFreed,
        totalCleaned,
        strategies: Object.keys(results)
      });

      // Keep only last 50 optimization records
      if (this.memoryStats.optimizationHistory.length > 50) {
        this.memoryStats.optimizationHistory = this.memoryStats.optimizationHistory.slice(-50);
      }

      logger.info('Memory optimization completed', {
        initialUsage: usagePercentage.toFixed(2) + '%',
        finalUsage: finalUsage.toFixed(2) + '%',
        memoryFreed,
        totalCleaned,
        improvement: (usagePercentage - finalUsage).toFixed(2) + '%',
        strategiesExecuted: Object.keys(results).length,
        category: 'memory_optimization'
      });

      return {
        success: true,
        results,
        stats: {
          initialUsage: usagePercentage,
          finalUsage,
          memoryFreed,
          totalCleaned,
          improvement: usagePercentage - finalUsage
        }
      };

    } catch (error) {
      logger.error('Memory optimization failed', {
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

  determineCleanupLevel(usagePercentage, forceCleanup) {
    if (forceCleanup) return 1.0;
    if (usagePercentage >= this.thresholds.critical) return 1.0;
    if (usagePercentage >= this.thresholds.cleanup) return 0.7;
    if (usagePercentage >= this.thresholds.warning) return 0.5;
    return 0.3;
  }

  cleanupCache() {
    let cleaned = 0;
    
    // Clean global cache if it exists
    if (global.cache && typeof global.cache.clear === 'function') {
      const sizeBefore = global.cache.size || 0;
      global.cache.clear();
      cleaned += sizeBefore;
    }

    // Clean module cache for non-core modules
    const moduleIds = Object.keys(require.cache);
    const nonCoreModules = moduleIds.filter(id => 
      !id.includes('node_modules') && 
      !id.includes('core/') &&
      !id.includes('server.js')
    );

    // Remove 30% of non-core cached modules
    const toRemove = Math.floor(nonCoreModules.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      delete require.cache[nonCoreModules[i]];
      cleaned++;
    }

    return cleaned;
  }

  cleanupMemoryLeaks() {
    let cleaned = 0;

    // Clean up potential WeakMap/WeakSet leaks
    if (global.WeakMap) {
      // Force cleanup of weak references
      if (global.gc) global.gc();
    }

    // Clean up timers and intervals
    const timers = process._getActiveHandles();
    let timersCleaned = 0;
    timers.forEach(timer => {
      if (timer && timer._idleTimeout && timer._idleTimeout > 300000) { // 5 minutes
        try {
          timer.close();
          timersCleaned++;
        } catch (e) {
          // Timer already closed or invalid
        }
      }
    });
    cleaned += timersCleaned;

    // Clean up large strings and buffers in global scope
    for (const key in global) {
      if (global.hasOwnProperty(key)) {
        const value = global[key];
        if (typeof value === 'string' && value.length > 100000) {
          delete global[key];
          cleaned++;
        } else if (Buffer.isBuffer(value) && value.length > 50000) {
          delete global[key];
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  cleanupLargeObjects() {
    let cleaned = 0;

    // Clean up large objects in process
    if (process.env.NODE_ENV !== 'production') {
      // In development, clean up debug objects
      if (global.debugInfo) {
        delete global.debugInfo;
        cleaned++;
      }
    }

    // Force cleanup of V8 compilation cache
    if (global.gc) {
      const beforeHeap = process.memoryUsage().heapUsed;
      global.gc();
      const afterHeap = process.memoryUsage().heapUsed;
      const freed = beforeHeap - afterHeap;
      if (freed > 0) cleaned += Math.floor(freed / 1000); // Convert to KB
    }

    return cleaned;
  }

  cleanupEventListeners() {
    let cleaned = 0;

    // Clean up process event listeners (keep essential ones)
    const processEvents = ['exit', 'SIGTERM', 'SIGINT'];
    const allEvents = process.eventNames();
    
    allEvents.forEach(eventName => {
      if (!processEvents.includes(eventName)) {
        const listeners = process.listeners(eventName);
        if (listeners.length > 5) { // If too many listeners
          // Remove excess listeners (keep first 5)
          const excess = listeners.slice(5);
          excess.forEach(listener => {
            process.removeListener(eventName, listener);
            cleaned++;
          });
        }
      }
    });

    return cleaned;
  }

  forceGarbageCollection() {
    let cleaned = 0;
    
    if (global.gc) {
      const beforeHeap = process.memoryUsage().heapUsed;
      
      // Multiple GC passes for thorough cleanup
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
      
      const afterHeap = process.memoryUsage().heapUsed;
      const freed = beforeHeap - afterHeap;
      cleaned = Math.max(0, Math.floor(freed / 1024)); // Convert to KB
    }

    return cleaned;
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryStatus();
    }, 15000); // Check every 15 seconds

    logger.info('Memory monitoring started', {
      interval: '15 seconds',
      category: 'memory_optimization'
    });
  }

  checkMemoryStatus() {
    const memory = process.memoryUsage();
    const usagePercentage = (memory.heapUsed / memory.heapTotal) * 100;

    // Update peak memory usage
    if (memory.heapUsed > this.memoryStats.peakHeap) {
      this.memoryStats.peakHeap = memory.heapUsed;
    }

    // Auto-optimize if memory usage is high
    if (usagePercentage >= this.thresholds.cleanup) {
      logger.warn('High memory usage detected, triggering automatic optimization', {
        currentUsage: usagePercentage.toFixed(2) + '%',
        threshold: this.thresholds.cleanup + '%',
        category: 'memory_optimization'
      });
      
      this.optimizeMemory(usagePercentage >= this.thresholds.critical);
    }

    // Detect potential memory leaks
    const growthRate = this.calculateMemoryGrowthRate();
    if (growthRate > 10) { // 10% growth in short period
      this.memoryStats.leaksDetected++;
      logger.warn('Potential memory leak detected', {
        growthRate: growthRate.toFixed(2) + '%',
        currentUsage: usagePercentage.toFixed(2) + '%',
        category: 'memory_optimization'
      });
    }
  }

  calculateMemoryGrowthRate() {
    const history = this.memoryStats.optimizationHistory;
    if (history.length < 2) return 0;

    const recent = history.slice(-5); // Last 5 optimizations
    if (recent.length < 2) return 0;

    const firstUsage = recent[0].beforeUsage;
    const lastUsage = recent[recent.length - 1].beforeUsage;
    
    return ((lastUsage - firstUsage) / firstUsage) * 100;
  }

  getMemoryReport() {
    const currentMemory = process.memoryUsage();
    const usagePercentage = (currentMemory.heapUsed / currentMemory.heapTotal) * 100;

    return {
      current: {
        heapUsed: currentMemory.heapUsed,
        heapTotal: currentMemory.heapTotal,
        usagePercentage: parseFloat(usagePercentage.toFixed(2)),
        rss: currentMemory.rss,
        external: currentMemory.external
      },
      statistics: {
        initialHeap: this.memoryStats.initialHeap,
        peakHeap: this.memoryStats.peakHeap,
        cleanupCycles: this.memoryStats.cleanupCycles,
        leaksDetected: this.memoryStats.leaksDetected,
        growthRate: this.calculateMemoryGrowthRate()
      },
      thresholds: this.thresholds,
      recentOptimizations: this.memoryStats.optimizationHistory.slice(-10),
      recommendations: this.generateRecommendations(usagePercentage)
    };
  }

  generateRecommendations(usagePercentage) {
    const recommendations = [];

    if (usagePercentage > this.thresholds.critical) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediate memory optimization required',
        description: 'Memory usage is critically high and may cause system instability'
      });
    } else if (usagePercentage > this.thresholds.cleanup) {
      recommendations.push({
        priority: 'high',
        action: 'Schedule memory cleanup',
        description: 'Memory usage is above optimal levels'
      });
    } else if (usagePercentage > this.thresholds.warning) {
      recommendations.push({
        priority: 'medium',
        action: 'Monitor memory usage',
        description: 'Memory usage is approaching cleanup threshold'
      });
    }

    if (this.memoryStats.leaksDetected > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Investigate memory leaks',
        description: `${this.memoryStats.leaksDetected} potential memory leaks detected`
      });
    }

    const growthRate = this.calculateMemoryGrowthRate();
    if (growthRate > 5) {
      recommendations.push({
        priority: 'medium',
        action: 'Review memory growth patterns',
        description: 'Memory usage is growing faster than expected'
      });
    }

    return recommendations;
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory monitoring stopped', {
        category: 'memory_optimization'
      });
    }
  }

  cleanup() {
    this.stopMonitoring();
    this.cleanupStrategies.clear();
    this.memoryStats.optimizationHistory = [];
    
    logger.info('Enhanced Memory Optimizer cleaned up', {
      category: 'memory_optimization'
    });
  }
}

module.exports = EnhancedMemoryOptimizer;