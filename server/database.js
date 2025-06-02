const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { config } = require('./config');
const schema = require('../shared/schema');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000,
  acquireTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 1000,
  statement_timeout: 30000,
  query_timeout: 30000
});

const db = drizzle(pool, { schema });

async function testConnection() {
  let client;
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log(`Testando conexão com PostgreSQL... (tentativa ${4 - retries})`);
      client = await pool.connect();
      console.log('Conectado ao PostgreSQL com sucesso');
      
      const result = await client.query('SELECT NOW() as current_time');
      console.log(`Conexão ativa: ${result.rows[0].current_time}`);
      
      return true;
    } catch (error) {
      console.warn(`Tentativa ${4 - retries} falhou:`, error.message);
      retries--;
      
      if (retries > 0) {
        console.log('Aguardando 2 segundos antes de tentar novamente...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('Todas as tentativas de conexão falharam');
        return false;
      }
    } finally {
      if (client) {
        client.release();
        client = null;
      }
    }
  }
  
  return false;
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