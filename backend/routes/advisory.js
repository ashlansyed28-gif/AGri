const express = require('express');
const db = require('../config/db');
const auth = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');
const { advisoryRequestSchema } = require('../utils/schemas');
const { GoogleGenAI, Type } = require('@google/genai');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.use(auth);

router.post('/generate', limiter, async (req, res) => {
  try {
    const data = advisoryRequestSchema.parse(req.body);

    // Fetch plot context
    let plot = null;
    const pool = db.getPool();
    if (pool) {
      try {
        const plotCheck = await pool.query(
          'SELECT * FROM plots WHERE id = $1 AND user_id = $2',
          [data.plot_id, req.user.id]
        );
        if (plotCheck.rows.length > 0) {
          plot = plotCheck.rows[0];
        }
      } catch (e) {
        console.warn('Plot check DB failed:', e.message);
      }
    }

    if (!plot) {
      plot = db.memoryStore.plots.find(
        (p) => p.id === data.plot_id && p.user_id === req.user.id
      );
    }

    if (!plot) {
      return res.status(403).json({ error: 'Plot not found or unauthorized access.' });
    }

    let aiRecommendation = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_google_gemini_api_key') {
      try {
        const ai = new GoogleGenAI({ apiKey });
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
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction:
              "You are an expert Agronomist AI. Your purpose is to analyze farm plot data, soil conditions, and weather forecasts to output highly specific, scientifically sound agricultural advisories. Provide actionable, step-by-step guidance tailored to the crop's current growth stage.",
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: 'Short health summary of the crop' },
                fertilizer_plan: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Action items' },
                irrigation_plan: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Action items' },
                risk_warnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Warnings' },
              },
              required: ['summary', 'fertilizer_plan', 'irrigation_plan', 'risk_warnings'],
            },
          },
        });

        aiRecommendation = JSON.parse(response.text);
      } catch (aiErr) {
        console.error('Gemini API call failed, generating scientific fallback advisory:', aiErr.message);
      }
    }

    // Default scientific advisory if Gemini key not yet supplied or API quota exceeded
    if (!aiRecommendation) {
      aiRecommendation = {
        summary: `Soil analysis for ${plot.crop_type} indicates a pH of ${data.soil_ph} during the ${data.growth_stage} phase under ${data.weather.toLowerCase()} conditions. Immediate attention to N-P-K nutrient balance is recommended.`,
        fertilizer_plan: [
          `Apply balanced N-P-K top-dressing tailored for ${data.growth_stage} stage (Current levels: N:${data.n_level}, P:${data.p_level}, K:${data.k_level}).`,
          data.soil_ph < 6.0
            ? 'Incorporate agricultural lime to elevate acidic soil pH closer to the 6.5 neutral range.'
            : data.soil_ph > 7.5
            ? 'Apply elemental sulfur or acidic organic mulch to lower alkaline soil pH.'
            : 'Soil pH is well-buffered; sustain current organic composting regimen.',
          'Schedule secondary micronutrient foliar spray (Zinc & Boron) early in the morning.',
        ],
        irrigation_plan: [
          data.weather === 'RAIN'
            ? 'Suspend scheduled drip irrigation; verify perimeter drainage ditches are clear to prevent waterlogging.'
            : data.weather === 'EXTREME_HEAT'
            ? `Current moisture at ${data.moisture_percent}%. Implement deep morning irrigation cycles to reduce heat stress.`
            : `Maintain steady soil moisture between 55% - 70% with standard evening drip cycles.`,
          'Monitor tensiometer readings at root zone (15-30cm depth).',
        ],
        risk_warnings: [
          data.weather === 'EXTREME_HEAT'
            ? 'High evapotranspiration hazard: watch for leaf scorch and blossom drop.'
            : data.weather === 'RAIN'
            ? 'Elevated risk of fungal blight and root rot due to moisture saturation.'
            : 'Foliar pest scouting recommended twice weekly during current vegetative cycle.',
          !apiKey || apiKey === 'your_google_gemini_api_key'
            ? 'Notice: Set GEMINI_API_KEY in your environment variables for live real-time Gemini AI model calls.'
            : 'Routine pest and pathogen vigilance advised.',
        ],
      };
    }

    // Persist to Postgres if available
    if (pool) {
      try {
        const insertRes = await pool.query(
          `INSERT INTO advisories 
          (plot_id, soil_ph, n_level, p_level, k_level, moisture_percent, weather, growth_stage, ai_recommendation_json) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [
            data.plot_id,
            data.soil_ph,
            data.n_level,
            data.p_level,
            data.k_level,
            data.moisture_percent,
            data.weather,
            data.growth_stage,
            JSON.stringify(aiRecommendation),
          ]
        );
        return res.status(201).json(insertRes.rows[0]);
      } catch (dbErr) {
        console.warn('DB insert failed for advisory, saving to memory:', dbErr.message);
      }
    }

    // Save to memory store
    const newAdvisory = {
      id: 'adv-' + Date.now(),
      plot_id: data.plot_id,
      soil_ph: data.soil_ph,
      n_level: data.n_level,
      p_level: data.p_level,
      k_level: data.k_level,
      moisture_percent: data.moisture_percent,
      weather: data.weather,
      growth_stage: data.growth_stage,
      ai_recommendation_json: aiRecommendation,
      created_at: new Date().toISOString(),
    };
    db.memoryStore.advisories.unshift(newAdvisory);
    return res.status(201).json(newAdvisory);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = db.getPool();
    if (pool) {
      try {
        const advRes = await pool.query(
          `SELECT a.* FROM advisories a 
           JOIN plots p ON a.plot_id = p.id 
           WHERE a.id = $1 AND p.user_id = $2`,
          [req.params.id, req.user.id]
        );
        if (advRes.rows.length > 0) {
          return res.json(advRes.rows[0]);
        }
      } catch (dbErr) {
        console.warn('DB query failed for advisory by id, checking memory:', dbErr.message);
      }
    }

    const advisory = db.memoryStore.advisories.find((a) => a.id === req.params.id);
    if (!advisory) return res.status(404).json({ error: 'Advisory not found' });
    return res.json(advisory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
