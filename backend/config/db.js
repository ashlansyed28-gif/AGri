const { Pool } = require('pg');
const { supabase } = require('./supabase');

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]') || connectionString.startsWith('sb_')) {
    return null;
  }

  try {
    const isRemote =
      connectionString.includes('supabase') ||
      connectionString.includes('pooler') ||
      process.env.NODE_ENV === 'production';

    pool = new Pool({
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 8000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PG client error:', err.message);
    });

    return pool;
  } catch (err) {
    console.error('Error creating PG pool:', err.message);
    return null;
  }
}

// In-memory fallback for demo / testing before DB is linked
const memoryStore = {
  users: [],
  plots: [],
  advisories: [],
};

module.exports = {
  getPool,
  supabase,
  memoryStore,
  query: async (text, params) => {
    const p = getPool();
    if (!p) throw new Error('PostgreSQL database connection not configured.');
    return p.query(text, params);
  },
};
