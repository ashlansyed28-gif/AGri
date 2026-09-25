const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
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
  memoryStore,
  query: async (text, params) => {
    const p = getPool();
    if (!p) throw new Error('Database connection not configured.');
    return p.query(text, params);
  },
};
