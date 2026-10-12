const { Pool } = require('pg');
require('dotenv').config();

let pool;
const schema = process.env.DB_SCHEMA || 'public';
if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('DB_SCHEMA 格式不正確');
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: require('./connection')(),
    options: '-c search_path=' + schema,
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
