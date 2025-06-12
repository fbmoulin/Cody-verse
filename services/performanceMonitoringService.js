class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      database: new Map(),
      ai: new Map(),
      cache: new Map(),
      errors: new Map()
    };
    
    this.thresholds = {
      responseTime: 2000,      // 2 seconds
      dbQueryTime: 1000,       // 1 second
      aiResponseTime: 5000,    // 5 seconds
      errorRate: 0.05,         // 5%
      cacheHitRate: 0.8        // 80%
    };
    
    this.alerts = [];
    this.monitoringInterval = null;
    this.startTime = Date.now();
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.analyzeMetrics();
      this.cleanupOldMetrics();
    }, 60000); // Every minute
    
    const logger = require('../server/logger');
    logger.info('Performance monitoring started');
  }

  recordRequest(method, url, duration, statusCode) {
    const key = `${method}:${url}`;
    const timestamp = Date.now();
    
    if (!this.metrics.requests.has(key)) {
      this.metrics.requests.set(key, []);
    }
    
    this.metrics.requests.get(key).push({
      timestamp,
      duration,
      statusCode,
      success: statusCode < 400
    });
    
    // Alert on slow requests
    if (duration > this.thresholds.responseTime) {
      this.triggerAlert('slow_request', {
        endpoint: key,
        duration,
        threshold: this.thresholds.responseTime
      });
    }
  }

  recordDatabaseQuery(operation, table, duration, success) {
    const key = `${operation}:${table}`;
    const timestamp = Date.now();
    
    if (!this.metrics.database.has(key)) {
      this.metrics.database.set(key, []);
    }
    
    this.metrics.database.get(key).push({
      timestamp,
      duration,
      success
    });
    
    if (duration > this.thresholds.dbQueryTime) {
      this.triggerAlert('slow_query', {
        operation: key,
        duration,
        threshold: this.thresholds.dbQueryTime
      });
    }
  }

  recordAIInteraction(provider, operation, duration, success, tokens = 0) {
    const key = `${provider}:${operation}`;
    const timestamp = Date.now();
    
    if (!this.metrics.ai.has(key)) {
      this.metrics.ai.set(key, []);
    }
    
    this.metrics.ai.get(key).push({
      timestamp,
      duration,
      success,
      tokens
    });
    
    if (duration > this.thresholds.aiResponseTime) {
      this.triggerAlert('slow_ai_response', {
        provider: key,
        duration,
        threshold: this.thresholds.aiResponseTime
      });
    }
  }

  recordCacheOperation(operation, key, hit, duration = 0) {
    const cacheKey = `${operation}:${key}`;
    const timestamp = Date.now();
    
    if (!this.metrics.cache.has(cacheKey)) {
      this.metrics.cache.set(cacheKey, []);
    }
    
    this.metrics.cache.get(cacheKey).push({
      timestamp,
      hit,
      duration
    });
  }

  recordError(type, error, context = {}) {
    const timestamp = Date.now();
    
    if (!this.metrics.errors.has(type)) {
      this.metrics.errors.set(type, []);
    }
    
    this.metrics.errors.get(type).push({
      timestamp,
      error: error.message,
      stack: error.stack,
      context
    });
    
    this.triggerAlert('error', {
      type,
      error: error.message,
      context
    });
  }

  analyzeMetrics() {
    const analysis = {
      requests: this.analyzeRequests(),
      database: this.analyzeDatabase(),
      ai: this.analyzeAI(),
      cache: this.analyzeCache(),
      errors: this.analyzeErrors(),
      system: this.getSystemMetrics()
    };
    
    this.checkThresholds(analysis);
    return analysis;
  }

  analyzeRequests() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const allRequests = [];
    
    for (const [endpoint, requests] of this.metrics.requests) {
      const recentRequests = requests.filter(r => r.timestamp > oneHourAgo);
      allRequests.push(...recentRequests);
    }
    
    if (allRequests.length === 0) {
      return { totalRequests: 0, avgResponseTime: 0, errorRate: 0 };
    }
    
    const totalRequests = allRequests.length;
    const successfulRequests = allRequests.filter(r => r.success).length;
    const avgResponseTime = allRequests.reduce((sum, r) => sum + r.duration, 0) / totalRequests;
    const errorRate = (totalRequests - successfulRequests) / totalRequests;
    
    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      successRate: Math.round((successfulRequests / totalRequests) * 100) / 100,
      p95ResponseTime: this.calculatePercentile(allRequests.map(r => r.duration), 0.95)
    };
  }

  analyzeDatabase() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const allQueries = [];
    
    for (const [operation, queries] of this.metrics.database) {
      const recentQueries = queries.filter(q => q.timestamp > oneHourAgo);
      allQueries.push(...recentQueries);
    }
    
    if (allQueries.length === 0) {
      return { totalQueries: 0, avgQueryTime: 0, successRate: 1 };
    }
    
    const totalQueries = allQueries.length;
    const successfulQueries = allQueries.filter(q => q.success).length;
    const avgQueryTime = allQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries;
    
    return {
      totalQueries,
      avgQueryTime: Math.round(avgQueryTime),
      successRate: Math.round((successfulQueries / totalQueries) * 100) / 100,
      p95QueryTime: this.calculatePercentile(allQueries.map(q => q.duration), 0.95)
    };
  }

  analyzeAI() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const allInteractions = [];
    
    for (const [provider, interactions] of this.metrics.ai) {
      const recentInteractions = interactions.filter(i => i.timestamp > oneHourAgo);
      allInteractions.push(...recentInteractions);
    }
    
    if (allInteractions.length === 0) {
      return { totalInteractions: 0, avgResponseTime: 0, successRate: 1 };
    }
    
    const totalInteractions = allInteractions.length;
    const successfulInteractions = allInteractions.filter(i => i.success).length;
    const avgResponseTime = allInteractions.reduce((sum, i) => sum + i.duration, 0) / totalInteractions;
    const totalTokens = allInteractions.reduce((sum, i) => sum + i.tokens, 0);
    
    return {
      totalInteractions,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round((successfulInteractions / totalInteractions) * 100) / 100,
      totalTokens,
      avgTokensPerRequest: Math.round(totalTokens / totalInteractions)
    };
  }

  analyzeCache() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const allOperations = [];
    
    for (const [key, operations] of this.metrics.cache) {
      const recentOperations = operations.filter(o => o.timestamp > oneHourAgo);
      allOperations.push(...recentOperations);
    }
    
    if (allOperations.length === 0) {
      return { totalOperations: 0, hitRate: 0 };
    }
    
    const totalOperations = allOperations.length;
    const hits = allOperations.filter(o => o.hit).length;
    const hitRate = hits / totalOperations;
    
    return {
      totalOperations,
      hits,
      misses: totalOperations - hits,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  analyzeErrors() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const errorCounts = {};
    let totalErrors = 0;
    
    for (const [type, errors] of this.metrics.errors) {
      const recentErrors = errors.filter(e => e.timestamp > oneHourAgo);
      errorCounts[type] = recentErrors.length;
      totalErrors += recentErrors.length;
    }
    
    return {
      totalErrors,
      errorsByType: errorCounts,
      mostCommonError: Object.keys(errorCounts).reduce((a, b) => 
        errorCounts[a] > errorCounts[b] ? a : b, null
      )
    };
  }

  getSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime: Math.round(uptime / 1000), // seconds
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpuUsage: process.cpuUsage()
    };
  }

  checkThresholds(analysis) {
    const alerts = [];
    
    // Check response time threshold
    if (analysis.requests.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Average response time (${analysis.requests.avgResponseTime}ms) exceeds threshold (${this.thresholds.responseTime}ms)`
      });
    }
    
    // Check error rate threshold
    if (analysis.requests.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'reliability',
        severity: 'critical',
        message: `Error rate (${analysis.requests.errorRate}) exceeds threshold (${this.thresholds.errorRate})`
      });
    }
    
    // Check database performance
    if (analysis.database.avgQueryTime > this.thresholds.dbQueryTime) {
      alerts.push({
        type: 'database',
        severity: 'warning',
        message: `Average database query time (${analysis.database.avgQueryTime}ms) exceeds threshold (${this.thresholds.dbQueryTime}ms)`
      });
    }
    
    // Check cache hit rate
    if (analysis.cache.hitRate < this.thresholds.cacheHitRate) {
      alerts.push({
        type: 'cache',
        severity: 'info',
        message: `Cache hit rate (${analysis.cache.hitRate}) below optimal threshold (${this.thresholds.cacheHitRate})`
      });
    }
    
    alerts.forEach(alert => this.triggerAlert(alert.type, alert));
  }

  triggerAlert(type, data) {
    const alert = {
      timestamp: Date.now(),
      type,
      data,
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
    
    const logger = require('../server/logger');
    logger.warn('Performance alert triggered', alert);
    
    // Could integrate with external alerting systems here
    this.notifyAlertChannels(alert);
  }

  notifyAlertChannels(alert) {
    // Integration points for external notification systems:
    // - Slack webhooks
    // - Email notifications
    // - SMS alerts
    // - PagerDuty
    // - Custom webhooks
    
    // For now, just log the alert
    console.warn(`🚨 Alert: ${alert.type}`, alert.data);
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }

  cleanupOldMetrics() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    [this.metrics.requests, this.metrics.database, this.metrics.ai, this.metrics.cache, this.metrics.errors]
      .forEach(metricMap => {
        for (const [key, values] of metricMap) {
          const filteredValues = values.filter(v => v.timestamp > oneWeekAgo);
          metricMap.set(key, filteredValues);
        }
      });
  }

  getHealthStatus() {
    const analysis = this.analyzeMetrics();
    const recentAlerts = this.alerts.filter(a => 
      Date.now() - a.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );
    
    let status = 'healthy';
    if (recentAlerts.some(a => a.data.severity === 'critical')) {
      status = 'critical';
    } else if (recentAlerts.some(a => a.data.severity === 'warning')) {
      status = 'warning';
    }
    
    return {
      status,
      timestamp: Date.now(),
      metrics: analysis,
      recentAlerts: recentAlerts.length,
      uptime: analysis.system.uptime
    };
  }

  generateReport(timeRange = 'hour') {
    const now = Date.now();
    let startTime;
    
    switch (timeRange) {
      case 'hour':
        startTime = now - (60 * 60 * 1000);
        break;
      case 'day':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (60 * 60 * 1000);
    }
    
    const analysis = this.analyzeMetrics();
    const relevantAlerts = this.alerts.filter(a => a.timestamp > startTime);
    
    return {
      timeRange,
      startTime,
      endTime: now,
      summary: analysis,
      alerts: relevantAlerts,
      recommendations: this.generateRecommendations(analysis),
      healthScore: this.calculateHealthScore(analysis)
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.requests.avgResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Response Times',
        description: 'Consider implementing caching, database indexing, or CDN integration'
      });
    }
    
    if (analysis.cache.hitRate < 0.7) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: 'Improve Cache Strategy',
        description: 'Review cache keys and TTL settings to improve hit rate'
      });
    }
    
    if (analysis.database.avgQueryTime > 500) {
      recommendations.push({
        type: 'database',
        priority: 'high',
        title: 'Database Optimization',
        description: 'Add database indexes, optimize queries, or consider query caching'
      });
    }
    
    if (analysis.errors.totalErrors > 50) {
      recommendations.push({
        type: 'reliability',
        priority: 'critical',
        title: 'Error Rate Reduction',
        description: 'Investigate and fix the most common error patterns'
      });
    }
    
    return recommendations;
  }

  calculateHealthScore(analysis) {
    let score = 100;
    
    // Response time impact (0-30 points)
    if (analysis.requests.avgResponseTime > 2000) score -= 30;
    else if (analysis.requests.avgResponseTime > 1000) score -= 15;
    else if (analysis.requests.avgResponseTime > 500) score -= 5;
    
    // Error rate impact (0-40 points)
    if (analysis.requests.errorRate > 0.1) score -= 40;
    else if (analysis.requests.errorRate > 0.05) score -= 20;
    else if (analysis.requests.errorRate > 0.01) score -= 10;
    
    // Database performance impact (0-20 points)
    if (analysis.database.avgQueryTime > 1000) score -= 20;
    else if (analysis.database.avgQueryTime > 500) score -= 10;
    else if (analysis.database.avgQueryTime > 200) score -= 5;
    
    // Cache efficiency impact (0-10 points)
    if (analysis.cache.hitRate < 0.5) score -= 10;
    else if (analysis.cache.hitRate < 0.7) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    const logger = require('../server/logger');
    logger.info('Performance monitoring stopped');
  }
}

module.exports = new PerformanceMonitoringService();