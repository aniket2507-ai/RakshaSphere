/**
 * Risk_Explainer — generates human-readable explanations for Risk_Scores.
 *
 * Responsibilities:
 *  - explainRiskScore(zoneId, riskResult, inputs): compute per-factor weighted
 *    contribution, rank factors by contribution, populate topContributors with
 *    top 3 factor names, generate human-readable description strings per factor
 *  - getTopContributors(breakdown): return array of top 3 factor names sorted
 *    by contribution descending
 *  - formatExplanation(breakdown): return a single human-readable string
 *    summarising the breakdown
 *
 * Requirements: 1A.1, 1A.2, 1A.4, 1A.5
 */

'use strict';

const config = require('../../config/risk.config');

// ─── Factor Keys ──────────────────────────────────────────────────────────────

const FACTORS = ['crime', 'infrastructure', 'weather', 'timeOfDay', 'crowd'];

// ─── Description Generators ───────────────────────────────────────────────────

/**
 * Generate a human-readable description for the crime factor.
 * @param {number} score - 0-100
 * @returns {string}
 */
function describeCrime(score) {
  if (score > 66) return 'High crime activity reported in the last 24 hours';
  if (score > 33) return 'Moderate crime activity in the area';
  return 'Low crime activity in the area';
}

/**
 * Generate a human-readable description for the infrastructure factor.
 * @param {number} score - 0-100
 * @returns {string}
 */
function describeInfrastructure(score) {
  if (score > 66) return 'Multiple open infrastructure issues detected';
  if (score > 33) return 'Some infrastructure issues present';
  return 'Infrastructure in good condition';
}

/**
 * Generate a human-readable description for the weather factor.
 * @param {number} score - 0-100
 * @returns {string}
 */
function describeWeather(score) {
  if (score > 66) return 'Severe weather conditions reducing safety';
  if (score > 33) return 'Adverse weather conditions present';
  return 'Weather conditions are favourable';
}

/**
 * Generate a human-readable description for the time-of-day factor.
 * @param {number} score - 0-100
 * @returns {string}
 */
function describeTimeOfDay(score) {
  if (score > 66) return 'Late night hours (high risk period)';
  if (score > 33) return 'Evening hours (moderate risk period)';
  return 'Daytime hours (low risk)';
}

/**
 * Generate a human-readable description for the crowd factor.
 * @param {number} score - 0-100
 * @returns {string}
 */
function describeCrowd(score) {
  if (score > 66) return 'High crowd density';
  if (score > 33) return 'Moderate crowd density';
  return 'Low crowd density';
}

/** Map of factor name to description function */
const DESCRIBERS = {
  crime: describeCrime,
  infrastructure: describeInfrastructure,
  weather: describeWeather,
  timeOfDay: describeTimeOfDay,
  crowd: describeCrowd,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute a full RiskBreakdown for a zone.
 *
 * For each factor:
 *  - contribution = score x weight  (or 0 if the source is excluded)
 *  - description  = human-readable string based on score range
 *
 * topContributors is populated with the top 3 factor names ranked by
 * contribution descending (excluded sources contribute 0 and rank last).
 *
 * @param {string} zoneId
 * @param {import('../../models').RiskResult} riskResult
 * @param {import('../../models').RiskInputs} inputs
 * @returns {import('../../models').RiskBreakdown}
 */
function explainRiskScore(zoneId, riskResult, inputs) {
  const { weights } = config;
  const excluded = new Set(riskResult.excludedSources || []);

  const factorDetails = {};

  for (const factor of FACTORS) {
    const isExcluded = excluded.has(factor);
    const rawScore = inputs[factor] !== null && inputs[factor] !== undefined ? inputs[factor] : 0;
    const score = isExcluded ? 0 : rawScore;
    const weight = weights[factor];
    const contribution = isExcluded ? 0 : score * weight;
    const description = isExcluded ? 'Data unavailable' : DESCRIBERS[factor](score);

    factorDetails[factor] = { score, weight, contribution, description };
  }

  const topContributors = getTopContributors(factorDetails);

  return {
    zoneId,
    crime: factorDetails.crime,
    infrastructure: factorDetails.infrastructure,
    weather: factorDetails.weather,
    timeOfDay: factorDetails.timeOfDay,
    crowd: factorDetails.crowd,
    topContributors,
    confidence: riskResult.confidence,
    excludedSources: riskResult.excludedSources || [],
  };
}

/**
 * Return the top 3 factor names sorted by contribution descending.
 *
 * Accepts either a full RiskBreakdown or a plain object mapping factor names
 * to FactorDetail objects (as produced internally by explainRiskScore).
 *
 * @param {import('../../models').RiskBreakdown | Object} breakdown
 * @returns {[string, string, string]}
 */
function getTopContributors(breakdown) {
  return FACTORS
    .slice()
    .sort((a, b) => (breakdown[b] ? breakdown[b].contribution : 0) - (breakdown[a] ? breakdown[a].contribution : 0))
    .slice(0, 3);
}

/**
 * Return a single human-readable string summarising the RiskBreakdown.
 *
 * Format:
 *   "Risk score driven by: <factor1> (<contribution>), <factor2> (<contribution>), <factor3> (<contribution>)."
 *
 * @param {import('../../models').RiskBreakdown} breakdown
 * @returns {string}
 */
function formatExplanation(breakdown) {
  const top = breakdown.topContributors || getTopContributors(breakdown);
  const parts = top.map((factor) => {
    const detail = breakdown[factor];
    const contribution = detail ? detail.contribution.toFixed(1) : '0.0';
    return `${factor} (${contribution})`;
  });
  return `Risk score driven by: ${parts.join(', ')}.`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  explainRiskScore,
  getTopContributors,
  formatExplanation,
};
