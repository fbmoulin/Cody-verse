const express = require('express');
const path = require('path');
const { config, validateConfig } = require('./server/config');
const { testConnection, closeConnections } = require('./server/database');
const dataInitializer = require('./services/dataInitializer');

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
  }

  async initialize() {
    try {
      console.log('Inicializando Cody Verse Backend...');
      
      // Validar configurações
      validateConfig();
      
      // Testar conexão com banco (opcional em desenvolvimento)
      if (config.database.url) {
        const dbConnected = await testConnection();
        if (!dbConnected) {
          console.warn('⚠️ Banco de dados não disponível - continuando sem persistência');
        }
      } else {
        console.warn('⚠️ DATABASE_URL não configurada - rodando sem banco de dados');
      }
      
      // Configurar middleware
      this.setupMiddleware();
      
      // Configurar rotas
      this.setupRoutes();
      
      // Inicializar dados base (se banco disponível)
      if (config.server.nodeEnv === 'development' && config.database.url) {
        try {
          await dataInitializer.initializeDatabase();
        } catch (error) {
          console.warn('Aviso: Não foi possível inicializar dados do banco:', error.message);
        }
      }
      
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

    // Rotas da API
    this.app.use('/api', apiRoutes);

    // Health check
    this.app.get('/health', require('./server/database').healthCheck);

    // Status do servidor
    this.app.get('/status', (req, res) => {
      res.json({
        service: 'Cody Verse Backend',
        version: '1.0.0',
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv
      });
    });

    // Fallback para SPA
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Middleware de tratamento de erros (deve ser o último)
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
          
          // Fechar conexões com banco
          await closeConnections();
          
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