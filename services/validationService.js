/**
 * Comprehensive Data Validation and Sanitization Service
 * Provides enterprise-grade input validation, sanitization, and security
 */

const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

class ValidationService {
  constructor() {
    this.rules = {
      // User validation rules
      userId: {
        type: 'integer',
        min: 1,
        max: 999999999,
        required: true
      },
      email: {
        type: 'email',
        maxLength: 254,
        required: true
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/,
        required: true
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        required: true
      },
      age: {
        type: 'integer',
        min: 3,
        max: 120,
        required: true
      },
      
      // Course and lesson validation
      courseId: {
        type: 'integer',
        min: 1,
        max: 999999,
        required: true
      },
      lessonId: {
        type: 'integer',
        min: 1,
        max: 999999,
        required: true
      },
      moduleId: {
        type: 'integer',
        min: 1,
        max: 999999,
        required: true
      },
      
      // Progress and scoring
      score: {
        type: 'number',
        min: 0,
        max: 100,
        required: false
      },
      progress: {
        type: 'number',
        min: 0,
        max: 100,
        required: false
      },
      timeSpent: {
        type: 'integer',
        min: 0,
        max: 86400, // 24 hours in seconds
        required: false
      },
      
      // Text content validation
      title: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        sanitize: true,
        required: true
      },
      description: {
        type: 'string',
        minLength: 1,
        maxLength: 2000,
        sanitize: true,
        required: false
      },
      content: {
        type: 'string',
        minLength: 1,
        maxLength: 50000,
        sanitize: true,
        allowHTML: true,
        required: false
      },
      
      // Gamification
      xp: {
        type: 'integer',
        min: 0,
        max: 999999999,
        required: false
      },
      coins: {
        type: 'integer',
        min: 0,
        max: 999999999,
        required: false
      },
      gems: {
        type: 'integer',
        min: 0,
        max: 999999,
        required: false
      },
      
      // Study techniques
      techniqueType: {
        type: 'string',
        enum: ['pomodoro', 'feynman', 'spaced_repetition', 'active_recall', 'mind_mapping', 'interleaving'],
        required: true
      },
      sessionDuration: {
        type: 'integer',
        min: 60, // 1 minute
        max: 7200, // 2 hours
        required: false
      },
      
      // AI learning parameters
      difficultyLevel: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: false
      },
      learningStyle: {
        type: 'string',
        enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
        required: false
      },
      
      // General validation rules
      sortBy: {
        type: 'string',
        enum: ['id', 'name', 'created_at', 'updated_at', 'score', 'progress'],
        required: false
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        required: false
      },
      limit: {
        type: 'integer',
        min: 1,
        max: 100,
        required: false
      },
      offset: {
        type: 'integer',
        min: 0,
        max: 999999,
        required: false
      }
    };

    // SQL injection patterns to detect and block
    this.sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(\s*\d+\s*\))/i,
      /(WAITFOR\s+DELAY)/i,
      /(BENCHMARK\s*\()/i
    ];

    // XSS patterns to detect and sanitize
    this.xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ];
  }

  /**
   * Validate request data against defined rules
   */
  validateRequest(data, requiredFields = [], optionalFields = []) {
    const errors = [];
    const sanitizedData = {};
    const allFields = [...requiredFields, ...optionalFields];

    try {
      // Check for required fields
      for (const field of requiredFields) {
        if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined || data[field] === '') {
          errors.push(`Field '${field}' is required`);
          continue;
        }

        // Validate and sanitize the field
        const validationResult = this.validateField(field, data[field]);
        if (validationResult.isValid) {
          sanitizedData[field] = validationResult.sanitizedValue;
        } else {
          errors.push(...validationResult.errors);
        }
      }

      // Check optional fields if they exist
      for (const field of optionalFields) {
        if (data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined && data[field] !== '') {
          const validationResult = this.validateField(field, data[field]);
          if (validationResult.isValid) {
            sanitizedData[field] = validationResult.sanitizedValue;
          } else {
            errors.push(...validationResult.errors);
          }
        }
      }

      // Check for unexpected fields
      for (const field in data) {
        if (!allFields.includes(field)) {
          errors.push(`Unexpected field '${field}' provided`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        sanitizedData: {}
      };
    }
  }

  /**
   * Validate individual field against its rules
   */
  validateField(fieldName, value) {
    const rule = this.rules[fieldName];
    if (!rule) {
      return {
        isValid: false,
        errors: [`No validation rule found for field '${fieldName}'`],
        sanitizedValue: value
      };
    }

    const errors = [];
    let sanitizedValue = value;

    try {
      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push(`Field '${fieldName}' must be of type ${rule.type}`);
        return { isValid: false, errors, sanitizedValue: value };
      }

      // Convert type if needed
      sanitizedValue = this.convertType(value, rule.type);

      // String validations
      if (rule.type === 'string') {
        // Length validations
        if (rule.minLength && sanitizedValue.length < rule.minLength) {
          errors.push(`Field '${fieldName}' must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
          errors.push(`Field '${fieldName}' must be no more than ${rule.maxLength} characters long`);
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
          errors.push(`Field '${fieldName}' format is invalid`);
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(sanitizedValue)) {
          errors.push(`Field '${fieldName}' must be one of: ${rule.enum.join(', ')}`);
        }

        // Security validations
        if (this.containsSQLInjection(sanitizedValue)) {
          errors.push(`Field '${fieldName}' contains potentially dangerous SQL patterns`);
        }

        // Sanitize content
        if (rule.sanitize) {
          if (rule.allowHTML) {
            sanitizedValue = this.sanitizeHTML(sanitizedValue);
          } else {
            sanitizedValue = this.sanitizeString(sanitizedValue);
          }
        }
      }

      // Email validation
      if (rule.type === 'email') {
        if (!validator.isEmail(sanitizedValue)) {
          errors.push(`Field '${fieldName}' must be a valid email address`);
        }
        sanitizedValue = validator.normalizeEmail(sanitizedValue) || sanitizedValue;
      }

      // Numeric validations
      if (rule.type === 'integer' || rule.type === 'number') {
        if (rule.min !== undefined && sanitizedValue < rule.min) {
          errors.push(`Field '${fieldName}' must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && sanitizedValue > rule.max) {
          errors.push(`Field '${fieldName}' must be no more than ${rule.max}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedValue
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error for field '${fieldName}': ${error.message}`],
        sanitizedValue: value
      };
    }
  }

  /**
   * Validate data type
   */
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(Number(value));
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      case 'email':
        return typeof value === 'string';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Convert value to expected type
   */
  convertType(value, expectedType) {
    switch (expectedType) {
      case 'integer':
        return parseInt(value, 10);
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === true || value === 'true';
      case 'string':
        return String(value);
      default:
        return value;
    }
  }

  /**
   * Check for SQL injection patterns
   */
  containsSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize HTML content while preserving safe tags
   */
  sanitizeHTML(input) {
    if (typeof input !== 'string') return input;

    // Configure DOMPurify to allow educational content tags
    const config = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'blockquote'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    };

    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize string by removing dangerous characters
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize object by recursively cleaning all string values
   */
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(query) {
    const { limit = 20, offset = 0, sortBy = 'id', sortOrder = 'asc' } = query;

    return this.validateRequest(
      { limit, offset, sortBy, sortOrder },
      [],
      ['limit', 'offset', 'sortBy', 'sortOrder']
    );
  }

  /**
   * Validate user authentication data
   */
  validateAuthData(data) {
    return this.validateRequest(
      data,
      ['username'],
      ['email', 'password']
    );
  }

  /**
   * Validate course progress data
   */
  validateProgressData(data) {
    return this.validateRequest(
      data,
      ['userId', 'lessonId'],
      ['courseId', 'moduleId', 'score', 'progress', 'timeSpent']
    );
  }

  /**
   * Validate gamification data
   */
  validateGamificationData(data) {
    return this.validateRequest(
      data,
      ['userId'],
      ['xp', 'coins', 'gems', 'lessonId', 'courseId']
    );
  }

  /**
   * Validate study technique data
   */
  validateStudyTechniqueData(data) {
    return this.validateRequest(
      data,
      ['userId', 'techniqueType'],
      ['sessionDuration', 'difficultyLevel', 'content']
    );
  }

  /**
   * Validate AI learning data
   */
  validateAILearningData(data) {
    return this.validateRequest(
      data,
      ['userId'],
      ['courseId', 'difficultyLevel', 'learningStyle', 'content']
    );
  }

  /**
   * Get validation rules for a specific field (for frontend validation)
   */
  getFieldRules(fieldName) {
    return this.rules[fieldName] || null;
  }

  /**
   * Get all validation rules (for frontend validation setup)
   */
  getAllRules() {
    return { ...this.rules };
  }
}

module.exports = new ValidationService();