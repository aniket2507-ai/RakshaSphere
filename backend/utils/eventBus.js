/**
 * EventBus — singleton Node.js EventEmitter for inter-service communication.
 *
 * Services must not import each other directly; all cross-service
 * communication happens by emitting and listening to events on this bus.
 *
 * Usage:
 *   const eventBus = require('./eventBus');
 *   eventBus.emit('issue:created', { reportId, zoneId, type });
 *   eventBus.on('risk:updated', ({ zoneId, score }) => { ... });
 */

const { EventEmitter } = require('events');

const eventBus = new EventEmitter();

// Raise the default listener limit to accommodate multiple service subscribers
eventBus.setMaxListeners(50);

module.exports = eventBus;
