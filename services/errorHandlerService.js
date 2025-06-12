class ErrorHandlerService {
  constructor() {
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    };
  }

  async withRetry(operation, options = {}) {
    const config = { ...this.retryConfig, ...options };
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === config.maxRetries) break;
        if (!this.isRetryableError(error)) break;

        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        
        console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries + 1}):`, error.message);
        await this.sleep(delay);
      }
    }

    this.logError(lastError);
    throw lastError;
  }

  isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 
      'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH'
    ];
    
    const retryableMessages = [
      'timeout', 'connection', 'network', 'temporary'
    ];

    return retryableCodes.includes(error.code) ||
           retryableMessages.some(msg => error.message.toLowerCase().includes(msg)) ||
           (error.status >= 500 && error.status < 600);
  }

  createCircuitBreaker(name, options = {}) {
    const breaker = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: null,
      threshold: options.threshold || 5,
      timeout: options.timeout || 30000,
      resetTimeout: options.resetTimeout || 60000
    };

    this.circuitBreakers.set(name, breaker);
    return breaker;
  }

  async executeWithCircuitBreaker(name, operation) {
    let breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      breaker = this.createCircuitBreaker(name);
    }

    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.lastFailureTime > breaker.resetTimeout) {
        breaker.state = 'HALF_OPEN';
        console.log(`Circuit breaker ${name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${name} is OPEN`);
      }
    }

    try {
      const result = await operation();
      
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        console.log(`Circuit breaker ${name} reset to CLOSED`);
      }
      
      return result;
    } catch (error) {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = 'OPEN';
        console.error(`Circuit breaker ${name} opened after ${breaker.failureCount} failures`);
      }

      throw error;
    }
  }

  logError(error, context = {}) {
    const errorKey = `${error.name}:${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context,
      count: count + 1
    };

    if (count === 0) {
      console.error('New error occurred:', errorLog);
    } else if (count % 10 === 0) {
      console.error(`Recurring error (${count + 1} times):`, errorLog);
    }

    return errorLog;
  }

  handleAsyncError(error, context = {}) {
    this.logError(error, context);
    
    // Prevent crash for unhandled errors
    if (!context.handled) {
      console.error('Unhandled async error:', error);
    }
  }

  createErrorResponse(error, defaultMessage = 'Internal server error') {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      success: false,
      error: isDevelopment ? error.message : defaultMessage,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: error.stack })
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getErrorStats() {
    const stats = {};
    for (const [error, count] of this.errorCounts.entries()) {
      stats[error] = count;
    }
    return stats;
  }

  getCircuitBreakerStats() {
    const stats = {};
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      stats[name] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime
      };
    }
    return stats;
  }
}

module.exports = new ErrorHandlerService();