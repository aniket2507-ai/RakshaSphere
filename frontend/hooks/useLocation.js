/**
 * useLocation — high-frequency location tracking hook for navigation.
 * Uses navigator.geolocation.watchPosition with 2-3s updates.
 * Exposes: location, locationHistory, tracking, permissionDenied, start, stop
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const THROTTLE_MS = 2500;
const MAX_HISTORY = 300;
const USER_ID = 'user-001';

export default function useLocation() {
  const [tracking, setTracking]               = useState(false);
  const [location, setLocation]               = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const watchIdRef   = useRef(null);
  const lastEmitRef  = useRef(0);
  const pushTimerRef = useRef(null);

  const pushToBackend = useCallback((coords) => {
    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`${BASE_URL}/api/location/update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: USER_ID, location: { lat: coords.latitude, lng: coords.longitude } }),
        });
      } catch (_) {}
    }, 4000);
  }, []);

  const handlePosition = useCallback((pos) => {
    const now = Date.now();
    if (now - lastEmitRef.current < THROTTLE_MS) return;
    lastEmitRef.current = now;

    const coords = {
      latitude:  pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy:  pos.coords.accuracy,
      heading:   pos.coords.heading,
      speed:     pos.coords.speed,
    };
    setLocation(coords);
    setLocationHistory((prev) => {
      const next = [...prev, [coords.latitude, coords.longitude]];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    pushToBackend(coords);
  }, [pushToBackend]);

  const start = useCallback(() => {
    if (!navigator.geolocation) { setPermissionDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermissionDenied(false);
        setTracking(true);
        handlePosition(pos);
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          (err) => console.warn('[useLocation] watch error:', err.message),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      },
      (err) => { console.warn('[useLocation] permission error:', err.message); setPermissionDenied(true); },
      { enableHighAccuracy: true }
    );
  }, [handlePosition]);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearTimeout(pushTimerRef.current);
    setTracking(false);
    setLocation(null);
    setLocationHistory([]);
  }, []);

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    clearTimeout(pushTimerRef.current);
  }, []);

  return { tracking, location, locationHistory, permissionDenied, start, stop };
}
