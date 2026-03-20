/**
 * Risk_Predictor — analyzes historical risk patterns and predicts future risk.
 *
 * Responsibilities:
 *  - predictRisk(zoneId, hoursAhead): predict risk 1–3 hours ahead, clamp hoursAhead
 *    to {1,2,3}, emit `risk:prediction_ready`, return PredictedRisk.
 *    Must NOT modify the current zone riskScore in scorer.js.
 *  - analyzePatterns(zoneId): analyze historical RiskResult records, return PatternAnalysis.
 *  - hasSufficientData(zoneId): return true if >= 24 data points exist for the zone.
 *  - Listen for `risk:updated` events to record history per zone.
 *
 * Requirements: 1B.1, 1B.2, 1B.4, 1B.5, 1B.6
 */

'use strict';

const eventBus = require('../../utils/eventBus');
const config = require('../../config/risk.config');

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum number of historical data points required for pattern-based prediction */
const MIN_DATA_POINTS = 24;

/** Maximum history entries to keep per zone (rolling window) */
const MAX_HISTORY_SIZE = 720; // ~30 days at one entry per hour

// ─── In-Memory History Store ──────────────────────────────────────────────────

/**
 * Historical risk records per zone.
 * zoneId -> Array<{ score, classification, confidence, computedAt }>
 *
 * @type {Map<string, Array<{ score: number, classification: string, confidence: string, computedAt: string }>>}
 */
const zoneHistory = new Map();

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
 * Clamp hoursAhead to the valid set {1, 2, 3}.
 *
 * @param {number} hoursAhead
 * @returns {1|2|3}
 */
function clampHoursAhead(hoursAhead) {
  const n = Math.round(Number(hoursAhead) || 1);
  if (n <= 1) return 1;
  if (n >= 3) return 3;
  return 2;
}

/**
 * Extract the hour-of-day (0-23) from an ISO 8601 timestamp.
 *
 * @param {string} isoString
 * @returns {number}
 */
function hourOf(isoString) {
  return new Date(isoString).getHours();
}

/**
 * Extract the day-of-week (0=Sun ... 6=Sat) from an ISO 8601 timestamp.
 *
 * @param {string} isoString
 * @returns {number}
 */
function dayOf(isoString) {
  return new Date(isoString).getDay();
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Return true if the zone has at least MIN_DATA_POINTS historical records.
 *
 * @param {string} zoneId
 * @returns {boolean}
 */
function hasSufficientData(zoneId) {
  const history = zoneHistory.get(zoneId);
  return Array.isArray(history) && history.length >= MIN_DATA_POINTS;
}

/**
 * Analyze historical RiskResult records for a zone and return a PatternAnalysis.
 *
 * Pattern detection strategy:
 *  1. time_of_day  - if scores in the same hour-of-day bucket are consistently
 *     higher/lower than the overall mean (stddev of bucket means > 10 points)
 *  2. day_of_week  - if scores grouped by day-of-week show similar variance
 *  3. none         - insufficient variance to identify a pattern
 *
 * @param {string} zoneId
 * @returns {{ zoneId: string, hasRecurringPattern: boolean, patternType: string, historicalDataPoints: number, lastAnalyzedAt: string }}
 */
function analyzePatterns(zoneId) {
  const history = zoneHistory.get(zoneId) || [];
  const now = new Date().toISOString();

  if (history.length < MIN_DATA_POINTS) {
    return {
      zoneId,
      hasRecurringPattern: false,
      patternType: 'none',
      historicalDataPoints: history.length,
      lastAnalyzedAt: now,
    };
  }

  // Time-of-day pattern
  const hourBuckets = Array.from({ length: 24 }, () => []);
  for (const record of history) {
    const h = hourOf(record.computedAt);
    hourBuckets[h].push(record.score);
  }

  const hourMeans = hourBuckets
    .filter(b => b.length > 0)
    .map(b => b.reduce((a, v) => a + v, 0) / b.length);

  const overallMean = hourMeans.reduce((a, v) => a + v, 0) / (hourMeans.length || 1);
  const hourVariance =
    hourMeans.reduce((a, v) => a + (v - overallMean) ** 2, 0) / (hourMeans.length || 1);
  const hourStdDev = Math.sqrt(hourVariance);

  if (hourStdDev > 10) {
    return {
      zoneId,
      hasRecurringPattern: true,
      patternType: 'time_of_day',
      historicalDataPoints: history.length,
      lastAnalyzedAt: now,
    };
  }

  // Day-of-week pattern
  const dayBuckets = Array.from({ length: 7 }, () => []);
  for (const record of history) {
    const d = dayOf(record.computedAt);
    dayBuckets[d].push(record.score);
  }

  const dayMeans = dayBuckets
    .filter(b => b.length > 0)
    .map(b => b.reduce((a, v) => a + v, 0) / b.length);

  const dayOverallMean = dayMeans.reduce((a, v) => a + v, 0) / (dayMeans.length || 1);
  const dayVariance =
    dayMeans.reduce((a, v) => a + (v - dayOverallMean) ** 2, 0) / (dayMeans.length || 1);
  const dayStdDev = Math.sqrt(dayVariance);

  if (dayStdDev > 10) {
    return {
      zoneId,
      hasRecurringPattern: true,
      patternType: 'day_of_week',
      historicalDataPoints: history.length,
      lastAnalyzedAt: now,
    };
  }

  return {
    zoneId,
    hasRecurringPattern: false,
    patternType: 'none',
    historicalDataPoints: history.length,
    lastAnalyzedAt: now,
  };
}

/**
 * Predict the risk for a zone `hoursAhead` hours into the future.
 *
 * - hoursAhead is clamped to {1, 2, 3}.
 * - Does NOT modify the current zone riskScore in scorer.js.
 * - Emits `risk:prediction_ready` on EventBus.
 * - When insufficient data: confidence = "low", predictedScore = current score or 0,
 *   isPatternBased = false.
 *
 * Prediction strategy (when sufficient data exists):
 *  1. Determine the target hour (now + hoursAhead).
 *  2. Collect all historical scores recorded at that same hour-of-day.
 *  3. Use the mean of those scores as the predicted score.
 *  4. Confidence: high if >= 48 same-hour samples, medium if >= 12, else low.
 *
 * @param {string} zoneId
 * @param {number} hoursAhead
 * @returns {{ zoneId: string, hoursAhead: number, predictedScore: number, predictedClassification: string, isPatternBased: boolean, confidence: string, predictedAt: string }}
 */
function predictRisk(zoneId, hoursAhead) {
  const clamped = clampHoursAhead(hoursAhead);
  const now = new Date();
  const predictedAt = now.toISOString();

  // Current score from history (last recorded entry) or 0
  const history = zoneHistory.get(zoneId) || [];
  const currentScore = history.length > 0 ? history[history.length - 1].score : 0;

  if (!hasSufficientData(zoneId)) {
    const result = {
      zoneId,
      hoursAhead: clamped,
      predictedScore: currentScore,
      predictedClassification: classify(currentScore),
      isPatternBased: false,
      confidence: 'low',
      predictedAt,
    };

    eventBus.emit('risk:prediction_ready', { zoneId, predictedRisk: result });
    return result;
  }

  // Target hour-of-day for the prediction window
  const targetHour = (now.getHours() + clamped) % 24;

  // Collect historical scores at the same hour-of-day
  const sameHourScores = history
    .filter(r => hourOf(r.computedAt) === targetHour)
    .map(r => r.score);

  let predictedScore;
  let confidence;

  if (sameHourScores.length === 0) {
    // Fall back to overall mean
    const overallMean = history.reduce((a, r) => a + r.score, 0) / history.length;
    predictedScore = Math.round(overallMean);
    confidence = 'low';
  } else {
    const mean = sameHourScores.reduce((a, v) => a + v, 0) / sameHourScores.length;
    predictedScore = Math.min(100, Math.max(0, Math.round(mean)));

    if (sameHourScores.length >= 48) confidence = 'high';
    else if (sameHourScores.length >= 12) confidence = 'medium';
    else confidence = 'low';
  }

  const result = {
    zoneId,
    hoursAhead: clamped,
    predictedScore,
    predictedClassification: classify(predictedScore),
    isPatternBased: true,
    confidence,
    predictedAt,
  };

  eventBus.emit('risk:prediction_ready', { zoneId, predictedRisk: result });
  return result;
}

// ─── EventBus Listener ────────────────────────────────────────────────────────

/**
 * risk:updated - record the new score in the zone's history.
 * Payload: { zoneId, score, classification, confidence, computedAt }
 */
eventBus.on('risk:updated', ({ zoneId, score, classification, confidence, computedAt }) => {
  if (!zoneId) return;

  if (!zoneHistory.has(zoneId)) {
    zoneHistory.set(zoneId, []);
  }

  const history = zoneHistory.get(zoneId);
  history.push({
    score,
    classification,
    confidence,
    computedAt: computedAt || new Date().toISOString(),
  });

  // Keep history bounded
  if (history.length > MAX_HISTORY_SIZE) {
    history.splice(0, history.length - MAX_HISTORY_SIZE);
  }
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  predictRisk,
  analyzePatterns,
  hasSufficientData,
  /** Exposed for testing */
  _zoneHistory: zoneHistory,
  MIN_DATA_POINTS,
};
