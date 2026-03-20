'use strict';

/**
 * Routes API — /api/route
 * Delegates all routing logic to the Router service.
 */

const { Router } = require('express');
const routerService = require('../services/router');

const router = Router();

/**
 * POST /api/route/compare
 * Body: { from: [lat, lng], to: [lat, lng] }
 * Returns: { fastest: RouteResult, safest: RouteResult }
 */
router.post('/compare', async (req, res) => {
  const { from, to } = req.body;

  if (
    !Array.isArray(from) || from.length !== 2 ||
    !Array.isArray(to) || to.length !== 2
  ) {
    return res.status(400).json({
      error: 'INVALID_PARAMS',
      message: 'Body must contain from: [lat,lng] and to: [lat,lng]',
    });
  }

  try {
    const result = await routerService.compareRoutes(from, to);
    res.json(result);
  } catch (err) {
    console.error('[routes API] compareRoutes error:', err.message);
    res.status(502).json({ error: 'ROUTING_FAILED', message: err.message });
  }
});

module.exports = router;
