'use strict';

/**
 * Risk_Engine — unified interface for the risk scoring sub-system.
 *
 * Re-exports all public functions from scorer, explainer, and predictor
 * so consumers can do:
 *
 *   const riskEngine = require('./services/risk');
 *   riskEngine.computeRiskScore(...)
 *   riskEngine.explainRiskScore(...)
 *   riskEngine.predictRisk(...)
 */

const scorer = require('./scorer');
const explainer = require('./explainer');
const predictor = require('./predictor');

module.exports = {
  // ── Scorer ──────────────────────────────────────────────────────────────────
  computeRiskScore: scorer.computeRiskScore,
  recomputeZone: scorer.recomputeZone,
  getAllZoneScores: scorer.getAllZoneScores,

  // ── Explainer ────────────────────────────────────────────────────────────────
  explainRiskScore: explainer.explainRiskScore,
  getTopContributors: explainer.getTopContributors,
  formatExplanation: explainer.formatExplanation,

  // ── Predictor ────────────────────────────────────────────────────────────────
  predictRisk: predictor.predictRisk,
  analyzePatterns: predictor.analyzePatterns,
  hasSufficientData: predictor.hasSufficientData,
};
