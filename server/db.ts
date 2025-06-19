const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require("../shared/schema.js");

if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL not found, using fallback database configuration');
  // Create a simple fallback that won't crash
  module.exports = { 
    pool: null, 
    db: {
      select: () => ({ from: () => ({ where: () => [] }) }),
      insert: () => ({ values: () => ({ onConflictDoUpdate: () => ({ returning: () => [] }) }) })
    }
  };
} else {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const db = drizzle(pool, { schema });
  module.exports = { pool, db };
}
