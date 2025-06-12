class ConfigManager {
  constructor() {
    this.config = {
      database: {
        pool: {
          max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
          min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 10000,
          acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT, 10) || 5000
        },
        query: {
          timeout: parseInt(process.env.DB_QUERY_TIMEOUT, 10) || 8000,
          slowThreshold: parseInt(process.env.DB_SLOW_THRESHOLD, 10) || 5000
        },
        retry: {
          maxAttempts: parseInt(process.env.DB_MAX_RETRIES, 10) || 5,
          baseDelay: parseInt(process.env.DB_RETRY_DELAY, 10) || 2000
        }
      },
      cache: {
        defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL, 10) || 300000,
        maxSize: parseInt(process.env.CACHE_MAX_SIZE, 10) || 1000,
        apiTTL: parseInt(process.env.CACHE_API_TTL, 10) || 180000,
        userDataTTL: parseInt(process.env.CACHE_USER_TTL, 10) || 600000,
        staticDataTTL: parseInt(process.env.CACHE_STATIC_TTL, 10) || 3600000
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
        skipSuccessful: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
        skipFailed: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
      },
      circuitBreaker: {
        api: {
          threshold: parseInt(process.env.CB_API_THRESHOLD, 10) || 10,
          timeout: parseInt(process.env.CB_API_TIMEOUT, 10) || 30000,
          resetTimeout: parseInt(process.env.CB_API_RESET, 10) || 60000
        },
        database: {
          threshold: parseInt(process.env.CB_DB_THRESHOLD, 10) || 5,
          timeout: parseInt(process.env.CB_DB_TIMEOUT, 10) || 10000,
          resetTimeout: parseInt(process.env.CB_DB_RESET, 10) || 30000
        }
      },
      monitoring: {
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
        slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD, 10) || 5000,
        memoryWarningThreshold: parseFloat(process.env.MEMORY_WARNING_THRESHOLD) || 0.8,
        cpuWarningThreshold: parseFloat(process.env.CPU_WARNING_THRESHOLD) || 0.9
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        errorSamplingRate: parseFloat(process.env.ERROR_SAMPLING_RATE) || 0.1,
        enableSlowQueryLogging: process.env.ENABLE_SLOW_QUERY_LOG !== 'false',
        enablePerformanceLogging: process.env.ENABLE_PERF_LOG !== 'false'
      },
      server: {
        port: parseInt(process.env.PORT, 10) || 5000,
        host: process.env.HOST || '0.0.0.0',
        nodeEnv: process.env.NODE_ENV || 'development',
        gracefulShutdownTimeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT, 10) || 30000
      },
      gamification: {
        levels: [
          { level: 1, name: 'Novice', icon: '🌱', xpRequired: 0 },
          { level: 2, name: 'Beginner', icon: '📖', xpRequired: 100 },
          { level: 3, name: 'Student', icon: '🎓', xpRequired: 300 },
          { level: 4, name: 'Learner', icon: '📚', xpRequired: 600 },
          { level: 5, name: 'Scholar', icon: '🎖️', xpRequired: 1000 },
          { level: 6, name: 'Expert', icon: '⭐', xpRequired: 1500 },
          { level: 7, name: 'Master', icon: '🏆', xpRequired: 2500 },
          { level: 8, name: 'Grandmaster', icon: '👑', xpRequired: 4000 }
        ],
        xpCalculation: {
          baseXP: parseInt(process.env.GAMIF_BASE_XP, 10) || 50,
          timeMultiplier: parseFloat(process.env.GAMIF_TIME_MULT) || 2.0,
          scoreMultiplier: parseFloat(process.env.GAMIF_SCORE_MULT) || 1.5,
          minimumXP: parseInt(process.env.GAMIF_MIN_XP, 10) || 25
        },
        coinCalculation: {
          baseCoins: parseInt(process.env.GAMIF_BASE_COINS, 10) || 10,
          timeMultiplier: parseFloat(process.env.GAMIF_COIN_TIME_MULT) || 0.5,
          scoreMultiplier: parseFloat(process.env.GAMIF_COIN_SCORE_MULT) || 1.0,
          minimumCoins: parseInt(process.env.GAMIF_MIN_COINS, 10) || 5
        },
        dailyGoals: {
          lessons: parseInt(process.env.GAMIF_DAILY_LESSONS, 10) || 3,
          timeMinutes: parseInt(process.env.GAMIF_DAILY_TIME, 10) || 30,
          xpTarget: parseInt(process.env.GAMIF_DAILY_XP, 10) || 200
        }
      }
    };
  }

  get(path) {
    return this.getNestedValue(this.config, path);
  }

  set(path, value) {
    this.setNestedValue(this.config, path, value);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  validate() {
    const requiredPaths = [
      'database.pool.max',
      'cache.defaultTTL',
      'server.port',
      'gamification.levels'
    ];

    const errors = [];
    
    for (const path of requiredPaths) {
      const value = this.get(path);
      if (value === undefined || value === null) {
        errors.push(`Missing required configuration: ${path}`);
      }
    }

    if (this.get('database.pool.max') < this.get('database.pool.min')) {
      errors.push('Database max pool size must be greater than min pool size');
    }

    if (this.get('cache.defaultTTL') <= 0) {
      errors.push('Cache TTL must be positive');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    return true;
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      environment: this.get('server.nodeEnv'),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  export() {
    return JSON.parse(JSON.stringify(this.config));
  }

  import(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.validate();
  }
}

module.exports = new ConfigManager();