/**
 * SOSButton — hold-to-activate SOS with countdown ring.
 * Web (Expo web) implementation using CSS animations + pointer events.
 * Hold 3 seconds to trigger. Visual pulse when active. Cancel with click.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BASE_URL   = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const HOLD_MS    = 3000;
const TICK_MS    = 50;

// ── CSS injection ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('sos-css')) {
  const s = document.createElement('style');
  s.id = 'sos-css';
  s.textContent = `
    @keyframes sos-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(244,67,54,0.7); }
      70%  { box-shadow: 0 0 0 18px rgba(244,67,54,0); }
      100% { box-shadow: 0 0 0 0 rgba(244,67,54,0); }
    }
    @keyframes sos-active-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(158,9,9,0.8); }
      70%  { box-shadow: 0 0 0 22px rgba(158,9,9,0); }
      100% { box-shadow: 0 0 0 0 rgba(158,9,9,0); }
    }
    .sos-btn {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #F44336, #B71C1C);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; user-select: none; position: relative;
      box-shadow: 0 4px 16px rgba(244,67,54,0.5);
      transition: transform 0.1s ease;
    }
    .sos-btn:hover { transform: scale(1.05); }
    .sos-btn.holding { transform: scale(0.96); }
    .sos-btn.active {
      background: linear-gradient(135deg, #9E0909, #5C0000);
      animation: sos-active-pulse 1.4s ease-out infinite;
      box-shadow: 0 4px 20px rgba(158,9,9,0.7);
    }
    .sos-btn.cancelled {
      background: linear-gradient(135deg, #757575, #424242);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .sos-ring {
      position: absolute; top: -5px; left: -5px;
      width: 82px; height: 82px; border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #fff;
      transform-origin: center;
      pointer-events: none;
    }
    .sos-label {
      color: #fff; font-weight: 800; font-size: 15px;
      letter-spacing: 1px; text-align: center; line-height: 1.2;
      pointer-events: none; white-space: pre;
    }
    .sos-countdown {
      color: #fff; font-weight: 900; font-size: 22px;
      pointer-events: none;
    }
    .sos-error {
      position: absolute; bottom: 80px; right: 0;
      background: rgba(183,28,28,0.95); color: #fff;
      font-size: 11px; border-radius: 8px;
      padding: 6px 10px; max-width: 160px; text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: normal; word-break: break-word;
    }
    .sos-status {
      position: absolute; bottom: 80px; right: 0;
      background: rgba(158,9,9,0.95); color: #fff;
      font-size: 11px; border-radius: 8px;
      padding: 6px 10px; text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
    }
    .sos-hint {
      position: absolute; bottom: -22px; left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.85); font-size: 9px;
      white-space: nowrap; pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
  `;
  document.head.appendChild(s);
}

export default function SOSButton({ userId, location }) {
  const [phase, setPhase]         = useState('idle'); // idle | holding | active | cancelling
  const [progress, setProgress]   = useState(0);
  const [alertId, setAlertId]     = useState(null);
  const [error, setError]         = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const holdTimerRef    = useRef(null);
  const tickIntervalRef = useRef(null);
  const holdStartRef    = useRef(null);
  const ringRef         = useRef(null);
  const phaseRef        = useRef(phase);
  phaseRef.current      = phase;

  useEffect(() => () => {
    clearTimeout(holdTimerRef.current);
    clearInterval(tickIntervalRef.current);
  }, []);

  const triggerSOS = useCallback(async () => {
    if (!location) {
      setError('Enable location tracking first.');
      setPhase('idle');
      setTimeout(() => setError(null), 4000);
      return;
    }
    setError(null);
    setStatusMsg('Sending SOS…');
    try {
      const res = await fetch(`${BASE_URL}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, location: { lat: location.latitude, lng: location.longitude } }),
      });
      const data = await res.json();
      if (res.status === 409) { setAlertId(data.alert?.id); setPhase('active'); setStatusMsg('SOS Active'); return; }
      if (!res.ok) { setPhase('idle'); setError(data.message || 'SOS failed'); setStatusMsg(null); return; }
      setAlertId(data.alert?.id);
      setPhase('active');
      setStatusMsg('SOS Active — help notified');
    } catch {
      setPhase('idle');
      setError('Network error. SOS may not have sent.');
      setStatusMsg(null);
    }
  }, [userId, location]);

  const cancelSOS = useCallback(async () => {
    if (!alertId) { setPhase('idle'); setStatusMsg(null); return; }
    setPhase('cancelling');
    setStatusMsg('Cancelling…');
    try {
      const res = await fetch(`${BASE_URL}/api/sos/${alertId}`, { method: 'DELETE' });
      if (res.ok) {
        setPhase('idle'); setAlertId(null); setStatusMsg(null);
      } else {
        const data = await res.json();
        setPhase('active');
        setError(data.message || 'Cancel failed');
        setStatusMsg('SOS Active');
        setTimeout(() => setError(null), 4000);
      }
    } catch {
      setPhase('active');
      setError('Network error while cancelling.');
      setStatusMsg('SOS Active');
      setTimeout(() => setError(null), 4000);
    }
  }, [alertId]);

  const startHold = useCallback((e) => {
    e.preventDefault();
    if (phaseRef.current !== 'idle') return;
    setPhase('holding');
    setProgress(0);
    holdStartRef.current = Date.now();

    tickIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      setProgress(Math.min(1, elapsed / HOLD_MS));
    }, TICK_MS);

    holdTimerRef.current = setTimeout(() => {
      clearInterval(tickIntervalRef.current);
      setProgress(1);
      triggerSOS();
    }, HOLD_MS);
  }, [triggerSOS]);

  const cancelHold = useCallback(() => {
    if (phaseRef.current !== 'holding') return;
    clearTimeout(holdTimerRef.current);
    clearInterval(tickIntervalRef.current);
    setPhase('idle');
    setProgress(0);
  }, []);

  const handleClick = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'active' || p === 'cancelling') cancelSOS();
  }, [cancelSOS]);

  const ringDeg = progress * 360;
  const countdownSec = phase === 'holding' ? Math.ceil((1 - progress) * (HOLD_MS / 1000)) : null;

  const btnClass = ['sos-btn', phase === 'holding' ? 'holding' : '', phase === 'active' ? 'active' : '', phase === 'cancelling' ? 'cancelled' : ''].filter(Boolean).join(' ');

  return (
    <View style={styles.wrapper}>
      {error && <div className="sos-error">{error}</div>}
      {statusMsg && !error && <div className="sos-status">{statusMsg}</div>}

      <div
        className={btnClass}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onClick={handleClick}
        role="button"
        aria-label={phase === 'active' ? 'Cancel SOS alert' : 'Hold 3 seconds to trigger SOS'}
      >
        {phase === 'holding' && (
          <div
            ref={ringRef}
            className="sos-ring"
            style={{ transform: `rotate(${ringDeg}deg)` }}
          />
        )}

        {phase === 'holding' ? (
          <span className="sos-countdown">{countdownSec}</span>
        ) : phase === 'active' ? (
          <span className="sos-label">{'CANCEL\nSOS'}</span>
        ) : phase === 'cancelling' ? (
          <span className="sos-label" style={{ fontSize: 11 }}>…</span>
        ) : (
          <span className="sos-label">SOS</span>
        )}

        {phase === 'active' && <span className="sos-hint">tap to cancel</span>}
        {phase === 'idle' && <span className="sos-hint">hold 3s</span>}
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', position: 'relative' },
});
