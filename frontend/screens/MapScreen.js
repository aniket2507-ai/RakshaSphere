/**
 * MapScreen — traffic-aware navigation screen.
 * Uses Google Maps JS API (via RouteMap) with real-time traffic.
 * Zoom-filtered risk zones, live location tracking, off-route detection.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';

import RouteMap from '../components/RouteMap';
import NavigationPanel from '../components/NavigationPanel';
import ZoneDetailPanel from '../components/ZoneDetailPanel';
import RouteAnalysisPanel from '../components/RouteAnalysisPanel';
import SOSButton from '../components/SOSButton';
import WeatherWidget from '../components/WeatherWidget';
import useLocation from '../hooks/useLocation';
import useNavigation from '../hooks/useNavigation';
import { geocode } from '../services/routeService';
import { geocodeQuery } from '../services/googleMapsService';
import sseClient from '../services/sseClient';

// ── CSS ───────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  if (!document.getElementById('mapscreen-css')) {
    const s = document.createElement('style');
    s.id = 'mapscreen-css';
    s.textContent = `
      .ms-search-bar {
        background: rgba(255,255,255,0.97);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      }
      .ms-fab {
        background: rgba(255,255,255,0.97);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        border-radius: 50%; box-shadow: 0 3px 12px rgba(0,0,0,0.18);
        transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer;
      }
      .ms-fab:hover { transform: scale(1.06); box-shadow: 0 5px 18px rgba(0,0,0,0.22); }
      .ms-fab-nav   { background: linear-gradient(135deg, #1976D2, #0D47A1) !important; }
      .ms-fab-stop  { background: linear-gradient(135deg, #E53935, #B71C1C) !important; }
      .ms-fab-follow { border: 2.5px solid #1976D2 !important; background: #E3F2FD !important; }
      .ms-recalc-banner {
        background: linear-gradient(90deg, #E65100, #BF360C);
        border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      }
    `;
    document.head.appendChild(s);
  }
}

const BASE_URL       = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const USER_ID        = 'user-001';
const DEFAULT_CENTER = [28.6139, 77.209];

export default function MapScreen() {
  const { tracking, location, locationHistory, permissionDenied, start, stop } = useLocation();
  const userLatLng = location ? [location.latitude, location.longitude] : null;

  const nav = useNavigation();

  const [zones, setZones]               = useState([]);
  const [datasetZones, setDatasetZones] = useState([]);
  const [districtZones, setDistrictZones] = useState([]);
  const [sampleZones, setSampleZones]   = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  const [destInput, setDestInput]     = useState('');
  const [showPanel, setShowPanel]     = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [followUser, setFollowUser]   = useState(false);

  const [proximityAlert, setProximityAlert] = useState(null);
  const alertTimerRef   = useRef(null);
  const datasetFetchRef = useRef(null);

  // Cap zones: top 20 district by score desc, top 15 dataset by score desc
  const topDataset  = [...datasetZones].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 15);
  const topDistrict = [...districtZones].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
  const allZones    = [...zones, ...topDataset, ...topDistrict, ...sampleZones];

  // ── Zone loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`${BASE_URL}/api/risk/zones`)
      .then(r => r.json())
      .then(d => setZones(d.zones || []))
      .catch(e => console.warn('[MapScreen] zones:', e.message));
  }, []);

  useEffect(() => {
    clearTimeout(datasetFetchRef.current);
    datasetFetchRef.current = setTimeout(() => {
      let url = `${BASE_URL}/api/risk/dataset-zones?radiusKm=500`;
      if (userLatLng) url += `&lat=${userLatLng[0]}&lng=${userLatLng[1]}`;
      fetch(url)
        .then(r => r.json())
        .then(d => setDatasetZones(d.zones || []))
        .catch(e => console.warn('[MapScreen] dataset-zones:', e.message));
    }, 800);
  }, [userLatLng?.[0], userLatLng?.[1]]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/risk/district-zones?radiusKm=2000`)
      .then(r => r.json())
      .then(d => setDistrictZones(d.zones || []))
      .catch(e => console.warn('[MapScreen] district-zones:', e.message));
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/risk/sample-zones`)
      .then(r => r.json())
      .then(d => setSampleZones(d.zones || []))
      .catch(e => console.warn('[MapScreen] sample-zones:', e.message));
  }, []);

  // ── SSE risk updates ────────────────────────────────────────────────────────

  useEffect(() => {
    sseClient.subscribe('risk:updated', ({ zoneId, score, classification, color }) => {
      setZones(prev => prev.map(z => z.zoneId === zoneId ? { ...z, score, classification, color } : z));
    });
    sseClient.subscribe('risk:threshold_crossed', ({ zoneId, newScore, color }) => {
      setZones(prev => prev.map(z => z.zoneId === zoneId ? { ...z, score: newScore, color } : z));
      setProximityAlert({ zoneId, score: newScore });
      clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setProximityAlert(null), 8000);
    });
    return () => sseClient.unsubscribe();
  }, []);

  // ── Off-route / arrival check ───────────────────────────────────────────────

  useEffect(() => {
    if (userLatLng) nav.checkPosition(userLatLng);
  }, [userLatLng?.[0], userLatLng?.[1]]);

  // ── Search ──────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!destInput.trim()) return;
    try {
      let coords = null;
      try { coords = await geocodeQuery(destInput); } catch (_) {}
      if (!coords) coords = await geocode(destInput);
      if (!coords) { nav.setRouteError('Location not found.'); return; }
      await nav.planRoute(userLatLng || DEFAULT_CENTER, coords);
      setShowPanel(true);
    } catch (_) {}
  }, [destInput, userLatLng, nav]);

  // ── Map click → destination ─────────────────────────────────────────────────

  const handleMapClick = useCallback((latlng) => {
    if (nav.isNavigating) return;
    const dest = [latlng.lat, latlng.lng];
    setDestInput(`${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`);
    nav.planRoute(userLatLng || DEFAULT_CENTER, dest).then(() => setShowPanel(true)).catch(() => {});
  }, [nav.isNavigating, userLatLng, nav]);

  // ── Navigation controls ─────────────────────────────────────────────────────

  const startNavigation = useCallback(() => {
    if (!tracking) start();
    nav.startNavigation(userLatLng);
    setFollowUser(true);
    // Open Google Maps in browser for live turn-by-turn navigation
    if (nav.destination) {
      const [dLat, dLng] = nav.destination;
      const origin = userLatLng ? `${userLatLng[0]},${userLatLng[1]}` : '';
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dLat},${dLng}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  }, [tracking, start, userLatLng, nav]);

  const stopNavigation = useCallback(() => {
    nav.stopNavigation();
    setFollowUser(false);
    setShowPanel(false);
    setDestInput('');
  }, [nav]);

  const clearRoute = useCallback(() => {
    stopNavigation();
    nav.setRouteError(null);
  }, [stopNavigation, nav]);

  const panelHeight = showPanel && nav.fastest ? 260 : 0;

  return (
    <View style={s.root}>
      {/* Map — RouteMap renders its own <div>, no MapContainer needed */}
      <View style={s.mapFill}>
        <RouteMap
          userLatLng={userLatLng}
          destCoords={nav.destination}
          destLabel={destInput}
          locationHistory={locationHistory}
          fastest={nav.fastest}
          safest={nav.safest}
          activeRoute={nav.activeRoute}
          zones={allZones}
          isNavigating={nav.isNavigating}
          followUser={followUser}
          onMapClick={handleMapClick}
          onZoneClick={setSelectedZoneId}
          arrived={nav.arrived}
        />
      </View>

      {/* Search bar */}
      <div className="ms-search-bar" style={{
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
      }}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search destination or tap map…"
          placeholderTextColor="#999"
          value={destInput}
          onChangeText={setDestInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {destInput.length > 0 && (
          <TouchableOpacity onPress={clearRoute}>
            <Text style={s.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
        {nav.routeLoading && <ActivityIndicator size="small" color="#1976D2" style={{ marginLeft: 6 }} />}
      </div>

      {/* FAB column */}
      <View style={s.fabCol}>
        <div
          className={`ms-fab${followUser ? ' ms-fab-follow' : ''}`}
          style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setFollowUser(true); if (!tracking) start(); }}
        >
          <Text style={s.fabIcon}>📍</Text>
        </div>

        <div
          className="ms-fab"
          style={{
            width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: tracking ? '2.5px solid #E53935' : 'none',
            background: tracking ? '#FFEBEE' : undefined,
          }}
          onClick={tracking ? () => { stop(); setFollowUser(false); } : start}
        >
          <Text style={s.fabIcon}>{tracking ? '🔴' : '📡'}</Text>
        </div>

        {nav.destination && !nav.isNavigating && nav.fastest && (
          <div
            className="ms-fab ms-fab-nav"
            style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={startNavigation}
          >
            <Text style={[s.fabIcon, { color: '#fff' }]}>▶</Text>
          </div>
        )}

        {nav.isNavigating && (
          <div
            className="ms-fab ms-fab-stop"
            style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={stopNavigation}
          >
            <Text style={[s.fabIcon, { color: '#fff' }]}>⏹</Text>
          </div>
        )}
      </View>

      {/* Zone count badge */}
      {allZones.length > 0 && (
        <View style={s.zoneBadge} pointerEvents="none">
          <View style={s.zoneDot} />
          <Text style={s.zoneBadgeText}>{allZones.length} zones live</Text>
        </View>
      )}

      {/* Route legend */}
      {(nav.fastest || nav.safest) && (
        <View style={s.segLegend} pointerEvents="none">
          {[['#4CAF50', 'Low traffic'], ['#FFA726', 'Moderate'], ['#EF5350', 'Heavy']].map(([c, l]) => (
            <View key={l} style={s.segLegendItem}>
              <View style={[s.segLegendDot, { backgroundColor: c }]} />
              <Text style={s.segLegendText}>{l}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recalculating banner */}
      {nav.recalculating && (
        <div className="ms-recalc-banner" style={{
          position: 'absolute', top: 80, left: 16, right: 72, zIndex: 1001,
          display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
        }}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={s.bannerText}>Recalculating route…</Text>
        </div>
      )}

      {proximityAlert && !nav.recalculating && (
        <View style={s.alertBanner}>
          <Text style={s.alertText}>⚠️ Risk spike — zone {proximityAlert.zoneId} (score {proximityAlert.score})</Text>
          <TouchableOpacity onPress={() => setProximityAlert(null)}>
            <Text style={s.bannerDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {permissionDenied && (
        <View style={[s.alertBanner, { backgroundColor: '#E65100' }]}>
          <Text style={s.alertText}>📵 Location denied — enable in browser settings</Text>
        </View>
      )}

      {nav.routeError && (
        <View style={[s.alertBanner, { backgroundColor: '#37474F' }]}>
          <Text style={s.alertText}>{nav.routeError}</Text>
          <TouchableOpacity onPress={() => nav.setRouteError(null)}>
            <Text style={s.bannerDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation panel */}
      {showPanel && nav.fastest && (
        <NavigationPanel
          fastest={nav.fastest}
          safest={nav.safest}
          activeRoute={nav.activeRoute}
          onSelectRoute={nav.setActiveRoute}
          isNavigating={nav.isNavigating}
          onStart={startNavigation}
          onStop={stopNavigation}
          onClose={() => setShowPanel(false)}
          arrived={nav.arrived}
          trafficLevel={nav.trafficLevel}
          usingGoogleMaps={nav.usingGoogleMaps}
          showAnalysis={showAnalysis}
          onToggleAnalysis={() => setShowAnalysis(v => !v)}
        />
      )}

      {/* Weather widget — bottom left */}
      <View style={[s.weatherWrapper, panelHeight > 0 && { bottom: panelHeight + 16 }]}>
        <WeatherWidget
          lat={userLatLng ? userLatLng[0] : DEFAULT_CENTER[0]}
          lng={userLatLng ? userLatLng[1] : DEFAULT_CENTER[1]}
        />
      </View>

      <View style={[s.sosWrapper, panelHeight > 0 && { bottom: panelHeight + 16 }]}>
        <SOSButton userId={USER_ID} location={location} />
      </View>

      <ZoneDetailPanel zoneId={selectedZoneId} zones={allZones} onClose={() => setSelectedZoneId(null)} />

      {showAnalysis && nav.destination && (
        <RouteAnalysisPanel
          zones={allZones}
          origin={userLatLng || DEFAULT_CENTER}
          destination={nav.destination}
          onClose={() => setShowAnalysis(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  mapFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a2e', outlineStyle: 'none' },
  searchClear: { fontSize: 14, color: '#bbb', paddingHorizontal: 6 },
  fabCol: { position: 'absolute', right: 16, top: 80, zIndex: 1000, gap: 10 },
  fabIcon: { fontSize: 18 },
  zoneBadge: {
    position: 'absolute', top: 80, left: 16, zIndex: 1000,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  zoneDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  zoneBadgeText: { fontSize: 11, color: '#333', fontWeight: '600' },
  segLegend: {
    position: 'absolute', top: 116, left: 16, zIndex: 1000,
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  segLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  segLegendDot: { width: 8, height: 8, borderRadius: 4 },
  segLegendText: { fontSize: 10, color: '#444', fontWeight: '600' },
  alertBanner: {
    position: 'absolute', top: 80, left: 16, right: 72, zIndex: 1001,
    backgroundColor: '#B71C1C', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  alertText: { color: '#fff', fontSize: 12, flex: 1 },
  bannerText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bannerDismiss: { color: '#fff', fontSize: 16, marginLeft: 8 },
  sosWrapper: { position: 'absolute', bottom: 40, right: 20, zIndex: 1003 },
  weatherWrapper: { position: 'absolute', bottom: 40, left: 16, zIndex: 1003 },
});
