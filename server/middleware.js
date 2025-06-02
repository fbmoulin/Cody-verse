const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { config } = require('./config');

function setupSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
    origin: config.security.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Configurar trust proxy para Replit
  app.set('trust proxy', 1);
  
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindow,
    max: config.security.rateLimitMax,
    message: {
      error: 'Muitas requisições do mesmo IP, tente novamente em alguns minutos.',
      retryAfter: Math.ceil(config.security.rateLimitWindow / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true
  });
  app.use('/api/', limiter);

  console.log('Middleware de segurança configurado');
}

function setupPerformance(app) {
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));

  console.log('Middleware de performance configurado');
}

function setupLogging(app) {
  const morgan = require('morgan');
  const logger = require('./logger');
  
  // Criar stream personalizado para morgan que usa winston
  const stream = {
    write: (message) => logger.http(message.trim())
  };
  
  // Usar morgan com winston
  app.use(morgan('combined', { 
    stream,
    skip: (req, res) => {
      return req.url === '/health' || req.url === '/api/health';
    }
  }));
  
  // Logging de requisições lentas e erros
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn(`Requisição lenta: ${req.method} ${req.originalUrl} - ${duration}ms`);
      }
      
      if (res.statusCode >= 400) {
        logger.error(`Erro ${res.statusCode}: ${req.method} ${req.originalUrl}`);
      }
    });
    
    next();
  });
  
  logger.success('Sistema de logging avançado configurado com Winston');
}

function setupParsing(app) {
  app.use(require('express').json({ 
    limit: '10mb',
    strict: true
  }));

  app.use(require('express').urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  console.log('Middleware de parsing configurado');
}

function setupErrorHandling(app) {
  app.use((req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.path}`);
    error.status = 404;
    next(error);
  });

  app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message || 'Erro interno do servidor';
    
    console.error(`Erro ${status}:`, {
      message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.status(status).json({
      error: true,
      status,
      message: config.server.nodeEnv === 'production' && status === 500 
        ? 'Erro interno do servidor' 
        : message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  });

  console.log('Middleware de tratamento de erros configurado');
}

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn('Requisição lenta:', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`
      });
    }
  });
  
  next();
}

module.exports = {
  setupSecurity,
  setupPerformance,
  setupLogging,
  setupParsing,
  setupErrorHandling,
  requestLogger
};