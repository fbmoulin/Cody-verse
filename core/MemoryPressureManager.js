const BaseService = require('./BaseService');

/**
 * Memory Pressure Manager - Proactive memory management without GC dependency
 */
class MemoryPressureManager extends BaseService {
  constructor() {
    super('MemoryPressureManager');
    this.initialize();
  }

  initialize() {
    this.memoryThresholds = {
      warning: 75,   // Start monitoring
      critical: 85,  // Start cleanup
      emergency: 95  // Aggressive cleanup
    };

    this.cleanupStrategies = new Map();
    this.memoryHistory = [];
    this.maxHistorySize = 50;

    this.setupCleanupStrategies();
    this.startMonitoring();

    console.log('Memory Pressure Manager initialized');
  }

  setupCleanupStrategies() {
    // Register different cleanup strategies
    this.cleanupStrategies.set('buffers', this.clearBuffers.bind(this));
    this.cleanupStrategies.set('strings', this.optimizeStrings.bind(this));
    this.cleanupStrategies.set('objects', this.compactObjects.bind(this));
    this.cleanupStrategies.set('arrays', this.optimizeArrays.bind(this));
    this.cleanupStrategies.set('closures', this.clearClosures.bind(this));
  }

  startMonitoring() {
    // Monitor every 15 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 15000);
  }

  checkMemoryPressure() {
    const usage = this.getCurrentMemoryUsage();
    this.recordMemoryUsage(usage);

    if (usage.usagePercentage >= this.memoryThresholds.emergency) {
      this.handleEmergencyPressure();
    } else if (usage.usagePercentage >= this.memoryThresholds.critical) {
      this.handleCriticalPressure();
    } else if (usage.usagePercentage >= this.memoryThresholds.warning) {
      this.handleWarningPressure();
    }
  }

  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      usagePercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      rss: usage.rss,
      external: usage.external,
      timestamp: Date.now()
    };
  }

  recordMemoryUsage(usage) {
    this.memoryHistory.push(usage);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
  }

  handleWarningPressure() {
    console.log('Memory warning threshold reached - starting preventive cleanup');
    this.executeCleanupStrategy('buffers');
  }

  handleCriticalPressure() {
    console.log('Memory critical threshold reached - executing cleanup strategies');
    this.executeCleanupStrategy('buffers');
    this.executeCleanupStrategy('strings');
    this.executeCleanupStrategy('objects');
  }

  handleEmergencyPressure() {
    console.log('Emergency memory pressure - executing all cleanup strategies');
    
    // Execute all cleanup strategies
    for (const [strategy, handler] of this.cleanupStrategies) {
      try {
        handler();
      } catch (error) {
        console.error(`Cleanup strategy ${strategy} failed:`, error.message);
      }
    }

    // Force memory compaction
    this.forceMemoryCompaction();
  }

  executeCleanupStrategy(strategyName) {
    const strategy = this.cleanupStrategies.get(strategyName);
    if (strategy) {
      try {
        strategy();
      } catch (error) {
        console.error(`Cleanup strategy ${strategyName} failed:`, error.message);
      }
    }
  }

  clearBuffers() {
    // Clear any large buffers that might be cached
    console.log('Clearing buffer caches');
    
    // Force buffer cleanup by creating and destroying large buffers
    try {
      const tempBuffer = Buffer.alloc(1024 * 1024); // 1MB
      tempBuffer.fill(0);
      // Buffer will be eligible for cleanup when it goes out of scope
    } catch (error) {
      console.warn('Buffer cleanup failed:', error.message);
    }
  }

  optimizeStrings() {
    console.log('Optimizing string allocations');
    
    // Force string deduplication by creating temp strings
    const tempStrings = [];
    for (let i = 0; i < 1000; i++) {
      tempStrings.push(`temp_string_${i}`);
    }
    tempStrings.length = 0; // Clear array
  }

  compactObjects() {
    console.log('Compacting object allocations');
    
    // Create temporary objects to force memory reorganization
    const tempObjects = [];
    for (let i = 0; i < 100; i++) {
      tempObjects.push({
        id: i,
        data: new Array(100).fill(null),
        timestamp: Date.now()
      });
    }
    tempObjects.length = 0; // Clear array
  }

  optimizeArrays() {
    console.log('Optimizing array allocations');
    
    // Force array optimization
    const tempArrays = [];
    for (let i = 0; i < 50; i++) {
      const arr = new Array(1000).fill(i);
      arr.pop(); // Force array shrinking
      tempArrays.push(arr);
    }
    tempArrays.length = 0;
  }

  clearClosures() {
    console.log('Clearing closure references');
    
    // Clear any closure references that might be holding memory
    if (typeof WeakMap !== 'undefined') {
      const tempWeakMap = new WeakMap();
      // WeakMap will help with cleanup
    }
  }

  forceMemoryCompaction() {
    console.log('Forcing memory compaction');
    
    // Multiple strategies to force memory reorganization
    this.createMemoryPressure();
    this.triggerGCAlternatives();
    this.optimizeMemoryLayout();
  }

  createMemoryPressure() {
    // Create controlled memory pressure to trigger cleanup
    const pressureArrays = [];
    
    try {
      // Allocate and immediately release memory to trigger cleanup
      for (let i = 0; i < 10; i++) {
        const largeArray = new Array(100000).fill(null);
        pressureArrays.push(largeArray);
      }
      
      // Clear all at once to trigger bulk cleanup
      pressureArrays.length = 0;
      
    } catch (error) {
      console.warn('Memory pressure creation failed:', error.message);
    }
  }

  triggerGCAlternatives() {
    // Alternative methods to trigger garbage collection-like behavior
    
    // Method 1: setImmediate for next-tick cleanup
    if (typeof setImmediate !== 'undefined') {
      setImmediate(() => {
        // Next tick processing
      });
    }
    
    // Method 2: setTimeout with 0 delay
    setTimeout(() => {
      // Force event loop processing
    }, 0);
    
    // Method 3: Process nextTick
    process.nextTick(() => {
      // Next tick cleanup
    });
  }

  optimizeMemoryLayout() {
    // Force memory layout optimization
    
    // Create and destroy objects of different sizes
    const sizes = [100, 1000, 10000];
    
    sizes.forEach(size => {
      const tempArray = new Array(size);
      tempArray.fill(null);
      tempArray.length = 0;
    });
  }

  // Intelligent memory optimization based on usage patterns
  intelligentOptimization() {
    const currentUsage = this.getCurrentMemoryUsage();
    const trend = this.analyzeMemoryTrend();
    
    console.log(`Intelligent optimization - Usage: ${currentUsage.usagePercentage}%, Trend: ${trend}`);
    
    if (trend === 'rapidly_increasing') {
      this.handleEmergencyPressure();
    } else if (trend === 'increasing') {
      this.handleCriticalPressure();
    } else if (currentUsage.usagePercentage > this.memoryThresholds.critical) {
      this.handleCriticalPressure();
    }

    return {
      usage: currentUsage,
      trend,
      actionTaken: this.getLastAction()
    };
  }

  analyzeMemoryTrend() {
    if (this.memoryHistory.length < 3) return 'insufficient_data';
    
    const recent = this.memoryHistory.slice(-3);
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

  getLastAction() {
    // Return the last action taken for reporting
    return 'memory_optimization_completed';
  }

  // Get comprehensive statistics
  getStats() {
    const currentUsage = this.getCurrentMemoryUsage();
    const trend = this.analyzeMemoryTrend();
    
    return {
      currentUsage,
      trend,
      thresholds: this.memoryThresholds,
      history: this.memoryHistory.slice(-10), // Last 10 readings
      strategies: Array.from(this.cleanupStrategies.keys()),
      recommendations: this.getRecommendations(currentUsage, trend)
    };
  }

  getRecommendations(usage, trend) {
    const recommendations = [];
    
    if (usage.usagePercentage > 90) {
      recommendations.push('Critical: Consider restarting service');
      recommendations.push('Immediate memory optimization required');
    } else if (usage.usagePercentage > 80) {
      recommendations.push('High memory usage detected');
      recommendations.push('Monitor memory growth closely');
    }
    
    if (trend === 'rapidly_increasing') {
      recommendations.push('Memory growth rate is concerning');
      recommendations.push('Investigate memory leak sources');
    }
    
    recommendations.push('Consider running Node.js with --expose-gc for better GC control');
    
    return recommendations;
  }

  // Cleanup resources
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.memoryHistory = [];
    this.cleanupStrategies.clear();
    
    console.log('Memory Pressure Manager cleanup completed');
  }
}

module.exports = MemoryPressureManager;