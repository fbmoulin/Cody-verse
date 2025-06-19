const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Integration Health Manager - Monitors and manages health of all system integrations
 */
class IntegrationHealthManager extends BaseService {
  constructor() {
    super('IntegrationHealthManager');
    this.integrations = new Map();
    this.healthChecks = new Map();
    this.circuitBreakers = new Map();
    this.monitoringInterval = null;
    this.initializeHealthManager();
  }

  initializeHealthManager() {
    this.setupIntegrations();
    this.startHealthMonitoring();
    logger.info('Integration Health Manager initialized', {
      category: 'integration_health',
      integrationsCount: this.integrations.size
    });
  }

  setupIntegrations() {
    // Database integration
    this.integrations.set('database', {
      name: 'PostgreSQL Database',
      type: 'database',
      critical: true,
      healthEndpoint: () => this.checkDatabaseHealth(),
      circuitBreaker: {
        failures: 0,
        threshold: 3,
        timeout: 60000, // 1 minute
        lastFailure: null
      }
    });

    // OpenAI integration
    this.integrations.set('openai', {
      name: 'OpenAI API',
      type: 'external_api',
      critical: false,
      healthEndpoint: () => this.checkOpenAIHealth(),
      circuitBreaker: {
        failures: 0,
        threshold: 5,
        timeout: 300000, // 5 minutes
        lastFailure: null
      }
    });

    // Cache integration
    this.integrations.set('cache', {
      name: 'Memory Cache',
      type: 'internal',
      critical: false,
      healthEndpoint: () => this.checkCacheHealth(),
      circuitBreaker: {
        failures: 0,
        threshold: 10,
        timeout: 30000, // 30 seconds
        lastFailure: null
      }
    });

    // Memory management
    this.integrations.set('memory', {
      name: 'Memory Management',
      type: 'system',
      critical: true,
      healthEndpoint: () => this.checkMemoryHealth(),
      circuitBreaker: {
        failures: 0,
        threshold: 5,
        timeout: 120000, // 2 minutes
        lastFailure: null
      }
    });

    // UX features
    this.integrations.set('ux', {
      name: 'UX Enhancement System',
      type: 'internal',
      critical: false,
      healthEndpoint: () => this.checkUXHealth(),
      circuitBreaker: {
        failures: 0,
        threshold: 10,
        timeout: 60000, // 1 minute
        lastFailure: null
      }
    });
  }

  async checkDatabaseHealth() {
    try {
      const { testConnection } = require('../server/database');
      const isConnected = await testConnection();
      
      if (!isConnected) {
        throw new Error('Database connection test failed');
      }

      // Test a simple query using DataAccessLayer
      const DataAccessLayer = require('./DataAccessLayer');
      const dal = new DataAccessLayer();
      await dal.executeQuery('SELECT 1 as health_check', []);

      return {
        status: 'healthy',
        responseTime: Date.now(),
        details: 'Database connection and queries working normally'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(),
        error: error.message,
        details: 'Database connection or query failed'
      };
    }
  }

  async checkOpenAIHealth() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          status: 'degraded',
          responseTime: Date.now(),
          details: 'OpenAI API key not configured - AI features disabled'
        };
      }

      // Simple health check with minimal token usage
      const OpenAI = require('openai');
      const openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 10000
      });

      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        temperature: 0
      });
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: `OpenAI API responding normally (${responseTime}ms)`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(),
        error: error.message,
        details: 'OpenAI API connection failed'
      };
    }
  }

  async checkCacheHealth() {
    try {
      const cacheManager = global.cacheManager;
      if (!cacheManager) {
        return {
          status: 'degraded',
          responseTime: Date.now(),
          details: 'Cache manager not available'
        };
      }

      // Test cache operations
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      const startTime = Date.now();
      cacheManager.set(testKey, testValue, 1000);
      const retrieved = cacheManager.get(testKey);
      cacheManager.delete(testKey);
      const responseTime = Date.now() - startTime;

      if (!retrieved || retrieved.test !== true) {
        throw new Error('Cache set/get operations failed');
      }

      const stats = cacheManager.getStats();

      return {
        status: 'healthy',
        responseTime,
        details: `Cache operations working (${stats.size} items cached)`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(),
        error: error.message,
        details: 'Cache operations failed'
      };
    }
  }

  async checkMemoryHealth() {
    try {
      const memoryUsage = process.memoryUsage();
      const usagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      let status = 'healthy';
      let details = `Memory usage: ${usagePercentage.toFixed(1)}%`;

      if (usagePercentage > 95) {
        status = 'critical';
        details += ' - Critical memory usage';
      } else if (usagePercentage > 85) {
        status = 'degraded';
        details += ' - High memory usage';
      }

      return {
        status,
        responseTime: Date.now(),
        details,
        metrics: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          usagePercentage: parseFloat(usagePercentage.toFixed(1)),
          rss: memoryUsage.rss
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(),
        error: error.message,
        details: 'Memory health check failed'
      };
    }
  }

  async checkUXHealth() {
    try {
      const uxManager = global.uxManager;
      if (!uxManager) {
        return {
          status: 'degraded',
          responseTime: Date.now(),
          details: 'UX manager not available'
        };
      }

      const metrics = uxManager.getUXMetrics();
      
      return {
        status: 'healthy',
        responseTime: Date.now(),
        details: 'UX enhancement system operational',
        metrics
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now(),
        error: error.message,
        details: 'UX system health check failed'
      };
    }
  }

  async runHealthCheck(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return null;
    }

    try {
      const result = await integration.healthEndpoint();
      
      // Reset circuit breaker on success
      if (result.status === 'healthy') {
        integration.circuitBreaker.failures = 0;
      } else if (result.status === 'unhealthy') {
        integration.circuitBreaker.failures++;
        integration.circuitBreaker.lastFailure = Date.now();
      }

      this.healthChecks.set(integrationId, {
        ...result,
        integration: integration.name,
        lastChecked: Date.now(),
        circuitBreakerStatus: this.getCircuitBreakerStatus(integration)
      });

      return this.healthChecks.get(integrationId);
    } catch (error) {
      integration.circuitBreaker.failures++;
      integration.circuitBreaker.lastFailure = Date.now();

      const errorResult = {
        status: 'unhealthy',
        responseTime: Date.now(),
        error: error.message,
        details: `Health check failed for ${integration.name}`,
        integration: integration.name,
        lastChecked: Date.now(),
        circuitBreakerStatus: this.getCircuitBreakerStatus(integration)
      };

      this.healthChecks.set(integrationId, errorResult);
      return errorResult;
    }
  }

  getCircuitBreakerStatus(integration) {
    const { failures, threshold, timeout, lastFailure } = integration.circuitBreaker;
    
    if (failures >= threshold) {
      const timeSinceFailure = lastFailure ? Date.now() - lastFailure : 0;
      if (timeSinceFailure < timeout) {
        return 'open';
      } else {
        return 'half-open';
      }
    }
    
    return 'closed';
  }

  isIntegrationAvailable(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    const status = this.getCircuitBreakerStatus(integration);
    return status === 'closed' || status === 'half-open';
  }

  async runAllHealthChecks() {
    const results = new Map();
    
    for (const [id, integration] of this.integrations.entries()) {
      try {
        const result = await this.runHealthCheck(id);
        results.set(id, result);
      } catch (error) {
        logger.error(`Health check failed for ${integration.name}`, {
          integrationId: id,
          error: error.message,
          category: 'integration_health'
        });
      }
    }

    return results;
  }

  startHealthMonitoring() {
    // Run health checks every 2 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runAllHealthChecks();
        
        // Log critical issues
        const criticalIssues = this.getCriticalIssues();
        if (criticalIssues.length > 0) {
          logger.warn('Critical integration issues detected', {
            issues: criticalIssues,
            category: 'integration_health'
          });
        }
      } catch (error) {
        logger.error('Health monitoring cycle failed', {
          error: error.message,
          category: 'integration_health'
        });
      }
    }, 120000); // 2 minutes

    logger.info('Health monitoring started', {
      interval: '2 minutes',
      category: 'integration_health'
    });
  }

  getCriticalIssues() {
    const issues = [];
    
    for (const [id, health] of this.healthChecks.entries()) {
      const integration = this.integrations.get(id);
      
      if (integration.critical && health.status === 'unhealthy') {
        issues.push({
          integration: integration.name,
          status: health.status,
          error: health.error,
          circuitBreaker: health.circuitBreakerStatus
        });
      }
    }
    
    return issues;
  }

  getSystemHealthSummary() {
    const summary = {
      overall: 'healthy',
      integrations: {},
      criticalIssues: 0,
      degradedServices: 0,
      lastChecked: Date.now()
    };

    let hasUnhealthy = false;
    let hasDegraded = false;

    for (const [id, health] of this.healthChecks.entries()) {
      const integration = this.integrations.get(id);
      
      summary.integrations[id] = {
        name: integration.name,
        status: health.status,
        critical: integration.critical,
        circuitBreaker: health.circuitBreakerStatus,
        lastChecked: health.lastChecked,
        responseTime: health.responseTime
      };

      if (health.status === 'unhealthy') {
        if (integration.critical) {
          hasUnhealthy = true;
          summary.criticalIssues++;
        } else {
          summary.degradedServices++;
        }
      } else if (health.status === 'degraded') {
        hasDegraded = true;
        summary.degradedServices++;
      }
    }

    if (hasUnhealthy) {
      summary.overall = 'unhealthy';
    } else if (hasDegraded || summary.degradedServices > 0) {
      summary.overall = 'degraded';
    }

    return summary;
  }

  async recoverIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    logger.info(`Attempting to recover integration: ${integration.name}`, {
      integrationId,
      category: 'integration_health'
    });

    // Reset circuit breaker
    integration.circuitBreaker.failures = 0;
    integration.circuitBreaker.lastFailure = null;

    // Run health check
    const result = await this.runHealthCheck(integrationId);
    
    logger.info(`Recovery attempt completed for ${integration.name}`, {
      integrationId,
      status: result.status,
      category: 'integration_health'
    });

    return result;
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Health monitoring stopped', {
        category: 'integration_health'
      });
    }
  }
}

module.exports = IntegrationHealthManager;