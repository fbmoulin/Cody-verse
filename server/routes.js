const { createServer } = require("http");
const { storage } = require("./storage.js");
const { setupAuth, isAuthenticated } = require("./replitAuth.js");

async function registerRoutes(app) {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ 
      message: "This is a protected route", 
      userId: userId,
      user: req.user.claims 
    });
  });

  // Health check for auth system
  app.get("/api/auth/status", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.claims?.sub,
        email: req.user.claims?.email,
        name: req.user.claims?.first_name
      } : null
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

module.exports = { registerRoutes };