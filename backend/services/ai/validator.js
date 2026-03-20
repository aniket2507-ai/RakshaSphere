'use strict';

/**
 * validator.js — relevancy and moderation validation logic.
 *
 * Rules:
 *  1. Image must contain an outdoor/road/street scene (SCENE_LABELS).
 *  2. Image must contain at least one infrastructure issue (ISSUE_LABELS).
 *  3. Matching labels must have confidence >= CONFIDENCE_THRESHOLD (70%).
 *  4. Image must not contain unsafe moderation content.
 *
 * Exports:
 *   validateImage(labels, moderationLabels)
 *     → { valid, issueType, severity, confidence, reason, allLabels }
 */

const CONFIDENCE_THRESHOLD = 70; // percent (Rekognition returns 0–100)

// Rekognition label names that indicate an outdoor/road/street scene
const SCENE_LABELS = new Set([
  'Road', 'Street', 'Outdoors', 'Pavement', 'Sidewalk', 'Alley',
  'Path', 'Asphalt', 'Highway', 'Freeway', 'Urban', 'City',
  'Town', 'Neighborhood', 'Infrastructure', 'Construction',
  'Building', 'Architecture', 'Parking Lot', 'Parking',
  'Driveway', 'Intersection', 'Bridge', 'Overpass', 'Underpass',
  'Drain', 'Gutter', 'Curb', 'Walkway', 'Lane',
  // Disaster / natural hazard scenes
  'Nature', 'Landscape', 'Environment', 'Ground', 'Soil', 'Dirt',
  'Field', 'Flood', 'Flooding', 'Water', 'River', 'Lake',
  'Rubble', 'Ruins', 'Wreckage', 'Debris', 'Destruction',
  'Fire', 'Smoke', 'Flame', 'Burning', 'Ash',
  'Earthquake', 'Landslide', 'Mudslide', 'Avalanche',
  'Storm', 'Hurricane', 'Cyclone', 'Tornado', 'Disaster',
  'Hazard', 'Accident', 'Crash', 'Collapsed', 'Collapse',
  'Garbage', 'Trash', 'Waste', 'Litter', 'Pollution',
  'Pothole', 'Crack', 'Damage', 'Broken',
]);

/**
 * Issue label map: Rekognition label name → { issueType, severity }
 * issueType matches the VALID_TYPES set in backend/api/issues.js
 */
const ISSUE_LABEL_MAP = {
  // Garbage / waste
  'Garbage':      { issueType: 'garbage',      severity: 'moderate' },
  'Trash':        { issueType: 'garbage',      severity: 'moderate' },
  'Waste':        { issueType: 'garbage',      severity: 'moderate' },
  'Litter':       { issueType: 'garbage',      severity: 'moderate' },
  'Rubbish':      { issueType: 'garbage',      severity: 'moderate' },
  'Dumpster':     { issueType: 'garbage',      severity: 'moderate' },
  'Landfill':     { issueType: 'garbage',      severity: 'moderate' },
  'Pollution':    { issueType: 'garbage',      severity: 'moderate' },

  // Waterlogging / flooding
  'Flood':        { issueType: 'waterlogging', severity: 'high' },
  'Flooding':     { issueType: 'waterlogging', severity: 'high' },
  'Water':        { issueType: 'waterlogging', severity: 'moderate' },
  'Puddle':       { issueType: 'waterlogging', severity: 'moderate' },
  'Sewage':       { issueType: 'waterlogging', severity: 'moderate' },
  'Drainage':     { issueType: 'waterlogging', severity: 'low' },
  'Inundation':   { issueType: 'waterlogging', severity: 'high' },

  // Low lighting
  'Darkness':     { issueType: 'low_lighting', severity: 'low' },
  'Night':        { issueType: 'low_lighting', severity: 'low' },
  'Shadow':       { issueType: 'low_lighting', severity: 'low' },

  // Road / infrastructure damage
  'Pothole':      { issueType: 'road_damage',  severity: 'moderate' },
  'Crack':        { issueType: 'road_damage',  severity: 'low' },
  'Damage':       { issueType: 'road_damage',  severity: 'moderate' },
  'Broken':       { issueType: 'road_damage',  severity: 'moderate' },
  'Debris':       { issueType: 'road_damage',  severity: 'low' },
  'Rubble':       { issueType: 'road_damage',  severity: 'moderate' },
  'Collapse':     { issueType: 'road_damage',  severity: 'high' },
  'Collapsed':    { issueType: 'road_damage',  severity: 'high' },
  'Demolition':   { issueType: 'road_damage',  severity: 'moderate' },
  'Excavation':   { issueType: 'road_damage',  severity: 'moderate' },
  'Hole':         { issueType: 'road_damage',  severity: 'moderate' },
  'Mud':          { issueType: 'road_damage',  severity: 'low' },
  'Fire':         { issueType: 'road_damage',  severity: 'high' },
  'Smoke':        { issueType: 'road_damage',  severity: 'high' },
  'Flame':        { issueType: 'road_damage',  severity: 'high' },
  'Burning':      { issueType: 'road_damage',  severity: 'high' },
  'Wreckage':     { issueType: 'road_damage',  severity: 'high' },
  'Destruction':  { issueType: 'road_damage',  severity: 'high' },
  'Ruins':        { issueType: 'road_damage',  severity: 'high' },
  'Landslide':    { issueType: 'road_damage',  severity: 'high' },
  'Mudslide':     { issueType: 'road_damage',  severity: 'high' },
  'Earthquake':   { issueType: 'road_damage',  severity: 'high' },
  'Avalanche':    { issueType: 'road_damage',  severity: 'high' },
  'Storm':        { issueType: 'road_damage',  severity: 'high' },
  'Hurricane':    { issueType: 'road_damage',  severity: 'high' },
  'Cyclone':      { issueType: 'road_damage',  severity: 'high' },
  'Tornado':      { issueType: 'road_damage',  severity: 'high' },
  'Accident':     { issueType: 'road_damage',  severity: 'high' },
  'Crash':        { issueType: 'road_damage',  severity: 'high' },
};

// Moderation parent/label names that trigger rejection
const UNSAFE_MODERATION_PARENTS = new Set([
  'Explicit Nudity', 'Violence', 'Visually Disturbing',
  'Hate Symbols', 'Drugs', 'Tobacco', 'Gambling',
]);

/**
 * Validate Rekognition output against relevancy rules.
 *
 * @param {Array<{ name: string, confidence: number, parents: string[] }>} labels
 * @param {Array<{ name: string, confidence: number, parentName: string }>} moderationLabels
 * @returns {{
 *   valid: boolean,
 *   issueType: string|null,
 *   severity: string|null,
 *   confidence: number,
 *   reason: string|null,
 *   allLabels: string[]
 * }}
 */
function validateImage(labels, moderationLabels) {
  const allLabels = labels.map(l => l.name);

  // 1. Content moderation — reject unsafe images
  for (const mod of moderationLabels) {
    if (mod.confidence >= CONFIDENCE_THRESHOLD) {
      const unsafe = UNSAFE_MODERATION_PARENTS.has(mod.parentName)
        || UNSAFE_MODERATION_PARENTS.has(mod.name);
      if (unsafe) {
        return {
          valid: false, issueType: null, severity: null,
          confidence: mod.confidence,
          reason: `Image contains inappropriate content: ${mod.name}`,
          allLabels,
        };
      }
    }
  }

  // 2. Scene check — must show outdoor/road/street/disaster context
  // If a high-confidence issue label is present, skip scene check (disaster photos)
  const hasHighConfidenceIssue = labels.some(
    l => l.confidence >= CONFIDENCE_THRESHOLD && ISSUE_LABEL_MAP[l.name]
  );

  const sceneMatch = labels.find(
    l => SCENE_LABELS.has(l.name) && l.confidence >= CONFIDENCE_THRESHOLD
  );

  if (!sceneMatch && !hasHighConfidenceIssue) {
    return {
      valid: false, issueType: null, severity: null, confidence: 0,
      reason: 'Image does not appear to show an outdoor, road, or disaster scene',
      allLabels,
    };
  }

  // 3. Issue check — must contain a relevant infrastructure issue
  let bestIssue = null;
  let bestConfidence = 0;

  for (const label of labels) {
    if (label.confidence < CONFIDENCE_THRESHOLD) continue;
    const match = ISSUE_LABEL_MAP[label.name];
    if (match && label.confidence > bestConfidence) {
      bestIssue = match;
      bestConfidence = label.confidence;
    }
  }

  if (!bestIssue) {
    return {
      valid: false, issueType: null, severity: null,
      confidence: sceneMatch.confidence,
      reason: 'No relevant infrastructure issue detected (garbage, water, damage, or lighting)',
      allLabels,
    };
  }

  return {
    valid: true,
    issueType: bestIssue.issueType,
    severity: bestIssue.severity,
    confidence: parseFloat((bestConfidence / 100).toFixed(4)), // normalise to 0–1
    reason: null,
    allLabels,
  };
}

module.exports = { validateImage, CONFIDENCE_THRESHOLD, SCENE_LABELS, ISSUE_LABEL_MAP };
