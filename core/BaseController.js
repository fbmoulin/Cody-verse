const BaseService = require('./BaseService');

class BaseController extends BaseService {
  constructor(name) {
    super(name);
  }

  createResponse(data, message = 'Success', metadata = {}) {
    return {
      success: true,
      data: this.sanitizeOutput(data),
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  createErrorResponse(error, statusCode = 500) {
    return {
      success: false,
      error: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    };
  }

  async handleRequest(req, res, operation) {
    try {
      const result = await this.executeWithMetrics(
        () => operation(req, res),
        req.originalUrl
      );
      
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      if (!res.headersSent) {
        const errorResponse = this.createErrorResponse(error);
        res.status(error.status || 500).json(errorResponse);
      }
    }
  }

  validateRequest(req, requiredFields = []) {
    const missingFields = requiredFields.filter(field => {
      const value = req.body?.[field] || req.params?.[field] || req.query?.[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return true;
  }

  extractUserId(req) {
    return req.params?.userId || req.user?.id || req.query?.userId;
  }

  parseIntParam(value, fieldName, defaultValue = null) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid ${fieldName}: must be a number`);
    }
    
    return parsed;
  }

  createPaginationResponse(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    return this.createResponse(data, 'Success', {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  }
}

module.exports = BaseController;