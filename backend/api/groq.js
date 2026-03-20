'use strict';

/**
 * Groq API routes — /api/groq
 *
 * POST /api/groq/validate  — validate report text (spam/gibberish/abuse)
 * POST /api/groq/insights  — generate AI safety insights narrative
 */

const { Router } = require('express');
const { validateReportText, generateInsights } = require('../services/ai/groq');
const infraMonitor = require('../services/infrastructure');
const riskEngine   = require('../services/risk');

const router = Router();

// ── POST /api/groq/validate ───────────────────────────────────────────────────
router.post('/validate', async (req, res) => {
  const { title, description, city } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'title is required' });
  }
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'city is required' });
  }

  try {
    const result = await validateReportText({ title, description: description || '', city });
    res.json(result);
  } catch (err) {
    console.error('[groq/validate]', err);
    res.json({ valid: true, reason: null, flags: [] });
  }
});

// ── POST /api/groq/insights ───────────────────────────────────────────────────
router.post('/insights', async (req, res) => {
  try {
    const zoneMap = riskEngine.getAllZoneScores();
    const zones   = Array.from(zoneMap.values());
    const reports = infraMonitor.getReports({});
    const cityScores = Array.isArray(req.body.cityScores) ? req.body.cityScores : [];

    const insights = await generateInsights({ zones, reports, cityScores });
    res.json(insights);
  } catch (err) {
    console.error('[groq/insights]', err);
    res.status(500).json({ error: 'INSIGHTS_ERROR', message: err.message });
  }
});

module.exports = router;
