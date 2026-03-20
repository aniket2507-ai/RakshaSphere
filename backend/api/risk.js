'use strict';

/**
 * Risk API routes — /api/risk
 * No business logic here; all computation delegated to Risk_Engine service.
 */

const { Router } = require('express');
const riskEngine = require('../services/risk');
const scorer = require('../services/risk/scorer');
const eventBus = require('../utils/eventBus');
const config = require('../config/risk.config');
const { getDatasetZones } = require('../services/dataLoader/csvParser');
const { getDistrictZones } = require('../services/dataLoader/districtParser');
const { getSampleZones } = require('../services/dataLoader/sampleZones');

const router = Router();

/** Map a numeric score to a hex color for frontend map overlays. */
function scoreToColor(score) {
  if (score <= config.thresholds.safe) return '#4CAF50';
  if (score <= config.thresholds.moderate) return '#FFC107';
  return '#F44336';
}

/**
 * Decode a zone ID like "z-12-77" into { lat, lng } center coordinates.
 * Adds 0.5 to place the marker at the center of the 1-degree grid cell.
 */
function zoneIdToCoords(zoneId) {
  const match = zoneId.match(/^z-(-?\d+)-(-?\d+)$/);
  if (!match) return null;
  return { lat: parseFloat(match[1]) + 0.5, lng: parseFloat(match[2]) + 0.5 };
}

// ── GET /api/risk/zones ───────────────────────────────────────────────────────
router.get('/zones', (req, res) => {
  const zoneMap = riskEngine.getAllZoneScores();
  const zones = Array.from(zoneMap.entries()).map(([zoneId, result]) => {
    const coords = zoneIdToCoords(zoneId);
    return {
      zoneId,
      score: result.score,
      classification: result.classification,
      color: scoreToColor(result.score),
      lastUpdated: result.lastUpdated,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
    };
  }).filter(z => z.lat !== null);
  res.json({ zones });
});

// ── GET /api/risk/dataset-zones ───────────────────────────────────────────────
// Returns city-level risk zones derived from the real crime datasets.
// Supports optional proximity filtering: ?lat=28.6&lng=77.2&radiusKm=500
router.get('/dataset-zones', (req, res) => {
  let zones = getDatasetZones();

  const lat      = parseFloat(req.query.lat);
  const lng      = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 500;

  if (!isNaN(lat) && !isNaN(lng)) {
    zones = zones.filter(z => haversineKm(lat, lng, z.lat, z.lng) <= radiusKm);
  }

  res.json({ zones, total: zones.length });
});

// ── GET /api/risk/district-zones ──────────────────────────────────────────────
// Returns district-level risk zones from IPC 2001–2012 dataset.
// Supports optional proximity filtering: ?lat=28.6&lng=77.2&radiusKm=500
router.get('/district-zones', (req, res) => {
  let zones = getDistrictZones();

  const lat      = parseFloat(req.query.lat);
  const lng      = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radiusKm) || 1000;

  if (!isNaN(lat) && !isNaN(lng)) {
    zones = zones.filter(z => haversineKm(lat, lng, z.lat, z.lng) <= radiusKm);
  }

  res.json({ zones, total: zones.length });
});

// ── GET /api/risk/sample-zones ────────────────────────────────────────────────
// Returns hardcoded sample zones covering all severity levels across major cities.
router.get('/sample-zones', (req, res) => {
  const zones = getSampleZones();
  res.json({ zones, total: zones.length });
});

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GET /api/risk/zone/:id ────────────────────────────────────────────────────
router.get('/zone/:id', (req, res) => {
  const { id } = req.params;
  const zoneMap = riskEngine.getAllZoneScores();

  if (!zoneMap.has(id)) {
    return res.status(404).json({ error: 'ZONE_NOT_FOUND', zoneId: id });
  }

  const riskResult = zoneMap.get(id);
  const inputs = scorer._zoneInputsCache?.get(id) || riskResult.inputs || {};
  const explanation = riskEngine.explainRiskScore(id, riskResult, inputs);
  const prediction = riskEngine.hasSufficientData(id)
    ? riskEngine.predictRisk(id, 1)
    : null;

  // Build per-factor breakdown keyed by factor name
  const FACTORS = ['crime', 'infrastructure', 'weather', 'timeOfDay', 'crowd'];
  const breakdown = {};
  for (const f of FACTORS) {
    if (explanation[f]) breakdown[f] = explanation[f];
  }

  // Count open issues for this zone (derived from infrastructure input: each issue = 20 pts)
  const infraInput = inputs.infrastructure;
  const issueCount = infraInput != null ? Math.round(infraInput / 20) : null;

  res.json({
    zoneId: id,
    score: riskResult.score,
    classification: riskResult.classification,
    color: scoreToColor(riskResult.score),
    confidence: riskResult.confidence,
    lastUpdated: riskResult.lastUpdated || riskResult.computedAt,
    breakdown,
    topContributors: explanation.topContributors,
    explanation: riskEngine.formatExplanation(explanation),
    predictedRisk: prediction,
    issueCount,
  });
});

// ── GET /api/risk/zone/:id/predict ────────────────────────────────────────────
router.get('/zone/:id/predict', (req, res) => {
  const { id } = req.params;
  const hoursAhead = parseInt(req.query.hoursAhead, 10) || 1;

  if (![1, 2, 3].includes(hoursAhead)) {
    return res.status(400).json({ error: 'INVALID_HOURS_AHEAD', message: 'hoursAhead must be 1, 2, or 3' });
  }

  if (!riskEngine.hasSufficientData(id)) {
    return res.status(503).json({ error: 'INSUFFICIENT_DATA', zoneId: id });
  }

  const prediction = riskEngine.predictRisk(id, hoursAhead);
  res.json({ zoneId: id, hoursAhead, prediction });
});

// ── POST /api/risk/zone/:id/recompute ─────────────────────────────────────────
router.post('/zone/:id/recompute', (req, res) => {
  const { id } = req.params;
  const result = riskEngine.recomputeZone(id);
  res.json({ zoneId: id, result });
});

// ── GET /api/risk/stream (SSE) ────────────────────────────────────────────────
const sseClients = new Set();

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);
  sseClients.add(res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

eventBus.on('risk:updated', ({ zoneId, score, classification }) => {
  broadcast('risk:updated', { zoneId, score, classification, color: scoreToColor(score) });
});

eventBus.on('risk:threshold_crossed', ({ zoneId, previousScore, newScore }) => {
  broadcast('risk:threshold_crossed', { zoneId, previousScore, newScore, color: scoreToColor(newScore) });
});

module.exports = router;
