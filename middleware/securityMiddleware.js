const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Middleware de Segurança
 * Implementa várias camadas de proteção contra ataques comuns
 */
class SecurityMiddleware {
  
  // Rate limiting básico
  static basicRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requisições por IP
      message: {
        success: false,
        error: 'Muitas tentativas',
        message: 'Limite de requisições excedido. Tente novamente em 15 minutos.',
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
      }
    });
  }

  // Rate limiting para autenticação
  static authRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas de login por IP
      message: {
        success: false,
        error: 'Muitas tentativas de login',
        message: 'Máximo de 5 tentativas de login por 15 minutos excedido.',
        retryAfter: 900
      },
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Rate limiting para API tokens
  static apiRateLimit() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 1000, // máximo 1000 requisições por hora para API
      message: {
        success: false,
        error: 'API rate limit exceeded',
        message: 'API rate limit of 1000 requests per hour exceeded.',
        retryAfter: 3600
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Rate limiting para criação de recursos
  static createResourceRateLimit() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 50, // máximo 50 criações por hora
      message: {
        success: false,
        error: 'Limite de criação excedido',
        message: 'Máximo de 50 criações por hora excedido.',
        retryAfter: 3600
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Configuração de segurança do Helmet
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.openai.com"],
          mediaSrc: ["'self'", "blob:"],
          objectSrc: ["'none'"],
          frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    });
  }

  // Configuração de CORS
  static cors() {
    return cors({
      origin: function (origin, callback) {
        // Lista de domínios permitidos
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5000',
          'https://localhost:3000',
          'https://localhost:5000'
        ];

        // Permitir requisições do Replit
        if (!origin || 
            origin.includes('.replit.') || 
            origin.includes('.repl.co') ||
            allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Não permitido pelo CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ],
      maxAge: 86400 // 24 horas
    });
  }

  // Middleware para detecção de SQL Injection
  static sqlInjectionProtection() {
    const sqlPatterns = [
      /(\s*(;|\/\*|\*\/|--|\#)\s*)/i,
      /(union\s+select)/i,
      /(select\s+.*\s+from)/i,
      /(insert\s+into)/i,
      /(delete\s+from)/i,
      /(update\s+.*\s+set)/i,
      /(drop\s+table)/i,
      /(create\s+table)/i,
      /(alter\s+table)/i,
      /(\'\s*or\s+\'\d+\'\s*=\s*\'\d+)/i,
      /(\'\s*or\s+\d+\s*=\s*\d+)/i
    ];

    return (req, res, next) => {
      const checkValue = (value) => {
        if (typeof value === 'string') {
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        }
        return false;
      };

      const checkObject = (obj) => {
        for (const [key, value] of Object.entries(obj)) {
          if (checkValue(key) || checkValue(value)) {
            return true;
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (checkObject(value)) {
              return true;
            }
          }
        }
        return false;
      };

      // Verificar query parameters
      if (req.query && checkObject(req.query)) {
        return res.status(400).json({
          success: false,
          error: 'Entrada suspeita detectada',
          message: 'A requisição contém padrões suspeitos que podem indicar SQL injection.'
        });
      }

      // Verificar body
      if (req.body && checkObject(req.body)) {
        return res.status(400).json({
          success: false,
          error: 'Entrada suspeita detectada',
          message: 'A requisição contém padrões suspeitos que podem indicar SQL injection.'
        });
      }

      next();
    };
  }

  // Middleware para detecção de NoSQL Injection
  static noSqlInjectionProtection() {
    const forbiddenKeys = ['$where', '$ne', '$gt', '$lt', '$gte', '$lte', '$regex', '$options'];

    return (req, res, next) => {
      const checkObject = (obj) => {
        for (const [key, value] of Object.entries(obj)) {
          if (forbiddenKeys.includes(key)) {
            return true;
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (checkObject(value)) {
              return true;
            }
          }
        }
        return false;
      };

      if ((req.body && checkObject(req.body)) || 
          (req.query && checkObject(req.query))) {
        return res.status(400).json({
          success: false,
          error: 'Entrada suspeita detectada',
          message: 'A requisição contém operadores NoSQL não permitidos.'
        });
      }

      next();
    };
  }

  // Middleware para proteção contra Path Traversal
  static pathTraversalProtection() {
    const dangerousPatterns = [
      /\.\./,
      /\\/,
      /%2e%2e/i,
      /%5c/i,
      /\x00/
    ];

    return (req, res, next) => {
      const checkValue = (value) => {
        if (typeof value === 'string') {
          for (const pattern of dangerousPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        }
        return false;
      };

      // Verificar parâmetros da URL
      for (const value of Object.values(req.params)) {
        if (checkValue(value)) {
          return res.status(400).json({
            success: false,
            error: 'Path inválido',
            message: 'O path contém caracteres não permitidos.'
          });
        }
      }

      // Verificar query parameters
      for (const value of Object.values(req.query)) {
        if (checkValue(value)) {
          return res.status(400).json({
            success: false,
            error: 'Query inválida',
            message: 'Os parâmetros contêm caracteres não permitidos.'
          });
        }
      }

      next();
    };
  }

  // Middleware para proteção contra Request Size Attack
  static requestSizeProtection(maxSize = '10mb') {
    return (req, res, next) => {
      const contentLength = parseInt(req.headers['content-length']);
      const maxSizeBytes = this.parseSize(maxSize);

      if (contentLength > maxSizeBytes) {
        return res.status(413).json({
          success: false,
          error: 'Payload muito grande',
          message: `O tamanho da requisição excede o limite de ${maxSize}.`
        });
      }

      next();
    };
  }

  // Middleware para log de segurança
  static securityLogging() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const suspicious = this.detectSuspiciousActivity(req, res, duration);
        
        if (suspicious) {
          console.warn('Atividade suspeita detectada:', {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString(),
            reason: suspicious
          });
        }
      });

      next();
    };
  }

  // Detectar atividade suspeita
  static detectSuspiciousActivity(req, res, duration) {
    const reasons = [];

    // Requisições muito rápidas (possível bot)
    if (duration < 10) {
      reasons.push('very_fast_request');
    }

    // Requisições muito lentas (possível ataque DoS)
    if (duration > 30000) {
      reasons.push('very_slow_request');
    }

    // Status codes suspeitos
    if ([401, 403, 404, 429].includes(res.statusCode)) {
      reasons.push(`status_${res.statusCode}`);
    }

    // User-Agent suspeito
    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent || 
        userAgent.includes('bot') || 
        userAgent.includes('crawler') ||
        userAgent.includes('scanner')) {
      reasons.push('suspicious_user_agent');
    }

    // Muitos headers
    if (Object.keys(req.headers).length > 50) {
      reasons.push('too_many_headers');
    }

    return reasons.length > 0 ? reasons : null;
  }

  // Converter string de tamanho para bytes
  static parseSize(size) {
    if (typeof size === 'number') return size;
    
    const match = size.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024
    };
    
    return Math.floor(value * multipliers[unit]);
  }

  // Middleware de limpeza de headers de resposta
  static cleanResponseHeaders() {
    return (req, res, next) => {
      // Remover headers que podem vazar informações
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');
      
      // Adicionar headers de segurança customizados
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      next();
    };
  }

  // Middleware abrangente de segurança
  static comprehensive() {
    return [
      this.helmet(),
      this.cors(),
      this.cleanResponseHeaders(),
      this.requestSizeProtection(),
      this.sqlInjectionProtection(),
      this.noSqlInjectionProtection(),
      this.pathTraversalProtection(),
      this.securityLogging(),
      this.basicRateLimit()
    ];
  }
}

module.exports = SecurityMiddleware;