/**
 * googleMapsService — Google Maps API integration.
 * Directions API (traffic-aware routing) + Geocoding API.
 */

const API_KEY         = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json';
const GEOCODE_BASE    = 'https://maps.googleapis.com/maps/api/geocode/json';

// ── Polyline decoder ──────────────────────────────────────────────────────────

export function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// ── Traffic helpers ───────────────────────────────────────────────────────────

export function calculateTrafficLevel(durationSecs, durationInTrafficSecs) {
  if (!durationInTrafficSecs || !durationSecs) return 'unknown';
  const ratio = durationInTrafficSecs / durationSecs;
  if (ratio < 1.15) return 'low';
  if (ratio < 1.45) return 'moderate';
  return 'high';
}

export function trafficColor(level) {
  return level === 'low' ? '#4CAF50' : level === 'moderate' ? '#FFA726' : '#EF5350';
}

function buildSegments(steps, overallRatio) {
  return steps.map((step) => {
    const stepRatio = step.duration_in_traffic
      ? step.duration_in_traffic.value / step.duration.value
      : overallRatio;
    const level  = stepRatio < 1.15 ? 'low' : stepRatio < 1.45 ? 'moderate' : 'high';
    const coords = decodePolyline(step.polyline.points);
    return { coords, color: trafficColor(level), risk: level === 'high' ? 2 : level === 'moderate' ? 1 : 0 };
  });
}

// ── Directions API ────────────────────────────────────────────────────────────

export async function getRoute(origin, destination, mode = 'driving') {
  const params = new URLSearchParams({
    origin:         `${origin[0]},${origin[1]}`,
    destination:    `${destination[0]},${destination[1]}`,
    mode,
    departure_time: 'now',
    traffic_model:  'best_guess',
    alternatives:   'true',
    key:            API_KEY,
  });

  const res  = await fetch(`${DIRECTIONS_BASE}?${params}`);
  if (!res.ok) throw new Error(`Directions API HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) throw new Error(`Directions API: ${data.status}`);

  return data.routes.map((route) => {
    const leg                   = route.legs[0];
    const durationSecs          = leg.duration.value;
    const durationInTrafficSecs = leg.duration_in_traffic?.value ?? durationSecs;
    const overallRatio          = durationInTrafficSecs / durationSecs;
    const level                 = calculateTrafficLevel(durationSecs, durationInTrafficSecs);
    const coords                = decodePolyline(route.overview_polyline.points);
    const segments              = buildSegments(leg.steps, overallRatio);

    return {
      coords, segments,
      distanceKm:            (leg.distance.value / 1000).toFixed(1),
      durationMins:          Math.round(durationSecs / 60),
      durationInTrafficMins: Math.round(durationInTrafficSecs / 60),
      trafficLevel:          level,
      riskLevel:             level === 'low' ? 'Low' : level === 'moderate' ? 'Moderate' : 'High',
      highRiskSegments:      segments.filter(s => s.risk === 2).length,
      riskExposure:          segments.filter(s => s.risk > 0).length,
      summary:               route.summary,
    };
  });
}

// ── Geocoding API ─────────────────────────────────────────────────────────────

export async function geocodeQuery(query) {
  const params = new URLSearchParams({ address: query, key: API_KEY });
  const res    = await fetch(`${GEOCODE_BASE}?${params}`);
  const data   = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;
  const { lat, lng } = data.results[0].geometry.location;
  return [lat, lng];
}
