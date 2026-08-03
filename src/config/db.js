const { Pool } = require('pg');
require('dotenv').config();

// Reuses one connection pool across the whole app instead of opening
// a new database connection for every request (much faster + safer).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // needed for Supabase free tier
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

module.exports = pool;
