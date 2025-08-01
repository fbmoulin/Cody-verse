const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

// Replit Auth components
const { setupAuth, isAuthenticated } = require('./server/replitAuth.js');
const { storage } = require('./server/storage.js');
const AuthMiddleware = require('./server/authMiddleware.js');
const authRoutes = require('./server/authRoutes.js');

// Validation and Security Middleware
const ValidationMiddleware = require('./middleware/validationMiddleware.js');
const SanitizationMiddleware = require('./middleware/sanitizationMiddleware.js');
const SecurityMiddleware = require('./middleware/securityMiddleware.js');

// Production optimizers
const ProductionOptimizer = require('./core/ProductionOptimizer');
const LoadBalancer = require('./core/LoadBalancer');
const DatabaseOptimizer = require('./core/DatabaseOptimizer');

console.log('Starting Optimized Cody Verse Backend...');

class CodyVerseServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.optimizer = new ProductionOptimizer();
    this.loadBalancer = new LoadBalancer();
    this.dbOptimizer = new DatabaseOptimizer();
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  setupBasicMiddleware() {
    // Production security
    if (this.isProduction) {
      this.app.use(helmet({
        contentSecurityPolicy: false, // Allow more flexibility for educational content
        crossOriginEmbedderPolicy: false
      }));
    }

    // Compression for better performance
    this.app.use(compression({
      level: 6,
      threshold: 1024
    }));

    // Enhanced JSON parsing with error handling
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
    
    // Enhanced CORS with production settings
    this.app.use((req, res, next) => {
      const origin = this.isProduction ? 
        ['https://*.replit.app', 'https://*.replit.dev'] : '*';
      
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Request metrics middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        if (duration > 1000) {
          console.log(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }
      });
      next();
    });

    console.log('Enhanced middleware configured');
  }

  async setupRoutes() {
    try {
      // Setup Replit authentication first
      await setupAuth(this.app);
      
      // Auth routes
      this.app.get('/api/auth/user', isAuthenticated, async (req, res) => {
        try {
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          res.json(user);
        } catch (error) {
          console.error("Error fetching user:", error);
          res.status(500).json({ message: "Failed to fetch user" });
        }
      });

      this.app.get('/api/auth/status', (req, res) => {
        res.json({
          authenticated: req.isAuthenticated(),
          user: req.user ? {
            id: req.user.claims?.sub,
            email: req.user.claims?.email,
            firstName: req.user.claims?.first_name,
            lastName: req.user.claims?.last_name,
            profileImageUrl: req.user.claims?.profile_image_url
          } : null
        });
      });

      this.app.get("/api/protected", isAuthenticated, async (req, res) => {
        const userId = req.user?.claims?.sub;
        res.json({ 
          message: "This is a protected route", 
          userId: userId,
          user: req.user.claims 
        });
      });

      // Enhanced authentication routes with validation
      this.app.use('/api/auth', 
        SanitizationMiddleware.sanitizeResponseMiddleware(['password', 'tokenHash']),
        authRoutes
      );

      // Validated routes with comprehensive security
      const validatedRoutes = require('./routes/validatedRoutes.js');
      this.app.use('/api/v1', validatedRoutes);
      
    } catch (error) {
      console.error('Failed to setup auth routes:', error);
      // Continue with fallback auth setup
      this.setupFallbackAuthRoutes();
    }
    // Optimized static file serving
    this.app.use(express.static(path.join(__dirname), {
      maxAge: this.isProduction ? '7d' : '1h',
      etag: true,
      lastModified: true,
      cacheControl: true,
      immutable: this.isProduction,
      setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
      }
    }));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Cody Verse Backend',
        version: '1.0.0'
      });
    });

    // System status
    this.app.get('/status', (req, res) => {
      res.json({
        service: 'Cody Verse Backend',
        version: '1.0.0',
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Load API routes safely
    try {
      const apiRoutes = require('./routes/api');
      this.app.use('/api', apiRoutes);
      console.log('API routes loaded successfully');
    } catch (error) {
      console.warn('Failed to load API routes:', error.message);
      // Fallback API routes
      this.setupFallbackRoutes();
    }

    // Add fallback auth routes
    this.setupFallbackAuthRoutes();

    // Auth page route
    this.app.get('/auth', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, 'client', 'auth.html'));
      } catch (error) {
        console.error('Error serving auth page:', error);
        res.status(404).send('Auth page not found');
      }
    });

    // Admin auth dashboard
    this.app.get('/admin/auth', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, 'client', 'admin-auth.html'));
      } catch (error) {
        console.error('Error serving admin auth page:', error);
        res.status(404).send('Admin auth page not found');
      }
    });

    // Main app routes
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-responsive-app.html'));
    });

    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'codyverse-responsive-app.html'));
    });

    console.log('Routes configured with authentication support');

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('Server error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });

    console.log('Routes configured');
  }

  setupFallbackRoutes() {
    // Essential API endpoints as fallback
    this.app.get('/api/courses', (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: 1,
            title: 'Fundamentos de IA',
            description: 'Aprenda os conceitos básicos de Inteligência Artificial',
            modules: 7,
            duration: '4 horas',
            difficulty: 'Iniciante'
          }
        ]
      });
    });

    this.app.get('/api/gamification/dashboard/:userId', (req, res) => {
      const userId = parseInt(req.params.userId) || 1;
      res.json({
        success: true,
        data: {
          user: { id: userId, name: 'Usuário', level: 1, xp: 0 },
          stats: { totalXP: 0, level: 1, completedLessons: 0, streak: 0 },
          badges: [],
          wallet: { coins: 0, gems: 0 },
          streaks: { current: 0, longest: 0 },
          goals: [],
          notifications: []
        }
      });
    });

    this.app.post('/api/gamification/lesson-completion/:userId', (req, res) => {
      res.json({
        success: true,
        data: {
          xpGained: 50,
          coinsEarned: 10,
          levelUp: false,
          newBadges: []
        }
      });
    });

    console.log('Fallback routes configured');
  }

  setupFallbackAuthRoutes() {
    console.log('Setting up fallback auth routes...');
    
    this.app.get('/api/auth/status', (req, res) => {
      res.json({
        authenticated: false,
        user: null,
        error: 'Authentication not configured'
      });
    });

    this.app.get('/api/auth/user', (req, res) => {
      res.status(401).json({ 
        message: "Authentication not configured" 
      });
    });

    this.app.get("/api/protected", (req, res) => {
      res.status(401).json({ 
        message: "Authentication not configured" 
      });
    });

    this.app.get("/api/login", (req, res) => {
      res.status(501).json({ 
        error: 'Authentication not configured', 
        message: 'Replit authentication is not properly configured. Please check environment variables.' 
      });
    });

    this.app.get("/api/callback", (req, res) => {
      res.redirect("/auth?error=not_configured");
    });

    this.app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });

    // Enhanced auth routes fallback
    this.app.use('/api/auth', authRoutes);

    // Fallback validated routes
    const validatedRoutes = require('./routes/validatedRoutes.js');
    this.app.use('/api/v1', validatedRoutes);

    console.log('Fallback auth routes configured');
  }

  async initialize() {
    try {
      this.setupBasicMiddleware();
      this.setupRoutes();
      console.log('Server initialization completed');
    } catch (error) {
      console.error('Initialization error:', error);
      // Continue with minimal setup
      this.setupBasicMiddleware();
      this.setupFallbackRoutes();
    }
  }

  async start() {
    await this.initialize();
    
    const port = process.env.PORT || 5000;
    const host = '0.0.0.0';
    
    this.server = this.app.listen(port, host, () => {
      console.log(`
🚀 Cody Verse Backend running!
📍 Address: http://${host}:${port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 API: http://${host}:${port}/api
💚 Health: http://${host}:${port}/health
      `);
    });

    this.server.on('error', (error) => {
      console.error('Server startup error:', error);
    });

    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      
      if (this.server) {
        this.server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
    });
  }
}

// Start the server
const server = new CodyVerseServer();
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});