const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Production optimizers
const ProductionOptimizer = require('./core/ProductionOptimizer');
const ScalableArchitecture = require('./core/ScalableArchitecture');

// Core services
const logger = require('./server/logger');
const ConfigManager = require('./core/ConfigManager');

console.log('Starting CodyVerse Production Server...');

class CodyVerseProductionServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.config = new ConfigManager();
    this.optimizer = new ProductionOptimizer();
    this.architecture = new ScalableArchitecture();
    this.isShuttingDown = false;
    
    // Performance tracking
    this.metrics = {
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      avgResponseTime: 0
    };
  }

  async initialize() {
    try {
      logger.info('Initializing production server', { category: 'startup' });

      // 1. Setup production optimizations
      await this.optimizer.optimizeForProduction();
      
      // 2. Initialize scalable architecture
      await this.architecture.initializeScalableComponents();
      
      // 3. Configure security middleware
      this.setupSecurityMiddleware();
      
      // 4. Configure performance middleware
      this.setupPerformanceMiddleware();
      
      // 5. Setup enhanced monitoring
      this.setupProductionMonitoring();
      
      // 6. Configure optimized routes
      this.setupOptimizedRoutes();
      
      // 7. Setup error handling
      this.setupProductionErrorHandling();
      
      // 8. Configure graceful shutdown
      this.setupGracefulShutdown();

      logger.info('Production server initialized successfully', {
        category: 'startup',
        duration: Date.now() - this.metrics.startTime
      });

    } catch (error) {
      logger.error('Failed to initialize production server', {
        category: 'startup',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  setupSecurityMiddleware() {
    // Security headers
    this.app.use(helmet({
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
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://*.replit.app', 'https://*.replit.dev']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      }
    });

    this.app.use(limiter);

    logger.info('Security middleware configured', { category: 'security' });
  }

  setupPerformanceMiddleware() {
    // Compression
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Request parsing with limits
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true,
      type: 'application/json'
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb',
      parameterLimit: 1000
    }));

    // Request metrics middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      this.metrics.requests++;

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.updateMetrics(duration, res.statusCode);
        
        // Log slow requests
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            category: 'performance',
            method: req.method,
            path: req.path,
            duration,
            statusCode: res.statusCode
          });
        }
      });

      next();
    });

    // Static file serving with caching
    this.app.use(express.static(path.join(__dirname), {
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : '1h',
      etag: true,
      lastModified: true,
      cacheControl: true,
      immutable: process.env.NODE_ENV === 'production'
    }));

    logger.info('Performance middleware configured', { category: 'performance' });
  }

  setupProductionMonitoring() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health = {
        status: this.isShuttingDown ? 'shutting-down' : 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        metrics: this.getMetricsSummary(),
        version: '1.0.0'
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Detailed metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = {
        timestamp: Date.now(),
        server: this.getMetricsSummary(),
        optimizer: this.optimizer.getOptimizationReport(),
        architecture: this.architecture.getConfiguration(),
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      res.json(metrics);
    });

    // Performance monitoring interval
    setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    logger.info('Production monitoring configured', { category: 'monitoring' });
  }

  setupOptimizedRoutes() {
    // API routes with caching
    const apiRouter = express.Router();
    
    // Cache middleware for GET requests
    apiRouter.use('/api', (req, res, next) => {
      if (req.method === 'GET') {
        const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;
        // Implement caching logic here
      }
      next();
    });

    // Import and use API routes
    try {
      const apiRoutes = require('./routes/api');
      this.app.use('/', apiRoutes);
      logger.info('API routes configured', { category: 'routing' });
    } catch (error) {
      logger.error('Failed to load API routes', {
        category: 'routing',
        error: error.message
      });
    }

    // Fallback routes
    this.app.get('*', (req, res) => {
      // Serve index.html for SPA routes
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
      } else {
        res.status(404).json({
          success: false,
          error: 'API endpoint not found',
          path: req.path,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  setupProductionErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      logger.warn('404 - Route not found', {
        category: 'routing',
        method: req.method,
        path: req.path,
        ip: req.ip
      });

      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      this.metrics.errors++;

      logger.error('Unhandled error', {
        category: 'error',
        error: error.message,
        stack: error.stack,
        method: req.method,
        path: req.path,
        ip: req.ip
      });

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV !== 'production';
      
      res.status(error.status || 500).json({
        success: false,
        error: isDev ? error.message : 'Internal server error',
        ...(isDev && { stack: error.stack }),
        timestamp: new Date().toISOString()
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        category: 'critical',
        error: error.message,
        stack: error.stack
      });
      
      // Graceful shutdown on critical errors
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        category: 'critical',
        reason: reason?.message || reason,
        promise: promise.toString()
      });
    });

    logger.info('Production error handling configured', { category: 'error_handling' });
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, starting graceful shutdown`, {
          category: 'shutdown',
          signal
        });
        this.gracefulShutdown(signal);
      });
    });
  }

  async gracefulShutdown(reason) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress', { category: 'shutdown' });
      return;
    }

    this.isShuttingDown = true;
    
    logger.info('Starting graceful shutdown', {
      category: 'shutdown',
      reason,
      uptime: process.uptime()
    });

    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit', {
        category: 'shutdown'
      });
      process.exit(1);
    }, 30000);

    try {
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed', { category: 'shutdown' });
        });
      }

      // Cleanup resources
      await this.cleanup();

      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed', { category: 'shutdown' });
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', {
        category: 'shutdown',
        error: error.message
      });
      process.exit(1);
    }
  }

  async cleanup() {
    logger.info('Starting cleanup process', { category: 'cleanup' });

    try {
      // Cleanup optimizer
      if (this.optimizer && typeof this.optimizer.cleanup === 'function') {
        await this.optimizer.cleanup();
      }

      // Cleanup architecture
      if (this.architecture && typeof this.architecture.cleanup === 'function') {
        await this.architecture.cleanup();
      }

      logger.info('Cleanup completed successfully', { category: 'cleanup' });
    } catch (error) {
      logger.error('Error during cleanup', {
        category: 'cleanup',
        error: error.message
      });
    }
  }

  updateMetrics(duration, statusCode) {
    // Update average response time
    const totalRequests = this.metrics.requests;
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (totalRequests - 1) + duration) / totalRequests
    );

    // Track errors
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
  }

  getMetricsSummary() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? 
        (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0,
      avgResponseTime: Math.round(this.metrics.avgResponseTime),
      uptime: Date.now() - this.metrics.startTime
    };
  }

  performHealthCheck() {
    const memory = process.memoryUsage();
    const memoryUsage = (memory.heapUsed / memory.heapTotal) * 100;

    if (memoryUsage > 90) {
      logger.warn('High memory usage detected', {
        category: 'health_check',
        memoryUsage: memoryUsage.toFixed(2),
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal
      });
    }

    // Log metrics every 5 minutes
    if (this.metrics.requests % 100 === 0) {
      logger.info('Health check metrics', {
        category: 'health_check',
        ...this.getMetricsSummary(),
        memoryUsage: memoryUsage.toFixed(2)
      });
    }
  }

  async start() {
    try {
      await this.initialize();

      const port = process.env.PORT || 5000;
      const host = '0.0.0.0';

      this.server = this.app.listen(port, host, () => {
        logger.info('Production server started successfully', {
          category: 'startup',
          port,
          host,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        });

        console.log(`🚀 CodyVerse Production Server running on http://${host}:${port}`);
        console.log(`📊 Health check available at http://${host}:${port}/health`);
        console.log(`📈 Metrics available at http://${host}:${port}/metrics`);
      });

      this.server.on('error', (error) => {
        logger.error('Server error', {
          category: 'server',
          error: error.message,
          code: error.code
        });
      });

      return this.server;
    } catch (error) {
      logger.error('Failed to start production server', {
        category: 'startup',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Start the production server
if (require.main === module) {
  const server = new CodyVerseProductionServer();
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = CodyVerseProductionServer;