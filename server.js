const express = require('express');
const path = require('path');
const { config, validateConfig } = require('./server/config');
const { dbManager, testConnection, closeConnections } = require('./server/database');
const dataInitializer = require('./services/dataInitializer');
const performanceMiddleware = require('./server/performanceMiddleware');

// Enhanced services for robustness
const connectionPool = require('./server/connectionPool');
const errorHandler = require('./services/errorHandlerService');
const systemHealth = require('./services/systemHealthMonitor');
const cacheService = require('./services/cacheService');
const RequestMiddleware = require('./server/requestMiddleware');

// Core refactored components
const configManager = require('./core/ConfigManager');
const DataAccessLayer = require('./core/DataAccessLayer');
const apiDocGenerator = require('./core/APIDocGenerator');
const AdvancedPerformanceOptimizer = require('./core/AdvancedPerformanceOptimizer');
const EnhancedMemoryOptimizer = require('./core/EnhancedMemoryOptimizer');
const QueryOptimizer = require('./core/QueryOptimizer');
const MemoryDebugger = require('./core/MemoryDebugger');
const TargetedMemoryOptimizer = require('./core/TargetedMemoryOptimizer');
const CacheOptimizer = require('./core/CacheOptimizer');
const OptimizedCacheSystem = require('./core/OptimizedCacheSystem');
const MemoryLeakDetector = require('./core/MemoryLeakDetector');
const VisualOptimizer = require('./core/VisualOptimizer');
// const ComprehensiveDatabaseOptimizer = require('./services/comprehensiveDatabaseOptimizer');

// Middleware
const {
  setupSecurity,
  setupPerformance,
  setupLogging,
  setupParsing,
  setupErrorHandling,
  requestLogger
} = require('./server/middleware');

// Routes
const apiRoutes = require('./routes/api');

class CodyVerseServer {
  constructor() {
    this.app = express();
    this.server = null;
    // Defer optimizer initialization until after server starts
    this.optimizersInitialized = false;
  }

  async initializeOptimizers() {
    if (!this.optimizersInitialized) {
      try {
        this.performanceOptimizer = new AdvancedPerformanceOptimizer();
        this.memoryOptimizer = new EnhancedMemoryOptimizer();
        this.queryOptimizer = new QueryOptimizer();
        this.memoryDebugger = new MemoryDebugger();
        this.targetedOptimizer = new TargetedMemoryOptimizer();
        this.cacheOptimizer = new CacheOptimizer();
        this.visualOptimizer = new VisualOptimizer();
        this.optimizersInitialized = true;
        console.log('Performance optimizers initialized');
      } catch (error) {
        console.warn('Optimizer initialization failed, continuing without optimizers:', error.message);
        // Create fallback optimizers to prevent crashes
        this.performanceOptimizer = { createOptimizedMiddleware: () => (req, res, next) => next() };
        this.memoryOptimizer = { getMemoryReport: () => ({ status: 'disabled' }), optimizeMemory: () => ({ status: 'disabled' }) };
        this.queryOptimizer = { getQueryReport: () => ({ status: 'disabled' }) };
        this.memoryDebugger = { analyzeMemoryLeaks: () => ({ status: 'disabled' }), aggressiveMemoryCleanup: () => ({ status: 'disabled' }), getMemoryReport: () => ({ status: 'disabled' }) };
        this.targetedOptimizer = { targetedCleanup: () => ({ status: 'disabled' }) };
        this.cacheOptimizer = {};
        this.visualOptimizer = {};
        this.optimizersInitialized = true;
      }
    }
  }

  async initialize() {
    try {
      console.log('Inicializando Cody Verse Backend...');
      
      // Initialize optimizers first with error handling
      await this.initializeOptimizers();
      
      // Basic middleware first to ensure server can respond
      this.setupBasicMiddleware();
      
      // Validate enhanced configuration
      try {
        configManager.validate();
        console.log('Enhanced configuration validated');
      } catch (error) {
        console.warn('Configuration validation failed, using defaults:', error.message);
      }
      
      // Initialize enhanced connection pool
      try {
        await connectionPool.initialize();
        console.log('Enhanced database connection pool initialized');
        
        await dbManager.initialize();
        console.log('Database initialized with migrations');
        
        const dbConnected = await testConnection();
        if (!dbConnected) {
          console.warn('Database unavailable - server will continue without persistence');
        }
      } catch (error) {
        console.warn('Database connection error:', error.message);
        console.log('Server will continue with in-memory data');
      }

      // Initialize API documentation
      try {
        apiDocGenerator.autoRegisterRoutes();
        console.log('API documentation initialized');
      } catch (error) {
        console.warn('API documentation initialization failed:', error.message);
      }

      // Start system health monitoring
      try {
        systemHealth.startMonitoring();
        console.log('System health monitoring started');
      } catch (error) {
        console.warn('Health monitoring initialization failed:', error.message);
      }
      
      // Setup enhanced middleware
      try {
        this.setupMiddleware();
        console.log('Enhanced middleware configured');
      } catch (error) {
        console.warn('Enhanced middleware failed, using basic middleware:', error.message);
      }
      
      // Setup routes
      try {
        this.setupRoutes();
        console.log('Routes configured');
      } catch (error) {
        console.warn('Route setup failed, using basic routes:', error.message);
        this.setupBasicRoutes();
      }
      
      console.log('Servidor inicializado com sucesso');
    } catch (error) {
      console.error('Erro na inicialização:', error);
      // Don't exit, try to continue with basic functionality
      console.log('Continuing with basic server functionality...');
      this.setupBasicMiddleware();
      this.setupBasicRoutes();
    }
  }

  setupBasicMiddleware() {
    const express = require('express');
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    console.log('Basic middleware configured');
  }

  setupBasicRoutes() {
    // Basic health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Basic API routes
    this.app.use('/api', require('./routes/api'));
    
    console.log('Basic routes configured');
  }

  setupMiddleware() {
    // Advanced performance middleware with memory optimization
    this.app.use(this.performanceOptimizer.createOptimizedMiddleware());
    
    // Add memory monitoring endpoint
    this.app.get('/api/performance/memory', async (req, res) => {
      const memoryReport = this.memoryOptimizer.getMemoryReport();
      res.json({ success: true, data: memoryReport });
    });
    
    // Add performance optimization endpoint
    this.app.post('/api/performance/optimize', async (req, res) => {
      try {
        const force = req.body && req.body.force || false;
        const result = await this.memoryOptimizer.optimizeMemory(force);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Add query optimization report endpoint
    this.app.get('/api/performance/queries', (req, res) => {
      const queryReport = this.queryOptimizer.getQueryReport();
      res.json({ success: true, data: queryReport });
    });
    
    // Add memory debugging endpoints
    this.app.get('/api/debug/memory/analysis', (req, res) => {
      const analysis = this.memoryDebugger.analyzeMemoryLeaks();
      res.json({ success: true, data: analysis });
    });
    
    this.app.post('/api/debug/memory/aggressive-cleanup', async (req, res) => {
      try {
        const result = await this.memoryDebugger.aggressiveMemoryCleanup();
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    this.app.get('/api/debug/memory/report', (req, res) => {
      const report = this.memoryDebugger.getMemoryReport();
      res.json({ success: true, data: report });
    });
    
    // Add targeted memory optimization endpoint
    this.app.post('/api/debug/memory/targeted-cleanup', async (req, res) => {
      try {
        const result = await this.targetedOptimizer.targetedCleanup();
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Add emergency memory cleanup endpoint
    this.app.post('/api/debug/memory/emergency-cleanup', async (req, res) => {
      try {
        // Clear module cache aggressively
        const modulesBefore = Object.keys(require.cache).length;
        const cleared = [];
        
        for (const moduleId of Object.keys(require.cache)) {
          if (!moduleId.includes('node_modules') && 
              !moduleId.includes('/core/') &&
              !moduleId.includes('server.js') &&
              !moduleId.includes('/routes/')) {
            try {
              delete require.cache[moduleId];
              cleared.push(moduleId);
            } catch (e) {
              // Module in use
            }
          }
        }
        
        const modulesAfter = Object.keys(require.cache).length;
        
        // Force garbage collection
        if (global.gc) {
          for (let i = 0; i < 5; i++) {
            global.gc();
          }
        }
        
        res.json({ 
          success: true, 
          data: {
            modulesBefore,
            modulesAfter,
            modulesCleared: cleared.length,
            clearedModules: cleared.slice(0, 10) // Show first 10
          }
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Emergency cache optimization endpoints (critical memory leak fix)
    this.app.post('/api/debug/cache/emergency-flush', async (req, res) => {
      try {
        const flushed = this.cacheOptimizer.emergencyFlush();
        const stats = this.cacheOptimizer.getCacheStats();
        res.json({ success: true, data: { flushed, stats } });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    this.app.get('/api/debug/cache/stats', (req, res) => {
      try {
        const stats = this.cacheOptimizer.getCacheStats();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Advanced memory management endpoints
    this.app.get('/api/memory/optimized-cache/stats', (req, res) => {
      try {
        const stats = this.optimizedCacheSystem.getStats();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/memory/optimize', (req, res) => {
      try {
        this.optimizedCacheSystem.performMemoryOptimization();
        const stats = this.optimizedCacheSystem.getStats();
        res.json({ 
          success: true, 
          message: 'Memory optimization completed',
          data: stats 
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/memory/leak-detection', (req, res) => {
      try {
        const report = this.memoryLeakDetector.getReport();
        res.json({ success: true, data: report });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/memory/emergency-cleanup', (req, res) => {
      try {
        this.optimizedCacheSystem.emergencyCleanup();
        this.cacheOptimizer.emergencyFlush();
        
        if (global.gc) {
          global.gc();
        }
        
        const memUsage = process.memoryUsage();
        res.json({ 
          success: true, 
          message: 'Emergency cleanup completed',
          data: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            usagePercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Middleware de logging personalizado
    this.app.use(requestLogger);
    
    // Configurações de segurança
    setupSecurity(this.app);
    
    // Configurações de performance
    setupPerformance(this.app);
    
    // Sistema de logging
    setupLogging(this.app);
    
    // Parsing de requisições
    setupParsing(this.app);
    
    // Enhanced request tracking and monitoring
    this.app.use(RequestMiddleware.createRequestTracker());
    this.app.use(RequestMiddleware.createRateLimiter(60000, 200)); // 200 requests per minute
    
    // Performance optimization middleware
    this.app.use(this.performanceOptimizer.createOptimizedMiddleware());
  }

  setupRoutes() {
    // Servir arquivos estáticos
    this.app.use(express.static(path.join(__dirname), {
      maxAge: config.server.nodeEnv === 'production' ? '1d' : '0',
      etag: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    // Responsive Design System Routes
    this.app.get('/design-system', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-design-system.html'));
    });

    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-responsive-app.html'));
    });

    this.app.get('/react', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-react-app.html'));
    });

    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-responsive-app.html'));
    });

    // Cache middleware for API routes
    this.app.use('/api', RequestMiddleware.createCacheMiddleware(180000)); // 3 minutes cache
    
    // Rotas da API with circuit breaker
    this.app.use('/api', RequestMiddleware.createCircuitBreaker('api', { threshold: 10 }));
    this.app.use('/api', apiRoutes);

    // Enhanced health check
    this.app.get('/health', (req, res) => {
      systemHealth.recordRequest();
      const healthStatus = systemHealth.getHealthStatus();
      res.status(healthStatus.overall === 'healthy' ? 200 : 503).json(healthStatus);
    });

    // Detailed system metrics
    this.app.get('/metrics', (req, res) => {
      const metrics = systemHealth.getDetailedMetrics();
      res.json(metrics);
    });

    // Cache statistics
    this.app.get('/cache-stats', (req, res) => {
      const stats = cacheService.getStats();
      res.json(stats);
    });

    // API Documentation endpoints
    this.app.get('/api-spec.json', (req, res) => {
      const spec = apiDocGenerator.generateOpenAPISpec();
      res.json(spec);
    });

    this.app.get('/docs', (req, res) => {
      const html = apiDocGenerator.generateHTMLDoc();
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    });

    // Enhanced configuration endpoint
    this.app.get('/config', (req, res) => {
      res.json({
        environment: configManager.getEnvironmentInfo(),
        features: {
          caching: true,
          circuitBreakers: true,
          rateLimiting: true,
          monitoring: true,
          documentation: true
        }
      });
    });

    // Status do servidor
    this.app.get('/status', (req, res) => {
      res.json({
        service: 'Cody Verse Backend',
        version: '1.0.0',
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        health: systemHealth.getHealthStatus().overall
      });
    });

    // Fallback para SPA (rotas específicas)
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Enhanced error handling middleware (deve ser o último)
    this.app.use(RequestMiddleware.createErrorHandler());
    setupErrorHandling(this.app);
  }

  async start() {
    await this.initialize();
    
    const port = process.env.PORT || 5000;
    const host = '0.0.0.0'; // Required for Replit
    
    this.server = this.app.listen(port, host, () => {
      console.log(`
🚀 Cody Verse Backend rodando!
📍 Endereço: http://${host}:${port}
🌍 Ambiente: ${process.env.NODE_ENV || 'development'}
📊 API: http://${host}:${port}/api
💚 Health: http://${host}:${port}/health
      `);
    });

    // Handle server startup errors
    this.server.on('error', (error) => {
      console.error('Server startup error:', error);
    });

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    let isShuttingDown = false;
    
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) {
        console.log('Shutdown já em andamento...');
        return;
      }
      
      isShuttingDown = true;
      console.log(`\nRecebido ${signal}. Finalizando servidor graciosamente...`);
      
      if (this.server) {
        this.server.close(async () => {
          console.log('Servidor HTTP fechado');
          
          try {
            // Graceful shutdown in proper order
            console.log('Initiating graceful shutdown...');
            await systemHealth.gracefulShutdown();
            
            // Only close database connections once
            try {
              await closeConnections();
            } catch (error) {
              if (!error.message.includes('Called end on pool more than once')) {
                console.error('Error closing database connections:', error.message);
              }
            }
            
            try {
              await connectionPool.close();
            } catch (error) {
              if (!error.message.includes('Called end on pool more than once')) {
                console.error('Error closing connection pool:', error.message);
              }
            }
            
            console.log('Graceful shutdown completed');
          } catch (error) {
            console.error('Error during graceful shutdown:', error.message);
          }
          
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('Erro não capturado:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Promise rejeitada não tratada:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }
}

// Inicializar e iniciar servidor
const server = new CodyVerseServer();
server.start().catch(console.error);