/**
 * Production Deployment Configuration
 * Optimized settings for Replit deployment
 */

const deploymentConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    timeout: 30000,
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    maxConnections: 1000,
    clustering: false // Single instance for Replit
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.openai.com']
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? /^https:\/\/.*\.replit\.(app|dev)$/
        : true,
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,
      message: {
        error: 'Rate limit exceeded',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    }
  },

  // Performance Configuration
  performance: {
    compression: {
      level: 6,
      threshold: 1024,
      chunkSize: 16 * 1024
    },
    cache: {
      static: {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : '1h',
        etag: true,
        lastModified: true,
        immutable: process.env.NODE_ENV === 'production'
      },
      api: {
        defaultTTL: 300, // 5 minutes
        maxKeys: 1000,
        updateAgeOnGet: true
      }
    },
    parsing: {
      json: {
        limit: '10mb',
        strict: true,
        type: 'application/json'
      },
      urlencoded: {
        limit: '10mb',
        extended: true,
        parameterLimit: 1000
      }
    }
  },

  // Database Configuration
  database: {
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      createTimeoutMillis: 5000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000
    },
    query: {
      timeout: 10000,
      retries: 3,
      backoff: 1000
    },
    health: {
      checkInterval: 30000,
      timeout: 5000
    }
  },

  // Memory Management
  memory: {
    thresholds: {
      warning: 75,
      critical: 85,
      emergency: 95
    },
    optimization: {
      interval: 15000,
      gcThreshold: 90,
      cacheCleanup: true,
      moduleCleanup: true
    },
    monitoring: {
      enabled: true,
      logInterval: 300000 // 5 minutes
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json',
    maxSize: '20m',
    maxFiles: 5,
    datePattern: 'YYYY-MM-DD',
    categories: {
      startup: { level: 'info', enabled: true },
      performance: { level: 'info', enabled: true },
      security: { level: 'warn', enabled: true },
      database: { level: 'warn', enabled: true },
      memory: { level: 'info', enabled: true },
      api: { level: 'error', enabled: true },
      optimization: { level: 'info', enabled: true }
    }
  },

  // Monitoring Configuration
  monitoring: {
    health: {
      enabled: true,
      endpoints: ['/health', '/api/health'],
      interval: 30000
    },
    metrics: {
      enabled: true,
      endpoint: '/metrics',
      collect: {
        memory: true,
        cpu: true,
        requests: true,
        database: true,
        cache: true
      }
    },
    alerts: {
      memory: { threshold: 85, enabled: true },
      errors: { threshold: 10, window: 300000, enabled: true },
      responseTime: { threshold: 1000, enabled: true },
      database: { errorThreshold: 5, enabled: true }
    }
  },

  // Error Handling
  errorHandling: {
    production: {
      exposeStack: false,
      exposeErrors: false,
      logErrors: true
    },
    development: {
      exposeStack: true,
      exposeErrors: true,
      logErrors: true
    },
    gracefulShutdown: {
      timeout: 30000,
      signals: ['SIGTERM', 'SIGINT', 'SIGUSR2']
    }
  },

  // Feature Flags
  features: {
    loadBalancing: false, // Single instance
    caching: true,
    compression: true,
    security: true,
    monitoring: true,
    optimization: true,
    circuitBreaker: true,
    rateLimit: true
  },

  // Environment Specific Overrides
  environments: {
    development: {
      logging: { level: 'debug' },
      security: { cors: { origin: true } },
      performance: { cache: { static: { maxAge: '1m' } } }
    },
    production: {
      logging: { level: 'warn' },
      security: { 
        helmet: { hsts: { maxAge: 31536000 } },
        rateLimit: { max: 500 }
      },
      performance: { 
        compression: { level: 9 },
        cache: { static: { maxAge: '7d' } }
      }
    }
  }
};

// Apply environment-specific overrides
const env = process.env.NODE_ENV || 'development';
if (deploymentConfig.environments[env]) {
  const envConfig = deploymentConfig.environments[env];
  
  // Deep merge environment config
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(deploymentConfig, envConfig);
}

module.exports = deploymentConfig;