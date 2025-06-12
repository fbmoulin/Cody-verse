const performanceMonitoringService = require('../services/performanceMonitoringService');
const databaseOptimizationService = require('../services/databaseOptimizationService');

class PerformanceMiddleware {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await databaseOptimizationService.initializeOptimizedConnection();
      performanceMonitoringService.startMonitoring();
      
      this.isInitialized = true;
      
      const logger = require('./logger');
      logger.info('Performance middleware initialized successfully');
    } catch (error) {
      const logger = require('./logger');
      logger.error('Failed to initialize performance middleware', { error: error.message });
      throw error;
    }
  }

  requestMonitoring() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        
        performanceMonitoringService.recordRequest(
          req.method,
          req.route?.path || req.path,
          duration,
          res.statusCode
        );
        
        if (duration > 2000) {
          const logger = require('./logger');
          logger.warn('Slow request detected', {
            method: req.method,
            path: req.path,
            duration,
            statusCode: res.statusCode
          });
        }
        
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  healthCheck() {
    return async (req, res) => {
      try {
        const healthStatus = performanceMonitoringService.getHealthStatus();
        const dbStats = databaseOptimizationService.getPerformanceStats();
        
        const overallHealth = {
          status: healthStatus.status,
          timestamp: healthStatus.timestamp,
          uptime: healthStatus.uptime,
          database: {
            connected: true,
            avgQueryTime: dbStats.avgQueryTime,
            successRate: dbStats.successRate,
            cacheHitRate: dbStats.cacheHitRate,
            activeConnections: dbStats.poolStats.totalConnections
          },
          performance: {
            avgResponseTime: healthStatus.metrics.requests.avgResponseTime,
            errorRate: healthStatus.metrics.requests.errorRate,
            totalRequests: healthStatus.metrics.requests.totalRequests
          }
        };
        
        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(overallHealth);
        
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  async gracefulShutdown() {
    try {
      performanceMonitoringService.stop();
      await databaseOptimizationService.gracefulShutdown();
      
      const logger = require('./logger');
      logger.info('Performance middleware shutdown completed');
    } catch (error) {
      const logger = require('./logger');
      logger.error('Error during performance middleware shutdown', { error: error.message });
    }
  }
}

module.exports = new PerformanceMiddleware();