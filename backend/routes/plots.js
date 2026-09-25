const express = require('express');
const db = require('../config/db');
const auth = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const pool = db.getPool();
    if (pool) {
      try {
        const result = await pool.query(
          'SELECT * FROM plots WHERE user_id = $1 ORDER BY created_at DESC',
          [req.user.id]
        );
        return res.json(result.rows);
      } catch (dbErr) {
        console.warn('DB query failed for plots, checking memory:', dbErr.message);
      }
    }

    const userPlots = db.memoryStore.plots.filter((p) => p.user_id === req.user.id);
    return res.json(userPlots);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { plot_name, crop_type, acreage, region } = req.body;

  if (!plot_name || !crop_type || acreage === undefined || !region) {
    return res.status(400).json({ error: 'Please provide plot name, crop type, acreage, and region.' });
  }

  try {
    const pool = db.getPool();
    if (pool) {
      try {
        const result = await pool.query(
          'INSERT INTO plots (user_id, plot_name, crop_type, acreage, region) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [req.user.id, plot_name, crop_type, acreage, region]
        );
        return res.status(201).json(result.rows[0]);
      } catch (dbErr) {
        console.warn('DB insert failed for plot, saving to memory:', dbErr.message);
      }
    }

    const newPlot = {
      id: 'plot-' + Date.now(),
      user_id: req.user.id,
      plot_name,
      crop_type,
      acreage,
      region,
      created_at: new Date().toISOString(),
    };
    db.memoryStore.plots.unshift(newPlot);
    return res.status(201).json(newPlot);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = db.getPool();
    if (pool) {
      try {
        const plotRes = await pool.query(
          'SELECT * FROM plots WHERE id = $1 AND user_id = $2',
          [req.params.id, req.user.id]
        );
        if (plotRes.rows.length > 0) {
          const advRes = await pool.query(
            'SELECT * FROM advisories WHERE plot_id = $1 ORDER BY created_at DESC',
            [req.params.id]
          );
          return res.json({ ...plotRes.rows[0], advisories: advRes.rows });
        }
      } catch (dbErr) {
        console.warn('DB fetch failed for plot details, checking memory:', dbErr.message);
      }
    }

    const plot = db.memoryStore.plots.find(
      (p) => p.id === req.params.id && p.user_id === req.user.id
    );
    if (!plot) return res.status(404).json({ error: 'Plot not found' });

    const advisories = db.memoryStore.advisories.filter((a) => a.plot_id === req.params.id);
    return res.json({ ...plot, advisories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
