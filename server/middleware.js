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
  // Advanced compression with conditional settings
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Skip compression for already compressed content
      if (res.getHeader('content-encoding')) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
    // Different compression levels based on content type
    chunkSize: 16 * 1024,
    windowBits: 15,
    memLevel: 8
  }));

  // Add performance headers
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    
    // Set cache control headers before response starts
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    
    // Add response time header only if headers haven't been sent
    res.on('finish', () => {
      if (!res.headersSent) {
        const duration = Number(process.hrtime.bigint() - start) / 1000000;
        try {
          res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        } catch (error) {
          // Headers already sent, ignore
        }
      }
    });
    
    next();
  });

  console.log('Middleware de performance avançado configurado');
}

function setupLogging(app) {
  const morgan = require('morgan');
  const logger = require('./logger');
  const errorMonitoring = require('../services/errorMonitoringService');
  
  // Enhanced request logging with error monitoring
  app.use((req, res, next) => {
    const start = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = requestId;
    req.startTime = start;
    
    // Capture response for monitoring
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - start;
      const requestInfo = {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };
      
      // Track slow requests
      if (duration > 1000) {
        errorMonitoring.trackSlowRequest(requestInfo);
      }
      
      // Track error responses
      if (res.statusCode >= 500) {
        const error = new Error(`HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`);
        error.name = 'HTTPError';
        errorMonitoring.trackCriticalError(error, requestInfo);
      } else if (res.statusCode >= 400) {
        const error = new Error(`HTTP ${res.statusCode}: ${req.method} ${req.originalUrl}`);
        error.name = 'ClientError';
        errorMonitoring.trackWarningError(error, requestInfo);
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  });
  
  // Morgan integration with custom format
  const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';
  
  app.use(morgan(morganFormat, { 
    stream: {
      write: (message) => logger.http(message.trim(), { category: 'access' })
    },
    skip: (req, res) => {
      // Skip health checks and monitoring endpoints to reduce noise
      return req.url === '/health' || 
             req.url === '/api/health' ||
             req.url.startsWith('/api/monitoring');
    }
  }));
  
  // Enhanced slow request and error tracking
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      
      // Log performance metrics
      if (duration > 1000) {
        logger.performance('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          status: statusCode,
          duration: `${duration}ms`,
          requestId: req.requestId,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }
      
      // Log error responses with context
      if (statusCode >= 400) {
        const logLevel = statusCode >= 500 ? 'error' : 'warn';
        logger[logLevel](`HTTP ${statusCode} response`, {
          method: req.method,
          url: req.originalUrl,
          status: statusCode,
          duration: `${duration}ms`,
          requestId: req.requestId,
          category: 'http_error'
        });
      }
      
      // Log security-related events
      if (statusCode === 401 || statusCode === 403) {
        logger.security('Authentication/Authorization failure', {
          method: req.method,
          url: req.originalUrl,
          status: statusCode,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId
        });
      }
    });
    
    next();
  });
  
  logger.success('Enhanced production logging system configured');
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
  const errorMonitoring = require('../services/errorMonitoringService');
  const logger = require('./logger');

  app.use((req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.method} ${req.path}`);
    error.status = 404;
    next(error);
  });

  app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message || 'Erro interno do servidor';
    
    // Enhanced error context for monitoring
    const errorContext = {
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
      userId: req.user?.id,
      statusCode: status,
      endpoint: req.route?.path,
      timestamp: new Date().toISOString()
    };

    // Track error with monitoring service
    let errorId = null;
    try {
      if (errorMonitoring && typeof errorMonitoring.trackError === 'function') {
        errorId = errorMonitoring.trackError(error, errorContext);
      } else if (errorMonitoring && typeof errorMonitoring.trackCriticalError === 'function') {
        errorId = errorMonitoring.trackCriticalError(error, errorContext);
      }
    } catch (trackingError) {
      logger.error('Error tracking failed', { trackingError: trackingError.message });
    }

    // Enhanced logging with structured data
    logger.logError(error, {
      ...errorContext,
      errorId,
      category: 'request_error'
    });

    // Production-safe error response
    const responseMessage = config.server.nodeEnv === 'production' && status === 500 
      ? 'Erro interno do servidor' 
      : message;

    res.status(status).json({
      error: true,
      status,
      message: responseMessage,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(config.server.nodeEnv !== 'production' && { errorId })
    });
  });

  console.log('Middleware de tratamento de erros avançado configurado');
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