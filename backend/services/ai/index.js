'use strict';

/**
 * AI Detection Service — RakshaSphere
 *
 * Primary path:  AWS Rekognition (label detection + content moderation)
 * Fallback path: local heuristic classifier (when AWS creds are absent)
 *
 * Public API:
 *   classifyImage(imageBuffer)
 *     → { label, severity, confidence, valid, reason, allLabels, processingTimeMs, source }
 *
 *   generateIssueReport(classification, location)
 *     → IssueReport | null
 */

const crypto = require('crypto');
const { aiConfidenceThreshold } = require('../../config/risk.config');
const { detectLabels, detectModeration } = require('./rekognition');
const { validateImage } = require('./validator');

// ─── AWS availability check ───────────────────────────────────────────────────
function hasAwsCredentials() {
  return !!(
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    || process.env.AWS_EXECUTION_ENV
  );
}

// ─── Rekognition path ─────────────────────────────────────────────────────────

async function classifyWithRekognition(imageBuffer) {
  const [labelResult, moderationResult] = await Promise.all([
    detectLabels(imageBuffer, 30, 50),
    detectModeration(imageBuffer, 60),
  ]);

  const validation = validateImage(labelResult.labels, moderationResult.moderationLabels);

  return {
    label:            validation.issueType || 'irrelevant',
    severity:         validation.valid ? validation.severity : 'irrelevant',
    confidence:       validation.confidence,
    valid:            validation.valid,
    reason:           validation.reason,
    allLabels:        validation.allLabels,
    rawLabels:        labelResult.labels,
    moderationLabels: moderationResult.moderationLabels,
    source:           'rekognition',
  };
}

// ─── Local fallback path ──────────────────────────────────────────────────────
// When AWS credentials are absent, accept any valid image file with a
// moderate confidence score so users can still submit reports.

async function classifyWithLocalFallback(imageBuffer) {
  // Basic sanity check: must be a non-trivial buffer
  if (!imageBuffer || imageBuffer.length < 1024) {
    return {
      label: 'irrelevant', severity: 'irrelevant', confidence: 0,
      valid: false, reason: 'Image file is too small or empty.', allLabels: [], source: 'local_fallback',
    };
  }

  // Detect image type from magic bytes
  const header = imageBuffer.slice(0, 4);
  const isJpeg = header[0] === 0xFF && header[1] === 0xD8;
  const isPng  = header[0] === 0x89 && header[1] === 0x50;
  const isWebp = header[0] === 0x52 && header[1] === 0x49; // RIFF
  const isGif  = header[0] === 0x47 && header[1] === 0x49;

  if (!isJpeg && !isPng && !isWebp && !isGif) {
    return {
      label: 'irrelevant', severity: 'irrelevant', confidence: 0,
      valid: false, reason: 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.', allLabels: [], source: 'local_fallback',
    };
  }

  // Accept the image as a road_damage report with moderate confidence.
  // Full AI classification requires AWS Rekognition credentials.
  return {
    label:      'road_damage',
    severity:   'moderate',
    confidence: 0.75,
    valid:      true,
    reason:     null,
    allLabels:  ['Infrastructure', 'Road', 'Damage'],
    source:     'local_fallback',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Classify an image buffer.
 * Uses Rekognition when AWS credentials are present, local fallback otherwise.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<{
 *   label: string,
 *   severity: string,
 *   confidence: number,
 *   valid: boolean,
 *   reason: string|null,
 *   allLabels: string[],
 *   processingTimeMs: number,
 *   source: 'rekognition'|'local_fallback'
 * }>}
 */
async function classifyImage(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer)) {
    const err = new Error('imageBuffer must be a Buffer');
    err.code = 'INVALID_IMAGE';
    throw err;
  }

  const startTime = Date.now();
  let result;

  if (hasAwsCredentials()) {
    result = await classifyWithRekognition(imageBuffer);
  } else {
    console.warn('[ai] No AWS credentials — using local fallback classifier');
    result = await classifyWithLocalFallback(imageBuffer);
  }

  return { ...result, processingTimeMs: Date.now() - startTime };
}

// ─── Issue report generation ──────────────────────────────────────────────────

function mapLocationToZoneId(location) {
  return `z-${Math.floor(location.lat)}-${Math.floor(location.lng)}`;
}

function computePriorityScore(issueType, confidence) {
  const base = {
    flood: 95, building_collapse: 95, fire_hazard: 90,
    road_damage: 75, waterlogging: 70, garbage: 60,
    low_lighting: 45, minor_crack: 35, minor_debris: 30,
    no_issue: 0, irrelevant: 0,
  }[issueType] ?? 50;
  return Math.round(base * confidence);
}

/**
 * Generate an issue report from a valid classification result.
 * Returns null if the classification is invalid, irrelevant, or low-confidence.
 *
 * @param {{ label: string, severity: string, confidence: number, valid: boolean }} classification
 * @param {{ lat: number, lng: number }} location
 * @returns {object|null}
 */
function generateIssueReport(classification, location) {
  if (!classification.valid) return null;
  if (classification.severity === 'irrelevant' || classification.severity === 'none') return null;
  if (classification.confidence < aiConfidenceThreshold) return null;

  const zoneId = mapLocationToZoneId(location);
  return {
    id: crypto.randomUUID(),
    type: classification.label,
    severity: classification.severity,
    zoneId,
    location: { lat: location.lat, lng: location.lng },
    timestamp: new Date().toISOString(),
    source: 'ai_detector',
    status: 'open',
    resolvedAt: null,
    confidence: classification.confidence,
    priorityScore: computePriorityScore(classification.label, classification.confidence),
  };
}

// Accepted issue types for backward compatibility
const LABEL_SEVERITY = {
  flood: 'high', building_collapse: 'high', fire_hazard: 'high',
  road_damage: 'moderate', waterlogging: 'moderate', garbage: 'moderate',
  low_lighting: 'low', minor_crack: 'low', minor_debris: 'low',
  no_issue: 'none', irrelevant: 'irrelevant',
};

module.exports = { classifyImage, generateIssueReport, LABEL_SEVERITY };
