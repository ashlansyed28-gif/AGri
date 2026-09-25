const express = require('express');
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
