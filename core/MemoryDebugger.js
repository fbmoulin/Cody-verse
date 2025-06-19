const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Memory Debugger - Advanced memory leak detection and aggressive optimization
 */
class MemoryDebugger extends BaseService {
  constructor() {
    super('MemoryDebugger');
    this.memorySnapshots = [];
    this.leakSources = new Map();
    this.largeObjectTracker = new WeakMap();
    this.eventListenerTracker = new Map();
    this.moduleLoadTracker = new Set();
    this.initialize();
  }

  initialize() {
    this.takeMemorySnapshot('initial');
    this.startLeakDetection();
    this.trackModuleLoads();
    logger.info('Memory Debugger initialized', {
      category: 'memory_debug'
    });
  }

  takeMemorySnapshot(label = 'snapshot') {
    const memUsage = process.memoryUsage();
    const snapshot = {
      timestamp: Date.now(),
      label,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
      usagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    this.memorySnapshots.push(snapshot);
    
    // Keep only last 50 snapshots
    if (this.memorySnapshots.length > 50) {
      this.memorySnapshots = this.memorySnapshots.slice(-50);
    }

    logger.info('Memory snapshot taken', {
      label,
      usage: snapshot.usagePercentage.toFixed(2) + '%',
      heapUsed: snapshot.heapUsed,
      category: 'memory_debug'
    });

    return snapshot;
  }

  analyzeMemoryLeaks() {
    if (this.memorySnapshots.length < 3) return null;

    const recent = this.memorySnapshots.slice(-5);
    const growthPattern = this.calculateGrowthPattern(recent);
    const leakIndicators = this.detectLeakIndicators();

    const analysis = {
      growthPattern,
      leakIndicators,
      recommendations: this.generateLeakRecommendations(growthPattern, leakIndicators),
      timestamp: Date.now()
    };

    logger.info('Memory leak analysis completed', {
      ...analysis,
      category: 'memory_debug'
    });

    return analysis;
  }

  calculateGrowthPattern(snapshots) {
    if (snapshots.length < 2) return { consistent: false, rate: 0 };

    const growthRates = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];
      const rate = ((curr.heapUsed - prev.heapUsed) / prev.heapUsed) * 100;
      growthRates.push(rate);
    }

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const isConsistent = growthRates.every(rate => rate > 0);

    return {
      consistent: isConsistent,
      rate: avgGrowthRate,
      trend: avgGrowthRate > 5 ? 'increasing' : avgGrowthRate < -5 ? 'decreasing' : 'stable'
    };
  }

  detectLeakIndicators() {
    const indicators = {
      moduleCache: this.analyzeModuleCache(),
      eventListeners: this.analyzeEventListeners(),
      largeObjects: this.analyzeLargeObjects(),
      globalVariables: this.analyzeGlobalVariables(),
      timers: this.analyzeTimers()
    };

    return indicators;
  }

  analyzeModuleCache() {
    const cacheSize = Object.keys(require.cache).length;
    const nonNodeModules = Object.keys(require.cache).filter(
      path => !path.includes('node_modules')
    ).length;

    return {
      totalModules: cacheSize,
      userModules: nonNodeModules,
      recommendation: cacheSize > 500 ? 'Consider clearing non-essential modules' : 'Normal'
    };
  }

  analyzeEventListeners() {
    const processListeners = process.listenerCount ? 
      process.eventNames().reduce((count, event) => {
        return count + process.listenerCount(event);
      }, 0) : 0;

    return {
      processListeners,
      recommendation: processListeners > 50 ? 'Too many event listeners detected' : 'Normal'
    };
  }

  analyzeLargeObjects() {
    // Check for large objects in global scope
    const largeGlobals = [];
    for (const key in global) {
      if (global.hasOwnProperty(key)) {
        const value = global[key];
        if (typeof value === 'object' && value !== null) {
          try {
            const size = JSON.stringify(value).length;
            if (size > 100000) { // 100KB
              largeGlobals.push({ key, size });
            }
          } catch (e) {
            // Circular reference or non-serializable
          }
        }
      }
    }

    return {
      largeGlobals,
      recommendation: largeGlobals.length > 0 ? 'Large global objects detected' : 'Normal'
    };
  }

  analyzeGlobalVariables() {
    const globalKeys = Object.keys(global);
    const suspiciousGlobals = globalKeys.filter(key => 
      !['console', 'process', 'Buffer', 'global', '__dirname', '__filename', 'module', 'require', 'exports'].includes(key)
    );

    return {
      totalGlobals: globalKeys.length,
      suspiciousGlobals,
      recommendation: suspiciousGlobals.length > 20 ? 'Too many global variables' : 'Normal'
    };
  }

  analyzeTimers() {
    const handles = process._getActiveHandles();
    const requests = process._getActiveRequests();

    return {
      activeHandles: handles.length,
      activeRequests: requests.length,
      recommendation: handles.length > 50 ? 'Too many active handles' : 'Normal'
    };
  }

  generateLeakRecommendations(growthPattern, indicators) {
    const recommendations = [];

    if (growthPattern.consistent && growthPattern.rate > 5) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediate investigation required',
        description: `Consistent memory growth at ${growthPattern.rate.toFixed(2)}% rate`
      });
    }

    if (indicators.moduleCache.totalModules > 500) {
      recommendations.push({
        priority: 'high',
        action: 'Clear module cache',
        description: `${indicators.moduleCache.totalModules} modules cached`
      });
    }

    if (indicators.eventListeners.processListeners > 50) {
      recommendations.push({
        priority: 'high',
        action: 'Remove excess event listeners',
        description: `${indicators.eventListeners.processListeners} listeners detected`
      });
    }

    if (indicators.largeObjects.largeGlobals.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Clean large global objects',
        description: `${indicators.largeObjects.largeGlobals.length} large objects in global scope`
      });
    }

    return recommendations;
  }

  async aggressiveMemoryCleanup() {
    const beforeSnapshot = this.takeMemorySnapshot('before_aggressive_cleanup');
    let cleanedItems = 0;

    try {
      // 1. Clear module cache aggressively
      const modulesBefore = Object.keys(require.cache).length;
      this.clearNonEssentialModules();
      const modulesAfter = Object.keys(require.cache).length;
      cleanedItems += modulesBefore - modulesAfter;

      // 2. Remove event listeners
      const listenersCleaned = this.cleanupEventListeners();
      cleanedItems += listenersCleaned;

      // 3. Clear global objects
      const globalsCleaned = this.cleanupGlobalObjects();
      cleanedItems += globalsCleaned;

      // 4. Force multiple garbage collection cycles
      if (global.gc) {
        for (let i = 0; i < 5; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 5. Clear internal caches
      const cachesCleaned = this.clearInternalCaches();
      cleanedItems += cachesCleaned;

      const afterSnapshot = this.takeMemorySnapshot('after_aggressive_cleanup');
      const memoryFreed = beforeSnapshot.heapUsed - afterSnapshot.heapUsed;
      const improvement = beforeSnapshot.usagePercentage - afterSnapshot.usagePercentage;

      logger.info('Aggressive memory cleanup completed', {
        cleanedItems,
        memoryFreed,
        improvement: improvement.toFixed(2) + '%',
        beforeUsage: beforeSnapshot.usagePercentage.toFixed(2) + '%',
        afterUsage: afterSnapshot.usagePercentage.toFixed(2) + '%',
        category: 'memory_debug'
      });

      return {
        success: true,
        stats: {
          cleanedItems,
          memoryFreed,
          improvement,
          beforeUsage: beforeSnapshot.usagePercentage,
          afterUsage: afterSnapshot.usagePercentage
        }
      };

    } catch (error) {
      logger.error('Aggressive memory cleanup failed', {
        error: error.message,
        category: 'memory_debug'
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  clearNonEssentialModules() {
    const essentialModules = [
      'express',
      'path',
      'fs',
      'util',
      'events',
      'stream',
      'crypto',
      'os',
      'cluster',
      'worker_threads'
    ];

    let cleared = 0;
    const cacheKeys = Object.keys(require.cache);
    
    for (const moduleId of cacheKeys) {
      // Don't clear core modules, node_modules, or essential application files
      if (moduleId.includes('node_modules') || 
          moduleId.includes('/core/') ||
          moduleId.includes('server.js') ||
          essentialModules.some(essential => moduleId.includes(essential))) {
        continue;
      }

      // Clear non-essential cached modules
      try {
        delete require.cache[moduleId];
        cleared++;
      } catch (e) {
        // Module might be in use
      }
    }

    return cleared;
  }

  cleanupEventListeners() {
    let cleaned = 0;

    // Clean process event listeners (keep essential ones)
    const essentialEvents = ['exit', 'SIGTERM', 'SIGINT', 'uncaughtException', 'unhandledRejection'];
    
    for (const eventName of process.eventNames()) {
      if (!essentialEvents.includes(eventName)) {
        const listeners = process.listeners(eventName);
        if (listeners.length > 3) {
          // Keep only first 3 listeners
          const excess = listeners.slice(3);
          excess.forEach(listener => {
            try {
              process.removeListener(eventName, listener);
              cleaned++;
            } catch (e) {
              // Listener might already be removed
            }
          });
        }
      }
    }

    return cleaned;
  }

  cleanupGlobalObjects() {
    let cleaned = 0;

    const safeToDelete = ['debugInfo', 'tempData', 'cache', '_temp', '_debug'];
    
    for (const key of safeToDelete) {
      if (global[key]) {
        try {
          delete global[key];
          cleaned++;
        } catch (e) {
          // Property might not be configurable
        }
      }
    }

    // Clean large strings in global scope
    for (const key in global) {
      if (global.hasOwnProperty(key)) {
        const value = global[key];
        if (typeof value === 'string' && value.length > 500000) { // 500KB
          try {
            delete global[key];
            cleaned++;
          } catch (e) {
            // Property might not be configurable
          }
        }
      }
    }

    return cleaned;
  }

  clearInternalCaches() {
    let cleared = 0;

    // Clear any internal caches we can find
    if (global.cache) {
      if (typeof global.cache.clear === 'function') {
        global.cache.clear();
        cleared++;
      } else if (global.cache instanceof Map) {
        global.cache.clear();
        cleared++;
      }
    }

    // Clear Buffer pool
    if (Buffer.poolSize) {
      Buffer.poolSize = 0;
      cleared++;
    }

    return cleared;
  }

  startLeakDetection() {
    setInterval(() => {
      const analysis = this.analyzeMemoryLeaks();
      if (analysis && analysis.growthPattern.consistent && analysis.growthPattern.rate > 10) {
        logger.warn('Significant memory leak detected', {
          growthRate: analysis.growthPattern.rate,
          recommendations: analysis.recommendations,
          category: 'memory_debug'
        });
      }
    }, 30000); // Check every 30 seconds
  }

  trackModuleLoads() {
    const originalRequire = require;
    const self = this;
    
    // This is for debugging purposes only
    if (process.env.NODE_ENV === 'development') {
      Module._load = function(id, parent, isMain) {
        self.moduleLoadTracker.add(id);
        return originalRequire.apply(this, arguments);
      };
    }
  }

  getMemoryReport() {
    const currentMemory = process.memoryUsage();
    const analysis = this.analyzeMemoryLeaks();
    
    return {
      current: {
        heapUsed: currentMemory.heapUsed,
        heapTotal: currentMemory.heapTotal,
        usagePercentage: (currentMemory.heapUsed / currentMemory.heapTotal) * 100,
        rss: currentMemory.rss,
        external: currentMemory.external
      },
      snapshots: this.memorySnapshots.slice(-10),
      analysis,
      recommendations: analysis ? analysis.recommendations : []
    };
  }

  cleanup() {
    this.memorySnapshots = [];
    this.leakSources.clear();
    this.eventListenerTracker.clear();
    this.moduleLoadTracker.clear();
    
    logger.info('Memory Debugger cleaned up', {
      category: 'memory_debug'
    });
  }
}

module.exports = MemoryDebugger;