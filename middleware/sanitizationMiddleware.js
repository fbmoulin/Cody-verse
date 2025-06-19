const xss = require('xss');
const validator = require('validator');

/**
 * Middleware de Sanitização de Dados
 * Remove caracteres maliciosos e normaliza dados de entrada
 */
class SanitizationMiddleware {
  constructor() {
    this.xssOptions = {
      whiteList: {
        // Tags HTML permitidas para conteúdo educacional
        p: ['class', 'style'],
        div: ['class', 'style'],
        span: ['class', 'style'],
        strong: [],
        em: [],
        u: [],
        br: [],
        code: ['class'],
        pre: ['class'],
        h1: ['class'],
        h2: ['class'],
        h3: ['class'],
        h4: ['class'],
        h5: ['class'],
        h6: ['class'],
        ul: ['class'],
        ol: ['class'],
        li: ['class'],
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        blockquote: ['class'],
        table: ['class'],
        thead: [],
        tbody: [],
        tr: [],
        th: ['class'],
        td: ['class']
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
      allowCommentTag: false,
      css: {
        whiteList: {
          'color': true,
          'background-color': true,
          'font-size': true,
          'font-weight': true,
          'text-align': true,
          'margin': true,
          'padding': true,
          'border': true
        }
      }
    };
  }

  // Sanitização básica de strings
  sanitizeString(str, options = {}) {
    if (typeof str !== 'string') return str;
    
    const {
      allowHtml = false,
      maxLength = 10000,
      trim = true,
      escape = true
    } = options;

    let sanitized = str;

    if (trim) {
      sanitized = sanitized.trim();
    }

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    if (allowHtml) {
      sanitized = xss(sanitized, this.xssOptions);
    } else if (escape) {
      sanitized = validator.escape(sanitized);
    }

    return sanitized;
  }

  // Sanitização de emails
  sanitizeEmail(email) {
    if (typeof email !== 'string') return email;
    
    return validator.normalizeEmail(email.trim().toLowerCase(), {
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: false,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: false,
      icloud_lowercase: true,
      icloud_remove_subaddress: false
    });
  }

  // Sanitização de URLs
  sanitizeUrl(url) {
    if (typeof url !== 'string') return url;
    
    const trimmed = url.trim();
    
    // Adicionar protocolo se não existir
    if (trimmed && !trimmed.match(/^https?:\/\//)) {
      return `https://${trimmed}`;
    }
    
    return trimmed;
  }

  // Sanitização de números
  sanitizeNumber(num, options = {}) {
    const {
      isInteger = false,
      min = Number.MIN_SAFE_INTEGER,
      max = Number.MAX_SAFE_INTEGER,
      defaultValue = null
    } = options;

    if (num === null || num === undefined || num === '') {
      return defaultValue;
    }

    const parsed = isInteger ? parseInt(num, 10) : parseFloat(num);
    
    if (isNaN(parsed)) {
      return defaultValue;
    }

    if (parsed < min) return min;
    if (parsed > max) return max;

    return parsed;
  }

  // Sanitização de arrays
  sanitizeArray(arr, itemSanitizer = null) {
    if (!Array.isArray(arr)) return [];
    
    return arr
      .filter(item => item !== null && item !== undefined)
      .map(item => itemSanitizer ? itemSanitizer(item) : item)
      .slice(0, 100); // Limite máximo de 100 itens
  }

  // Sanitização de objetos
  sanitizeObject(obj, schema = {}) {
    if (typeof obj !== 'object' || obj === null) return {};
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (schema[key]) {
        sanitized[key] = schema[key](value);
      } else {
        // Sanitização padrão para strings
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'number') {
          sanitized[key] = this.sanitizeNumber(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = this.sanitizeArray(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  // Middleware para sanitizar body das requisições
  sanitizeBody(schema = {}) {
    return (req, res, next) => {
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body, schema);
      }
      next();
    };
  }

  // Middleware para sanitizar query parameters
  sanitizeQuery() {
    return (req, res, next) => {
      if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            req.query[key] = this.sanitizeString(value, { 
              allowHtml: false, 
              maxLength: 200 
            });
          }
        }
      }
      next();
    };
  }

  // Middleware para sanitizar parâmetros da URL
  sanitizeParams() {
    return (req, res, next) => {
      if (req.params && typeof req.params === 'object') {
        for (const [key, value] of Object.entries(req.params)) {
          if (typeof value === 'string') {
            req.params[key] = this.sanitizeString(value, { 
              allowHtml: false, 
              maxLength: 100 
            });
          }
        }
      }
      next();
    };
  }

  // Sanitização específica para dados de usuário
  sanitizeUserData() {
    return this.sanitizeBody({
      email: (value) => this.sanitizeEmail(value),
      firstName: (value) => this.sanitizeString(value, { 
        maxLength: 50, 
        allowHtml: false 
      }),
      lastName: (value) => this.sanitizeString(value, { 
        maxLength: 50, 
        allowHtml: false 
      }),
      profileImageUrl: (value) => this.sanitizeUrl(value),
      preferences: (value) => this.sanitizeObject(value, {
        theme: (v) => ['light', 'dark', 'auto'].includes(v) ? v : 'light',
        language: (v) => ['pt-BR', 'en-US', 'es-ES'].includes(v) ? v : 'pt-BR',
        notifications: (v) => Boolean(v),
        emailUpdates: (v) => Boolean(v)
      })
    });
  }

  // Sanitização específica para dados de curso
  sanitizeCourseData() {
    return this.sanitizeBody({
      title: (value) => this.sanitizeString(value, { 
        maxLength: 100, 
        allowHtml: false 
      }),
      description: (value) => this.sanitizeString(value, { 
        maxLength: 1000, 
        allowHtml: true 
      }),
      difficulty: (value) => ['Iniciante', 'Intermediário', 'Avançado'].includes(value) ? value : 'Iniciante',
      category: (value) => this.sanitizeString(value, { 
        maxLength: 50, 
        allowHtml: false 
      }),
      duration: (value) => this.sanitizeNumber(value, { 
        isInteger: true, 
        min: 1, 
        max: 10080 
      }),
      price: (value) => this.sanitizeNumber(value, { 
        min: 0, 
        max: 9999.99 
      }),
      tags: (value) => this.sanitizeArray(value, (tag) => 
        this.sanitizeString(tag, { maxLength: 30, allowHtml: false })
      )
    });
  }

  // Sanitização específica para dados de lição
  sanitizeLessonData() {
    return this.sanitizeBody({
      title: (value) => this.sanitizeString(value, { 
        maxLength: 100, 
        allowHtml: false 
      }),
      content: (value) => this.sanitizeString(value, { 
        maxLength: 50000, 
        allowHtml: true 
      }),
      courseId: (value) => this.sanitizeString(value, { 
        maxLength: 36, 
        allowHtml: false 
      }),
      order: (value) => this.sanitizeNumber(value, { 
        isInteger: true, 
        min: 1, 
        max: 1000 
      }),
      duration: (value) => this.sanitizeNumber(value, { 
        isInteger: true, 
        min: 1, 
        max: 480 
      }),
      type: (value) => ['video', 'text', 'quiz', 'exercise', 'assignment'].includes(value) ? value : 'text',
      difficulty: (value) => ['easy', 'medium', 'hard'].includes(value) ? value : 'medium'
    });
  }

  // Sanitização para dados de progresso
  sanitizeProgressData() {
    return this.sanitizeBody({
      lessonId: (value) => this.sanitizeString(value, { 
        maxLength: 36, 
        allowHtml: false 
      }),
      progress: (value) => this.sanitizeNumber(value, { 
        min: 0, 
        max: 100 
      }),
      completed: (value) => Boolean(value),
      timeSpent: (value) => this.sanitizeNumber(value, { 
        isInteger: true, 
        min: 0, 
        max: 86400 
      }),
      score: (value) => this.sanitizeNumber(value, { 
        min: 0, 
        max: 100 
      })
    });
  }

  // Sanitização para dados de API token
  sanitizeTokenData() {
    return this.sanitizeBody({
      name: (value) => this.sanitizeString(value, { 
        maxLength: 50, 
        allowHtml: false 
      }),
      permissions: (value) => this.sanitizeArray(value, (perm) => 
        this.sanitizeString(perm, { maxLength: 50, allowHtml: false })
      ),
      expiresIn: (value) => ['7d', '30d', '1y'].includes(value) ? value : '1y'
    });
  }

  // Sanitização para conteúdo HTML rico
  sanitizeRichContent() {
    return (req, res, next) => {
      if (req.body.content) {
        req.body.content = xss(req.body.content, {
          ...this.xssOptions,
          whiteList: {
            ...this.xssOptions.whiteList,
            iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
            video: ['src', 'controls', 'width', 'height'],
            audio: ['src', 'controls']
          }
        });
      }
      next();
    };
  }

  // Middleware de sanitização geral
  general() {
    return (req, res, next) => {
      // Sanitizar query parameters
      this.sanitizeQuery()(req, res, () => {
        // Sanitizar parâmetros da URL
        this.sanitizeParams()(req, res, () => {
          // Sanitizar body básico
          this.sanitizeBody()(req, res, next);
        });
      });
    };
  }

  // Remoção de campos sensíveis da resposta
  sanitizeResponse(data, fieldsToRemove = ['password', 'tokenHash', 'refreshToken']) {
    if (typeof data !== 'object' || data === null) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponse(item, fieldsToRemove));
    }
    
    const sanitized = { ...data };
    
    for (const field of fieldsToRemove) {
      delete sanitized[field];
    }
    
    // Recursivo para objetos aninhados
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeResponse(value, fieldsToRemove);
      }
    }
    
    return sanitized;
  }

  // Middleware para sanitizar respostas
  sanitizeResponseMiddleware(fieldsToRemove) {
    const self = this;
    
    return (req, res, next) => {
      const originalJson = res.json;
      
      res.json = function(data) {
        const sanitized = self.sanitizeResponse(data, fieldsToRemove);
        return originalJson.call(this, sanitized);
      };
      
      next();
    };
  }
}

module.exports = new SanitizationMiddleware();