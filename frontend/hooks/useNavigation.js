/**
 * useNavigation — manages full navigation lifecycle.
 * Handles: route fetching (Google → OSRM fallback), traffic refresh every 12s,
 * off-route detection, arrival detection, and location tracking.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getRoute } from '../services/googleMapsService';
import { fetchRoutes, isOffRoute, hasArrived } from '../services/routeService';

const REROUTE_THRESHOLD_M  = 80;
const ARRIVAL_THRESHOLD_M  = 30;
const TRAFFIC_REFRESH_MS   = 12000;
const REROUTE_DEBOUNCE_MS  = 3000;

function normaliseGoogleRoutes(googleRoutes) {
  const sorted  = [...googleRoutes].sort((a, b) => a.durationInTrafficMins - b.durationInTrafficMins);
  const fastest = { ...sorted[0], type: 'fastest' };
  const byRisk  = [...googleRoutes].sort((a, b) => a.highRiskSegments - b.highRiskSegments);
  const safest  = { ...byRisk[0], type: 'safest' };
  return { fastest, safest };
}

export default function useNavigation() {
  const [isNavigating, setIsNavigating]       = useState(false);
  const [destination, setDestination]         = useState(null);
  const [fastest, setFastest]                 = useState(null);
  const [safest, setSafest]                   = useState(null);
  const [activeRoute, setActiveRoute]         = useState('safest');
  const [routeLoading, setRouteLoading]       = useState(false);
  const [routeError, setRouteError]           = useState(null);
  const [arrived, setArrived]                 = useState(false);
  const [recalculating, setRecalculating]     = useState(false);
  const [trafficLevel, setTrafficLevel]       = useState(null);
  const [usingGoogleMaps, setUsingGoogleMaps] = useState(false);

  const rerouteTimerRef = useRef(null);
  const trafficTimerRef = useRef(null);
  const lastOriginRef   = useRef(null);

  const currentRoute = activeRoute === 'fastest' ? fastest : safest;

  const computeRoutes = useCallback(async (from, to, silent = false) => {
    if (!silent) { setRouteLoading(true); setRouteError(null); }
    try {
      const googleRoutes = await getRoute(from, to);
      const { fastest: f, safest: s } = normaliseGoogleRoutes(googleRoutes);
      setFastest(f); setSafest(s);
      setTrafficLevel(f.trafficLevel);
      setUsingGoogleMaps(true);
      return { fastest: f, safest: s };
    } catch (googleErr) {
      console.warn('[useNavigation] Google Maps failed, using OSRM:', googleErr.message);
      try {
        const result = await fetchRoutes(from, to);
        setFastest({ ...result.fastest, type: 'fastest', durationInTrafficMins: result.fastest.durationMins, trafficLevel: 'unknown' });
        setSafest({  ...result.safest,  type: 'safest',  durationInTrafficMins: result.safest.durationMins,  trafficLevel: 'unknown' });
        setTrafficLevel('unknown');
        setUsingGoogleMaps(false);
        return result;
      } catch (osrmErr) {
        if (!silent) setRouteError('Could not find a route. Try a different destination.');
        throw osrmErr;
      }
    } finally {
      if (!silent) setRouteLoading(false);
    }
  }, []);

  const startTrafficRefresh = useCallback((from, to) => {
    clearInterval(trafficTimerRef.current);
    trafficTimerRef.current = setInterval(async () => {
      if (!from || !to) return;
      try {
        const googleRoutes = await getRoute(from, to);
        const { fastest: f, safest: s } = normaliseGoogleRoutes(googleRoutes);
        setFastest(f); setSafest(s);
        setTrafficLevel(f.trafficLevel);
      } catch (_) {}
    }, TRAFFIC_REFRESH_MS);
  }, []);

  const stopTrafficRefresh = useCallback(() => {
    clearInterval(trafficTimerRef.current);
  }, []);

  const checkPosition = useCallback((userLatLng) => {
    if (!isNavigating || !userLatLng || !currentRoute || arrived) return;
    if (destination && hasArrived(userLatLng, destination, ARRIVAL_THRESHOLD_M)) {
      setArrived(true); stopTrafficRefresh(); return;
    }
    if (isOffRoute(userLatLng, currentRoute.coords, REROUTE_THRESHOLD_M)) {
      clearTimeout(rerouteTimerRef.current);
      rerouteTimerRef.current = setTimeout(async () => {
        if (!destination) return;
        setRecalculating(true);
        try {
          await computeRoutes(userLatLng, destination, true);
          lastOriginRef.current = userLatLng;
          startTrafficRefresh(userLatLng, destination);
        } finally { setRecalculating(false); }
      }, REROUTE_DEBOUNCE_MS);
    } else {
      clearTimeout(rerouteTimerRef.current);
    }
  }, [isNavigating, currentRoute, arrived, destination, computeRoutes, startTrafficRefresh, stopTrafficRefresh]);

  const planRoute = useCallback(async (from, to) => {
    setDestination(to); setArrived(false);
    lastOriginRef.current = from;
    return computeRoutes(from, to);
  }, [computeRoutes]);

  const startNavigation = useCallback((userLatLng) => {
    if (!destination) return;
    setIsNavigating(true); setArrived(false);
    const origin = userLatLng || lastOriginRef.current;
    if (origin && destination) startTrafficRefresh(origin, destination);
  }, [destination, startTrafficRefresh]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false); setArrived(false);
    setFastest(null); setSafest(null);
    setDestination(null); setTrafficLevel(null);
    setRecalculating(false);
    stopTrafficRefresh();
    clearTimeout(rerouteTimerRef.current);
  }, [stopTrafficRefresh]);

  useEffect(() => () => {
    stopTrafficRefresh();
    clearTimeout(rerouteTimerRef.current);
  }, [stopTrafficRefresh]);

  return {
    isNavigating, destination, fastest, safest, activeRoute,
    routeLoading, routeError, arrived, recalculating,
    trafficLevel, usingGoogleMaps, currentRoute,
    planRoute, startNavigation, stopNavigation,
    setActiveRoute, setRouteError, checkPosition,
  };
}
