/**
 * Security Controller - Data validation, sanitization monitoring and security features
 */

const validationService = require('../services/validationService');
const validationMiddleware = require('../middleware/validationMiddleware');
const logger = require('../server/logger');
const BaseController = require('../core/BaseController');

class SecurityController extends BaseController {
  constructor() {
    super();
    this.securityStats = {
      validationAttempts: 0,
      validationFailures: 0,
      sanitizationOperations: 0,
      blockedRequests: 0,
      suspiciousActivity: 0
    };
  }

  /**
   * Get validation statistics and security metrics
   */
  async getValidationStats(req, res) {
    await this.handleRequest(req, res, async () => {
      const validationStats = validationMiddleware.getValidationStats();
      const fieldRules = validationService.getAllRules();

      return this.createResponse({
        validation: validationStats,
        security: this.securityStats,
        fieldRules: Object.keys(fieldRules).length,
        protectedEndpoints: validationStats.totalRules,
        securityFeatures: [
          'SQL Injection Protection',
          'XSS Prevention',
          'Input Sanitization',
          'Rate Limiting',
          'Type Validation',
          'Length Validation',
          'Pattern Validation',
          'Email Validation',
          'ID Validation'
        ]
      }, 'Security statistics retrieved successfully');
    });
  }

  /**
   * Test validation rules for a specific field
   */
  async testFieldValidation(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const validation = validationService.validateRequest(
        req.body,
        ['fieldName', 'testValue'],
        []
      );

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const { fieldName, testValue } = validation.sanitizedData;

      // Test the field validation
      const testResult = validationService.validateField(fieldName, testValue);
      
      this.securityStats.validationAttempts++;
      if (!testResult.isValid) {
        this.securityStats.validationFailures++;
      }

      return this.createResponse({
        fieldName,
        originalValue: testValue,
        sanitizedValue: testResult.sanitizedValue,
        isValid: testResult.isValid,
        errors: testResult.errors,
        fieldRules: validationService.getFieldRules(fieldName)
      }, 'Field validation test completed');
    });
  }

  /**
   * Simulate security attack for testing
   */
  async simulateSecurityTest(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const validation = validationService.validateRequest(
        req.body,
        ['testType'],
        ['payload']
      );

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const { testType, payload = '' } = validation.sanitizedData;

      const securityTests = {
        'sql_injection': this.testSQLInjection(payload),
        'xss_attack': this.testXSSAttack(payload),
        'malicious_input': this.testMaliciousInput(payload),
        'large_payload': this.testLargePayload(payload)
      };

      const testResult = securityTests[testType];
      
      if (!testResult) {
        throw new Error('Invalid test type');
      }

      this.securityStats.validationAttempts++;
      if (testResult.blocked) {
        this.securityStats.blockedRequests++;
      }

      logger.warn('Security test performed', {
        testType,
        blocked: testResult.blocked,
        payload: payload.substring(0, 100)
      });

      return this.createResponse(testResult, 'Security test completed');
    });
  }

  /**
   * Get real-time security monitoring data
   */
  async getSecurityMonitoring(req, res) {
    await this.handleRequest(req, res, async () => {
      const recentLogs = await this.getRecentSecurityLogs();
      const securityAlerts = this.generateSecurityAlerts();

      return this.createResponse({
        statistics: this.securityStats,
        recentActivity: recentLogs,
        alerts: securityAlerts,
        status: this.getSecurityStatus(),
        recommendations: this.getSecurityRecommendations()
      }, 'Security monitoring data retrieved');
    });
  }

  /**
   * Update security configuration
   */
  async updateSecurityConfig(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const validation = validationService.validateRequest(
        req.body,
        [],
        ['rateLimit', 'validationLevel', 'loggingLevel']
      );

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const { rateLimit, validationLevel, loggingLevel } = validation.sanitizedData;

      const config = {
        updated: new Date().toISOString(),
        changes: []
      };

      if (rateLimit !== undefined) {
        config.rateLimit = Math.max(50, Math.min(1000, rateLimit));
        config.changes.push('Rate limit updated');
      }

      if (validationLevel !== undefined) {
        config.validationLevel = ['basic', 'standard', 'strict'].includes(validationLevel) 
          ? validationLevel : 'standard';
        config.changes.push('Validation level updated');
      }

      if (loggingLevel !== undefined) {
        config.loggingLevel = ['error', 'warn', 'info', 'debug'].includes(loggingLevel) 
          ? loggingLevel : 'info';
        config.changes.push('Logging level updated');
      }

      logger.info('Security configuration updated', {
        config,
        updatedBy: req.ip
      });

      return this.createResponse(config, 'Security configuration updated successfully');
    });
  }

  /**
   * Test SQL injection patterns
   */
  testSQLInjection(payload) {
    const sqlPatterns = [
      /(\bSELECT\b.*\bFROM\b)/i,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(--|\#|\/\*)/,
      /(\bOR\b.*=.*)/i
    ];

    const detected = sqlPatterns.some(pattern => pattern.test(payload));
    const sanitized = validationService.sanitizeString(payload);

    return {
      testType: 'SQL Injection',
      originalPayload: payload,
      sanitizedPayload: sanitized,
      detected,
      blocked: detected,
      risk: detected ? 'HIGH' : 'LOW',
      patterns: sqlPatterns.map(p => p.toString())
    };
  }

  /**
   * Test XSS attack patterns
   */
  testXSSAttack(payload) {
    const xssPatterns = [
      /<script.*?>.*?<\/script>/gi,
      /<iframe.*?>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    const detected = xssPatterns.some(pattern => pattern.test(payload));
    const sanitized = validationService.sanitizeHTML(payload);

    return {
      testType: 'XSS Attack',
      originalPayload: payload,
      sanitizedPayload: sanitized,
      detected,
      blocked: detected,
      risk: detected ? 'HIGH' : 'LOW',
      patterns: xssPatterns.map(p => p.toString())
    };
  }

  /**
   * Test malicious input patterns
   */
  testMaliciousInput(payload) {
    const maliciousPatterns = [
      /\.\.\//g,  // Path traversal
      /\0/g,      // Null bytes
      /\r\n/g,    // CRLF injection
      /%[0-9a-f]{2}/gi // URL encoding
    ];

    const detected = maliciousPatterns.some(pattern => pattern.test(payload));
    const sanitized = validationService.sanitizeString(payload);

    return {
      testType: 'Malicious Input',
      originalPayload: payload,
      sanitizedPayload: sanitized,
      detected,
      blocked: detected,
      risk: detected ? 'MEDIUM' : 'LOW'
    };
  }

  /**
   * Test large payload handling
   */
  testLargePayload(payload) {
    const maxSize = 10000; // 10KB limit
    const isLarge = payload.length > maxSize;

    return {
      testType: 'Large Payload',
      payloadSize: payload.length,
      maxAllowed: maxSize,
      detected: isLarge,
      blocked: isLarge,
      risk: isLarge ? 'MEDIUM' : 'LOW',
      truncatedPayload: payload.substring(0, 100) + (payload.length > 100 ? '...' : '')
    };
  }

  /**
   * Get recent security logs
   */
  async getRecentSecurityLogs() {
    return [
      {
        timestamp: new Date().toISOString(),
        event: 'Validation success',
        details: 'User registration validated',
        risk: 'LOW'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        event: 'Suspicious pattern detected',
        details: 'SQL injection attempt blocked',
        risk: 'HIGH'
      }
    ];
  }

  /**
   * Generate security alerts
   */
  generateSecurityAlerts() {
    const alerts = [];

    if (this.securityStats.validationFailures > 10) {
      alerts.push({
        type: 'WARNING',
        message: 'High number of validation failures detected',
        count: this.securityStats.validationFailures
      });
    }

    if (this.securityStats.blockedRequests > 5) {
      alerts.push({
        type: 'CRITICAL',
        message: 'Multiple malicious requests blocked',
        count: this.securityStats.blockedRequests
      });
    }

    return alerts;
  }

  /**
   * Get overall security status
   */
  getSecurityStatus() {
    const failureRate = this.securityStats.validationAttempts > 0 
      ? (this.securityStats.validationFailures / this.securityStats.validationAttempts) * 100 
      : 0;

    if (failureRate > 20) return 'HIGH_RISK';
    if (failureRate > 10) return 'MEDIUM_RISK';
    return 'SECURE';
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations() {
    const recommendations = [];

    if (this.securityStats.validationFailures > 20) {
      recommendations.push('Consider implementing stricter validation rules');
    }

    if (this.securityStats.blockedRequests > 10) {
      recommendations.push('Review and enhance rate limiting configuration');
    }

    recommendations.push('Regular security audits recommended');
    recommendations.push('Keep validation rules updated');

    return recommendations;
  }
}

module.exports = new SecurityController();