/**
 * Configuração de conexão com banco de dados
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

let db: any;
let pool: Pool;

export async function connectDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    await pool.query('SELECT NOW()');
    
    db = drizzle(pool);
    
    console.log('Database connected successfully');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export { db, pool };