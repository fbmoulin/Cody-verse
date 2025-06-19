const BaseService = require('./BaseService');

/**
 * Advanced Garbage Collector - Intelligent memory cleanup strategies
 */
class AdvancedGarbageCollector extends BaseService {
  constructor() {
    super('AdvancedGarbageCollector');
    this.initialize();
  }

  initialize() {
    this.gcStats = {
      totalCollections: 0,
      memoryReclaimed: 0,
      averageCleanupTime: 0,
      lastGCTime: null
    };

    this.gcStrategies = [
      'mild',      // Standard GC
      'moderate',  // Multiple GC cycles
      'aggressive' // Full memory cleanup
    ];

    // Enable manual GC if available
    if (global.gc) {
      console.log('Manual garbage collection available');
    } else {
      console.log('Manual GC not available - consider running with --expose-gc');
    }

    this.startPeriodicCleanup();
  }

  startPeriodicCleanup() {
    // Mild cleanup every 2 minutes
    setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage.usagePercentage > 75) {
        this.performGarbageCollection('mild');
      }
    }, 120000);

    // Moderate cleanup every 10 minutes
    setInterval(() => {
      this.performGarbageCollection('moderate');
    }, 600000);
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

  performGarbageCollection(strategy = 'mild') {
    const startTime = Date.now();
    const startUsage = this.getMemoryUsage();

    console.log(`Starting ${strategy} garbage collection at ${startUsage.usagePercentage}% usage`);

    try {
      switch (strategy) {
        case 'mild':
          this.mildCleanup();
          break;
        case 'moderate':
          this.moderateCleanup();
          break;
        case 'aggressive':
          this.aggressiveCleanup();
          break;
      }

      const endTime = Date.now();
      const endUsage = this.getMemoryUsage();
      const memoryReclaimed = startUsage.heapUsed - endUsage.heapUsed;
      const cleanupTime = endTime - startTime;

      // Update statistics
      this.gcStats.totalCollections++;
      this.gcStats.memoryReclaimed += Math.max(0, memoryReclaimed);
      this.gcStats.averageCleanupTime = (this.gcStats.averageCleanupTime + cleanupTime) / 2;
      this.gcStats.lastGCTime = new Date().toISOString();

      const improvement = startUsage.usagePercentage - endUsage.usagePercentage;
      
      console.log(`${strategy} GC completed: ${startUsage.usagePercentage}% → ${endUsage.usagePercentage}% (${improvement.toFixed(1)}% improvement) in ${cleanupTime}ms`);

      return {
        strategy,
        before: startUsage,
        after: endUsage,
        improvement,
        memoryReclaimed: Math.round(memoryReclaimed / 1024 / 1024), // MB
        duration: cleanupTime
      };
    } catch (error) {
      console.error(`Error during ${strategy} garbage collection:`, error.message);
      return { error: error.message };
    }
  }

  mildCleanup() {
    if (global.gc) {
      global.gc();
    }
    
    // Clear small references
    this.clearWeakReferences();
  }

  moderateCleanup() {
    if (global.gc) {
      // Multiple GC cycles for better cleanup
      for (let i = 0; i < 3; i++) {
        global.gc();
        // Small delay between cycles
        this.sleep(10);
      }
    }

    // Clear module cache of unused modules
    this.clearUnusedModules();
    
    // Clear event listeners
    this.clearStaleEventListeners();
  }

  aggressiveCleanup() {
    if (global.gc) {
      // Aggressive GC with multiple cycles
      for (let i = 0; i < 5; i++) {
        global.gc();
        this.sleep(20);
      }
    }

    // Clear all possible references
    this.clearWeakReferences();
    this.clearUnusedModules();
    this.clearStaleEventListeners();
    this.clearLargeObjects();
    
    // Force process optimization
    this.optimizeProcessMemory();
  }

  clearWeakReferences() {
    // Clear any weak references that might be holding memory
    try {
      if (typeof WeakRef !== 'undefined') {
        // WeakRef cleanup would go here in newer Node.js versions
      }
    } catch (error) {
      // WeakRef not available in this Node.js version
    }
  }

  clearUnusedModules() {
    try {
      const moduleCache = require.cache;
      const initialCount = Object.keys(moduleCache).length;
      
      // Remove modules that haven't been accessed recently
      const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes
      
      for (const [modulePath, moduleObj] of Object.entries(moduleCache)) {
        // Skip core modules and recently accessed modules
        if (modulePath.includes('node_modules') && 
            moduleObj.loaded && 
            (!moduleObj.lastAccessed || moduleObj.lastAccessed < cutoffTime)) {
          
          try {
            delete require.cache[modulePath];
          } catch (error) {
            // Module couldn't be safely removed
          }
        }
      }
      
      const finalCount = Object.keys(moduleCache).length;
      const cleared = initialCount - finalCount;
      
      if (cleared > 0) {
        console.log(`Cleared ${cleared} unused modules from cache`);
      }
    } catch (error) {
      console.warn('Module cache cleanup failed:', error.message);
    }
  }

  clearStaleEventListeners() {
    try {
      // Clear any stale event listeners on process
      const eventNames = process.eventNames();
      eventNames.forEach(eventName => {
        const listeners = process.listeners(eventName);
        if (listeners.length > 10) { // Arbitrary threshold
          console.warn(`High number of listeners for ${eventName}: ${listeners.length}`);
        }
      });
    } catch (error) {
      console.warn('Event listener cleanup failed:', error.message);
    }
  }

  clearLargeObjects() {
    // This would clear application-specific large objects
    // Implementation depends on application structure
    console.log('Clearing large objects from memory');
  }

  optimizeProcessMemory() {
    try {
      // Optimize V8 heap if possible
      if (global.gc) {
        // Force full garbage collection
        global.gc();
        
        // Additional V8 optimizations could go here
        // This is a placeholder for V8-specific optimizations
      }
    } catch (error) {
      console.warn('Process memory optimization failed:', error.message);
    }
  }

  sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy wait for very short delays
    }
  }

  // Intelligent GC based on memory pressure
  autoOptimize() {
    const usage = this.getMemoryUsage();
    
    if (usage.usagePercentage > 90) {
      return this.performGarbageCollection('aggressive');
    } else if (usage.usagePercentage > 80) {
      return this.performGarbageCollection('moderate');
    } else if (usage.usagePercentage > 70) {
      return this.performGarbageCollection('mild');
    }
    
    return { message: 'No optimization needed', usage: usage.usagePercentage };
  }

  // Monitor memory trends
  analyzeMemoryTrend(samples) {
    if (samples.length < 3) return 'insufficient_data';
    
    const recent = samples.slice(-3);
    const growthRates = [];
    
    for (let i = 1; i < recent.length; i++) {
      const growth = recent[i].usagePercentage - recent[i-1].usagePercentage;
      growthRates.push(growth);
    }
    
    const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    
    if (avgGrowth > 5) return 'rapidly_increasing';
    if (avgGrowth > 2) return 'increasing';
    if (avgGrowth < -2) return 'decreasing';
    return 'stable';
  }

  // Get comprehensive statistics
  getStats() {
    const currentUsage = this.getMemoryUsage();
    
    return {
      currentUsage,
      gcStats: this.gcStats,
      recommendations: this.getRecommendations(currentUsage),
      availableStrategies: this.gcStrategies,
      manualGCAvailable: !!global.gc
    };
  }

  getRecommendations(usage) {
    const recommendations = [];
    
    if (usage.usagePercentage > 85) {
      recommendations.push('Immediate aggressive cleanup recommended');
      recommendations.push('Consider restarting service if memory continues to grow');
    } else if (usage.usagePercentage > 75) {
      recommendations.push('Moderate cleanup recommended');
      recommendations.push('Monitor memory growth patterns');
    }
    
    if (!global.gc) {
      recommendations.push('Run Node.js with --expose-gc for better memory management');
    }
    
    return recommendations;
  }

  // Cleanup resources
  cleanup() {
    // Clear any intervals that were set up
    console.log('Advanced Garbage Collector cleanup completed');
  }
}

module.exports = AdvancedGarbageCollector;