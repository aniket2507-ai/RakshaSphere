import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const THROTTLE_MS = 2500;   // emit location update at most every 2.5s
const MAX_HISTORY = 200;    // cap trail length

export default function useLocationTracking(userId) {
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const watchIdRef    = useRef(null);
  const pushTimerRef  = useRef(null);
  const lastEmitRef   = useRef(0);   // timestamp of last throttled emit

  const pushUpdate = useCallback((coords) => {
    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/location/update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, location: { lat: coords.latitude, lng: coords.longitude } }),
        });
        if (res.ok) { const d = await res.json(); setZoneId(d.zoneId); }
      } catch (_) {}
    }, 5000);
  }, [userId]);

  const handlePosition = useCallback((pos) => {
    const now = Date.now();
    if (now - lastEmitRef.current < THROTTLE_MS) return;
    lastEmitRef.current = now;

    const coords = {
      latitude:  pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy:  pos.coords.accuracy,
      heading:   pos.coords.heading,
    };

    setLocation(coords);
    setLocationHistory((prev) => {
      const next = [...prev, [coords.latitude, coords.longitude]];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    pushUpdate(coords);
  }, [pushUpdate]);

  const enable = useCallback(() => {
    if (!navigator.geolocation) { setPermissionDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setPermissionDenied(false);
        setTracking(true);
        handlePosition(pos);
        try {
          await fetch(`${BASE_URL}/api/location/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
        } catch (_) {}
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          (err) => console.warn('[useLocationTracking] watch error:', err.message),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      },
      (err) => { console.warn('[useLocationTracking] permission error:', err.message); setPermissionDenied(true); },
      { enableHighAccuracy: true }
    );
  }, [userId, handlePosition]);

  const disable = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearTimeout(pushTimerRef.current);
    setTracking(false);
    setLocation(null);
    setLocationHistory([]);
    setZoneId(null);
    try {
      await fetch(`${BASE_URL}/api/location/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (_) {}
  }, [userId]);

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    clearTimeout(pushTimerRef.current);
  }, []);

  return { tracking, location, locationHistory, zoneId, permissionDenied, enable, disable };
}
