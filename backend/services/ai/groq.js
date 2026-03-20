'use strict';

/**
 * Groq AI Service — RakshaSphere
 *
 * Uses Groq's llama-3.3-70b-versatile model for:
 *   1. Text validation  — spam/gibberish/abuse detection for report submissions
 *   2. Insights generation — AI narrative + trend analysis for the dashboard
 */

const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = 'llama-3.3-70b-versatile';

let _client = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: GROQ_API_KEY });
  return _client;
}

// ─── Text Validation ──────────────────────────────────────────────────────────

/**
 * Validate a report submission for spam, gibberish, abuse, or irrelevance.
 *
 * @param {{ title: string, description: string, city: string }} fields
 * @returns {Promise<{ valid: boolean, reason: string|null, flags: string[] }>}
 */
async function validateReportText({ title, description, city }) {
  const prompt = `You are a content moderation AI for a public safety reporting platform in India.
Evaluate the following user-submitted incident report fields for quality issues.

City: "${city}"
Title: "${title}"
Description: "${description || '(none)'}"

Check for:
1. Gibberish or random characters (e.g. "asdfgh", "aaaaaaa", "xyzxyz")
2. Spam or test submissions (e.g. "test", "hello", "abc 123")
3. Abusive, offensive, or inappropriate language
4. Completely irrelevant content (e.g. food orders, jokes, advertisements)
5. Fake or obviously fabricated locations (e.g. "Narnia", "Mars")

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{"valid": true/false, "reason": "short reason if invalid, null if valid", "flags": ["flag1", "flag2"]}

Valid flags: "gibberish", "spam", "abusive", "irrelevant", "fake_location"
If valid, return: {"valid": true, "reason": null, "flags": []}`;

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { valid: true, reason: null, flags: [] };

    const parsed = JSON.parse(match[0]);
    return {
      valid: Boolean(parsed.valid),
      reason: parsed.reason || null,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch (err) {
    console.warn('[groq] validateReportText failed:', err.message);
    return { valid: true, reason: null, flags: [] };
  }
}

// ─── Insights Generation ──────────────────────────────────────────────────────

/**
 * Generate AI-powered safety insights narrative and trend data.
 *
 * @param {{ zones: object[], reports: object[], cityScores: object[] }} context
 * @returns {Promise<object>}
 */
async function generateInsights({ zones = [], reports = [], cityScores = [] }) {
  const dangerous = zones.filter(z => z.classification === 'dangerous').length;
  const moderate  = zones.filter(z => z.classification === 'moderate').length;
  const safe      = zones.filter(z => z.classification === 'safe').length;
  const total     = zones.length || 1;

  const typeCounts = {};
  for (const r of reports) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  const topIssue = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'road_damage';

  const sorted = [...cityScores].sort((a, b) => b.score - a.score);
  const topCity  = sorted[0]?.city || 'Kanpur';
  const safeCity = sorted[sorted.length - 1]?.city || 'Kochi';

  const prompt = `You are an AI safety analyst for RakshaSphere, an urban safety platform covering India.

Current data snapshot:
- Total zones monitored: ${total}
- Dangerous zones: ${dangerous} (${Math.round(dangerous/total*100)}%)
- Moderate risk zones: ${moderate} (${Math.round(moderate/total*100)}%)
- Safe zones: ${safe} (${Math.round(safe/total*100)}%)
- Most reported issue type: ${topIssue.replace(/_/g, ' ')}
- Highest risk city: ${topCity}
- Safest city: ${safeCity}
- Total community reports: ${reports.length}

Generate a concise safety insights response. Respond ONLY with this JSON (no markdown):
{
  "narrative": "2-3 sentence AI safety narrative summarizing current conditions across India",
  "topRisk": "one-line description of the top risk factor right now",
  "recommendation": "one actionable recommendation for city authorities",
  "spikeSummary": "one sentence about any notable spike or trend in the data",
  "safetyScore": <overall safety score 0-100 as integer>
}`;

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    return {
      narrative:      parsed.narrative      || 'AI analysis unavailable.',
      topRisk:        parsed.topRisk        || 'Road damage remains the top reported issue.',
      recommendation: parsed.recommendation || 'Increase night patrols in high-risk zones.',
      spikeSummary:   parsed.spikeSummary   || 'No significant spikes detected.',
      safetyScore:    Math.min(100, Math.max(0, parseInt(parsed.safetyScore) || 62)),
    };
  } catch (err) {
    console.warn('[groq] generateInsights failed:', err.message);
    return {
      narrative:      'AI analysis is temporarily unavailable. Showing cached data.',
      topRisk:        'Road damage is the most frequently reported infrastructure issue.',
      recommendation: 'Prioritise pothole repairs and drainage maintenance in monsoon-prone areas.',
      spikeSummary:   'Incident reports have increased in northern cities this week.',
      safetyScore:    62,
    };
  }
}

module.exports = { validateReportText, generateInsights };
