const logger = require('../server/logger');

class ErrorMonitoringService {
  constructor() {
    this.errorThresholds = {
      criticalErrorsPerHour: 10,
      warningErrorsPerHour: 50,
      slowRequestsPerMinute: 20,
      databaseConnectionFailures: 3,
      memoryUsageThreshold: 85 // percentage
    };

    this.errorCounters = {
      critical: new Map(),
      warning: new Map(),
      slow: new Map(),
      database: new Map()
    };

    this.alertSubscribers = [];
    this.monitoringEnabled = process.env.NODE_ENV === 'production';
    
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Reset counters every hour
    setInterval(() => {
      this.resetCounters();
    }, 60 * 60 * 1000);

    // Memory monitoring every 5 minutes
    setInterval(() => {
      this.checkMemoryUsage();
    }, 5 * 60 * 1000);

    // Error rate monitoring every minute
    setInterval(() => {
      this.checkErrorRates();
    }, 60 * 1000);

    logger.info('Error monitoring service initialized', {
      category: 'monitoring',
      thresholds: this.errorThresholds,
      enabled: this.monitoringEnabled
    });
  }

  // Track critical errors (500s, database failures, etc.)
  trackCriticalError(error, context = {}) {
    const hour = this.getCurrentHour();
    const errorKey = `${error.name || 'UnknownError'}:${hour}`;
    
    const count = this.errorCounters.critical.get(errorKey) || 0;
    this.errorCounters.critical.set(errorKey, count + 1);

    logger.logError(error, {
      ...context,
      severity: 'critical',
      category: 'error_monitoring',
      errorCount: count + 1
    });

    // Check if threshold exceeded
    if (count + 1 >= this.errorThresholds.criticalErrorsPerHour) {
      this.triggerAlert('critical_error_threshold', {
        errorType: error.name,
        count: count + 1,
        threshold: this.errorThresholds.criticalErrorsPerHour,
        timeWindow: 'hour',
        context
      });
    }

    return { tracked: true, count: count + 1 };
  }

  // Track warning-level errors
  trackWarningError(error, context = {}) {
    const hour = this.getCurrentHour();
    const errorKey = `${error.name || 'Warning'}:${hour}`;
    
    const count = this.errorCounters.warning.get(errorKey) || 0;
    this.errorCounters.warning.set(errorKey, count + 1);

    logger.warn(`Warning error: ${error.message}`, {
      ...context,
      severity: 'warning',
      category: 'error_monitoring',
      errorCount: count + 1,
      stack: error.stack
    });

    if (count + 1 >= this.errorThresholds.warningErrorsPerHour) {
      this.triggerAlert('warning_error_threshold', {
        errorType: error.name,
        count: count + 1,
        threshold: this.errorThresholds.warningErrorsPerHour,
        timeWindow: 'hour'
      });
    }

    return { tracked: true, count: count + 1 };
  }

  // Track slow requests
  trackSlowRequest(requestInfo) {
    const minute = this.getCurrentMinute();
    const key = `slow_requests:${minute}`;
    
    const count = this.errorCounters.slow.get(key) || 0;
    this.errorCounters.slow.set(key, count + 1);

    logger.performance('Slow request tracked', {
      ...requestInfo,
      category: 'performance_monitoring',
      slowRequestCount: count + 1
    });

    if (count + 1 >= this.errorThresholds.slowRequestsPerMinute) {
      this.triggerAlert('slow_request_threshold', {
        count: count + 1,
        threshold: this.errorThresholds.slowRequestsPerMinute,
        timeWindow: 'minute',
        avgResponseTime: requestInfo.responseTime
      });
    }
  }

  // Track database errors
  trackDatabaseError(error, operation = 'unknown') {
    const minute = this.getCurrentMinute();
    const key = `db_error:${minute}`;
    
    const count = this.errorCounters.database.get(key) || 0;
    this.errorCounters.database.set(key, count + 1);

    logger.database('Database error tracked', {
      error: error.message,
      operation,
      category: 'database_monitoring',
      dbErrorCount: count + 1,
      stack: error.stack
    });

    if (count + 1 >= this.errorThresholds.databaseConnectionFailures) {
      this.triggerAlert('database_error_threshold', {
        operation,
        count: count + 1,
        threshold: this.errorThresholds.databaseConnectionFailures,
        error: error.message
      });
    }
  }

  // Check memory usage
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    const usagePercentage = (usedMemory / totalMemory) * 100;

    logger.performance('Memory usage check', {
      category: 'memory_monitoring',
      heapUsed: usedMemory,
      heapTotal: totalMemory,
      usagePercentage: usagePercentage.toFixed(2),
      rss: usage.rss,
      external: usage.external
    });

    if (usagePercentage > this.errorThresholds.memoryUsageThreshold) {
      this.triggerAlert('high_memory_usage', {
        usagePercentage: usagePercentage.toFixed(2),
        threshold: this.errorThresholds.memoryUsageThreshold,
        heapUsed: usedMemory,
        heapTotal: totalMemory
      });
    }
  }

  // Check error rates
  checkErrorRates() {
    const hour = this.getCurrentHour();
    const minute = this.getCurrentMinute();

    // Calculate error rates
    const criticalCount = this.getCriticalErrorCount(hour);
    const warningCount = this.getWarningErrorCount(hour);
    const slowRequestCount = this.getSlowRequestCount(minute);
    const dbErrorCount = this.getDatabaseErrorCount(minute);

    logger.performance('Error rate check', {
      category: 'error_rate_monitoring',
      criticalErrors: criticalCount,
      warningErrors: warningCount,
      slowRequests: slowRequestCount,
      databaseErrors: dbErrorCount,
      timeWindow: hour
    });
  }

  // Trigger alert
  triggerAlert(alertType, data) {
    if (!this.monitoringEnabled) {
      return;
    }

    const alert = {
      type: alertType,
      severity: this.getAlertSeverity(alertType),
      timestamp: new Date().toISOString(),
      data,
      environment: process.env.NODE_ENV,
      service: 'codyverse-api'
    };

    logger.error(`ALERT: ${alertType}`, {
      category: 'alert',
      alert,
      severity: alert.severity
    });

    // Notify subscribers
    this.notifySubscribers(alert);

    // Store alert for dashboard
    this.storeAlert(alert);
  }

  // Notify alert subscribers
  notifySubscribers(alert) {
    this.alertSubscribers.forEach(subscriber => {
      try {
        subscriber(alert);
      } catch (error) {
        logger.error('Failed to notify alert subscriber', {
          category: 'monitoring_error',
          error: error.message,
          alertType: alert.type
        });
      }
    });
  }

  // Store alert for dashboard access
  storeAlert(alert) {
    if (!this.recentAlerts) {
      this.recentAlerts = [];
    }

    this.recentAlerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.recentAlerts.length > 100) {
      this.recentAlerts = this.recentAlerts.slice(0, 100);
    }
  }

  // Get alert severity
  getAlertSeverity(alertType) {
    const severityMap = {
      'critical_error_threshold': 'critical',
      'database_error_threshold': 'critical',
      'high_memory_usage': 'critical',
      'warning_error_threshold': 'warning',
      'slow_request_threshold': 'warning'
    };

    return severityMap[alertType] || 'info';
  }

  // Subscribe to alerts
  subscribeToAlerts(callback) {
    this.alertSubscribers.push(callback);
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  // Get monitoring dashboard data
  getDashboardData() {
    const hour = this.getCurrentHour();
    const minute = this.getCurrentMinute();

    return {
      errorCounts: {
        critical: this.getCriticalErrorCount(hour),
        warning: this.getWarningErrorCount(hour),
        slow: this.getSlowRequestCount(minute),
        database: this.getDatabaseErrorCount(minute)
      },
      thresholds: this.errorThresholds,
      recentAlerts: this.recentAlerts || [],
      memoryUsage: this.getMemoryUsageData(),
      systemHealth: this.getSystemHealth(),
      timestamp: new Date().toISOString()
    };
  }

  // Get system health status
  getSystemHealth() {
    const hour = this.getCurrentHour();
    const minute = this.getCurrentMinute();
    
    const criticalErrors = this.getCriticalErrorCount(hour);
    const dbErrors = this.getDatabaseErrorCount(minute);
    const memoryUsage = this.getMemoryUsagePercentage();

    let status = 'healthy';
    let issues = [];

    if (criticalErrors >= this.errorThresholds.criticalErrorsPerHour) {
      status = 'critical';
      issues.push('High critical error rate');
    }

    if (dbErrors >= this.errorThresholds.databaseConnectionFailures) {
      status = 'critical';
      issues.push('Database connection issues');
    }

    if (memoryUsage > this.errorThresholds.memoryUsageThreshold) {
      if (status !== 'critical') status = 'warning';
      issues.push('High memory usage');
    }

    return { status, issues, lastCheck: new Date().toISOString() };
  }

  // Helper methods
  getCurrentHour() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  }

  getCurrentMinute() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  }

  getCriticalErrorCount(hour) {
    let total = 0;
    for (const [key, count] of this.errorCounters.critical.entries()) {
      if (key.includes(hour)) {
        total += count;
      }
    }
    return total;
  }

  getWarningErrorCount(hour) {
    let total = 0;
    for (const [key, count] of this.errorCounters.warning.entries()) {
      if (key.includes(hour)) {
        total += count;
      }
    }
    return total;
  }

  getSlowRequestCount(minute) {
    return this.errorCounters.slow.get(`slow_requests:${minute}`) || 0;
  }

  getDatabaseErrorCount(minute) {
    return this.errorCounters.database.get(`db_error:${minute}`) || 0;
  }

  getMemoryUsageData() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      usagePercentage: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2),
      rss: usage.rss,
      external: usage.external
    };
  }

  getMemoryUsagePercentage() {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  resetCounters() {
    this.errorCounters.critical.clear();
    this.errorCounters.warning.clear();
    this.errorCounters.slow.clear();
    this.errorCounters.database.clear();

    logger.info('Error monitoring counters reset', {
      category: 'monitoring',
      timestamp: new Date().toISOString()
    });
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.errorThresholds = { ...this.errorThresholds, ...newThresholds };
    
    logger.info('Error monitoring thresholds updated', {
      category: 'monitoring',
      thresholds: this.errorThresholds
    });
  }

  // Enable/disable monitoring
  setMonitoringEnabled(enabled) {
    this.monitoringEnabled = enabled;
    
    logger.info(`Error monitoring ${enabled ? 'enabled' : 'disabled'}`, {
      category: 'monitoring',
      enabled
    });
  }
}

module.exports = new ErrorMonitoringService();