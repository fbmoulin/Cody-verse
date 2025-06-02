const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { config } = require('./config');
const schema = require('../shared/schema');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const db = drizzle(pool, { schema });

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL com sucesso');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`Hora do servidor: ${result.rows[0].current_time}`);
    
    client.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error.message);
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
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
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
  pool,
  testConnection,
  closeConnections,
  healthCheck
};