const validator = require('validator');
const xss = require('xss');

/**
 * Sistema de Validação e Sanitização de Dados
 * Valida e sanitiza entradas do usuário para prevenir ataques e garantir integridade
 */
class DataValidator {
  constructor() {
    this.xssOptions = {
      whiteList: {
        p: ['class'],
        div: ['class'],
        span: ['class'],
        strong: [],
        em: [],
        u: [],
        br: [],
        code: ['class'],
        pre: ['class']
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    };
  }

  // Validação de email
  validateEmail(email) {
    const errors = [];
    
    if (!email) {
      errors.push('Email é obrigatório');
      return { isValid: false, errors, sanitized: '' };
    }

    const sanitized = validator.normalizeEmail(email.trim().toLowerCase());
    
    if (!validator.isEmail(sanitized)) {
      errors.push('Email deve ter formato válido');
    }

    if (sanitized.length > 254) {
      errors.push('Email não pode ter mais de 254 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de nome de usuário
  validateUsername(username) {
    const errors = [];
    
    if (!username) {
      errors.push('Nome de usuário é obrigatório');
      return { isValid: false, errors, sanitized: '' };
    }

    const sanitized = validator.escape(username.trim());
    
    if (sanitized.length < 3) {
      errors.push('Nome de usuário deve ter pelo menos 3 caracteres');
    }

    if (sanitized.length > 30) {
      errors.push('Nome de usuário não pode ter mais de 30 caracteres');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      errors.push('Nome de usuário pode conter apenas letras, números, _ e -');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de senha
  validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Senha é obrigatória');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }

    if (password.length > 128) {
      errors.push('Senha não pode ter mais de 128 caracteres');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validação de nome
  validateName(name, fieldName = 'Nome') {
    const errors = [];
    
    if (!name) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors, sanitized: '' };
    }

    const sanitized = validator.escape(name.trim());
    
    if (sanitized.length < 2) {
      errors.push(`${fieldName} deve ter pelo menos 2 caracteres`);
    }

    if (sanitized.length > 50) {
      errors.push(`${fieldName} não pode ter mais de 50 caracteres`);
    }

    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(sanitized)) {
      errors.push(`${fieldName} pode conter apenas letras, espaços, ' e -`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de texto longo (descrições, conteúdo)
  validateText(text, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = 1000,
      allowHtml = false,
      fieldName = 'Texto'
    } = options;
    
    const errors = [];
    
    if (required && !text) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors, sanitized: '' };
    }

    if (!text) {
      return { isValid: true, errors: [], sanitized: '' };
    }

    let sanitized;
    if (allowHtml) {
      sanitized = xss(text.trim(), this.xssOptions);
    } else {
      sanitized = validator.escape(text.trim());
    }

    if (sanitized.length < minLength) {
      errors.push(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
    }

    if (sanitized.length > maxLength) {
      errors.push(`${fieldName} não pode ter mais de ${maxLength} caracteres`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de URL
  validateUrl(url, required = false) {
    const errors = [];
    
    if (required && !url) {
      errors.push('URL é obrigatória');
      return { isValid: false, errors, sanitized: '' };
    }

    if (!url) {
      return { isValid: true, errors: [], sanitized: '' };
    }

    const sanitized = url.trim();
    
    if (!validator.isURL(sanitized, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      errors.push('URL deve ter formato válido (http:// ou https://)');
    }

    if (sanitized.length > 2048) {
      errors.push('URL não pode ter mais de 2048 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de número inteiro
  validateInteger(value, options = {}) {
    const {
      required = false,
      min = Number.MIN_SAFE_INTEGER,
      max = Number.MAX_SAFE_INTEGER,
      fieldName = 'Número'
    } = options;
    
    const errors = [];
    
    if (required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors, sanitized: null };
    }

    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [], sanitized: null };
    }

    const sanitized = parseInt(value, 10);
    
    if (isNaN(sanitized)) {
      errors.push(`${fieldName} deve ser um número válido`);
      return { isValid: false, errors, sanitized: null };
    }

    if (sanitized < min) {
      errors.push(`${fieldName} deve ser pelo menos ${min}`);
    }

    if (sanitized > max) {
      errors.push(`${fieldName} não pode ser maior que ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de número decimal
  validateFloat(value, options = {}) {
    const {
      required = false,
      min = Number.MIN_VALUE,
      max = Number.MAX_VALUE,
      precision = 2,
      fieldName = 'Número'
    } = options;
    
    const errors = [];
    
    if (required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors, sanitized: null };
    }

    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [], sanitized: null };
    }

    const sanitized = parseFloat(value);
    
    if (isNaN(sanitized)) {
      errors.push(`${fieldName} deve ser um número válido`);
      return { isValid: false, errors, sanitized: null };
    }

    if (sanitized < min) {
      errors.push(`${fieldName} deve ser pelo menos ${min}`);
    }

    if (sanitized > max) {
      errors.push(`${fieldName} não pode ser maior que ${max}`);
    }

    // Arredondar para precisão especificada
    const rounded = Math.round(sanitized * Math.pow(10, precision)) / Math.pow(10, precision);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: rounded
    };
  }

  // Validação de data
  validateDate(date, options = {}) {
    const {
      required = false,
      minDate = null,
      maxDate = null,
      fieldName = 'Data'
    } = options;
    
    const errors = [];
    
    if (required && !date) {
      errors.push(`${fieldName} é obrigatória`);
      return { isValid: false, errors, sanitized: null };
    }

    if (!date) {
      return { isValid: true, errors: [], sanitized: null };
    }

    let sanitized;
    if (typeof date === 'string') {
      sanitized = new Date(date);
    } else {
      sanitized = date;
    }

    if (isNaN(sanitized.getTime())) {
      errors.push(`${fieldName} deve ter formato válido`);
      return { isValid: false, errors, sanitized: null };
    }

    if (minDate && sanitized < minDate) {
      errors.push(`${fieldName} não pode ser anterior a ${minDate.toLocaleDateString()}`);
    }

    if (maxDate && sanitized > maxDate) {
      errors.push(`${fieldName} não pode ser posterior a ${maxDate.toLocaleDateString()}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de array
  validateArray(array, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = 100,
      itemValidator = null,
      fieldName = 'Lista'
    } = options;
    
    const errors = [];
    
    if (required && (!array || !Array.isArray(array))) {
      errors.push(`${fieldName} é obrigatória`);
      return { isValid: false, errors, sanitized: [] };
    }

    if (!array || !Array.isArray(array)) {
      return { isValid: true, errors: [], sanitized: [] };
    }

    if (array.length < minLength) {
      errors.push(`${fieldName} deve ter pelo menos ${minLength} itens`);
    }

    if (array.length > maxLength) {
      errors.push(`${fieldName} não pode ter mais de ${maxLength} itens`);
    }

    const sanitized = [];
    if (itemValidator && typeof itemValidator === 'function') {
      for (let i = 0; i < array.length; i++) {
        const result = itemValidator(array[i]);
        if (!result.isValid) {
          errors.push(`Item ${i + 1}: ${result.errors.join(', ')}`);
        } else {
          sanitized.push(result.sanitized);
        }
      }
    } else {
      sanitized.push(...array);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de objeto JSON
  validateJSON(jsonString, required = false, fieldName = 'JSON') {
    const errors = [];
    
    if (required && !jsonString) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors, sanitized: null };
    }

    if (!jsonString) {
      return { isValid: true, errors: [], sanitized: null };
    }

    try {
      const sanitized = JSON.parse(jsonString);
      return {
        isValid: true,
        errors: [],
        sanitized
      };
    } catch (error) {
      errors.push(`${fieldName} deve ter formato JSON válido`);
      return {
        isValid: false,
        errors,
        sanitized: null
      };
    }
  }

  // Validação de enum
  validateEnum(value, allowedValues, options = {}) {
    const {
      required = false,
      fieldName = 'Valor'
    } = options;
    
    const errors = [];
    
    if (required && !value) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors, sanitized: null };
    }

    if (!value) {
      return { isValid: true, errors: [], sanitized: null };
    }

    const sanitized = validator.escape(value.toString().trim());
    
    if (!allowedValues.includes(sanitized)) {
      errors.push(`${fieldName} deve ser um dos seguintes valores: ${allowedValues.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // Validação de arquivo
  validateFile(file, options = {}) {
    const {
      required = false,
      maxSize = 5 * 1024 * 1024, // 5MB padrão
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      fieldName = 'Arquivo'
    } = options;
    
    const errors = [];
    
    if (required && !file) {
      errors.push(`${fieldName} é obrigatório`);
      return { isValid: false, errors };
    }

    if (!file) {
      return { isValid: true, errors: [] };
    }

    if (file.size > maxSize) {
      errors.push(`${fieldName} não pode ser maior que ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`${fieldName} deve ser um dos seguintes tipos: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitização geral de objeto
  sanitizeObject(obj, schema) {
    const sanitized = {};
    const errors = {};
    let hasErrors = false;

    for (const [key, validator] of Object.entries(schema)) {
      try {
        const result = validator(obj[key]);
        
        if (!result.isValid) {
          errors[key] = result.errors;
          hasErrors = true;
        } else {
          sanitized[key] = result.sanitized;
        }
      } catch (error) {
        errors[key] = [`Erro de validação: ${error.message}`];
        hasErrors = true;
      }
    }

    return {
      isValid: !hasErrors,
      errors,
      sanitized
    };
  }

  // Validação de token de API
  validateAPIToken(token) {
    const errors = [];
    
    if (!token) {
      errors.push('Token é obrigatório');
      return { isValid: false, errors };
    }

    if (!token.startsWith('cody_')) {
      errors.push('Token deve começar com "cody_"');
    }

    if (token.length !== 69) { // 'cody_' (5) + 64 hex chars
      errors.push('Token deve ter 69 caracteres');
    }

    const tokenPart = token.substring(5);
    if (!/^[a-f0-9]{64}$/.test(tokenPart)) {
      errors.push('Token deve conter apenas caracteres hexadecimais válidos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validação de JWT
  validateJWT(token) {
    const errors = [];
    
    if (!token) {
      errors.push('JWT é obrigatório');
      return { isValid: false, errors };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      errors.push('JWT deve ter 3 partes separadas por pontos');
    }

    for (let i = 0; i < parts.length; i++) {
      if (!/^[A-Za-z0-9_-]+$/.test(parts[i])) {
        errors.push(`Parte ${i + 1} do JWT contém caracteres inválidos`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new DataValidator();