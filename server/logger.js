const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Production logging configuration
const logDir = path.join(__dirname, '../logs');
const isProduction = process.env.NODE_ENV === 'production';

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Enhanced production format with detailed context
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, metadata, ...rest }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'codyverse-api',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      requestId: metadata?.requestId,
      userId: metadata?.userId,
      userAgent: metadata?.userAgent,
      ip: metadata?.ip,
      method: metadata?.method,
      url: metadata?.url,
      statusCode: metadata?.statusCode,
      responseTime: metadata?.responseTime,
      ...rest
    };

    if (stack) {
      logEntry.stack = stack;
      logEntry.errorName = rest.name;
    }

    return JSON.stringify(logEntry);
  })
);

// Development format for better readability
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n  ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Enhanced logger with production-ready transports
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info'),
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'codyverse-api',
    version: process.env.npm_package_version || '1.0.0',
    hostname: process.env.HOSTNAME || 'unknown'
  },
  transports: [
    // Console transport with environment-specific formatting
    new winston.transports.Console({
      format: isProduction ? 
        winston.format.combine(
          winston.format.colorize({ level: true }),
          winston.format.simple()
        ) : 
        developmentFormat,
      silent: process.env.NODE_ENV === 'test'
    }),

    // Error-specific log file with rotation
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
      format: productionFormat
    }),

    // Combined log file with rotation
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true,
      format: productionFormat
    }),

    // API access log
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'http',
      maxsize: 25 * 1024 * 1024, // 25MB
      maxFiles: 7,
      tailable: true,
      format: productionFormat
    }),

    // Performance monitoring log
    new winston.transports.File({
      filename: path.join(logDir, 'performance.log'),
      level: 'info',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 3,
      tailable: true,
      format: productionFormat,
      // Only log performance-related entries
      filter: (info) => info.category === 'performance' || info.responseTime
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      format: productionFormat
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      format: productionFormat
    })
  ],

  exitOnError: false
});

// Enhanced convenience methods for production logging
logger.success = (message, meta = {}) => {
  logger.info(message, { ...meta, success: true });
};

logger.database = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'database' });
};

logger.api = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'api' });
};

logger.performance = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'performance' });
};

logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, category: 'security' });
};

logger.audit = (message, meta = {}) => {
  logger.info(message, { ...meta, category: 'audit' });
};

// Enhanced error logging with context
logger.logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    category: 'error',
    ...context
  };

  logger.error(`${error.name}: ${error.message}`, errorInfo);
  
  // Track error frequency for monitoring
  if (!logger.errorStats) {
    logger.errorStats = new Map();
  }
  
  const errorKey = `${error.name}:${error.message}`;
  const count = logger.errorStats.get(errorKey) || 0;
  logger.errorStats.set(errorKey, count + 1);
  
  // Alert on repeated errors
  if (count > 5) {
    logger.warn(`Repeated error detected: ${errorKey}`, {
      category: 'monitoring',
      errorCount: count + 1,
      firstOccurrence: context.timestamp
    });
  }
};

// Request logging middleware integration
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  req.startTime = start;
  
  // Log incoming request
  logger.http('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    category: 'request'
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    
    logger.http('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration,
      contentLength: body ? body.length : 0,
      category: 'response'
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        responseTime: duration,
        category: 'performance'
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Error aggregation and reporting
logger.getErrorSummary = () => {
  if (!logger.errorStats) return {};
  
  const summary = {};
  for (const [error, count] of logger.errorStats.entries()) {
    summary[error] = count;
  }
  
  return {
    totalErrors: Array.from(logger.errorStats.values()).reduce((a, b) => a + b, 0),
    uniqueErrors: logger.errorStats.size,
    errorBreakdown: summary,
    timestamp: new Date().toISOString()
  };
};

// Log rotation management
logger.rotateLogs = () => {
  const logFiles = [
    'error.log', 'combined.log', 'access.log', 
    'performance.log', 'exceptions.log', 'rejections.log'
  ];
  
  logFiles.forEach(file => {
    const filePath = path.join(logDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      logger.debug(`Log file ${file}: ${fileSizeMB.toFixed(2)}MB`, {
        category: 'maintenance',
        file,
        sizeBytes: stats.size,
        sizeMB: fileSizeMB
      });
    }
  });
};

// Health monitoring for logging system
logger.healthCheck = () => {
  const health = {
    status: 'healthy',
    logDirectory: logDir,
    logLevel: logger.level,
    transports: logger.transports.length,
    errorStats: logger.getErrorSummary(),
    timestamp: new Date().toISOString()
  };
  
  try {
    // Check log directory accessibility
    fs.accessSync(logDir, fs.constants.W_OK);
    
    // Check log file sizes
    const logFiles = fs.readdirSync(logDir);
    health.logFiles = logFiles.map(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime
      };
    });
    
  } catch (error) {
    health.status = 'degraded';
    health.error = error.message;
  }
  
  return health;
};

// Initialize error stats tracking
logger.errorStats = new Map();

// Set up periodic maintenance with cleanup capability
logger.rotationInterval = setInterval(() => {
  logger.rotateLogs();
}, 24 * 60 * 60 * 1000); // Daily

// Cleanup function for graceful shutdown
logger.cleanup = () => {
  if (logger.rotationInterval) {
    clearInterval(logger.rotationInterval);
    logger.rotationInterval = null;
  }
};

module.exports = logger;