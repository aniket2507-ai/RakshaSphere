import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const RISK_COLORS = { low: '#4CAF50', moderate: '#FFC107', high: '#F44336' };

export default function RoutePanel({ origin, destination }) {
  const [routes, setRoutes] = useState([]);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const computeRoutes = useCallback(async () => {
    if (!origin || !destination) { setError('Set both origin and destination first.'); return; }
    setLoading(true); setError(null); setWarning(null);
    try {
      const res = await fetch(`${BASE_URL}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to compute routes'); return; }
      setRoutes(data.routes || []);
      setWarning(data.warning || null);
    } catch { setError('Network error while computing routes.'); }
    finally { setLoading(false); }
  }, [origin, destination]);

  const riskLevel = (score) => score <= 33 ? 'low' : score <= 66 ? 'moderate' : 'high';

  return (
    <View style={styles.panel}>
      <TouchableOpacity style={styles.computeBtn} onPress={computeRoutes} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.computeBtnText}>Find Safe Route</Text>}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {warning ? <View style={styles.warningBanner}><Text style={styles.warningText}>⚠ {warning.message}</Text></View> : null}
      <ScrollView>
        {routes.map((route, i) => (
          <View key={route.id} style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeRank}>Route {i + 1}</Text>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[riskLevel(route.averageRiskScore)] }]}>
                <Text style={styles.riskBadgeText}>Risk: {route.averageRiskScore}</Text>
              </View>
            </View>
            <Text style={styles.explanation}>{route.explanation}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{(route.totalDistance / 1000).toFixed(1)} km</Text>
              <Text style={styles.metaText}>{Math.round(route.estimatedTime / 60)} min</Text>
              <Text style={styles.metaText}>{route.zonesTraversed.length} zones</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#fff', borderRadius: 12, padding: 12, minWidth: 280, maxHeight: 400 },
  computeBtn: { backgroundColor: '#1976D2', borderRadius: 8, padding: 12, alignItems: 'center' },
  computeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  error: { color: '#F44336', fontSize: 12, marginTop: 6 },
  warningBanner: { backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFC107', borderRadius: 6, padding: 8, marginTop: 8 },
  warningText: { fontSize: 12, color: '#E65100' },
  routeCard: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, marginTop: 8 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeRank: { fontWeight: 'bold', fontSize: 14 },
  riskBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  riskBadgeText: { color: '#fff', fontSize: 12 },
  explanation: { fontSize: 12, color: '#555', marginVertical: 4 },
  meta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 12, color: '#777' },
});
