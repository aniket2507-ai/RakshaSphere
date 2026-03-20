'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const dataLoader = require('./services/dataLoader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/risk', require('./api/risk'));
app.use('/api/detect', require('./api/detect'));
app.use('/api/sos', require('./api/sos'));
app.use('/api/routes', require('./api/routes'));
app.use('/api/issues', require('./api/issues'));
app.use('/api/location', require('./api/location'));
app.use('/api/predictions', require('./api/predictions'));
app.use('/api/groq', require('./api/groq'));
app.use('/api/weather', require('./api/weather'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'RakshaSphere backend running', version: '1.0.0' });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await dataLoader.loadAll();
    console.log('[boot] Data loaded successfully');
  } catch (err) {
    console.warn('[boot] Data load warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`RakshaSphere backend listening on port ${PORT}`);
  });
}

start();
