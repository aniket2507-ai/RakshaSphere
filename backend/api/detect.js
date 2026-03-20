'use strict';

/**
 * Detection API routes — /api/detect
 * Accepts image uploads, runs AI classification via Rekognition (or local fallback),
 * validates relevancy, creates infrastructure reports on valid images.
 */

const { Router } = require('express');
const multer = require('multer');
const aiDetector = require('../services/ai');
const infraMonitor = require('../services/infrastructure');
const riskEngine = require('../services/risk');

const router = Router();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Unsupported image format. Use JPEG, PNG, WebP, or GIF.');
      err.code = 'INVALID_IMAGE';
      cb(err);
    }
  },
});

// ── POST /api/detect ──────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'INVALID_IMAGE', message: 'No image file provided' });
  }

  let location;
  try {
    location = typeof req.body.location === 'string'
      ? JSON.parse(req.body.location)
      : req.body.location;
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new Error('Invalid location');
    }
  } catch {
    return res.status(400).json({
      error: 'INVALID_LOCATION',
      message: 'location must be JSON with lat and lng numbers',
    });
  }

  try {
    const classification = await aiDetector.classifyImage(req.file.buffer);

    // Relevancy / moderation failed — return 422 with reason
    if (!classification.valid) {
      return res.status(422).json({
        error: 'IMAGE_REJECTED',
        message: classification.reason || 'Image did not pass relevancy validation',
        classification: {
          label:            classification.label,
          severity:         classification.severity,
          confidence:       classification.confidence,
          valid:            false,
          reason:           classification.reason,
          allLabels:        classification.allLabels || [],
          processingTimeMs: classification.processingTimeMs,
          source:           classification.source,
        },
        issueReport: null,
        riskImpact:  null,
      });
    }

    // Valid — create issue report and update risk zone
    const issueReport = aiDetector.generateIssueReport(classification, location);
    let createdReport = null;
    let riskImpact = null;

    if (issueReport) {
      const result = infraMonitor.createReport(issueReport);
      if (!result.deduplicated) {
        createdReport = result;
        const zoneMap = riskEngine.getAllZoneScores();
        const after = zoneMap.get(issueReport.zoneId);
        riskImpact = after ? { zoneId: issueReport.zoneId, currentScore: after.score } : null;
      }
    }

    res.json({
      classification: {
        label:            classification.label,
        severity:         classification.severity,
        confidence:       classification.confidence,
        valid:            true,
        reason:           null,
        allLabels:        classification.allLabels || [],
        processingTimeMs: classification.processingTimeMs,
        source:           classification.source,
      },
      issueReport: createdReport,
      riskImpact,
    });
  } catch (err) {
    if (err.code === 'DETECTION_TIMEOUT') {
      return res.status(503).json({ error: 'DETECTION_TIMEOUT', message: err.message });
    }
    if (err.code === 'INVALID_IMAGE') {
      return res.status(400).json({ error: 'INVALID_IMAGE', message: err.message });
    }
    console.error('[detect] Unexpected error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Detection failed' });
  }
});

router.use((err, _req, res, _next) => {
  if (err.code === 'INVALID_IMAGE' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: err.code, message: err.message });
  }
  res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
});

module.exports = router;
