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
const dataAccessLayer = require('./core/DataAccessLayer');
const apiDocGenerator = require('./core/APIDocGenerator');
const PerformanceOptimizer = require('./core/PerformanceOptimizer');

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
    this.performanceOptimizer = new PerformanceOptimizer();
  }

  async initialize() {
    try {
      console.log('Inicializando Cody Verse Backend...');
      
      // Validate enhanced configuration
      configManager.validate();
      console.log('Enhanced configuration validated');
      
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
      apiDocGenerator.autoRegisterRoutes();
      console.log('API documentation initialized');

      // Start system health monitoring
      systemHealth.startMonitoring();
      
      // Configurar middleware
      this.setupMiddleware();
      
      // Configurar rotas
      this.setupRoutes();
      
      // Dados já foram inicializados via SQL
      console.log('Dados base carregados do banco PostgreSQL');
      
      console.log('Servidor inicializado com sucesso');
    } catch (error) {
      console.error('Erro na inicialização:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
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

    // Refined Frontend Routes
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-refined.html'));
    });

    this.app.get('/design-system', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-design-system.html'));
    });

    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-responsive-app.html'));
    });

    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-responsive-app.html'));
    });

    // High-performance API routes with working endpoints
    const simpleApiRoutes = require('./server/simpleApiRoutes');
    this.app.use('/api', simpleApiRoutes);
    
    // Fallback to original API routes if needed
    this.app.use('/api', RequestMiddleware.createCacheMiddleware(180000)); // 3 minutes cache
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

    // Remove duplicate homepage route - handled above

    // Enhanced error handling middleware (deve ser o último)
    this.app.use(RequestMiddleware.createErrorHandler());
    setupErrorHandling(this.app);
  }

  async start() {
    await this.initialize();
    
    this.server = this.app.listen(config.server.port, config.server.host, () => {
      console.log(`
🚀 Cody Verse Backend rodando!
📍 Endereço: http://${config.server.host}:${config.server.port}
🌍 Ambiente: ${config.server.nodeEnv}
📊 API: http://${config.server.host}:${config.server.port}/api
💚 Health: http://${config.server.host}:${config.server.port}/health
      `);
    });

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\nRecebido ${signal}. Finalizando servidor graciosamente...`);
      
      if (this.server) {
        this.server.close(async () => {
          console.log('Servidor HTTP fechado');
          
          // Enhanced graceful shutdown
          await systemHealth.gracefulShutdown();
          await closeConnections();
          await connectionPool.close();
          
          console.log('Shutdown completo');
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