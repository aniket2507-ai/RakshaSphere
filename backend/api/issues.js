'use strict';

/**
 * Issues API routes — /api/issues
 */

const { Router } = require('express');
const infraMonitor = require('../services/infrastructure');
const riskEngine = require('../services/risk');

const router = Router();

const VALID_STATUSES = new Set(['open', 'resolved']);
const VALID_TYPES = new Set(['garbage', 'waterlogging', 'low_lighting', 'road_damage', 'no_issue']);

// ── GET /api/issues ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { zoneId, type, status, from, to } = req.query;

  if (type && !VALID_TYPES.has(type)) {
    return res.status(400).json({ error: 'INVALID_FILTER', message: `type must be one of: ${[...VALID_TYPES].join(', ')}` });
  }
  if (status && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'INVALID_FILTER', message: 'status must be open or resolved' });
  }

  const filter = {};
  if (zoneId) filter.zoneId = zoneId;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (from) filter.from = Number(from);
  if (to) filter.to = Number(to);

  const reports = infraMonitor.getReports(filter);
  res.json({ reports });
});

// ── POST /api/issues ──────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { type, zoneId, location, source } = req.body;

  if (!type || !VALID_TYPES.has(type)) {
    return res.status(400).json({ error: 'INVALID_REPORT', message: `type must be one of: ${[...VALID_TYPES].join(', ')}` });
  }
  if (!zoneId || typeof zoneId !== 'string') {
    return res.status(400).json({ error: 'INVALID_REPORT', message: 'zoneId is required' });
  }

  const report = {
    type,
    zoneId,
    location: location || null,
    timestamp: new Date().toISOString(),
    source: source || 'manual',
    confidence: 1.0,
    priorityScore: 50,
    resolvedAt: null,
  };

  const result = infraMonitor.createReport(report);

  if (result.deduplicated) {
    return res.status(409).json({ error: 'DUPLICATE_REPORT', message: 'A similar report already exists for this zone' });
  }

  const zoneMap = riskEngine.getAllZoneScores();
  const zoneRisk = zoneMap.get(zoneId);
  const riskImpact = zoneRisk ? { zoneId, currentScore: zoneRisk.score } : null;

  res.status(201).json({ report: result, riskImpact });
});

// ── PATCH /api/issues/:id/resolve ─────────────────────────────────────────────
router.patch('/:id/resolve', (req, res) => {
  try {
    const resolved = infraMonitor.resolveReport(req.params.id);
    const zoneMap = riskEngine.getAllZoneScores();
    const zoneRisk = zoneMap.get(resolved.zoneId);
    const riskImpact = zoneRisk ? { zoneId: resolved.zoneId, currentScore: zoneRisk.score } : null;

    res.json({ report: resolved, riskImpact });
  } catch (err) {
    if (err.code === 'REPORT_NOT_FOUND') {
      return res.status(404).json({ error: 'REPORT_NOT_FOUND', reportId: req.params.id });
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

module.exports = router;
