/**
 * Risk_Scorer — core scoring engine for RakshaSphere.
 *
 * Responsibilities:
 *  - computeRiskScore(zoneId, inputs): apply configurable weights, clamp to [0,100],
 *    populate excludedSources, classify, derive confidence
 *  - recomputeZone(zoneId): recompute using cached inputs, emit risk:updated and
 *    risk:threshold_crossed when score changes by >= routeRerouteThreshold
 *  - getAllZoneScores(): return Map of all cached RiskResults
 *  - Listen for EventBus events and trigger recomputes accordingly
 *  - Apply sosRiskBoost on sos:triggered; remove on sos:cancelled
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.6
 */

'use strict';

const config = require('../../config/risk.config');
const eventBus = require('../../utils/eventBus');

// ─── Color Mapping ────────────────────────────────────────────────────────────

const CLASSIFICATION_COLORS = {
  safe: '#4CAF50',
  moderate: '#FFC107',
  dangerous: '#F44336',
};

// ─── In-Memory Caches ─────────────────────────────────────────────────────────

/** @type {Map<string, import('../../models').RiskInputs>} */
const zoneInputsCache = new Map();

/** @type {Map<string, import('../../models').RiskResult>} */
const zoneResultsCache = new Map();

/**
 * Active SOS boosts per zone: zoneId → count of active SOS alerts.
 * @type {Map<string, number>}
 */
const sosBoostCount = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Classify a numeric score into safe / moderate / dangerous.
 *
 * @param {number} score
 * @returns {'safe'|'moderate'|'dangerous'}
 */
function classify(score) {
  if (score <= config.thresholds.safe) return 'safe';
  if (score <= config.thresholds.moderate) return 'moderate';
  return 'dangerous';
}

/**
 * Derive confidence from the number of available (non-null) input sources.
 *
 * 5 sources → high
 * 3–4 sources → medium
 * 0–2 sources → low
 *
 * @param {import('../../models').RiskInputs} inputs
 * @returns {'low'|'medium'|'high'}
 */
function deriveConfidence(inputs) {
  const sources = ['crime', 'infrastructure', 'weather', 'timeOfDay', 'crowd'];
  const available = sources.filter(k => inputs[k] !== null && inputs[k] !== undefined).length;
  if (available >= 5) return 'high';
  if (available >= 3) return 'medium';
  return 'low';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute a risk score for a zone from the provided inputs.
 * Null/undefined inputs are excluded from the weighted sum and recorded in
 * excludedSources. The raw weighted sum is then clamped to [0, 100].
 *
 * @param {string} zoneId
 * @param {import('../../models').RiskInputs} inputs
 * @returns {import('../../models').RiskResult}
 */
function computeRiskScore(zoneId, inputs) {
  const { weights } = config;
  const sources = ['crime', 'infrastructure', 'weather', 'timeOfDay', 'crowd'];

  const excludedSources = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const source of sources) {
    const value = inputs[source];
    if (value === null || value === undefined) {
      excludedSources.push(source);
    } else {
      weightedSum += value * weights[source];
      totalWeight += weights[source];
    }
  }

  // Normalise by available weight so missing sources don't deflate the score.
  // weightedSum is already in 0–100 range (inputs are 0–100, weights sum to 1.0),
  // so we rescale by dividing by totalWeight to account for excluded sources.
  let rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Apply SOS boost if active for this zone
  const boostCount = sosBoostCount.get(zoneId) || 0;
  if (boostCount > 0) {
    rawScore += config.sosRiskBoost;
  }

  // Clamp to [0, 100]
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  const result = {
    zoneId,
    score,
    classification: classify(score),
    confidence: deriveConfidence(inputs),
    computedAt: new Date().toISOString(),
    excludedSources,
  };

  // Cache inputs and result
  zoneInputsCache.set(zoneId, inputs);
  zoneResultsCache.set(zoneId, result);

  return result;
}

/**
 * Recompute the risk score for a zone using its cached inputs.
 * Emits `risk:updated` after every recompute.
 * Emits `risk:threshold_crossed` when the score changes by >= routeRerouteThreshold.
 *
 * @param {string} zoneId
 * @returns {import('../../models').RiskResult}
 */
function recomputeZone(zoneId) {
  const previousResult = zoneResultsCache.get(zoneId);
  const previousScore = previousResult ? previousResult.score : null;

  const inputs = zoneInputsCache.get(zoneId) || {
    crime: null,
    infrastructure: null,
    weather: null,
    timeOfDay: null,
    crowd: null,
  };

  const result = computeRiskScore(zoneId, inputs);

  // Emit risk:updated
  eventBus.emit('risk:updated', {
    zoneId,
    score: result.score,
    classification: result.classification,
    confidence: result.confidence,
    color: CLASSIFICATION_COLORS[result.classification],
    computedAt: result.computedAt,
  });

  // Emit risk:threshold_crossed if score changed by >= routeRerouteThreshold
  if (previousScore !== null) {
    const delta = result.score - previousScore;
    if (Math.abs(delta) >= config.routeRerouteThreshold) {
      eventBus.emit('risk:threshold_crossed', {
        zoneId,
        previousScore,
        newScore: result.score,
        direction: delta > 0 ? 'increasing' : 'decreasing',
      });
    }
  }

  return result;
}

/**
 * Return a Map of all cached zone RiskResults.
 *
 * @returns {Map<string, import('../../models').RiskResult>}
 */
function getAllZoneScores() {
  return new Map(zoneResultsCache);
}

// ─── EventBus Listeners ───────────────────────────────────────────────────────

/**
 * data:refreshed — reload all zone inputs from the fresh dataset and recompute.
 * The DataSources payload contains crimeData, weatherData, issueData.
 * We derive per-zone inputs from the datasets and recompute every known zone.
 */
eventBus.on('data:refreshed', (dataSources) => {
  // Build a map of zoneId → aggregated inputs from the fresh datasets
  const zoneInputMap = new Map();

  // Helper to ensure a zone entry exists
  const ensureZone = (zoneId) => {
    if (!zoneInputMap.has(zoneId)) {
      zoneInputMap.set(zoneId, {
        crime: null,
        infrastructure: null,
        weather: null,
        timeOfDay: null,
        crowd: null,
      });
    }
    return zoneInputMap.get(zoneId);
  };

  // Derive crime input per zone from crimeData records
  if (Array.isArray(dataSources.crimeData)) {
    const crimeByZone = new Map();
    for (const record of dataSources.crimeData) {
      const zoneId = record.zone_id || record.zoneId;
      if (!zoneId) continue;
      const severity = parseFloat(record.severity_score || record.severity || 0);
      if (!crimeByZone.has(zoneId)) crimeByZone.set(zoneId, []);
      crimeByZone.get(zoneId).push(severity);
    }
    for (const [zoneId, scores] of crimeByZone) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      ensureZone(zoneId).crime = Math.min(100, Math.max(0, avg));
    }
  }

  // Derive infrastructure input per zone from issueData
  if (Array.isArray(dataSources.issueData)) {
    const issuesByZone = new Map();
    for (const issue of dataSources.issueData) {
      const zoneId = issue.zoneId || issue.zone_id;
      if (!zoneId || issue.status === 'resolved') continue;
      if (!issuesByZone.has(zoneId)) issuesByZone.set(zoneId, 0);
      issuesByZone.set(zoneId, issuesByZone.get(zoneId) + 1);
    }
    for (const [zoneId, count] of issuesByZone) {
      // Cap at 100: each open issue contributes ~20 points (5 issues = 100)
      ensureZone(zoneId).infrastructure = Math.min(100, count * 20);
    }
  }

  // Derive weather input from weatherData (global, applied to all zones)
  if (dataSources.weatherData && typeof dataSources.weatherData === 'object') {
    const wd = dataSources.weatherData;
    const weatherScore = parseFloat(wd.risk_score || wd.riskScore || wd.severity || 0);
    const normalised = Math.min(100, Math.max(0, weatherScore));
    for (const inputs of zoneInputMap.values()) {
      inputs.weather = normalised;
    }
  }

  // Derive time-of-day input (global, based on current hour)
  const hour = new Date().getHours();
  // Night hours (22–5) are highest risk, morning/evening moderate, daytime low
  let timeScore;
  if (hour >= 22 || hour < 5) timeScore = 85;
  else if (hour < 8 || hour >= 19) timeScore = 55;
  else timeScore = 25;

  for (const inputs of zoneInputMap.values()) {
    inputs.timeOfDay = timeScore;
  }

  // Merge new inputs into cache and recompute
  for (const [zoneId, newInputs] of zoneInputMap) {
    const existing = zoneInputsCache.get(zoneId) || {};
    zoneInputsCache.set(zoneId, { ...existing, ...newInputs });
    recomputeZone(zoneId);
  }

  // Also recompute any zones already in cache that weren't in the new dataset
  for (const zoneId of zoneInputsCache.keys()) {
    if (!zoneInputMap.has(zoneId)) {
      recomputeZone(zoneId);
    }
  }
});

/**
 * issue:created — increase infrastructure input for the affected zone and recompute.
 */
eventBus.on('issue:created', ({ zoneId }) => {
  if (!zoneId) return;
  const inputs = zoneInputsCache.get(zoneId) || {
    crime: null, infrastructure: null, weather: null, timeOfDay: null, crowd: null,
  };
  const current = inputs.infrastructure !== null ? inputs.infrastructure : 0;
  inputs.infrastructure = Math.min(100, current + 20);
  zoneInputsCache.set(zoneId, inputs);
  recomputeZone(zoneId);
});

/**
 * issue:resolved — decrease infrastructure input for the affected zone and recompute.
 */
eventBus.on('issue:resolved', ({ zoneId }) => {
  if (!zoneId) return;
  const inputs = zoneInputsCache.get(zoneId) || {
    crime: null, infrastructure: null, weather: null, timeOfDay: null, crowd: null,
  };
  const current = inputs.infrastructure !== null ? inputs.infrastructure : 0;
  inputs.infrastructure = Math.max(0, current - 20);
  zoneInputsCache.set(zoneId, inputs);
  recomputeZone(zoneId);
});

/**
 * sos:triggered — apply sosRiskBoost to the affected zone and recompute.
 */
eventBus.on('sos:triggered', ({ zoneId }) => {
  if (!zoneId) return;
  const count = sosBoostCount.get(zoneId) || 0;
  sosBoostCount.set(zoneId, count + 1);
  recomputeZone(zoneId);
});

/**
 * sos:cancelled — remove sosRiskBoost from the affected zone and recompute.
 */
eventBus.on('sos:cancelled', ({ zoneId }) => {
  if (!zoneId) return;
  const count = sosBoostCount.get(zoneId) || 0;
  sosBoostCount.set(zoneId, Math.max(0, count - 1));
  recomputeZone(zoneId);
});

/**
 * location:cluster — update crowd density input for the affected zone and recompute.
 * Payload: { zoneId, density } where density is 0–100.
 */
eventBus.on('location:cluster', ({ zoneId, density }) => {
  if (!zoneId) return;
  const inputs = zoneInputsCache.get(zoneId) || {
    crime: null, infrastructure: null, weather: null, timeOfDay: null, crowd: null,
  };
  inputs.crowd = Math.min(100, Math.max(0, density || 0));
  zoneInputsCache.set(zoneId, inputs);
  recomputeZone(zoneId);
});

// ─── Nighttime Periodic Recompute ─────────────────────────────────────────────
// Every 5 minutes, recompute timeOfDay score for all cached zones so that
// risk scores update live as the hour changes (e.g. crossing 22:00 → night boost).

setInterval(() => {
  const hour = new Date().getHours();
  let timeScore;
  if (hour >= 22 || hour < 5) timeScore = 85;
  else if (hour < 8 || hour >= 19) timeScore = 55;
  else timeScore = 25;

  for (const [zoneId, inputs] of zoneInputsCache) {
    inputs.timeOfDay = timeScore;
    zoneInputsCache.set(zoneId, inputs);
    recomputeZone(zoneId);
  }
}, 5 * 60 * 1000);

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  computeRiskScore,
  recomputeZone,
  getAllZoneScores,
  /** Exposed for testing */
  _zoneInputsCache: zoneInputsCache,
  _zoneResultsCache: zoneResultsCache,
  _sosBoostCount: sosBoostCount,
  CLASSIFICATION_COLORS,
};
