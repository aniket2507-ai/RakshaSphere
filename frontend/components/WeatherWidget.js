/**
 * WeatherWidget — compact glassmorphism weather overlay for MapScreen.
 * On mount, requests browser geolocation immediately so weather loads
 * with the user's real live location. Falls back to provided lat/lng prop
 * if geolocation is denied or unavailable.
 * Auto-refreshes every 5 minutes.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Text, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchWeather } from '../services/weatherService';

if (typeof document !== 'undefined' && !document.getElementById('weather-widget-css')) {
  const s = document.createElement('style');
  s.id = 'weather-widget-css';
  s.textContent = `
    .ww-card {
      background: rgba(255,255,255,0.93);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
      border: 1px solid rgba(255,255,255,0.65);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      cursor: pointer; overflow: hidden; user-select: none;
    }
    .ww-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.22); transform: scale(1.02); }
    .ww-icon    { width: 42px; height: 42px; object-fit: contain; }
    .ww-icon-sm { width: 30px; height: 30px; object-fit: contain; }
    .ww-row     { display: flex; align-items: center; gap: 6px; }
    .ww-detail-label { color: #64748b; font-size: 10px; font-weight: 600; min-width: 58px; }
    .ww-detail-val   { color: #1e293b; font-size: 11px; font-weight: 700; }
    .ww-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 6px 0; }
  `;
  document.head.appendChild(s);
}

const REFRESH_MS = 5 * 60 * 1000;

export default function WeatherWidget({ lat: propLat, lng: propLng }) {
  const [weather,  setWeather]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [coords,   setCoords]   = useState(null);
  const timerRef   = useRef(null);
  const hasGeoFix  = useRef(false);

  // ── Step 1: request live browser geolocation on mount ──────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (propLat && propLng) setCoords({ lat: propLat, lng: propLng });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        hasGeoFix.current = true;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Denied or timed out — fall back to prop coords
        if (propLat && propLng) setCoords({ lat: propLat, lng: propLng });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: sync prop coords only if we never got a geo fix ────────────────
  useEffect(() => {
    if (hasGeoFix.current) return; // already have real GPS, ignore prop
    if (propLat && propLng) setCoords({ lat: propLat, lng: propLng });
  }, [propLat, propLng]);

  // ── Step 3: fetch weather whenever coords resolve ───────────────────────────
  const load = useCallback(async (c) => {
    if (!c?.lat || !c?.lng) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(c.lat, c.lng);
      setWeather(data);
    } catch {
      setError('Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    load(coords);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => load(coords), REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [coords, load]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading && !weather) {
    return (
      <div className="ww-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ActivityIndicator size="small" color="#1976D2" />
        <Text style={ww.loadText}>Getting weather…</Text>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div
        className="ww-card"
        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => load(coords)}
      >
        <Text style={ww.errorText}>⚠ {error}</Text>
        <Text style={ww.retryText}>tap to retry</Text>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className="ww-card"
      onClick={() => setExpanded(v => !v)}
      style={{ minWidth: expanded ? 210 : 'auto' }}
    >
      {/* Compact row */}
      <div className="ww-row" style={{ padding: '8px 12px' }}>
        <img className="ww-icon-sm" src={weather.iconUrl} alt={weather.description} />
        <Text style={ww.temp}>{weather.temp}°C</Text>
        <Text style={ww.city} numberOfLines={1}>{weather.city}</Text>
        <Text style={ww.chevron}>{expanded ? '▲' : '▼'}</Text>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          <div className="ww-divider" />
          <div className="ww-row" style={{ marginBottom: 8 }}>
            <img className="ww-icon" src={weather.iconUrl} alt={weather.description} />
            <div>
              <Text style={ww.cityFull}>{weather.city}, {weather.country}</Text>
              <Text style={ww.descFull}>{weather.description}</Text>
            </div>
          </div>
          {[
            ['🌡', 'Feels like', `${weather.feelsLike}°C`],
            ['💧', 'Humidity',   `${weather.humidity}%`],
            ['💨', 'Wind',       `${weather.windSpeed} km/h`],
            weather.visibility != null ? ['👁', 'Visibility', `${weather.visibility} km`] : null,
            ['🔵', 'Pressure',   `${weather.pressure} hPa`],
          ].filter(Boolean).map(([icon, label, val]) => (
            <div key={label} className="ww-row" style={{ marginBottom: 3 }}>
              <span style={{ fontSize: 11, width: 16 }}>{icon}</span>
              <span className="ww-detail-label">{label}</span>
              <span className="ww-detail-val">{val}</span>
            </div>
          ))}
          <Text style={ww.hint}>📍 Live location · refreshes every 5 min</Text>
        </div>
      )}
    </div>
  );
}

const ww = StyleSheet.create({
  loadText: { fontSize: 11, color: '#64748b' },
  errorText: { fontSize: 11, color: '#EF5350' },
  retryText: { fontSize: 10, color: '#94a3b8' },
  temp:     { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  city:     { fontSize: 11, color: '#64748b', flex: 1 },
  chevron:  { fontSize: 9,  color: '#94a3b8', marginLeft: 2 },
  cityFull: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  descFull: { fontSize: 11, color: '#64748b', textTransform: 'capitalize' },
  hint:     { fontSize: 9,  color: '#94a3b8', marginTop: 7, textAlign: 'center' },
});
