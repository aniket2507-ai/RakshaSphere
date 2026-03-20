'use strict';

/**
 * SOS API routes — /api/sos
 */

const { Router } = require('express');
const sosSystem = require('../services/sos');

const router = Router();

// ── POST /api/sos ─────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { userId, location, offline } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'userId is required' });
  }
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({ error: 'INVALID_LOCATION', message: 'location with lat/lng required' });
  }

  const active = sosSystem.getActiveAlerts();
  const existing = active.find((a) => a.userId === userId);
  if (existing) {
    return res.status(409).json({ error: 'DUPLICATE_SOS', alert: existing });
  }

  if (offline) {
    sosSystem.queueOfflineAlert({ userId, location });
    return res.status(202).json({ queued: true, message: 'SOS queued for offline sync' });
  }

  const alert = sosSystem.triggerSOS(userId, location);
  res.status(201).json({ alert });
});

// ── DELETE /api/sos/:id ───────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    sosSystem.cancelSOS(req.params.id);
    res.json({ cancelled: true, alertId: req.params.id });
  } catch (err) {
    if (err.code === 'ALERT_NOT_FOUND') {
      return res.status(404).json({ error: 'ALERT_NOT_FOUND', alertId: req.params.id });
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ── PATCH /api/sos/:id/location ───────────────────────────────────────────────
router.patch('/:id/location', (req, res) => {
  const { location } = req.body;
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({ error: 'INVALID_LOCATION', message: 'location with lat/lng required' });
  }

  try {
    sosSystem.updateLocation(req.params.id, location);
    res.json({ updated: true, alertId: req.params.id, location });
  } catch (err) {
    if (err.code === 'ALERT_NOT_FOUND') {
      return res.status(404).json({ error: 'ALERT_NOT_FOUND', alertId: req.params.id });
    }
    if (err.code === 'ALERT_CANCELLED') {
      return res.status(409).json({ error: 'ALERT_CANCELLED', alertId: req.params.id });
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// ── GET /api/sos/active ───────────────────────────────────────────────────────
router.get('/active', (_req, res) => {
  res.json({ alerts: sosSystem.getActiveAlerts() });
});

module.exports = router;
