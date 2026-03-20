/**
 * SOS_System — manages emergency alert lifecycle.
 *
 * @module backend/services/sos
 */

const crypto = require('crypto');
const eventBus = require('../../utils/eventBus');

/** @type {Map<string, import('../../models').SOSAlert>} */
const alerts = new Map();

/** @type {Array<{ userId: string, location: { lat: number, lng: number } }>} */
const offlineQueue = [];

/**
 * Map a GPS coordinate to a zone ID using the grid approach.
 * @param {{ lat: number, lng: number }} location
 * @returns {string}
 */
function locationToZoneId({ lat, lng }) {
  return `z-${Math.floor(lat)}-${Math.floor(lng)}`;
}

/**
 * Trigger an SOS alert for a user. If the user already has an active alert,
 * returns the existing alert without creating a duplicate.
 *
 * @param {string} userId
 * @param {{ lat: number, lng: number }} location
 * @returns {import('../../models').SOSAlert}
 */
function triggerSOS(userId, location) {
  // Return existing active alert if one exists for this user
  for (const alert of alerts.values()) {
    if (alert.userId === userId && alert.status === 'active') {
      return alert;
    }
  }

  const alertId = crypto.randomUUID();
  const zoneId = locationToZoneId(location);
  const timestamp = new Date().toISOString();

  /** @type {import('../../models').SOSAlert} */
  const alert = {
    id: alertId,
    userId,
    location,
    timestamp,
    status: 'active',
    locationHistory: [],
    zoneId,
  };

  alerts.set(alertId, alert);
  eventBus.emit('sos:triggered', { alertId, zoneId, userId });

  return alert;
}

/**
 * Cancel an active SOS alert. Idempotent — cancelling an already-cancelled
 * alert is a no-op.
 *
 * @param {string} alertId
 * @throws {Error} ALERT_NOT_FOUND if the alert does not exist
 */
function cancelSOS(alertId) {
  const alert = alerts.get(alertId);
  if (!alert) {
    const err = new Error(`Alert not found: ${alertId}`);
    err.code = 'ALERT_NOT_FOUND';
    throw err;
  }

  if (alert.status === 'cancelled') {
    return; // idempotent no-op
  }

  alert.status = 'cancelled';
  eventBus.emit('sos:cancelled', { alertId, zoneId: alert.zoneId });
}

/**
 * Append a new location to an active alert's location history.
 *
 * @param {string} alertId
 * @param {{ lat: number, lng: number }} location
 * @throws {Error} ALERT_NOT_FOUND if the alert does not exist
 * @throws {Error} ALERT_CANCELLED if the alert is already cancelled
 */
function updateLocation(alertId, location) {
  const alert = alerts.get(alertId);
  if (!alert) {
    const err = new Error(`Alert not found: ${alertId}`);
    err.code = 'ALERT_NOT_FOUND';
    throw err;
  }

  if (alert.status === 'cancelled') {
    const err = new Error(`Alert is cancelled: ${alertId}`);
    err.code = 'ALERT_CANCELLED';
    throw err;
  }

  alert.locationHistory.push({ ...location, timestamp: new Date().toISOString() });
}

/**
 * Return all alerts with status "active".
 *
 * @returns {import('../../models').SOSAlert[]}
 */
function getActiveAlerts() {
  return Array.from(alerts.values()).filter((a) => a.status === 'active');
}

/**
 * Push an alert to the offline queue for later processing.
 *
 * @param {{ userId: string, location: { lat: number, lng: number } }} alert
 */
function queueOfflineAlert(alert) {
  offlineQueue.push(alert);
}

/**
 * Process all queued offline alerts by calling triggerSOS for each, then
 * clear the queue.
 */
function syncOfflineQueue() {
  const queued = offlineQueue.splice(0, offlineQueue.length);
  for (const alert of queued) {
    triggerSOS(alert.userId, alert.location);
  }
}

module.exports = {
  triggerSOS,
  cancelSOS,
  updateLocation,
  getActiveAlerts,
  queueOfflineAlert,
  syncOfflineQueue,
};
