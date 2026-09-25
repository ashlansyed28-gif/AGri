import os

base_dir = 'c:/antigravity google/agriculture-assistant/backend'

def w(path, content):
    with open(f'{base_dir}/{path}', 'w', encoding='utf-8') as f:
        f.write(content)

w('server.js', '''require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const plotRoutes = require('./routes/plots');
const advisoryRoutes = require('./routes/advisory');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/advisory', advisoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
''')

w('config/db.js', '''const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
''')

w('middlewares/authMiddleware.js', '''const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
''')

w('utils/schemas.js', '''const { z } = require('zod');

const advisoryRequestSchema = z.object({
  plot_id: z.string().uuid(),
  soil_ph: z.number().min(0).max(14),
  n_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  p_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  k_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  moisture_percent: z.number().min(0).max(100),
  weather: z.enum(['DRY', 'RAIN', 'EXTREME_HEAT', 'FROST']),
  growth_stage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'HARVEST'])
});

module.exports = { advisoryRequestSchema };
''')

w('routes/auth.js', '''const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, full_name',
      [email, full_name, hashed]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
''')

w('routes/plots.js', '''const express = require('express');
const db = require('../config/db');
const auth = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM plots WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { plot_name, crop_type, acreage, region } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO plots (user_id, plot_name, crop_type, acreage, region) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, plot_name, crop_type, acreage, region]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const plotRes = await db.query('SELECT * FROM plots WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (plotRes.rows.length === 0) return res.status(404).json({ error: 'Plot not found' });
    
    const advRes = await db.query('SELECT * FROM advisories WHERE plot_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ ...plotRes.rows[0], advisories: advRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
''')

w('routes/advisory.js', '''const express = require('express');
const db = require('../config/db');
const auth = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');
const { advisoryRequestSchema } = require('../utils/schemas');
const { GoogleGenAI, Type } = require('@google/genai');

const router = express.Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.use(auth);

router.post('/generate', limiter, async (req, res) => {
  try {
    const data = advisoryRequestSchema.parse(req.body);
    
    const plotCheck = await db.query('SELECT * FROM plots WHERE id = $1 AND user_id = $2', [data.plot_id, req.user.id]);
    if (plotCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized plot access' });
    const plot = plotCheck.rows[0];

    const prompt = `Plot Context:
- Crop: ${plot.crop_type}
- Region: ${plot.region}
- Growth Stage: ${data.growth_stage}

Current Conditions:
- Soil pH: ${data.soil_ph}
- N-P-K Levels: ${data.n_level}-${data.p_level}-${data.k_level}
- Soil Moisture: ${data.moisture_percent}%
- Upcoming Weather: ${data.weather}

Generate a comprehensive crop management advisory.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Agronomist AI. Your purpose is to analyze farm plot data, soil conditions, and weather forecasts to output highly specific, scientifically sound agricultural advisories. Provide actionable, step-by-step guidance tailored to the crop's current growth stage.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Short health summary of the crop" },
            fertilizer_plan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action items" },
            irrigation_plan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action items" },
            risk_warnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Warnings" }
          },
          required: ["summary", "fertilizer_plan", "irrigation_plan", "risk_warnings"]
        }
      }
    });

    const aiRecommendation = JSON.parse(response.text);

    const insertRes = await db.query(
      `INSERT INTO advisories 
      (plot_id, soil_ph, n_level, p_level, k_level, moisture_percent, weather, growth_stage, ai_recommendation_json) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.plot_id, data.soil_ph, data.n_level, data.p_level, data.k_level, data.moisture_percent, data.weather, data.growth_stage, JSON.stringify(aiRecommendation)]
    );

    res.json(insertRes.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const advRes = await db.query(
      `SELECT a.* FROM advisories a 
       JOIN plots p ON a.plot_id = p.id 
       WHERE a.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (advRes.rows.length === 0) return res.status(404).json({ error: 'Advisory not found' });
    res.json(advRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
'''
)

print("Backend setup complete.")
