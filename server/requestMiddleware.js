const systemHealth = require('../services/systemHealthMonitor');
const errorHandler = require('../services/errorHandlerService');
const cacheService = require('../services/cacheService');

class RequestMiddleware {
  static createRequestTracker() {
    return (req, res, next) => {
      const startTime = Date.now();
      systemHealth.recordRequest();

      // Add request ID for tracking
      req.id = Math.random().toString(36).substr(2, 9);
      
      // Override res.json to track response times
      const originalJson = res.json;
      res.json = function(body) {
        const duration = Date.now() - startTime;
        
        if (duration > 5000) {
          systemHealth.recordSlowQuery();
          console.warn(`Slow request detected: ${req.method} ${req.url} - ${duration}ms`);
        }
        
        return originalJson.call(this, body);
      };

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        if (res.statusCode >= 400) {
          systemHealth.recordError();
        }
      });

      next();
    };
  }

  static createCacheMiddleware(ttl = 300000) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = `request:${req.originalUrl}`;
      const cachedResponse = cacheService.get(cacheKey);

      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Override res.json to cache successful responses
      const originalJson = res.json;
      res.json = function(body) {
        if (res.statusCode < 400 && body) {
          cacheService.set(cacheKey, body, ttl);
        }
        return originalJson.call(this, body);
      };

      next();
    };
  }

  static createErrorHandler() {
    return (error, req, res, next) => {
      const errorResponse = errorHandler.createErrorResponse(error);
      
      errorHandler.logError(error, {
        requestId: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      systemHealth.recordError();
      
      res.status(error.status || 500).json(errorResponse);
    };
  }

  static createRateLimiter(windowMs = 60000, max = 100) {
    const requests = new Map();

    return (req, res, next) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      const userRequests = requests.get(key) || [];
      const validRequests = userRequests.filter(time => time > windowStart);

      if (validRequests.length >= max) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      validRequests.push(now);
      requests.set(key, validRequests);
      next();
    };
  }

  static createCircuitBreaker(name, options = {}) {
    return async (req, res, next) => {
      try {
        await errorHandler.executeWithCircuitBreaker(name, async () => {
          next();
        });
      } catch (error) {
        if (error.message.includes('Circuit breaker')) {
          return res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            code: 'CIRCUIT_BREAKER_OPEN'
          });
        }
        next(error);
      }
    };
  }

  static createValidationMiddleware(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.details.map(d => d.message)
          });
        }
        req.validatedBody = value;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = RequestMiddleware;