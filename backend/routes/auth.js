const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'agri_super_secret_jwt_key_2026';

router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Please provide email, password, and full name.' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    // 1. Try Supabase Service Role client if configured
    if (db.supabase) {
      try {
        const { data: existing } = await db.supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existing) {
          return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const { data: user, error } = await db.supabase
          .from('users')
          .insert({ email, full_name, password_hash: hashed })
          .select('id, email, full_name, created_at')
          .single();

        if (!error && user) {
          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
          return res.status(201).json({ token, user });
        }
      } catch (sbErr) {
        console.warn('Supabase service client query failed:', sbErr.message);
      }
    }

    // 2. Try raw PostgreSQL pool if configured
    const pool = db.getPool();
    if (pool) {
      try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const result = await pool.query(
          'INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
          [email, full_name, hashed]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, user });
      } catch (dbErr) {
        console.warn('Database query failed, falling back to memory store:', dbErr.message);
      }
    }

    // 3. Fallback to memory store
    const existing = db.memoryStore.users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const newUser = {
      id: 'demo-' + Date.now(),
      email,
      full_name,
      password_hash: hashed,
      created_at: new Date().toISOString(),
      is_demo: true,
    };
    db.memoryStore.users.push(newUser);

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name, is_demo: true },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    // 1. Try Supabase Service Role client
    if (db.supabase) {
      try {
        const { data: user } = await db.supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (user) {
          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return res.status(400).json({ error: 'Invalid password.' });

          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
        }
      } catch (sbErr) {
        console.warn('Supabase login check failed:', sbErr.message);
      }
    }

    // 2. Try raw PostgreSQL pool
    const pool = db.getPool();
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return res.status(400).json({ error: 'Invalid password.' });

          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
        }
      } catch (dbErr) {
        console.warn('Database login failed, checking memory store:', dbErr.message);
      }
    }

    // 3. Fallback memory store
    const user = db.memoryStore.users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid password.' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, is_demo: true },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

module.exports = router;
