const connectionPool = require('../server/connectionPool');
const errorHandler = require('./errorHandlerService');

class SystemHealthMonitor {
  constructor() {
    this.healthStatus = {
      overall: 'healthy',
      database: 'unknown',
      api: 'unknown',
      memory: 'unknown',
      uptime: 0
    };
    this.startTime = Date.now();
    this.metrics = {
      requests: 0,
      errors: 0,
      slowQueries: 0,
      activeConnections: 0
    };
    this.healthCheckInterval = null;
  }

  startMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds

    console.log('System health monitoring started');
  }

  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async performHealthCheck() {
    try {
      // Database health
      const dbHealth = await this.checkDatabaseHealth();
      this.healthStatus.database = dbHealth.healthy ? 'healthy' : 'degraded';

      // Memory health
      const memoryHealth = this.checkMemoryHealth();
      this.healthStatus.memory = memoryHealth.healthy ? 'healthy' : 'warning';

      // Update uptime
      this.healthStatus.uptime = Date.now() - this.startTime;

      // Calculate overall health
      this.healthStatus.overall = this.calculateOverallHealth();

      // Log status if unhealthy
      if (this.healthStatus.overall !== 'healthy') {
        console.warn('System health status:', this.healthStatus);
      }

    } catch (error) {
      errorHandler.logError(error, { component: 'health-monitor' });
      this.healthStatus.overall = 'unhealthy';
    }
  }

  async checkDatabaseHealth() {
    try {
      return await connectionPool.healthCheck();
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  checkMemoryHealth() {
    const memUsage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB limit
    const memoryPercent = (memUsage.heapUsed / maxMemory) * 100;

    return {
      healthy: memoryPercent < 80,
      usage: memUsage,
      percent: memoryPercent
    };
  }

  calculateOverallHealth() {
    const unhealthyComponents = Object.values(this.healthStatus)
      .filter(status => status === 'unhealthy' || status === 'degraded').length;

    if (unhealthyComponents === 0) return 'healthy';
    if (unhealthyComponents <= 1) return 'degraded';
    return 'unhealthy';
  }

  recordRequest() {
    this.metrics.requests++;
  }

  recordError() {
    this.metrics.errors++;
  }

  recordSlowQuery() {
    this.metrics.slowQueries++;
  }

  getHealthStatus() {
    return {
      ...this.healthStatus,
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  getDetailedMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      system: {
        uptime: this.healthStatus.uptime,
        nodeVersion: process.version,
        platform: process.platform
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      metrics: this.metrics,
      errors: errorHandler.getErrorStats(),
      circuitBreakers: errorHandler.getCircuitBreakerStats()
    };
  }

  async gracefulShutdown() {
    console.log('Initiating graceful shutdown...');
    
    this.stopMonitoring();
    
    try {
      await connectionPool.close();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error.message);
    }

    console.log('Graceful shutdown completed');
  }
}

module.exports = new SystemHealthMonitor();