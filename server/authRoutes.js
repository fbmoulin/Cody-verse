const express = require('express');
const AuthMiddleware = require('./authMiddleware.js');
const { storage } = require('./storage.js');

const router = express.Router();

// Generate JWT token for authenticated user
router.post('/token/jwt', AuthMiddleware.requireAuth, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = AuthMiddleware.generateJWTToken(user, req.body.expiresIn || '24h');
    
    res.json({
      success: true,
      token,
      type: 'Bearer',
      expiresIn: req.body.expiresIn || '24h',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Generate API token for authenticated user
router.post('/token/api', AuthMiddleware.requireAuth, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const { name, permissions, expiresIn } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Token name is required' });
    }

    const tokenData = await AuthMiddleware.generateAPIToken(
      userId,
      name,
      permissions || [],
      expiresIn || '1y'
    );
    
    res.json({
      success: true,
      ...tokenData,
      type: 'Token',
      message: 'Store this token securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Error generating API token:', error);
    res.status(500).json({ error: 'Failed to generate API token' });
  }
});

// List user's API tokens
router.get('/tokens', AuthMiddleware.requireAuth, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const tokens = await storage.getAPITokens(userId);
    
    // Remove sensitive data
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.tokenName,
      permissions: token.permissions,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
      isActive: token.isActive,
      createdAt: token.createdAt
    }));
    
    res.json({
      success: true,
      tokens: safeTokens
    });
  } catch (error) {
    console.error('Error listing API tokens:', error);
    res.status(500).json({ error: 'Failed to list tokens' });
  }
});

// Revoke API token
router.delete('/tokens/:tokenId', AuthMiddleware.requireAuth, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const { tokenId } = req.params;
    
    await storage.revokeAPIToken(tokenId, userId);
    
    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API token:', error);
    res.status(500).json({ error: 'Failed to revoke token' });
  }
});

// Get current user profile
router.get('/profile', AuthMiddleware.requireAnyAuth, async (req, res) => {
  try {
    let userId = null;
    
    if (req.user && req.user.claims) {
      userId = req.user.claims.sub;
    } else if (req.jwtUser) {
      userId = req.jwtUser.userId;
    } else if (req.apiUser) {
      userId = req.apiUser.id;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Unable to identify user' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive information
    const { ...safeUser } = user;
    
    res.json({
      success: true,
      user: safeUser
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user preferences
router.patch('/profile/preferences', AuthMiddleware.requireAnyAuth, async (req, res) => {
  try {
    let userId = null;
    
    if (req.user && req.user.claims) {
      userId = req.user.claims.sub;
    } else if (req.jwtUser) {
      userId = req.jwtUser.userId;
    } else if (req.apiUser) {
      userId = req.apiUser.id;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Unable to identify user' });
    }
    
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Valid preferences object is required' });
    }
    
    await storage.updateUserPreferences(userId, preferences);
    
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Admin: Update user role
router.patch('/users/:userId/role', 
  AuthMiddleware.requireAnyAuth,
  AuthMiddleware.requireRole('admin'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      const validRoles = ['student', 'teacher', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role',
          validRoles
        });
      }
      
      await storage.updateUserRole(userId, role);
      
      res.json({
        success: true,
        message: `User role updated to ${role}`
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// Get authentication permissions info
router.get('/permissions', AuthMiddleware.requireAnyAuth, (req, res) => {
  let userRole = 'student';
  
  if (req.user && req.user.claims) {
    userRole = req.user.role || 'student';
  } else if (req.jwtUser) {
    userRole = req.jwtUser.role;
  } else if (req.apiUser) {
    userRole = req.apiUser.role;
  }
  
  const permissions = AuthMiddleware.getRolePermissions(userRole);
  
  res.json({
    success: true,
    role: userRole,
    permissions
  });
});

// Test protected route with different auth methods
router.get('/test/session', AuthMiddleware.requireAuth, (req, res) => {
  res.json({ success: true, method: 'session', user: req.user.claims });
});

router.get('/test/jwt', AuthMiddleware.requireJWT, (req, res) => {
  res.json({ success: true, method: 'jwt', user: req.jwtUser });
});

router.get('/test/api-token', AuthMiddleware.requireAPIToken, (req, res) => {
  res.json({ success: true, method: 'api-token', user: req.apiUser });
});

router.get('/test/any', AuthMiddleware.requireAnyAuth, (req, res) => {
  res.json({ 
    success: true, 
    method: 'any',
    authMethod: req.jwtUser ? 'jwt' : req.apiUser ? 'api-token' : 'session'
  });
});

module.exports = router;