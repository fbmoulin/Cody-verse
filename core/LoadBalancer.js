const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Load Balancer - Manages request distribution and traffic optimization
 */
class LoadBalancer extends BaseService {
  constructor() {
    super('LoadBalancer');
    this.servers = new Map();
    this.strategies = {
      'round-robin': this.roundRobinStrategy.bind(this),
      'least-connections': this.leastConnectionsStrategy.bind(this),
      'weighted': this.weightedStrategy.bind(this),
      'health-based': this.healthBasedStrategy.bind(this)
    };
    this.currentStrategy = 'round-robin';
    this.roundRobinIndex = 0;
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      requestsPerSecond: 0
    };
    this.requestQueue = [];
    this.config = {
      maxQueueSize: 1000,
      healthCheckInterval: 30000,
      retryAttempts: 3,
      timeout: 30000,
      circuitBreakerThreshold: 5
    };
  }

  initialize() {
    // For single-instance deployment, register self as primary server
    this.registerServer('primary', {
      host: '0.0.0.0',
      port: process.env.PORT || 5000,
      weight: 1,
      maxConnections: 100,
      currentConnections: 0,
      healthy: true,
      lastHealthCheck: Date.now(),
      responseTime: 0,
      errorCount: 0,
      circuitBreaker: 'closed'
    });

    this.startHealthMonitoring();
    this.startMetricsCollection();
    
    logger.info('Load balancer initialized', {
      category: 'load_balancer',
      strategy: this.currentStrategy,
      servers: this.servers.size
    });
  }

  registerServer(id, config) {
    this.servers.set(id, {
      id,
      ...config,
      registeredAt: Date.now(),
      lastSeen: Date.now()
    });

    logger.info('Server registered', {
      category: 'load_balancer',
      serverId: id,
      config
    });
  }

  unregisterServer(id) {
    if (this.servers.delete(id)) {
      logger.info('Server unregistered', {
        category: 'load_balancer',
        serverId: id
      });
    }
  }

  async distributeRequest(req, res, next) {
    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      // Check if queue is full
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        return this.handleQueueOverflow(req, res);
      }

      // Get available server
      const server = this.selectServer(req);
      if (!server) {
        return this.handleNoServerAvailable(req, res);
      }

      // Process request
      await this.processRequest(req, res, next, server);

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, true);
      this.updateServerMetrics(server.id, duration, true);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.failedRequests++;
      this.updateMetrics(duration, false);

      logger.error('Request distribution failed', {
        category: 'load_balancer',
        error: error.message,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        success: false,
        error: 'Service temporarily unavailable'
      });
    }
  }

  selectServer(req) {
    const availableServers = Array.from(this.servers.values())
      .filter(server => server.healthy && server.circuitBreaker !== 'open');

    if (availableServers.length === 0) {
      return null;
    }

    return this.strategies[this.currentStrategy](availableServers, req);
  }

  roundRobinStrategy(servers) {
    if (servers.length === 0) return null;
    
    const server = servers[this.roundRobinIndex % servers.length];
    this.roundRobinIndex++;
    return server;
  }

  leastConnectionsStrategy(servers) {
    return servers.reduce((least, current) => 
      current.currentConnections < least.currentConnections ? current : least
    );
  }

  weightedStrategy(servers) {
    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }
    
    return servers[0]; // Fallback
  }

  healthBasedStrategy(servers) {
    // Sort by health score (combination of response time and error rate)
    const scoredServers = servers.map(server => ({
      ...server,
      healthScore: this.calculateHealthScore(server)
    })).sort((a, b) => b.healthScore - a.healthScore);

    return scoredServers[0];
  }

  calculateHealthScore(server) {
    const responseTimeFactor = 1000 / (server.responseTime + 1);
    const errorRateFactor = 1 / (server.errorCount + 1);
    const connectionsFactor = 1 / (server.currentConnections + 1);
    
    return responseTimeFactor * errorRateFactor * connectionsFactor;
  }

  async processRequest(req, res, next, server) {
    server.currentConnections++;
    
    try {
      // For single-instance, just pass through to next middleware
      await next();
      
      server.currentConnections--;
    } catch (error) {
      server.currentConnections--;
      server.errorCount++;
      
      // Check circuit breaker
      this.checkCircuitBreaker(server);
      
      throw error;
    }
  }

  checkCircuitBreaker(server) {
    if (server.errorCount >= this.config.circuitBreakerThreshold) {
      server.circuitBreaker = 'open';
      server.circuitBreakerOpenTime = Date.now();
      
      logger.warn('Circuit breaker opened', {
        category: 'load_balancer',
        serverId: server.id,
        errorCount: server.errorCount
      });

      // Auto-reset after timeout
      setTimeout(() => {
        server.circuitBreaker = 'half-open';
        server.errorCount = 0;
        
        logger.info('Circuit breaker half-open', {
          category: 'load_balancer',
          serverId: server.id
        });
      }, 60000); // 1 minute
    }
  }

  handleQueueOverflow(req, res) {
    logger.warn('Request queue overflow', {
      category: 'load_balancer',
      queueSize: this.requestQueue.length,
      maxSize: this.config.maxQueueSize
    });

    res.status(503).json({
      success: false,
      error: 'Service overloaded, please try again later',
      retryAfter: 30
    });
  }

  handleNoServerAvailable(req, res) {
    logger.error('No healthy servers available', {
      category: 'load_balancer',
      path: req.path,
      method: req.method
    });

    res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      retryAfter: 60
    });
  }

  startHealthMonitoring() {
    this.healthInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    logger.info('Health monitoring started', {
      category: 'load_balancer',
      interval: this.config.healthCheckInterval
    });
  }

  async performHealthChecks() {
    for (const [id, server] of this.servers) {
      try {
        const startTime = Date.now();
        
        // For single-instance, check process health
        const health = await this.checkServerHealth(server);
        
        const responseTime = Date.now() - startTime;
        
        server.healthy = health.healthy;
        server.responseTime = responseTime;
        server.lastHealthCheck = Date.now();
        server.lastSeen = Date.now();

        if (!health.healthy) {
          logger.warn('Server health check failed', {
            category: 'load_balancer',
            serverId: id,
            reason: health.reason
          });
        }

        // Reset circuit breaker if server is healthy
        if (health.healthy && server.circuitBreaker === 'half-open') {
          server.circuitBreaker = 'closed';
          server.errorCount = 0;
        }

      } catch (error) {
        server.healthy = false;
        server.errorCount++;
        
        logger.error('Health check error', {
          category: 'load_balancer',
          serverId: id,
          error: error.message
        });
      }
    }
  }

  async checkServerHealth(server) {
    // Basic health checks for single-instance
    const memory = process.memoryUsage();
    const memoryUsage = (memory.heapUsed / memory.heapTotal) * 100;
    
    if (memoryUsage > 95) {
      return { healthy: false, reason: 'High memory usage' };
    }

    if (server.currentConnections >= server.maxConnections) {
      return { healthy: false, reason: 'Max connections reached' };
    }

    return { healthy: true };
  }

  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.calculateMetrics();
    }, 60000); // Every minute

    logger.info('Metrics collection started', {
      category: 'load_balancer'
    });
  }

  calculateMetrics() {
    // Calculate requests per second
    const now = Date.now();
    if (this.lastMetricsTime) {
      const timeDiff = (now - this.lastMetricsTime) / 1000;
      const requestsDiff = this.metrics.totalRequests - (this.lastTotalRequests || 0);
      this.metrics.requestsPerSecond = requestsDiff / timeDiff;
    }

    this.lastMetricsTime = now;
    this.lastTotalRequests = this.metrics.totalRequests;

    // Log metrics
    logger.info('Load balancer metrics', {
      category: 'load_balancer_metrics',
      ...this.metrics,
      servers: this.getServersSummary()
    });
  }

  updateMetrics(duration, success) {
    // Update average response time
    const totalRequests = this.metrics.totalRequests;
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (totalRequests - 1) + duration) / totalRequests
    );
  }

  updateServerMetrics(serverId, duration, success) {
    const server = this.servers.get(serverId);
    if (server) {
      // Update server response time
      server.responseTime = (server.responseTime + duration) / 2;
      
      if (!success) {
        server.errorCount++;
      }
    }
  }

  getServersSummary() {
    const summary = {};
    for (const [id, server] of this.servers) {
      summary[id] = {
        healthy: server.healthy,
        connections: server.currentConnections,
        responseTime: server.responseTime,
        errorCount: server.errorCount,
        circuitBreaker: server.circuitBreaker
      };
    }
    return summary;
  }

  getMetrics() {
    return {
      ...this.metrics,
      servers: this.getServersSummary(),
      strategy: this.currentStrategy,
      queueSize: this.requestQueue.length
    };
  }

  setStrategy(strategy) {
    if (this.strategies[strategy]) {
      this.currentStrategy = strategy;
      logger.info('Load balancing strategy changed', {
        category: 'load_balancer',
        strategy
      });
    } else {
      throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  // Middleware factory
  middleware() {
    return (req, res, next) => {
      this.distributeRequest(req, res, next);
    };
  }

  async cleanup() {
    logger.info('Cleaning up load balancer', { category: 'load_balancer' });
    
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.servers.clear();
    this.requestQueue.length = 0;
    
    logger.info('Load balancer cleanup completed', { category: 'load_balancer' });
  }
}

module.exports = LoadBalancer;