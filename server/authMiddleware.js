const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { storage } = require('./storage.js');

// JWT Secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret-key';

class AuthMiddleware {
  // Generate JWT token for API access
  static generateJWTToken(user, expiresIn = '24h') {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'student',
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  // Verify JWT token
  static verifyJWTToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Generate API token
  static async generateAPIToken(userId, tokenName, permissions = [], expiresIn = '1y') {
    const tokenId = crypto.randomUUID();
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    
    const expiresAt = new Date();
    if (expiresIn === '1y') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else if (expiresIn === '30d') {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (expiresIn === '7d') {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await storage.createAPIToken({
      id: tokenId,
      userId,
      tokenName,
      tokenHash,
      permissions,
      expiresAt
    });

    // Return the raw token only once
    return {
      tokenId,
      token: `cody_${rawToken}`,
      expiresAt
    };
  }

  // Verify API token
  static async verifyAPIToken(token) {
    try {
      if (!token.startsWith('cody_')) {
        return null;
      }

      const rawToken = token.substring(5);
      const apiTokens = await storage.getAPITokens();
      
      for (const apiToken of apiTokens) {
        if (!apiToken.isActive || (apiToken.expiresAt && new Date() > apiToken.expiresAt)) {
          continue;
        }

        const isValid = await bcrypt.compare(rawToken, apiToken.tokenHash);
        if (isValid) {
          // Update last used timestamp
          await storage.updateAPITokenLastUsed(apiToken.id);
          return apiToken;
        }
      }

      return null;
    } catch (error) {
      console.error('Error verifying API token:', error);
      return null;
    }
  }

  // Check user permissions
  static hasPermission(user, requiredPermission) {
    if (!user || !user.role) return false;
    
    const rolePermissions = this.getRolePermissions(user.role);
    return rolePermissions.includes(requiredPermission) || rolePermissions.includes('*');
  }

  // Get permissions for a role
  static getRolePermissions(role) {
    const permissions = {
      admin: ['*'], // All permissions
      teacher: [
        'courses.read',
        'courses.create',
        'courses.update',
        'lessons.read',
        'lessons.create',
        'lessons.update',
        'users.read',
        'progress.read',
        'analytics.read'
      ],
      student: [
        'courses.read',
        'lessons.read',
        'progress.read',
        'progress.update',
        'profile.read',
        'profile.update'
      ]
    };

    return permissions[role] || [];
  }

  // Middleware for session-based authentication
  static requireAuth(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    next();
  }

  // Middleware for JWT token authentication
  static requireJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'JWT token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7);
    const decoded = AuthMiddleware.verifyJWTToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid JWT token',
        message: 'The provided token is invalid or expired'
      });
    }

    req.jwtUser = decoded;
    next();
  }

  // Middleware for API token authentication
  static async requireAPIToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Token ')) {
      return res.status(401).json({
        error: 'API token required',
        message: 'Please provide a valid API token'
      });
    }

    const token = authHeader.substring(6);
    const apiToken = await AuthMiddleware.verifyAPIToken(token);
    
    if (!apiToken) {
      return res.status(401).json({
        error: 'Invalid API token',
        message: 'The provided API token is invalid or expired'
      });
    }

    req.apiToken = apiToken;
    req.apiUser = await storage.getUser(apiToken.userId);
    next();
  }

  // Middleware for permission checking
  static requirePermission(permission) {
    return (req, res, next) => {
      let user = null;
      
      // Check session user
      if (req.user && req.user.claims) {
        user = { 
          id: req.user.claims.sub,
          role: req.user.role || 'student'
        };
      }
      
      // Check JWT user
      if (req.jwtUser) {
        user = req.jwtUser;
      }
      
      // Check API user
      if (req.apiUser) {
        user = req.apiUser;
      }

      if (!user || !AuthMiddleware.hasPermission(user, permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Permission '${permission}' is required for this action`
        });
      }

      next();
    };
  }

  // Middleware for role checking
  static requireRole(requiredRole) {
    return (req, res, next) => {
      let userRole = null;
      
      if (req.user && req.user.claims) {
        userRole = req.user.role || 'student';
      }
      
      if (req.jwtUser) {
        userRole = req.jwtUser.role;
      }
      
      if (req.apiUser) {
        userRole = req.apiUser.role;
      }

      if (!userRole || userRole !== requiredRole) {
        return res.status(403).json({
          error: 'Insufficient role',
          message: `Role '${requiredRole}' is required for this action`
        });
      }

      next();
    };
  }

  // Combined authentication middleware (accepts session, JWT, or API token)
  static requireAnyAuth(req, res, next) {
    // Check session authentication
    if (req.isAuthenticated()) {
      return next();
    }

    // Check JWT authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AuthMiddleware.verifyJWTToken(token);
      if (decoded) {
        req.jwtUser = decoded;
        return next();
      }
    }

    // Check API token authentication
    if (authHeader && authHeader.startsWith('Token ')) {
      const token = authHeader.substring(6);
      AuthMiddleware.verifyAPIToken(token).then(apiToken => {
        if (apiToken) {
          req.apiToken = apiToken;
          storage.getUser(apiToken.userId).then(user => {
            req.apiUser = user;
            next();
          });
          return;
        }
        
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please provide valid authentication credentials'
        });
      });
      return;
    }

    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide valid authentication credentials'
    });
  }
}

module.exports = AuthMiddleware;