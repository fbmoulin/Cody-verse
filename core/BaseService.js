const errorHandler = require('../services/errorHandlerService');
const cacheService = require('../services/cacheService');

class BaseService {
  constructor(name) {
    this.serviceName = name;
    this.metrics = {
      operations: 0,
      errors: 0,
      averageResponseTime: 0
    };
  }

  async executeWithMetrics(operation, operationName = 'unknown') {
    const startTime = Date.now();
    this.metrics.operations++;

    try {
      const result = await operation();
      this.updateMetrics(startTime, true);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.updateMetrics(startTime, false);
      
      errorHandler.logError(error, {
        service: this.serviceName,
        operation: operationName
      });
      
      throw error;
    }
  }

  async executeWithCache(key, operation, ttl = 300000) {
    return await cacheService.getOrSet(key, operation, ttl);
  }

  async executeWithRetry(operation, options = {}) {
    return await errorHandler.withRetry(operation, options);
  }

  updateMetrics(startTime, success) {
    const duration = Date.now() - startTime;
    const currentAvg = this.metrics.averageResponseTime;
    const totalOps = this.metrics.operations;
    
    this.metrics.averageResponseTime = 
      ((currentAvg * (totalOps - 1)) + duration) / totalOps;
  }

  getMetrics() {
    return {
      service: this.serviceName,
      ...this.metrics,
      errorRate: (this.metrics.errors / this.metrics.operations) * 100 || 0
    };
  }

  validateInput(data, schema) {
    if (!data) {
      throw new Error('Input data is required');
    }
    
    if (schema && typeof schema.validate === 'function') {
      const { error } = schema.validate(data);
      if (error) {
        throw new Error(`Validation failed: ${error.message}`);
      }
    }
    
    return true;
  }

  sanitizeOutput(data) {
    if (!data) return null;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'secret', 'token', 'key'];
    const cleaned = JSON.parse(JSON.stringify(data));
    
    const removeSensitive = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          removeSensitive(obj[key]);
        }
      });
    };
    
    removeSensitive(cleaned);
    return cleaned;
  }
}

module.exports = BaseService;