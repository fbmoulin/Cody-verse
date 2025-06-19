const { body, param, query, validationResult } = require('express-validator');
const dataValidator = require('../lib/validator.js');

/**
 * Middleware de Validação para Rotas Express
 * Fornece validação automática baseada em esquemas
 */
class ValidationMiddleware {
  
  // Middleware para processar resultados de validação
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  }

  // Validação de criação de usuário
  static validateUserCreation() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email deve ter formato válido')
        .isLength({ max: 254 })
        .withMessage('Email não pode ter mais de 254 caracteres'),
      
      body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve ter entre 2 e 50 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
        .withMessage('Nome pode conter apenas letras, espaços, \' e -'),
      
      body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Sobrenome deve ter entre 2 e 50 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
        .withMessage('Sobrenome pode conter apenas letras, espaços, \' e -'),
      
      body('role')
        .optional()
        .isIn(['student', 'teacher', 'admin'])
        .withMessage('Role deve ser student, teacher ou admin'),
      
      body('profileImageUrl')
        .optional()
        .isURL({ protocols: ['http', 'https'] })
        .withMessage('URL da imagem deve ser válida'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de atualização de usuário
  static validateUserUpdate() {
    return [
      body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve ter entre 2 e 50 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
        .withMessage('Nome pode conter apenas letras, espaços, \' e -'),
      
      body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Sobrenome deve ter entre 2 e 50 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
        .withMessage('Sobrenome pode conter apenas letras, espaços, \' e -'),
      
      body('profileImageUrl')
        .optional()
        .isURL({ protocols: ['http', 'https'] })
        .withMessage('URL da imagem deve ser válida'),
      
      body('preferences')
        .optional()
        .isObject()
        .withMessage('Preferências devem ser um objeto válido'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de criação de curso
  static validateCourseCreation() {
    return [
      body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Título deve ter entre 3 e 100 caracteres')
        .escape(),
      
      body('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Descrição deve ter entre 10 e 1000 caracteres'),
      
      body('difficulty')
        .isIn(['Iniciante', 'Intermediário', 'Avançado'])
        .withMessage('Dificuldade deve ser Iniciante, Intermediário ou Avançado'),
      
      body('category')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Categoria deve ter entre 2 e 50 caracteres')
        .escape(),
      
      body('duration')
        .optional()
        .isInt({ min: 1, max: 10080 })
        .withMessage('Duração deve ser entre 1 e 10080 minutos'),
      
      body('price')
        .optional()
        .isFloat({ min: 0, max: 9999.99 })
        .withMessage('Preço deve ser entre 0 e 9999.99'),
      
      body('tags')
        .optional()
        .isArray({ max: 10 })
        .withMessage('Tags devem ser um array com máximo 10 itens'),
      
      body('tags.*')
        .optional()
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('Cada tag deve ter entre 2 e 30 caracteres')
        .escape(),
      
      this.handleValidationErrors
    ];
  }

  // Validação de criação de lição
  static validateLessonCreation() {
    return [
      body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Título deve ter entre 3 e 100 caracteres')
        .escape(),
      
      body('content')
        .trim()
        .isLength({ min: 50, max: 50000 })
        .withMessage('Conteúdo deve ter entre 50 e 50000 caracteres'),
      
      body('courseId')
        .isUUID()
        .withMessage('ID do curso deve ser um UUID válido'),
      
      body('order')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Ordem deve ser entre 1 e 1000'),
      
      body('duration')
        .optional()
        .isInt({ min: 1, max: 480 })
        .withMessage('Duração deve ser entre 1 e 480 minutos'),
      
      body('type')
        .isIn(['video', 'text', 'quiz', 'exercise', 'assignment'])
        .withMessage('Tipo deve ser video, text, quiz, exercise ou assignment'),
      
      body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Dificuldade deve ser easy, medium ou hard'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de progresso de lição
  static validateLessonProgress() {
    return [
      body('lessonId')
        .isUUID()
        .withMessage('ID da lição deve ser um UUID válido'),
      
      body('progress')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Progresso deve ser entre 0 e 100'),
      
      body('completed')
        .isBoolean()
        .withMessage('Completed deve ser true ou false'),
      
      body('timeSpent')
        .optional()
        .isInt({ min: 0, max: 86400 })
        .withMessage('Tempo gasto deve ser entre 0 e 86400 segundos'),
      
      body('score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Pontuação deve ser entre 0 e 100'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de criação de token API
  static validateAPITokenCreation() {
    return [
      body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Nome do token deve ter entre 3 e 50 caracteres')
        .matches(/^[a-zA-Z0-9\s_-]+$/)
        .withMessage('Nome pode conter apenas letras, números, espaços, _ e -'),
      
      body('permissions')
        .optional()
        .isArray({ max: 20 })
        .withMessage('Permissões devem ser um array com máximo 20 itens'),
      
      body('permissions.*')
        .optional()
        .matches(/^[a-z]+\.[a-z]+$/)
        .withMessage('Permissões devem ter formato recurso.acao'),
      
      body('expiresIn')
        .optional()
        .isIn(['7d', '30d', '1y'])
        .withMessage('Expiração deve ser 7d, 30d ou 1y'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de geração de JWT
  static validateJWTGeneration() {
    return [
      body('expiresIn')
        .optional()
        .isIn(['1h', '24h', '7d', '30d'])
        .withMessage('Expiração deve ser 1h, 24h, 7d ou 30d'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de parâmetros de ID
  static validateId(paramName = 'id') {
    return [
      param(paramName)
        .isUUID()
        .withMessage(`${paramName} deve ser um UUID válido`),
      
      this.handleValidationErrors
    ];
  }

  // Validação de parâmetros numéricos
  static validateNumericParam(paramName, min = 1, max = Number.MAX_SAFE_INTEGER) {
    return [
      param(paramName)
        .isInt({ min, max })
        .withMessage(`${paramName} deve ser um número entre ${min} e ${max}`),
      
      this.handleValidationErrors
    ];
  }

  // Validação de query de paginação
  static validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Página deve ser entre 1 e 10000'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser entre 1 e 100'),
      
      query('sort')
        .optional()
        .matches(/^[a-zA-Z_]+(:asc|:desc)?$/)
        .withMessage('Sort deve ter formato campo ou campo:asc/desc'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de query de busca
  static validateSearch() {
    return [
      query('q')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Busca deve ter entre 2 e 100 caracteres')
        .escape(),
      
      query('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Categoria deve ter entre 2 e 50 caracteres')
        .escape(),
      
      query('difficulty')
        .optional()
        .isIn(['Iniciante', 'Intermediário', 'Avançado'])
        .withMessage('Dificuldade deve ser Iniciante, Intermediário ou Avançado'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de preferências de usuário
  static validateUserPreferences() {
    return [
      body('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Tema deve ser light, dark ou auto'),
      
      body('preferences.language')
        .optional()
        .isIn(['pt-BR', 'en-US', 'es-ES'])
        .withMessage('Idioma deve ser pt-BR, en-US ou es-ES'),
      
      body('preferences.notifications')
        .optional()
        .isBoolean()
        .withMessage('Notificações deve ser true ou false'),
      
      body('preferences.emailUpdates')
        .optional()
        .isBoolean()
        .withMessage('Atualizações por email deve ser true ou false'),
      
      this.handleValidationErrors
    ];
  }

  // Validação de upload de arquivo
  static validateFileUpload(options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB padrão
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    } = options;

    return (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo é obrigatório'
        });
      }

      const validation = dataValidator.validateFile(req.file, {
        required: true,
        maxSize,
        allowedTypes
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo inválido',
          details: validation.errors
        });
      }

      next();
    };
  }

  // Sanitização customizada
  static sanitizeBody(schema) {
    return (req, res, next) => {
      const validation = dataValidator.sanitizeObject(req.body, schema);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        });
      }

      req.body = validation.sanitized;
      next();
    };
  }

  // Validação de rate limiting personalizada
  static validateRateLimit(windowMs = 60000, max = 100) {
    const requests = new Map();

    return (req, res, next) => {
      const now = Date.now();
      const identifier = req.ip || 'unknown';
      const window = Math.floor(now / windowMs);
      const key = `${identifier}:${window}`;

      const current = requests.get(key) || 0;

      if (current >= max) {
        return res.status(429).json({
          success: false,
          error: 'Muitas tentativas',
          message: `Limite de ${max} requisições por ${windowMs / 1000} segundos excedido`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      requests.set(key, current + 1);

      // Limpar entradas antigas
      setTimeout(() => {
        requests.delete(key);
      }, windowMs * 2);

      next();
    };
  }

  // Validação de enum
  static validateEnum(paramName, allowedValues, options = {}) {
    const { fieldName = 'Valor' } = options;
    
    return [
      param(paramName)
        .isIn(allowedValues)
        .withMessage(`${fieldName} deve ser um dos seguintes: ${allowedValues.join(', ')}`),
      
      this.handleValidationErrors
    ];
  }

  // Validação de data
  static validateDate(paramName, options = {}) {
    const { 
      required = false,
      minDate = null,
      maxDate = null,
      fieldName = 'Data'
    } = options;
    
    const validators = [];
    
    if (required) {
      validators.push(
        query(paramName)
          .notEmpty()
          .withMessage(`${fieldName} é obrigatória`)
      );
    } else {
      validators.push(
        query(paramName)
          .optional()
      );
    }
    
    validators.push(
      query(paramName)
        .isISO8601()
        .withMessage(`${fieldName} deve ter formato ISO 8601 válido`)
    );
    
    if (minDate) {
      validators.push(
        query(paramName)
          .isAfter(minDate.toISOString())
          .withMessage(`${fieldName} deve ser após ${minDate.toLocaleDateString()}`)
      );
    }
    
    if (maxDate) {
      validators.push(
        query(paramName)
          .isBefore(maxDate.toISOString())
          .withMessage(`${fieldName} deve ser antes de ${maxDate.toLocaleDateString()}`)
      );
    }
    
    validators.push(this.handleValidationErrors);
    
    return validators;
  }
}

module.exports = ValidationMiddleware;