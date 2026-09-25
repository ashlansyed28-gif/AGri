require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const plotRoutes = require('./routes/plots');
const advisoryRoutes = require('./routes/advisory');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Crop Advisory Assistant API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/advisory', advisoryRoutes);

// Only listen when executed directly, not when required in serverless environments (Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
