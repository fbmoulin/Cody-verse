const BaseController = require('../core/BaseController');
const IntegrationHealthManager = require('../core/IntegrationHealthManager');

/**
 * Integration Health Controller - Manages system integration monitoring and recovery
 */
class IntegrationHealthController extends BaseController {
  constructor() {
    super('IntegrationHealthController');
    this.healthManager = new IntegrationHealthManager();
  }

  // Get overall system health
  async getSystemHealth(req, res) {
    await this.handleRequest(req, res, async () => {
      const summary = this.healthManager.getSystemHealthSummary();
      
      return this.createResponse(summary, 'System health retrieved successfully');
    });
  }

  // Get specific integration health
  async getIntegrationHealth(req, res) {
    await this.handleRequest(req, res, async () => {
      const { integrationId } = req.params;
      
      const health = await this.healthManager.runHealthCheck(integrationId);
      
      if (!health) {
        return res.status(404).json(this.createErrorResponse('Integration not found', 404));
      }

      return this.createResponse(health, 'Integration health retrieved successfully');
    });
  }

  // Run all health checks
  async runAllHealthChecks(req, res) {
    await this.handleRequest(req, res, async () => {
      const results = await this.healthManager.runAllHealthChecks();
      
      const healthData = {};
      for (const [id, result] of results.entries()) {
        healthData[id] = result;
      }

      return this.createResponse(healthData, 'All health checks completed successfully');
    });
  }

  // Recover specific integration
  async recoverIntegration(req, res) {
    await this.handleRequest(req, res, async () => {
      const { integrationId } = req.params;
      
      const result = await this.healthManager.recoverIntegration(integrationId);
      
      return this.createResponse(result, `Recovery attempt completed for ${integrationId}`);
    });
  }

  // Get critical issues
  async getCriticalIssues(req, res) {
    await this.handleRequest(req, res, async () => {
      const issues = this.healthManager.getCriticalIssues();
      
      return this.createResponse({
        criticalIssues: issues,
        count: issues.length,
        severity: issues.length > 0 ? 'high' : 'none'
      }, 'Critical issues retrieved successfully');
    });
  }

  // Check if integration is available
  async checkIntegrationAvailability(req, res) {
    await this.handleRequest(req, res, async () => {
      const { integrationId } = req.params;
      
      const isAvailable = this.healthManager.isIntegrationAvailable(integrationId);
      
      return this.createResponse({
        integrationId,
        available: isAvailable,
        timestamp: Date.now()
      }, 'Integration availability checked successfully');
    });
  }

  // Get integration circuit breaker status
  async getCircuitBreakerStatus(req, res) {
    await this.handleRequest(req, res, async () => {
      const circuitBreakers = {};
      
      for (const [id, integration] of this.healthManager.integrations.entries()) {
        circuitBreakers[id] = {
          name: integration.name,
          status: this.healthManager.getCircuitBreakerStatus(integration),
          failures: integration.circuitBreaker.failures,
          threshold: integration.circuitBreaker.threshold,
          lastFailure: integration.circuitBreaker.lastFailure
        };
      }

      return this.createResponse(circuitBreakers, 'Circuit breaker statuses retrieved successfully');
    });
  }

  // Force reset circuit breaker
  async resetCircuitBreaker(req, res) {
    await this.handleRequest(req, res, async () => {
      const { integrationId } = req.params;
      
      const integration = this.healthManager.integrations.get(integrationId);
      if (!integration) {
        return res.status(404).json(this.createErrorResponse('Integration not found', 404));
      }

      // Reset circuit breaker
      integration.circuitBreaker.failures = 0;
      integration.circuitBreaker.lastFailure = null;

      return this.createResponse({
        integrationId,
        status: 'reset',
        timestamp: Date.now()
      }, 'Circuit breaker reset successfully');
    });
  }

  // Get integration performance metrics
  async getIntegrationMetrics(req, res) {
    await this.handleRequest(req, res, async () => {
      const metrics = {};
      
      for (const [id, health] of this.healthManager.healthChecks.entries()) {
        const integration = this.healthManager.integrations.get(id);
        
        metrics[id] = {
          name: integration.name,
          type: integration.type,
          critical: integration.critical,
          status: health.status,
          responseTime: health.responseTime,
          lastChecked: health.lastChecked,
          circuitBreaker: health.circuitBreakerStatus,
          uptime: this.calculateUptime(health),
          availability: this.calculateAvailability(id)
        };
      }

      return this.createResponse(metrics, 'Integration metrics retrieved successfully');
    });
  }

  // Calculate uptime percentage
  calculateUptime(health) {
    // Simple uptime calculation based on status
    if (health.status === 'healthy') return 100;
    if (health.status === 'degraded') return 75;
    return 0;
  }

  // Calculate availability percentage
  calculateAvailability(integrationId) {
    const isAvailable = this.healthManager.isIntegrationAvailable(integrationId);
    return isAvailable ? 100 : 0;
  }

  // Get detailed health report
  async getDetailedHealthReport(req, res) {
    await this.handleRequest(req, res, async () => {
      const summary = this.healthManager.getSystemHealthSummary();
      const criticalIssues = this.healthManager.getCriticalIssues();
      const detailedHealth = {};

      // Get detailed health for each integration
      for (const [id, integration] of this.healthManager.integrations.entries()) {
        const health = await this.healthManager.runHealthCheck(id);
        detailedHealth[id] = {
          ...health,
          integration: integration.name,
          type: integration.type,
          critical: integration.critical
        };
      }

      const report = {
        summary,
        detailedHealth,
        criticalIssues: {
          count: criticalIssues.length,
          issues: criticalIssues
        },
        recommendations: this.generateRecommendations(summary, criticalIssues),
        timestamp: Date.now()
      };

      return this.createResponse(report, 'Detailed health report generated successfully');
    });
  }

  // Generate recommendations based on health status
  generateRecommendations(summary, criticalIssues) {
    const recommendations = [];

    if (summary.overall === 'unhealthy') {
      recommendations.push({
        priority: 'high',
        action: 'Immediate attention required for critical systems',
        details: 'One or more critical integrations are failing'
      });
    }

    if (summary.degradedServices > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Monitor degraded services',
        details: `${summary.degradedServices} services are experiencing issues`
      });
    }

    if (criticalIssues.length > 0) {
      criticalIssues.forEach(issue => {
        recommendations.push({
          priority: 'high',
          action: `Restore ${issue.integration}`,
          details: `Circuit breaker: ${issue.circuitBreaker}, Error: ${issue.error}`
        });
      });
    }

    // Memory-specific recommendations
    const memoryHealth = summary.integrations.memory;
    if (memoryHealth && memoryHealth.status === 'degraded') {
      recommendations.push({
        priority: 'medium',
        action: 'Optimize memory usage',
        details: 'Memory usage is above recommended thresholds'
      });
    }

    return recommendations;
  }

  // Test integration recovery
  async testIntegrationRecovery(req, res) {
    await this.handleRequest(req, res, async () => {
      const { integrationId } = req.params;
      
      // Get current status
      const beforeStatus = await this.healthManager.runHealthCheck(integrationId);
      
      // Attempt recovery
      const recoveryResult = await this.healthManager.recoverIntegration(integrationId);
      
      // Get status after recovery
      const afterStatus = await this.healthManager.runHealthCheck(integrationId);
      
      const testResult = {
        integrationId,
        beforeRecovery: beforeStatus,
        recoveryAttempt: recoveryResult,
        afterRecovery: afterStatus,
        improved: afterStatus.status !== beforeStatus.status,
        timestamp: Date.now()
      };

      return this.createResponse(testResult, 'Integration recovery test completed');
    });
  }
}

module.exports = IntegrationHealthController;