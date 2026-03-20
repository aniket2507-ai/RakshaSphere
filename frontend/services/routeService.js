/**
 * routeService — fetches and normalises route data.
 * Tries backend /api/routes/compare first, falls back to OSRM directly.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const OSRM_BASE = 'https://router.project-osrm.org';
const NOMINATIM = 'https://nominatim.openstreetmap.org';

// ── Geocoding ─────────────────────────────────────────────────────────────────

export async function geocode(query) {
  const res = await fetch(
    `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data.length) return null;
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// ── Route fetching ────────────────────────────────────────────────────────────

async function fetchFromBackend(from, to) {
  const res = await fetch(`${BASE_URL}/api/routes/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to }),
  });
  if (!res.ok) throw new Error(`Backend route error: ${res.status}`);
  return res.json();
}

async function fetchFromOSRM(from, to) {
  const url =
    `${OSRM_BASE}/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson&alternatives=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');

  const build = (r, type) => {
    const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return {
      type,
      coords,
      segments: [{ coords, color: type === 'fastest' ? '#42A5F5' : '#4CAF50', risk: 0 }],
      distanceKm: (r.distance / 1000).toFixed(1),
      durationMins: Math.round(r.duration / 60),
      riskExposure: 0,
      riskLevel: 'Low',
      highRiskSegments: 0,
    };
  };

  const sorted = [...data.routes].sort((a, b) => a.duration - b.duration);
  return {
    fastest: build(sorted[0], 'fastest'),
    safest:  build(sorted[sorted.length - 1] || sorted[0], 'safest'),
  };
}

export async function fetchRoutes(from, to) {
  try {
    return await fetchFromBackend(from, to);
  } catch (err) {
    console.warn('[routeService] backend failed, using OSRM fallback:', err.message);
    return fetchFromOSRM(from, to);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
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

export function isOffRoute(userLatLng, routeCoords, thresholdM = 50) {
  if (!routeCoords?.length) return false;
  const [uLat, uLng] = userLatLng;
  for (const [rLat, rLng] of routeCoords) {
    if (haversine(uLat, uLng, rLat, rLng) <= thresholdM) return false;
  }
  return true;
}

export function hasArrived(userLatLng, destLatLng, arrivalM = 30) {
  if (!userLatLng || !destLatLng) return false;
  return haversine(userLatLng[0], userLatLng[1], destLatLng[0], destLatLng[1]) <= arrivalM;
}
