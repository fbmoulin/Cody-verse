const BaseService = require('./BaseService');

/**
 * Memory Leak Detector - Identifies and prevents memory leaks
 */
class MemoryLeakDetector extends BaseService {
  constructor() {
    super('MemoryLeakDetector');
    this.initialize();
  }

  initialize() {
    this.snapshots = [];
    this.maxSnapshots = 20;
    this.leakThreshold = 5; // MB growth per minute
    this.monitoringInterval = null;
    
    // Track potential leak sources
    this.leakSources = {
      eventListeners: new Set(),
      timers: new Set(),
      closures: new WeakMap(),
      largeObjects: new Map()
    };

    this.startMonitoring();
    console.log('Memory leak detector initialized');
  }

  startMonitoring() {
    // Take memory snapshots every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
      this.analyzeLeaks();
    }, 30000);

    // Register process monitoring
    this.setupProcessMonitoring();
  }

  takeSnapshot() {
    const usage = process.memoryUsage();
    const timestamp = Date.now();
    
    const snapshot = {
      timestamp,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
      usagePercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  analyzeLeaks() {
    if (this.snapshots.length < 3) return;

    const recent = this.snapshots.slice(-3);
    const growth = this.calculateMemoryGrowth(recent);
    
    if (growth.isLeaking) {
      console.warn('Potential memory leak detected:', {
        growthRate: `${growth.mbPerMinute.toFixed(2)} MB/min`,
        currentUsage: `${(recent[recent.length - 1].heapUsed / 1024 / 1024).toFixed(2)} MB`,
        trend: growth.trend
      });
      
      this.reportLeak(growth);
    }
  }

  calculateMemoryGrowth(snapshots) {
    if (snapshots.length < 2) return { isLeaking: false };

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    
    const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60; // minutes
    const memoryDiff = (last.heapUsed - first.heapUsed) / 1024 / 1024; // MB
    
    const mbPerMinute = memoryDiff / timeDiff;
    const isLeaking = mbPerMinute > this.leakThreshold;
    
    // Analyze trend
    let trend = 'stable';
    if (snapshots.length >= 3) {
      const growthRates = [];
      for (let i = 1; i < snapshots.length; i++) {
        const prevGrowth = (snapshots[i].heapUsed - snapshots[i-1].heapUsed) / 1024 / 1024;
        growthRates.push(prevGrowth);
      }
      
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      if (avgGrowth > 1) trend = 'increasing';
      else if (avgGrowth < -1) trend = 'decreasing';
    }

    return {
      isLeaking,
      mbPerMinute,
      trend,
      totalGrowth: memoryDiff,
      timeSpan: timeDiff
    };
  }

  reportLeak(growth) {
    const report = {
      timestamp: new Date().toISOString(),
      severity: this.getLeakSeverity(growth.mbPerMinute),
      details: growth,
      recommendations: this.getRecommendations(growth),
      potentialSources: this.identifyPotentialSources()
    };

    // Log to error monitoring
    const logger = require('../server/logger');
    logger.error('Memory leak detected', {
      category: 'memory_leak',
      ...report
    });

    return report;
  }

  getLeakSeverity(mbPerMinute) {
    if (mbPerMinute > 20) return 'critical';
    if (mbPerMinute > 10) return 'high';
    if (mbPerMinute > 5) return 'medium';
    return 'low';
  }

  getRecommendations(growth) {
    const recommendations = [];

    if (growth.mbPerMinute > 10) {
      recommendations.push('Immediate investigation required - restart service if critical');
      recommendations.push('Check for unclosed database connections');
      recommendations.push('Review recent code changes for event listener leaks');
    }

    if (growth.trend === 'increasing') {
      recommendations.push('Growth rate is accelerating - monitor closely');
      recommendations.push('Consider implementing circuit breakers');
    }

    recommendations.push('Run garbage collection manually');
    recommendations.push('Clear application caches');
    recommendations.push('Review large object allocations');

    return recommendations;
  }

  identifyPotentialSources() {
    const sources = [];

    // Check for excessive event listeners
    if (this.leakSources.eventListeners.size > 50) {
      sources.push({
        type: 'event_listeners',
        count: this.leakSources.eventListeners.size,
        risk: 'high'
      });
    }

    // Check for excessive timers
    if (this.leakSources.timers.size > 20) {
      sources.push({
        type: 'timers',
        count: this.leakSources.timers.size,
        risk: 'medium'
      });
    }

    // Check for large objects
    let largeObjectSize = 0;
    for (const [key, size] of this.leakSources.largeObjects) {
      largeObjectSize += size;
    }

    if (largeObjectSize > 50 * 1024 * 1024) { // 50MB
      sources.push({
        type: 'large_objects',
        totalSize: `${Math.round(largeObjectSize / 1024 / 1024)}MB`,
        count: this.leakSources.largeObjects.size,
        risk: 'high'
      });
    }

    return sources;
  }

  setupProcessMonitoring() {
    // Monitor unhandled promises
    process.on('unhandledRejection', (reason, promise) => {
      console.warn('Unhandled promise rejection detected (potential memory leak):', reason);
    });

    // Monitor uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception detected (potential memory leak):', error.message);
    });
  }

  // Track event listeners
  trackEventListener(target, event, listener) {
    const key = `${target.constructor.name}:${event}`;
    this.leakSources.eventListeners.add(key);
  }

  untrackEventListener(target, event, listener) {
    const key = `${target.constructor.name}:${event}`;
    this.leakSources.eventListeners.delete(key);
  }

  // Track timers
  trackTimer(timerId, type = 'timeout') {
    this.leakSources.timers.add({ id: timerId, type, created: Date.now() });
  }

  untrackTimer(timerId) {
    for (const timer of this.leakSources.timers) {
      if (timer.id === timerId) {
        this.leakSources.timers.delete(timer);
        break;
      }
    }
  }

  // Track large objects
  trackLargeObject(key, size) {
    this.leakSources.largeObjects.set(key, size);
  }

  untrackLargeObject(key) {
    this.leakSources.largeObjects.delete(key);
  }

  // Force memory analysis
  performAnalysis() {
    const snapshot = this.takeSnapshot();
    const analysis = this.analyzeLeaks();
    
    return {
      currentSnapshot: snapshot,
      growth: analysis,
      potentialSources: this.identifyPotentialSources(),
      recommendations: analysis ? this.getRecommendations(analysis) : []
    };
  }

  // Get comprehensive report
  getReport() {
    const currentUsage = this.takeSnapshot();
    const growth = this.snapshots.length >= 3 ? 
      this.calculateMemoryGrowth(this.snapshots.slice(-3)) : null;

    return {
      status: growth && growth.isLeaking ? 'warning' : 'healthy',
      currentUsage,
      growth,
      snapshots: this.snapshots,
      leakSources: {
        eventListeners: this.leakSources.eventListeners.size,
        timers: this.leakSources.timers.size,
        largeObjects: this.leakSources.largeObjects.size
      },
      recommendations: growth ? this.getRecommendations(growth) : []
    };
  }

  // Cleanup
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.snapshots = [];
    this.leakSources.eventListeners.clear();
    this.leakSources.timers.clear();
    this.leakSources.largeObjects.clear();
    
    console.log('Memory leak detector cleanup completed');
  }
}

module.exports = MemoryLeakDetector;