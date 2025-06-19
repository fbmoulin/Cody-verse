const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Memory Optimizer - Manages memory usage and implements cleanup strategies
 */
class MemoryOptimizer extends BaseService {
  constructor() {
    super('MemoryOptimizer');
    this.memoryThresholds = {
      warning: 85,
      critical: 95,
      cleanup: 90
    };
    this.cleanupStrategies = new Map();
    this.monitoringInterval = null;
    this.lastCleanup = Date.now();
    this.initializeOptimizer();
  }

  initializeOptimizer() {
    this.setupCleanupStrategies();
    this.startMemoryMonitoring();
    logger.info('Memory optimizer initialized', {
      category: 'memory_optimization',
      thresholds: this.memoryThresholds
    });
  }

  setupCleanupStrategies() {
    // Cache cleanup strategy
    this.cleanupStrategies.set('cache', {
      priority: 1,
      execute: () => this.cleanupCache(),
      description: 'Clear expired cache entries'
    });

    // Loading states cleanup
    this.cleanupStrategies.set('loading_states', {
      priority: 2,
      execute: () => this.cleanupLoadingStates(),
      description: 'Remove old loading states'
    });

    // Progress indicators cleanup
    this.cleanupStrategies.set('progress_indicators', {
      priority: 3,
      execute: () => this.cleanupProgressIndicators(),
      description: 'Remove completed progress indicators'
    });

    // Log buffer cleanup
    this.cleanupStrategies.set('logs', {
      priority: 4,
      execute: () => this.cleanupLogBuffers(),
      description: 'Clear log buffers'
    });

    // Garbage collection
    this.cleanupStrategies.set('gc', {
      priority: 5,
      execute: () => this.forceGarbageCollection(),
      description: 'Force garbage collection'
    });
  }

  startMemoryMonitoring() {
    // Monitor memory every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const usagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    logger.info('Memory usage check', {
      category: 'memory_monitoring',
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      usagePercentage: usagePercentage.toFixed(2),
      rss: memoryUsage.rss,
      external: memoryUsage.external
    });

    if (usagePercentage >= this.memoryThresholds.cleanup) {
      this.executeCleanup(usagePercentage);
    }

    return {
      usagePercentage,
      status: this.getMemoryStatus(usagePercentage),
      memoryUsage
    };
  }

  getMemoryStatus(usagePercentage) {
    if (usagePercentage >= this.memoryThresholds.critical) return 'critical';
    if (usagePercentage >= this.memoryThresholds.warning) return 'warning';
    return 'healthy';
  }

  async executeCleanup(currentUsage) {
    const timeSinceLastCleanup = Date.now() - this.lastCleanup;
    
    // Don't run cleanup more than once per minute
    if (timeSinceLastCleanup < 60000) return;

    logger.info('Memory cleanup initiated', {
      category: 'memory_cleanup',
      currentUsage: currentUsage.toFixed(2),
      threshold: this.memoryThresholds.cleanup
    });

    const strategies = Array.from(this.cleanupStrategies.entries())
      .sort(([,a], [,b]) => a.priority - b.priority);

    let cleanedItems = 0;
    const cleanupResults = [];

    for (const [name, strategy] of strategies) {
      try {
        const result = await strategy.execute();
        cleanedItems += result.cleaned || 0;
        cleanupResults.push({
          strategy: name,
          ...result
        });

        logger.info('Cleanup strategy executed', {
          category: 'memory_cleanup',
          strategy: name,
          cleaned: result.cleaned || 0,
          description: strategy.description
        });

        // Check if memory usage improved significantly
        const newUsage = this.getCurrentMemoryUsage();
        if (newUsage < this.memoryThresholds.warning) {
          logger.info('Memory cleanup successful, stopping early', {
            category: 'memory_cleanup',
            newUsage: newUsage.toFixed(2),
            strategiesExecuted: cleanupResults.length
          });
          break;
        }
      } catch (error) {
        logger.error('Cleanup strategy failed', {
          category: 'memory_cleanup',
          strategy: name,
          error: error.message
        });
      }
    }

    this.lastCleanup = Date.now();

    const finalUsage = this.getCurrentMemoryUsage();
    logger.info('Memory cleanup completed', {
      category: 'memory_cleanup',
      initialUsage: currentUsage.toFixed(2),
      finalUsage: finalUsage.toFixed(2),
      improvement: (currentUsage - finalUsage).toFixed(2),
      cleanedItems,
      strategiesExecuted: cleanupResults.length
    });

    return {
      initialUsage: currentUsage,
      finalUsage,
      improvement: currentUsage - finalUsage,
      cleanedItems,
      strategies: cleanupResults
    };
  }

  getCurrentMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    return (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  }

  async cleanupCache() {
    let cleaned = 0;
    
    try {
      // Access cache manager if available
      const cacheManager = global.cacheManager || require('./OptimizedCacheManager');
      if (cacheManager && typeof cacheManager.cleanup === 'function') {
        const result = cacheManager.cleanup();
        cleaned = result.removed || 0;
      }
    } catch (error) {
      logger.error('Cache cleanup failed', { error: error.message });
    }

    return { cleaned, type: 'cache_entries' };
  }

  async cleanupLoadingStates() {
    let cleaned = 0;
    
    try {
      // Access UX manager if available
      const uxManager = global.uxManager;
      if (uxManager && uxManager.loadingStates) {
        const now = Date.now();
        const oldStates = [];
        
        for (const [id, state] of uxManager.loadingStates.entries()) {
          // Remove loading states older than 10 minutes
          if (!state.isLoading && (now - (state.startTime || 0)) > 600000) {
            oldStates.push(id);
          }
        }
        
        oldStates.forEach(id => {
          uxManager.loadingStates.delete(id);
          cleaned++;
        });
      }
    } catch (error) {
      logger.error('Loading states cleanup failed', { error: error.message });
    }

    return { cleaned, type: 'loading_states' };
  }

  async cleanupProgressIndicators() {
    let cleaned = 0;
    
    try {
      const uxManager = global.uxManager;
      if (uxManager && uxManager.progressTrackers) {
        const now = Date.now();
        const oldIndicators = [];
        
        for (const [id, indicator] of uxManager.progressTrackers.entries()) {
          // Remove completed indicators older than 5 minutes
          if (indicator.isComplete && (now - (indicator.createdAt || 0)) > 300000) {
            oldIndicators.push(id);
          }
        }
        
        oldIndicators.forEach(id => {
          uxManager.progressTrackers.delete(id);
          cleaned++;
        });
      }
    } catch (error) {
      logger.error('Progress indicators cleanup failed', { error: error.message });
    }

    return { cleaned, type: 'progress_indicators' };
  }

  async cleanupLogBuffers() {
    let cleaned = 0;
    
    try {
      // Clear any in-memory log buffers
      if (global.logBuffers) {
        for (const buffer in global.logBuffers) {
          if (Array.isArray(global.logBuffers[buffer])) {
            cleaned += global.logBuffers[buffer].length;
            global.logBuffers[buffer] = [];
          }
        }
      }
    } catch (error) {
      logger.error('Log buffers cleanup failed', { error: error.message });
    }

    return { cleaned, type: 'log_entries' };
  }

  async forceGarbageCollection() {
    let cleaned = 0;
    
    try {
      if (global.gc) {
        const beforeGC = process.memoryUsage().heapUsed;
        global.gc();
        const afterGC = process.memoryUsage().heapUsed;
        cleaned = Math.max(0, beforeGC - afterGC);
        
        logger.info('Garbage collection executed', {
          category: 'memory_cleanup',
          freedMemory: cleaned,
          beforeGC,
          afterGC
        });
      }
    } catch (error) {
      logger.error('Garbage collection failed', { error: error.message });
    }

    return { cleaned, type: 'freed_bytes' };
  }

  getMemoryReport() {
    const memoryUsage = process.memoryUsage();
    const usagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    return {
      current: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        usagePercentage: parseFloat(usagePercentage.toFixed(2)),
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      status: this.getMemoryStatus(usagePercentage),
      thresholds: this.memoryThresholds,
      lastCleanup: this.lastCleanup,
      monitoring: !!this.monitoringInterval
    };
  }

  async optimizeMemoryUsage() {
    const currentUsage = this.getCurrentMemoryUsage();
    
    if (currentUsage >= this.memoryThresholds.cleanup) {
      return await this.executeCleanup(currentUsage);
    }
    
    return {
      message: 'Memory usage within acceptable limits',
      currentUsage,
      threshold: this.memoryThresholds.cleanup
    };
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory monitoring stopped', { category: 'memory_optimization' });
    }
  }
}

module.exports = MemoryOptimizer;