const { drizzle } = require('drizzle-orm/node-postgres');
const { config } = require('./config');
const schema = require('../shared/schema');
const DatabaseManager = require('../database/DatabaseManager');

// Initialize the stronger database manager
const dbManager = new DatabaseManager(config);

// Initialize Drizzle ORM with the database manager's pool
const db = drizzle(dbManager.pool, { schema });

async function testConnection() {
  try {
    return await dbManager.testConnection();
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

async function closeConnections() {
  try {
    await pool.end();
    console.log('Conexões com banco de dados fechadas');
  } catch (error) {
    console.error('Erro ao fechar conexões:', error.message);
  }
}

async function healthCheck(req, res) {
  try {
    const health = await dbManager.getHealthStatus();
    const status = health.status === 'healthy' ? 200 : 503;
    
    res.status(status).json({
      ...health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  db,
  dbManager,
  pool: dbManager.pool,
  testConnection,
  closeConnections,
  healthCheck
};