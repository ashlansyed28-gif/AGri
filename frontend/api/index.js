// Vercel Serverless Function entrypoint when root directory is set to frontend
try {
  module.exports = require('../../backend/server');
} catch (e) {
  // If backend folder is not included in frontend deployment scope, provide standalone handler
  const express = require('express');
  const cors = require('cors');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');

  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const memory = {
    users: [],
    plots: [],
    advisories: []
  };

  const JWT_SECRET = process.env.JWT_SECRET || 'agri_super_secret_jwt_key_2026';

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: 'Missing required fields' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: 'u-' + Date.now(), email, full_name, password_hash: hashed };
    memory.users.push(user);
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = memory.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  });

  module.exports = app;
}
