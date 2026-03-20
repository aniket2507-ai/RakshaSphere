/**
 * RakshaSphere Risk Engine Configuration
 * All configurable values for the risk computation pipeline.
 */

module.exports = {
  /** Weighted contribution of each data source to the composite Risk_Score */
  weights: {
    crime: 0.35,
    infrastructure: 0.25,
    weather: 0.15,
    timeOfDay: 0.15,
    crowd: 0.10,
  },

  /** Score boundaries for zone classification */
  thresholds: {
    safe: 33,       // score <= 33 → "safe"
    moderate: 66,   // score <= 66 → "moderate"
    dangerous: 100, // score <= 100 → "dangerous"
  },

  /** Minimum milliseconds between successive recomputes for the same zone */
  recomputeDebounceMs: 5000,

  /** Points added to a zone's Risk_Score while an SOS alert is active */
  sosRiskBoost: 20,

  /** Window (ms) within which identical issue reports are considered duplicates (1 hour) */
  deduplicationWindowMs: 3600000,

  /** Window (ms) within which critical issues must be escalated (1 minute) */
  escalationWindowMs: 60000,

  /** Minimum score-point change that triggers a risk:threshold_crossed event and reroute check */
  routeRerouteThreshold: 15,

  /** Minimum AI classification confidence required to generate an IssueReport */
  aiConfidenceThreshold: 0.7,
};
