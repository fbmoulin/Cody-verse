require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  security: {
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMax: 100,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    sessionSecret: process.env.SESSION_SECRET || 'cody-verse-secret-key'
  },

  cody: {
    enabled: true,
    responseDelay: 1500,
    maxInteractionsPerSession: 50
  },

  logging: {
    level: process.env.LOG_LEVEL || 'combined',
    enableFileLogging: process.env.NODE_ENV === 'production'
  }
};

function validateConfig() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Configurações obrigatórias ausentes: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  console.log('Configurações validadas com sucesso');
}

module.exports = { config, validateConfig };