const { Pool } = require('pg');
require('dotenv').config();

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => console.error('Unexpected pool error:', err));
} else {
  console.warn('DATABASE_URL not set, database disabled');
}

module.exports = pool;