/**
 * Location_Service — manages live user location tracking sessions.
 *
 * Sessions are stored in-memory only; no persistence.
 * Emits `location:cluster` on EventBus when crowd density in a zone reaches
 * the threshold (5+ users), so the Risk_Scorer can update the crowd factor.
 */

const eventBus = require('../../utils/eventBus');

/** @type {Map<string, { location: {lat:number,lng:number}|null, startedAt: string, zoneId: string|null }>} */
const sessions = new Map();

/** Minimum number of users in the same zone to trigger a cluster event. */
const CLUSTER_THRESHOLD = 5;

/**
 * Map a GPS coordinate to a zone identifier.
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
function toZoneId(lat, lng) {
  return `z-${Math.floor(lat)}-${Math.floor(lng)}`;
}

/**
 * Count how many active sessions are in a given zone.
 * @param {string} zoneId
 * @returns {number}
 */
function countUsersInZone(zoneId) {
  let count = 0;
  for (const session of sessions.values()) {
    if (session.zoneId === zoneId) count++;
  }
  return count;
}

/**
 * Normalise a raw user count to a 0-100 density score.
 * Uses a simple linear scale capped at 100.
 * @param {number} count
 * @returns {number}
 */
function toDensityScore(count) {
  return Math.min(100, Math.round((count / CLUSTER_THRESHOLD) * 50));
}

/**
 * Create a tracking session for the user.
 * If a session already exists it is replaced (idempotent restart).
 * @param {string} userId
 */
function startTracking(userId) {
  sessions.set(userId, {
    location: null,
    startedAt: new Date().toISOString(),
    zoneId: null,
  });
}

/**
 * Remove the user's tracking session.
 * After this call, getLocation(userId) returns null.
 * @param {string} userId
 */
function stopTracking(userId) {
  sessions.delete(userId);
}

/**
 * Store the latest location for an active session.
 * No-op if the user has no active session.
 * Emits location:cluster when the user's zone reaches CLUSTER_THRESHOLD users.
 * @param {string} userId
 * @param {{ lat: number, lng: number }} location
 */
function updateLocation(userId, location) {
  const session = sessions.get(userId);
  if (!session) return;

  const zoneId = toZoneId(location.lat, location.lng);
  session.location = location;
  session.zoneId = zoneId;

  const density = countUsersInZone(zoneId);
  if (density >= CLUSTER_THRESHOLD) {
    eventBus.emit('location:cluster', {
      zoneId,
      density: toDensityScore(density),
    });
  }
}

/**
 * Return the current location for a user, or null if no active session.
 * @param {string} userId
 * @returns {{ lat: number, lng: number } | null}
 */
function getLocation(userId) {
  const session = sessions.get(userId);
  if (!session) return null;
  return session.location;
}

module.exports = { startTracking, stopTracking, updateLocation, getLocation };
