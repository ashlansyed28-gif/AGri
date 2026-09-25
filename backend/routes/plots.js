const express = require('express');
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
