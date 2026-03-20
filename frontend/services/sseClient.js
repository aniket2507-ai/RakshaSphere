/**
 * sseClient — SSE client for React Native using fetch streaming.
 * React Native doesn't support EventSource natively.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
const SSE_URL = `${BASE_URL}/api/risk/stream`;
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

class SSEClient {
  constructor() {
    this._handlers = {};
    this._active = false;
    this._reconnectDelay = RECONNECT_DELAY_MS;
    this._reconnectTimer = null;
    this._abortController = null;
  }

  subscribe(eventType, handler) {
    if (!this._handlers[eventType]) this._handlers[eventType] = [];
    this._handlers[eventType].push(handler);
    if (!this._active) this._connect();
  }

  unsubscribe(eventType, handler) {
    if (handler && eventType) {
      if (this._handlers[eventType]) {
        this._handlers[eventType] = this._handlers[eventType].filter(h => h !== handler);
      }
    } else {
      this._active = false;
      this._handlers = {};
      clearTimeout(this._reconnectTimer);
      if (this._abortController) this._abortController.abort();
    }
  }

  _dispatch(eventType, data) {
    (this._handlers[eventType] || []).forEach((h) => {
      try { h(data); } catch (e) { console.warn('[sseClient] handler error:', e); }
    });
  }

  async _connect() {
    this._active = true;
    this._abortController = new AbortController();
    try {
      const response = await fetch(SSE_URL, {
        signal: this._abortController.signal,
        headers: { Accept: 'text/event-stream' },
      });
      if (!response.ok) throw new Error(`SSE connect failed: ${response.status}`);
      this._reconnectDelay = RECONNECT_DELAY_MS;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;

      while (this._active) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              if (currentEvent) this._dispatch(currentEvent, data);
            } catch { /* ignore */ }
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      if (!this._active) return;
      console.warn('[sseClient] reconnecting...', err.message);
    }
    if (this._active) this._scheduleReconnect();
  }

  _scheduleReconnect() {
    this._reconnectTimer = setTimeout(() => {
      if (this._active) this._connect();
    }, this._reconnectDelay);
    this._reconnectDelay = Math.min(this._reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
  }
}

export default new SSEClient();
