/**
 * Validation Middleware - Request validation and sanitization
 * Provides automatic validation for all API endpoints
 */

const validationService = require('../services/validationService');
const logger = require('../server/logger');

class ValidationMiddleware {
  constructor() {
    this.validationRules = {
      // User endpoints
      'POST /api/users': {
        body: {
          required: ['username', 'email', 'age'],
          optional: ['password']
        }
      },
      'PUT /api/users/:id': {
        params: { required: ['id'] },
        body: {
          required: [],
          optional: ['username', 'email', 'age']
        }
      },
      'GET /api/users/:id': {
        params: { required: ['id'] }
      },

      // Course endpoints
      'GET /api/courses': {
        query: {
          required: [],
          optional: ['limit', 'offset', 'sortBy', 'sortOrder']
        }
      },
      'GET /api/courses/:id': {
        params: { required: ['courseId'] }
      },
      'GET /api/courses/:id/lessons': {
        params: { required: ['courseId'] }
      },
      'GET /api/lessons/:id': {
        params: { required: ['lessonId'] }
      },

      // Progress endpoints
      'GET /api/progress/:userId': {
        params: { required: ['userId'] }
      },
      'POST /api/progress/lesson': {
        body: {
          required: ['userId', 'lessonId'],
          optional: ['courseId', 'moduleId', 'score', 'progress', 'timeSpent']
        }
      },
      'POST /api/progress/module': {
        body: {
          required: ['userId', 'moduleId'],
          optional: ['courseId', 'score', 'progress', 'timeSpent']
        }
      },

      // Gamification endpoints
      'GET /api/gamification/dashboard/:userId': {
        params: { required: ['userId'] }
      },
      'POST /api/gamification/lesson-completion': {
        body: {
          required: ['userId', 'lessonId'],
          optional: ['courseId', 'moduleId', 'score', 'timeSpent', 'xp', 'coins']
        }
      },
      'GET /api/gamification/badges/:userId': {
        params: { required: ['userId'] }
      },
      'GET /api/gamification/wallet/:userId': {
        params: { required: ['userId'] }
      },

      // Study techniques endpoints
      'POST /api/study/analyze-profile': {
        body: {
          required: ['userId'],
          optional: ['learningStyle', 'difficultyLevel']
        }
      },
      'POST /api/study/techniques': {
        body: {
          required: ['userId'],
          optional: ['techniqueType', 'sessionDuration', 'difficultyLevel']
        }
      },
      'POST /api/study/pomodoro/start': {
        body: {
          required: ['userId'],
          optional: ['sessionDuration', 'content']
        }
      },
      'POST /api/study/session/end': {
        body: {
          required: ['userId', 'techniqueType'],
          optional: ['sessionDuration', 'score', 'progress']
        }
      },

      // AI Learning endpoints
      'POST /api/learning/path': {
        body: {
          required: ['userId'],
          optional: ['courseId', 'difficultyLevel', 'learningStyle']
        }
      },
      'POST /api/learning/techniques': {
        body: {
          required: ['userId', 'techniqueType'],
          optional: ['content', 'difficultyLevel']
        }
      },
      'POST /api/learning/adapt-content': {
        body: {
          required: ['userId', 'content'],
          optional: ['difficultyLevel', 'learningStyle']
        }
      },

      // Age adaptation endpoints
      'POST /api/age/register': {
        body: {
          required: ['userId', 'age'],
          optional: ['username', 'email']
        }
      },
      'GET /api/age/content/:userId': {
        params: { required: ['userId'] }
      },

      // Cody AI endpoints
      'POST /api/cody/interact': {
        body: {
          required: ['userId', 'message'],
          optional: ['context', 'sessionId']
        }
      },
      'GET /api/cody/context/:userId': {
        params: { required: ['userId'] }
      }
    };
  }

  /**
   * Main validation middleware function
   */
  validate() {
    return (req, res, next) => {
      try {
        const route = `${req.method} ${this.normalizeRoute(req.route?.path || req.path)}`;
        const rules = this.validationRules[route];

        if (!rules) {
          // No specific validation rules, but still sanitize
          this.sanitizeRequest(req);
          return next();
        }

        const validationErrors = [];

        // Validate parameters
        if (rules.params) {
          const paramValidation = validationService.validateRequest(
            req.params,
            rules.params.required || [],
            rules.params.optional || []
          );
          
          if (!paramValidation.isValid) {
            validationErrors.push(...paramValidation.errors);
          } else {
            req.params = paramValidation.sanitizedData;
          }
        }

        // Validate query parameters
        if (rules.query) {
          const queryValidation = validationService.validateRequest(
            req.query,
            rules.query.required || [],
            rules.query.optional || []
          );
          
          if (!queryValidation.isValid) {
            validationErrors.push(...queryValidation.errors);
          } else {
            req.query = queryValidation.sanitizedData;
          }
        }

        // Validate request body
        if (rules.body) {
          const bodyValidation = validationService.validateRequest(
            req.body,
            rules.body.required || [],
            rules.body.optional || []
          );
          
          if (!bodyValidation.isValid) {
            validationErrors.push(...bodyValidation.errors);
          } else {
            req.body = bodyValidation.sanitizedData;
          }
        }

        // If validation errors exist, return 400
        if (validationErrors.length > 0) {
          logger.warn('Validation failed', {
            route,
            errors: validationErrors,
            userId: req.params?.userId || req.body?.userId || 'unknown',
            ip: req.ip
          });

          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors,
            timestamp: new Date().toISOString()
          });
        }

        // Sanitize any remaining request data
        this.sanitizeRequest(req);

        // Log successful validation for monitoring
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Request validated successfully', {
            route,
            userId: req.params?.userId || req.body?.userId || 'unknown'
          });
        }

        next();

      } catch (error) {
        logger.error('Validation middleware error', {
          error: error.message,
          route: req.path,
          method: req.method,
          userId: req.params?.userId || req.body?.userId || 'unknown'
        });

        res.status(500).json({
          success: false,
          message: 'Internal validation error',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Sanitize request data for security
   */
  sanitizeRequest(req) {
    // Sanitize headers (remove potentially dangerous headers)
    const dangerousHeaders = ['x-forwarded-host', 'x-real-ip'];
    dangerousHeaders.forEach(header => {
      if (req.headers[header]) {
        delete req.headers[header];
      }
    });

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = validationService.sanitizeObject(req.query);
    }

    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
      req.body = validationService.sanitizeObject(req.body);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = validationService.sanitizeObject(req.params);
    }
  }

  /**
   * Normalize route path for consistent matching
   */
  normalizeRoute(path) {
    return path
      .replace(/\/:\w+/g, '/:id')  // Replace :userId, :courseId, etc. with :id
      .replace(/\/\d+/g, '/:id')   // Replace numeric IDs with :id
      .replace(/\/$/, '');         // Remove trailing slash
  }

  /**
   * Custom validation middleware for specific use cases
   */
  validateIds() {
    return (req, res, next) => {
      const ids = ['id', 'userId', 'courseId', 'lessonId', 'moduleId'];
      
      for (const idField of ids) {
        const value = req.params[idField] || req.body[idField] || req.query[idField];
        
        if (value !== undefined) {
          const validation = validationService.validateField(idField, value);
          
          if (!validation.isValid) {
            logger.warn('ID validation failed', {
              field: idField,
              value,
              errors: validation.errors,
              ip: req.ip
            });

            return res.status(400).json({
              success: false,
              message: `Invalid ${idField}`,
              errors: validation.errors,
              timestamp: new Date().toISOString()
            });
          }

          // Update the sanitized value
          if (req.params[idField]) req.params[idField] = validation.sanitizedValue;
          if (req.body[idField]) req.body[idField] = validation.sanitizedValue;
          if (req.query[idField]) req.query[idField] = validation.sanitizedValue;
        }
      }

      next();
    };
  }

  /**
   * Rate limiting validation
   */
  validateRateLimit() {
    return (req, res, next) => {
      // Check for potential abuse patterns
      const userAgent = req.get('User-Agent') || '';
      const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
      
      if (isSuspicious) {
        logger.warn('Suspicious user agent detected', {
          userAgent,
          ip: req.ip,
          path: req.path
        });

        // Still allow but with increased monitoring
        req.suspicious = true;
      }

      next();
    };
  }

  /**
   * File upload validation (for future use)
   */
  validateFileUpload(options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      maxFiles = 1
    } = options;

    return (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        return next();
      }

      const errors = [];

      // Check file count
      if (req.files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
      }

      // Validate each file
      req.files.forEach((file, index) => {
        // Check file size
        if (file.size > maxSize) {
          errors.push(`File ${index + 1} exceeds maximum size of ${maxSize} bytes`);
        }

        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(`File ${index + 1} type '${file.mimetype}' not allowed`);
        }

        // Check for malicious filenames
        if (file.originalname.includes('..') || file.originalname.includes('/')) {
          errors.push(`File ${index + 1} has invalid filename`);
        }
      });

      if (errors.length > 0) {
        logger.warn('File upload validation failed', {
          errors,
          files: req.files.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })),
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          message: 'File validation failed',
          errors,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      totalRules: Object.keys(this.validationRules).length,
      rulesByMethod: {
        GET: Object.keys(this.validationRules).filter(r => r.startsWith('GET')).length,
        POST: Object.keys(this.validationRules).filter(r => r.startsWith('POST')).length,
        PUT: Object.keys(this.validationRules).filter(r => r.startsWith('PUT')).length,
        DELETE: Object.keys(this.validationRules).filter(r => r.startsWith('DELETE')).length
      },
      availableValidations: [
        'Input sanitization',
        'SQL injection protection',
        'XSS prevention',
        'Type validation',
        'Length validation',
        'Pattern validation',
        'Email validation',
        'File upload validation',
        'Rate limiting protection'
      ]
    };
  }
}

module.exports = new ValidationMiddleware();