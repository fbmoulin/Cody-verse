const passport = require("passport");
const session = require("express-session");
const memoize = require("memoizee");
const connectPg = require("connect-pg-simple");
const { storage } = require("./storage.js");

// Dynamic imports for ES modules
let client, Strategy;

// Initialize OpenID client
async function initializeOpenIDClient() {
  if (!client) {
    const openidClient = await import("openid-client");
    client = openidClient;
    Strategy = openidClient.Strategy;
  }
  return client;
}

const getOidcConfig = memoize(
  async () => {
    await initializeOpenIDClient();
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID || 'default-repl-id'
    );
  },
  { maxAge: 3600 * 1000 }
);

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-development',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user,
  tokens
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

async function setupAuth(app) {
  try {
    await initializeOpenIDClient();
    
    app.set("trust proxy", 1);
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Check for required environment variables
    if (!process.env.REPL_ID) {
      console.warn('REPL_ID not found, using fallback auth setup');
      setupFallbackAuth(app);
      return;
    }

    const config = await getOidcConfig();

    const verify = async (tokens, verified) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    const domains = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",") : ['localhost'];
    
    for (const domain of domains) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user, cb) => cb(null, user));
    passport.deserializeUser((user, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      const hostname = req.hostname || 'localhost';
      passport.authenticate(`replitauth:${hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      const hostname = req.hostname || 'localhost';
      passport.authenticate(`replitauth:${hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });

    console.log('Replit authentication configured successfully');
  } catch (error) {
    console.error('Failed to setup Replit auth:', error);
    setupFallbackAuth(app);
  }
}

function setupFallbackAuth(app) {
  console.log('Setting up fallback authentication...');
  
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Fallback routes
  app.get("/api/login", (req, res) => {
    res.status(501).json({ 
      error: 'Authentication not configured', 
      message: 'Replit authentication is not properly configured. Please check environment variables.' 
    });
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/auth?error=not_configured");
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

const isAuthenticated = async (req, res, next) => {
  const user = req.user;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    await initializeOpenIDClient();
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

module.exports = { setupAuth, isAuthenticated, getSession };