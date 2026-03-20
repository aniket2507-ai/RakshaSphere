'use strict';

/**
 * Location API routes — /api/location
 */

const { Router } = require('express');
const locationService = require('../services/location');

const router = Router();

// ── POST /api/location/start ──────────────────────────────────────────────────
router.post('/start', (req, res) => {
  const { userId } = req.body;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'userId is required' });
  }
  locationService.startTracking(userId);
  res.json({ tracking: true, userId });
});

// ── POST /api/location/stop ───────────────────────────────────────────────────
router.post('/stop', (req, res) => {
  const { userId } = req.body;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'userId is required' });
  }
  locationService.stopTracking(userId);
  res.json({ tracking: false, userId });
});

// ── PATCH /api/location/update ────────────────────────────────────────────────
router.patch('/update', (req, res) => {
  const { userId, location } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'userId is required' });
  }
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({ error: 'INVALID_LOCATION', message: 'location with lat/lng required' });
  }

  locationService.updateLocation(userId, location);

  const zoneId = `z-${Math.floor(location.lat)}-${Math.floor(location.lng)}`;
  res.json({ updated: true, userId, location, zoneId });
});

module.exports = router;
