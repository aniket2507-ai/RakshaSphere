'use strict';

/**
 * rekognition.js — thin AWS Rekognition wrapper.
 *
 * Exports:
 *   detectLabels(imageBuffer)     → { labels: [{name, confidence, parents}] }
 *   detectModeration(imageBuffer) → { moderationLabels: [{name, confidence, parentName}] }
 */

const AWS = require('aws-sdk');

// Rekognition client — region from env or default to ap-south-1 (Mumbai)
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || 'ap-south-1',
  // Credentials from: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY env vars,
  // or IAM role if running on EC2/Lambda.
});

const REKOGNITION_TIMEOUT_MS = 8000;

/**
 * Detect labels in an image buffer.
 *
 * @param {Buffer} imageBuffer
 * @param {number} [maxLabels=30]
 * @param {number} [minConfidence=50]
 * @returns {Promise<{ labels: Array<{ name: string, confidence: number, parents: string[] }> }>}
 */
async function detectLabels(imageBuffer, maxLabels = 30, minConfidence = 50) {
  const params = {
    Image: { Bytes: imageBuffer },
    MaxLabels: maxLabels,
    MinConfidence: minConfidence,
  };

  const result = await Promise.race([
    rekognition.detectLabels(params).promise(),
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error('Rekognition detectLabels timed out');
        err.code = 'DETECTION_TIMEOUT';
        reject(err);
      }, REKOGNITION_TIMEOUT_MS)
    ),
  ]);

  const labels = (result.Labels || []).map(l => ({
    name: l.Name,
    confidence: parseFloat((l.Confidence || 0).toFixed(2)),
    parents: (l.Parents || []).map(p => p.Name),
  }));

  return { labels };
}

/**
 * Detect moderation labels in an image buffer.
 *
 * @param {Buffer} imageBuffer
 * @param {number} [minConfidence=60]
 * @returns {Promise<{ moderationLabels: Array<{ name: string, confidence: number, parentName: string }> }>}
 */
async function detectModeration(imageBuffer, minConfidence = 60) {
  const params = {
    Image: { Bytes: imageBuffer },
    MinConfidence: minConfidence,
  };

  const result = await Promise.race([
    rekognition.detectModerationLabels(params).promise(),
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error('Rekognition detectModerationLabels timed out');
        err.code = 'DETECTION_TIMEOUT';
        reject(err);
      }, REKOGNITION_TIMEOUT_MS)
    ),
  ]);

  const moderationLabels = (result.ModerationLabels || []).map(l => ({
    name: l.Name,
    confidence: parseFloat((l.Confidence || 0).toFixed(2)),
    parentName: l.ParentName || '',
  }));

  return { moderationLabels };
}

module.exports = { detectLabels, detectModeration };
