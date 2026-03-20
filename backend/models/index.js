/**
 * Shared JSDoc type definitions for RakshaSphere.
 *
 * These types are used across all backend services and the API layer.
 * Import this file only for documentation/IDE support — no runtime values are exported.
 */

/**
 * Raw weighted inputs fed into the Risk_Scorer.
 * Each field is a normalised score in the range 0–100.
 * A null value means the data source is unavailable.
 *
 * @typedef {Object} RiskInputs
 * @property {number|null} crime          - Crime activity level (0–100)
 * @property {number|null} infrastructure - Infrastructure issue severity (0–100)
 * @property {number|null} weather        - Weather risk level (0–100)
 * @property {number|null} timeOfDay      - Time-of-day risk factor (0–100)
 * @property {number|null} crowd          - Crowd density risk (0–100)
 */

/**
 * Output of a single risk computation for a zone.
 *
 * @typedef {Object} RiskResult
 * @property {string}   zoneId           - Zone identifier
 * @property {number}   score            - Composite risk score (0–100)
 * @property {'safe'|'moderate'|'dangerous'} classification - Zone classification
 * @property {'low'|'medium'|'high'}     confidence       - Confidence in the score
 * @property {string}   computedAt       - ISO 8601 timestamp of computation
 * @property {string[]} excludedSources  - Data sources omitted due to unavailability
 */

/**
 * Per-factor contribution detail used in the explainability breakdown.
 *
 * @typedef {Object} FactorDetail
 * @property {number} score        - Raw factor score (0–100)
 * @property {number} weight       - Configured weight (e.g. 0.35)
 * @property {number} contribution - Weighted score (score × weight)
 * @property {string} description  - Human-readable explanation
 */

/**
 * Full explainability breakdown for a Risk_Score.
 *
 * @typedef {Object} RiskBreakdown
 * @property {string}       zoneId           - Zone identifier
 * @property {FactorDetail} crime            - Crime factor detail
 * @property {FactorDetail} infrastructure   - Infrastructure factor detail
 * @property {FactorDetail} weather          - Weather factor detail
 * @property {FactorDetail} timeOfDay        - Time-of-day factor detail
 * @property {FactorDetail} crowd            - Crowd factor detail
 * @property {[string, string, string]} topContributors - Top 3 factor names by contribution
 * @property {'low'|'medium'|'high'} confidence         - Confidence level
 * @property {string[]}     excludedSources  - Omitted data sources
 */

/**
 * Predicted future risk for a zone.
 *
 * @typedef {Object} PredictedRisk
 * @property {string}   zoneId                  - Zone identifier
 * @property {1|2|3}    hoursAhead               - Hours into the future
 * @property {number}   predictedScore           - Predicted risk score (0–100)
 * @property {'safe'|'moderate'|'dangerous'} predictedClassification
 * @property {boolean}  isPatternBased           - Whether prediction uses recurring patterns
 * @property {'low'|'medium'|'high'} confidence  - Prediction confidence
 * @property {string}   predictedAt              - ISO 8601 timestamp
 */

/**
 * A detected or manually reported infrastructure problem.
 *
 * @typedef {Object} IssueReport
 * @property {string}   id            - UUID
 * @property {'garbage'|'waterlogging'|'low_lighting'|'road_damage'|'no_issue'} type
 * @property {string}   zoneId        - Zone where the issue was detected
 * @property {{ lat: number, lng: number }} location - GPS coordinates
 * @property {string}   timestamp     - ISO 8601 creation timestamp
 * @property {'ai_detector'|'manual'} source - How the report was created
 * @property {'open'|'in_progress'|'resolved'} status
 * @property {string|null} resolvedAt - ISO 8601 resolution timestamp, or null
 * @property {number}   confidence    - AI confidence score (0.0–1.0)
 * @property {number}   priorityScore - Derived from risk impact
 */

/**
 * An active or cancelled SOS emergency alert.
 *
 * @typedef {Object} SOSAlert
 * @property {string}   id              - UUID
 * @property {string}   userId          - User who triggered the alert
 * @property {{ lat: number, lng: number }} location - Initial GPS coordinates
 * @property {string}   timestamp       - ISO 8601 creation timestamp
 * @property {'active'|'cancelled'}     status
 * @property {Array<{ lat: number, lng: number, timestamp: string }>} locationHistory
 * @property {string}   zoneId          - Zone where the alert was triggered
 */

/**
 * A computed navigation route between two points.
 *
 * @typedef {Object} RouteResult
 * @property {string}   id                  - Route identifier
 * @property {{ lat: number, lng: number }} origin
 * @property {{ lat: number, lng: number }} destination
 * @property {Array<{ lat: number, lng: number }>} waypoints
 * @property {number}   totalDistance       - Distance in metres
 * @property {number}   estimatedTime       - Travel time in seconds
 * @property {number}   cumulativeRiskScore - Sum of zone scores along the path
 * @property {boolean}  isHighRiskWarning   - True when all routes exceed score 75
 */

/**
 * Result of an AI image classification.
 *
 * @typedef {Object} ClassificationResult
 * @property {'garbage'|'waterlogging'|'low_lighting'|'road_damage'|'no_issue'} label
 * @property {number}  confidence       - Confidence score (0.0–1.0)
 * @property {number}  processingTimeMs - Time taken to classify the image
 */

/**
 * Parsed datasets loaded from the data/ directory.
 *
 * @typedef {Object} DataSources
 * @property {Object[]} crimeData    - Parsed records from crime_data.csv
 * @property {Object}   weatherData  - Parsed content of weather_data.json
 * @property {IssueReport[]} issueData - Parsed records from sample_issues.json
 * @property {string}   loadedAt     - ISO 8601 timestamp of last successful load
 * @property {string[]} missingFiles - Files that could not be loaded
 */

module.exports = {};
