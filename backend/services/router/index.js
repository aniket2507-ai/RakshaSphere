'use strict';

/**
 * Router Service — safety-aware routing for RakshaSphere.
 * Fetches OSRM routes, scores risk exposure per segment, returns
 * structured fastest + safest RouteResult objects.
 */

const riskEngine = require('../risk');

const OSRM_BASE = 'https://router.project-osrm.org';

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function zoneIdToCoords(zoneId) {
  const m = zoneId.match(/^z-(-?\d+)-(-?\d+)$/);
  if (!m) return null;
  return { lat: parseFloat(m[1]) + 0.5, lng: parseFloat(m[2]) + 0.5 };
}

function riskAtPoint([lat, lng], zoneMap, radiusM = 6000) {
  let best = null;
  let bestDist = Infinity;
  for (const [zoneId, result] of zoneMap) {
    const c = zoneIdToCoords(zoneId);
    if (!c) continue;
    const d = haversine([lat, lng], [c.lat, c.lng]);
    if (d < radiusM && d < bestDist) {
      bestDist = d;
      best = result;
    }
  }
  return best ? best.score : 0;
}

function scoreToSegmentColor(score) {
  if (score <= 33) return '#4CAF50';
  if (score <= 66) return '#FFA726';
  return '#EF5350';
}

function annotateSegments(coords, zoneMap) {
  const segments = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const mid = [
      (coords[i][0] + coords[i + 1][0]) / 2,
      (coords[i][1] + coords[i + 1][1]) / 2,
    ];
    const risk = riskAtPoint(mid, zoneMap);
    segments.push({ coords: [coords[i], coords[i + 1]], color: scoreToSegmentColor(risk), risk });
  }
  return segments;
}

function computeRiskExposure(coords, zoneMap) {
  if (coords.length < 2) return 0;
  let totalLen = 0;
  let weightedRisk = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const len = haversine(coords[i], coords[i + 1]);
    const mid = [
      (coords[i][0] + coords[i + 1][0]) / 2,
      (coords[i][1] + coords[i + 1][1]) / 2,
    ];
    weightedRisk += riskAtPoint(mid, zoneMap) * len;
    totalLen += len;
  }
  return totalLen > 0 ? Math.round(weightedRisk / totalLen) : 0;
}

function classifyExposure(score) {
  if (score <= 33) return 'Low';
  if (score <= 66) return 'Moderate';
  return 'High';
}

// ── OSRM Fetch ────────────────────────────────────────────────────────────────

async function fetchOSRMRoutes(from, to, alternatives = true) {
  const url =
    `${OSRM_BASE}/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson&alternatives=${alternatives}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');
  return data.routes.map((r) => ({
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceM: r.distance,
    durationS: r.duration,
  }));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compare fastest vs safest route between two [lat,lng] points.
 * Returns { fastest: RouteResult, safest: RouteResult }
 */
async function compareRoutes(from, to) {
  const zoneMap = riskEngine.getAllZoneScores();

  let candidates;
  try {
    candidates = await fetchOSRMRoutes(from, to, true);
  } catch {
    candidates = await fetchOSRMRoutes(from, to, false);
  }

  const scored = candidates.map((r) => ({
    ...r,
    exposure: computeRiskExposure(r.coords, zoneMap),
  }));

  const fastest = scored.reduce((a, b) => (a.durationS <= b.durationS ? a : b));
  const safest = scored.reduce((a, b) => {
    if (a.exposure !== b.exposure) return a.exposure < b.exposure ? a : b;
    return a.distanceM <= b.distanceM ? a : b;
  });

  const buildResult = (raw, type) => {
    const segments = annotateSegments(raw.coords, zoneMap);
    return {
      type,
      coords: raw.coords,
      segments,
      distanceKm: (raw.distanceM / 1000).toFixed(1),
      durationMins: Math.round(raw.durationS / 60),
      riskExposure: raw.exposure,
      riskLevel: classifyExposure(raw.exposure),
      highRiskSegments: segments.filter((s) => s.risk > 66).length,
    };
  };

  return {
    fastest: buildResult(fastest, 'fastest'),
    safest: buildResult(safest, 'safest'),
  };
}

module.exports = { compareRoutes };
