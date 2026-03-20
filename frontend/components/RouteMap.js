/**
 * RouteMap — Google Maps JS API map component.
 *
 * Features:
 *  - Google Maps base tiles + Traffic layer
 *  - Dark custom route polyline (not Google Maps default blue)
 *  - Zoom-adaptive risk zone circles:
 *      zoom < 7  → hidden
 *      zoom 7–9  → only large district zones (radius ≥ 20 km)
 *      zoom 9–11 → all zones at full radius
 *      zoom 11–13→ all zones at 60% radius
 *      zoom ≥ 13 → all zones at 30% radius (street-level detail)
 *  - Safe place markers (green pins) for low-risk zones at zoom ≥ 11
 *  - User location marker + destination marker
 *  - Location trail polyline
 *  - Camera follow / fly-to during navigation
 */
import { useEffect, useRef } from 'react';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

// ── Load Google Maps script once ──────────────────────────────────────────────

let gmapsLoadPromise = null;

function loadGoogleMaps() {
  if (gmapsLoadPromise) return gmapsLoadPromise;
  if (typeof window !== 'undefined' && window.google?.maps) {
    return (gmapsLoadPromise = Promise.resolve());
  }
  gmapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('gm-script');
    if (existing) { existing.addEventListener('load', resolve); return; }
    const s = document.createElement('script');
    s.id = 'gm-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    s.async = true; s.defer = true;
    s.onload  = resolve;
    s.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(s);
  });
  return gmapsLoadPromise;
}

function zoneColor(zone) {
  if (zone.color) return zone.color;
  const c = zone.classification || '';
  if (c === 'High' || c === 'dangerous') return '#EF5350';
  if (c === 'Moderate' || c === 'moderate') return '#FFA726';
  return '#4CAF50';
}

function isSafeZone(zone) {
  const score = zone.score || 0;
  const cls   = zone.classification || '';
  return score <= 33 || cls === 'safe' || cls === 'Low';
}

// Which zones to show at a given zoom level.
// Zoomed OUT → only large district zones (big overview circles).
// Zoomed IN  → only small neighborhood/sample zones (street-level detail).
// Mid zoom   → all zones.
function filterZones(zones, zoom) {
  if (zoom < 7) return [];

  if (zoom < 9) {
    // Very zoomed out — only large district zones (radius ≥ 15 km or source=district)
    return zones.filter(z => z.source === 'district' || (z.radius || 0) >= 15000);
  }

  if (zoom >= 13) {
    // Very zoomed in — hide large district zones, show only small/medium zones
    return zones.filter(z => z.source !== 'district' && (z.radius || 0) < 15000);
  }

  // zoom 9–13 — show everything
  return zones;
}

// Radius scale factor: large zones shrink as you zoom in, small zones stay visible
function radiusScale(zone, zoom) {
  const isLarge = zone.source === 'district' || (zone.radius || 0) >= 15000;

  if (isLarge) {
    // District/large zones: full size when zoomed out, shrink when zoomed in
    if (zoom >= 13) return 0.15;
    if (zoom >= 12) return 0.30;
    if (zoom >= 11) return 0.50;
    if (zoom >= 9)  return 0.80;
    return 1.00;
  } else {
    // Small/neighborhood zones: full size when zoomed in
    if (zoom >= 13) return 1.00;
    if (zoom >= 11) return 0.85;
    if (zoom >= 9)  return 0.70;
    return 1.00;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RouteMap({
  userLatLng, destCoords, destLabel, locationHistory,
  fastest, safest, activeRoute, zones,
  isNavigating, followUser, onMapClick, onZoneClick, arrived,
}) {
  const divRef          = useRef(null);
  const mapRef          = useRef(null);
  const userMarkerRef   = useRef(null);
  const destMarkerRef   = useRef(null);
  const trailRef        = useRef(null);
  const routePolysRef   = useRef([]);
  const circlesRef      = useRef([]);
  const safeMarkersRef  = useRef([]);
  const infoWinRef      = useRef(null);
  const prevFollowRef   = useRef(null);
  const zoomListenerRef = useRef(null);
  const zonesRef        = useRef(zones);
  zonesRef.current      = zones;

  // ── Init map ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !divRef.current) return;
    loadGoogleMaps().then(() => {
      if (mapRef.current) return;
      const G = window.google.maps;
      const map = new G.Map(divRef.current, {
        center:           { lat: 28.6139, lng: 77.209 },
        zoom:             12,
        mapTypeId:        'roadmap',
        disableDefaultUI: true,
        zoomControl:      true,
        zoomControlOptions: { position: G.ControlPosition.RIGHT_CENTER },
        gestureHandling:  'greedy',
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });
      new G.TrafficLayer().setMap(map);
      infoWinRef.current = new G.InfoWindow();
      map.addListener('click', (e) => onMapClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() }));
      mapRef.current = map;
    }).catch(e => console.error('[RouteMap]', e));
  }, []);

  // ── User marker ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (!userLatLng) { userMarkerRef.current?.setMap(null); return; }
    const pos = { lat: userLatLng[0], lng: userLatLng[1] };
    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: pos, map: mapRef.current, zIndex: 1000,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10, fillColor: '#1976D2', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 3,
        },
        title: 'You are here',
      });
    } else {
      userMarkerRef.current.setPosition(pos);
    }
    if (followUser) {
      const p = prevFollowRef.current;
      if (!p || p[0] !== userLatLng[0] || p[1] !== userLatLng[1]) {
        mapRef.current.panTo(pos);
        prevFollowRef.current = userLatLng;
      }
    }
  }, [userLatLng, followUser]);

  // ── Destination marker ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (!destCoords) { destMarkerRef.current?.setMap(null); destMarkerRef.current = null; return; }
    const pos  = { lat: destCoords[0], lng: destCoords[1] };
    const icon = {
      url: arrived
        ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    };
    if (!destMarkerRef.current) {
      destMarkerRef.current = new window.google.maps.Marker({
        position: pos, map: mapRef.current, zIndex: 900, icon,
        title: arrived ? 'Arrived!' : (destLabel || 'Destination'),
      });
    } else {
      destMarkerRef.current.setPosition(pos);
      destMarkerRef.current.setIcon(icon);
    }
  }, [destCoords, destLabel, arrived]);

  // ── Fly-to on navigation start ──────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !isNavigating || !userLatLng) return;
    mapRef.current.panTo({ lat: userLatLng[0], lng: userLatLng[1] });
    mapRef.current.setZoom(16);
  }, [isNavigating]);

  // ── Location trail ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    trailRef.current?.setMap(null);
    if (locationHistory.length < 2) return;
    trailRef.current = new window.google.maps.Polyline({
      path: locationHistory.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: '#1976D2', strokeOpacity: 0.35, strokeWeight: 3,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0', repeat: '12px',
      }],
      map: mapRef.current,
    });
  }, [locationHistory]);

  // ── Route polylines — dark custom color, distinct from Google Maps ───────────

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    routePolysRef.current.forEach(p => p.setMap(null));
    routePolysRef.current = [];

    const cur = activeRoute === 'fastest' ? fastest : safest;
    const inc = activeRoute === 'fastest' ? safest  : fastest;

    // Inactive route — very faint grey
    if (inc && fastest && safest) {
      inc.segments?.forEach(seg => {
        const p = new window.google.maps.Polyline({
          path: seg.coords.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: '#607D8B', strokeOpacity: 0.18, strokeWeight: 5,
          map: mapRef.current, zIndex: 1,
        });
        routePolysRef.current.push(p);
      });
    }

    // Active route — dark navy outline + vivid traffic-colored inner line
    cur?.segments?.forEach(seg => {
      // Outer dark stroke (border/shadow effect)
      const outline = new window.google.maps.Polyline({
        path: seg.coords.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: '#0D1B2A', strokeOpacity: 0.6,
        strokeWeight: isNavigating ? 11 : 9,
        map: mapRef.current, zIndex: 2,
      });
      routePolysRef.current.push(outline);

      // Inner segment — vivid non-Google-blue traffic colors
      const trafficColor =
        seg.color === '#4CAF50' ? '#00C853'   // low traffic  → vivid green
        : seg.color === '#FFA726' ? '#FF6D00' // moderate     → deep orange
        : seg.color === '#EF5350' ? '#D50000' // heavy        → deep red
        : '#3949AB';                          // fallback     → indigo
      const inner = new window.google.maps.Polyline({
        path: seg.coords.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: trafficColor, strokeOpacity: 0.95,
        strokeWeight: isNavigating ? 7 : 5,
        map: mapRef.current, zIndex: 3,
      });
      routePolysRef.current.push(inner);
    });
  }, [fastest, safest, activeRoute, isNavigating]);

  // ── Risk zone circles + safe place markers ──────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    if (zoomListenerRef.current) {
      window.google.maps.event.removeListener(zoomListenerRef.current);
      zoomListenerRef.current = null;
    }

    function clearAll() {
      circlesRef.current.forEach(({ circle, listener }) => {
        window.google.maps.event.removeListener(listener);
        circle.setMap(null);
      });
      circlesRef.current = [];
      safeMarkersRef.current.forEach(m => m.setMap(null));
      safeMarkersRef.current = [];
    }

    function drawZones(zoom) {
      clearAll();
      const visible = filterZones(zonesRef.current, zoom);

      visible.forEach((zone) => {
        if (!zone.lat || !zone.lng) return;
        const color      = zoneColor(zone);
        const baseRadius = zone.radius || (zone.source === 'district' ? 25000 : 5000);
        const radius     = Math.max(300, baseRadius * radiusScale(zone, zoom));
        const safe       = isSafeZone(zone);

        const circle = new window.google.maps.Circle({
          center: { lat: zone.lat, lng: zone.lng },
          radius,
          strokeColor:   color,
          strokeOpacity: safe ? 0.35 : 0.7,
          strokeWeight:  safe ? 1 : 1.5,
          fillColor:     color,
          fillOpacity:   safe ? 0.07 : 0.14,
          map: mapRef.current,
          zIndex: 0,
        });

        const listener = circle.addListener('click', () => {
          onZoneClick?.(zone.zoneId);
          const label = zone.source === 'district'
            ? zone.district
            : (zone.name || zone.city || zone.zoneId);
          const sub = zone.source === 'district'
            ? zone.state
            : (zone.city && zone.name ? zone.city : (zone.crimeCount ? `${zone.crimeCount} crimes` : ''));
          infoWinRef.current.setContent(`
            <div style="font-family:sans-serif;min-width:150px;padding:4px 0">
              <div style="font-weight:700;font-size:13px;margin-bottom:3px">${label}</div>
              ${sub ? `<div style="font-size:11px;color:#666;margin-bottom:4px">${sub}</div>` : ''}
              <span style="background:${color};color:#fff;border-radius:8px;padding:2px 9px;font-size:11px;font-weight:600">${zone.classification || (safe ? 'Safe' : 'Risk')}</span>
              <span style="font-size:20px;font-weight:800;color:${color};margin-left:8px">${zone.score || ''}</span>
              <div style="font-size:10px;color:#aaa;margin-top:5px">Click for details</div>
            </div>
          `);
          infoWinRef.current.setPosition({ lat: zone.lat, lng: zone.lng });
          infoWinRef.current.open(mapRef.current);
        });
        circlesRef.current.push({ circle, listener });

        // Safe place marker — green dot, only at zoom ≥ 11
        if (safe && zoom >= 11) {
          const marker = new window.google.maps.Marker({
            position: { lat: zone.lat, lng: zone.lng },
            map: mapRef.current,
            zIndex: 5,
            title: `✅ Safe: ${zone.name || zone.city || zone.district || zone.zoneId}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#43A047',
              fillOpacity: 0.9,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });
          marker.addListener('click', () => {
            onZoneClick?.(zone.zoneId);
            infoWinRef.current.setContent(`
              <div style="font-family:sans-serif;min-width:140px;padding:4px 0">
                <div style="font-weight:700;font-size:13px;color:#2E7D32;margin-bottom:4px">✅ Safe Zone</div>
                <div style="font-size:12px;font-weight:600;margin-bottom:2px">${zone.name || zone.city || zone.district || zone.zoneId}</div>
                ${(zone.city || zone.state) ? `<div style="font-size:11px;color:#666;margin-bottom:4px">${zone.city || zone.state}</div>` : ''}
                <div style="background:#E8F5E9;border-radius:8px;padding:4px 10px;display:inline-block">
                  <span style="font-size:11px;color:#388E3C;font-weight:700">Risk Score: ${zone.score || 0}</span>
                </div>
              </div>
            `);
            infoWinRef.current.setPosition({ lat: zone.lat, lng: zone.lng });
            infoWinRef.current.open(mapRef.current);
          });
          safeMarkersRef.current.push(marker);
        }
      });
    }

    drawZones(mapRef.current.getZoom() ?? 12);

    zoomListenerRef.current = mapRef.current.addListener('zoom_changed', () => {
      drawZones(mapRef.current.getZoom());
    });

    return () => {
      if (zoomListenerRef.current) {
        window.google?.maps?.event?.removeListener(zoomListenerRef.current);
        zoomListenerRef.current = null;
      }
    };
  }, [zones, onZoneClick]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  useEffect(() => () => {
    routePolysRef.current.forEach(p => p.setMap(null));
    circlesRef.current.forEach(({ circle }) => circle.setMap(null));
    safeMarkersRef.current.forEach(m => m.setMap(null));
    trailRef.current?.setMap(null);
    userMarkerRef.current?.setMap(null);
    destMarkerRef.current?.setMap(null);
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
