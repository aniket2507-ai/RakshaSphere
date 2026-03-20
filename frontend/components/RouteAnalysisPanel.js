/**
 * RouteAnalysisPanel — AI-powered route safety analysis slide-up panel.
 * Shows zone-by-zone breakdown, overall risk, travel advice, nighttime warnings.
 */
import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

if (typeof document !== 'undefined' && !document.getElementById('rap-css')) {
  const s = document.createElement('style');
  s.id = 'rap-css';
  s.textContent = `
    .rap-zone-row { transition: background 0.15s ease; border-radius: 8px; }
    .rap-zone-row:hover { background: rgba(128,128,128,0.12) !important; }
    .rap-close-btn { transition: transform 0.15s ease; cursor: pointer; }
    .rap-close-btn:hover { transform: scale(1.1); }
  `;
  document.head.appendChild(s);
}

const RISK_COLOR = { safe: '#4CAF50', moderate: '#FFA726', dangerous: '#EF5350' };
const RISK_LABEL = { safe: 'Safe', moderate: 'Moderate', dangerous: 'High Risk' };
const RISK_ICON  = { safe: '✓', moderate: '⚠', dangerous: '⛔' };

function classifyScore(score) {
  if (score <= 33) return 'safe';
  if (score <= 66) return 'moderate';
  return 'dangerous';
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getZonesAlongRoute(zones, origin, destination) {
  if (!origin || !destination || !zones?.length) return [];
  const [oLat, oLng] = origin;
  const [dLat, dLng] = destination;

  const minLat = Math.min(oLat, dLat) - 1.5;
  const maxLat = Math.max(oLat, dLat) + 1.5;
  const minLng = Math.min(oLng, dLng) - 1.5;
  const maxLng = Math.max(oLng, dLng) + 1.5;

  return zones.filter(z => {
    const lat = z.lat ?? z.center?.[0];
    const lng = z.lng ?? z.center?.[1];
    if (lat == null || lng == null) return false;
    if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) return false;
    return haversineKm(oLat, oLng, lat, lng) <= 80
      || haversineKm(dLat, dLng, lat, lng) <= 80;
  });
}

function getTravelAdvice(routeZones, hour) {
  const isNight = hour >= 22 || hour < 5;
  const isEvening = hour >= 19 && hour < 22;
  const highRisk = routeZones.filter(z => (z.score || 0) > 66);
  const advice = [];

  if (isNight) {
    advice.push({ icon: '🌙', text: 'Night travel — risk scores are elevated. Consider travelling after sunrise.', color: '#EF5350' });
  } else if (isEvening) {
    advice.push({ icon: '🌆', text: 'Evening hours — moderate risk increase. Stay on well-lit main roads.', color: '#FFA726' });
  } else {
    advice.push({ icon: '☀️', text: 'Daytime travel — optimal safety window.', color: '#4CAF50' });
  }

  if (highRisk.length > 0) {
    advice.push({ icon: '⛔', text: `${highRisk.length} high-risk zone${highRisk.length > 1 ? 's' : ''} along route. Use alternate roads where possible.`, color: '#EF5350' });
  }

  if (!isNight && routeZones.length > 0) {
    const avgScore = routeZones.reduce((s, z) => s + (z.score || 0), 0) / routeZones.length;
    if (avgScore < 40) {
      advice.push({ icon: '✅', text: 'Route corridor is generally safe. Proceed normally.', color: '#4CAF50' });
    }
  }

  if (isNight && highRisk.length === 0) {
    advice.push({ icon: '💡', text: 'No high-risk zones detected, but stay alert during night hours.', color: '#FFA726' });
  }

  return advice;
}

export default function RouteAnalysisPanel({ zones, origin, destination, onClose }) {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }).start();
  }, []);

  const routeZones = getZonesAlongRoute(zones, origin, destination);
  const sortedZones = [...routeZones].sort((a, b) => (b.score || 0) - (a.score || 0));
  const avoidZones = sortedZones.filter(z => (z.score || 0) > 66);

  const avgScore = routeZones.length > 0
    ? Math.round(routeZones.reduce((s, z) => s + (z.score || 0), 0) / routeZones.length)
    : 0;
  const overallClass = classifyScore(avgScore);
  const overallColor = RISK_COLOR[overallClass];

  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;
  const advice = getTravelAdvice(routeZones, hour);

  const panelBg      = isDark ? '#1a1a2e' : '#ffffff';
  const textPrimary  = isDark ? '#ffffff' : '#0f172a';
  const textSecond   = isDark ? 'rgba(255,255,255,0.75)' : '#334155';
  const textMuted    = isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8';
  const textDim      = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  const cardBg       = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const handleColor  = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
  const adviceBg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

  return (
    <Animated.View style={[rap.panel, { backgroundColor: panelBg, transform: [{ translateY: slideAnim }] }]}>
      <View style={rap.header}>
        <View style={[rap.handle, { backgroundColor: handleColor }]} />
        <View style={rap.headerRow}>
          <Text style={[rap.title, { color: textPrimary }]}>🤖 AI Route Analysis</Text>
          <div className="rap-close-btn" onClick={onClose} style={{ padding: 6 }}>
            <Text style={[rap.closeIcon, { color: textMuted }]}>✕</Text>
          </div>
        </View>
      </View>

      <ScrollView style={rap.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Overall risk score */}
        <View style={[rap.scoreCard, { borderColor: overallColor, backgroundColor: cardBg }]}>
          <View style={rap.scoreLeft}>
            <Text style={[rap.scoreLabel, { color: textDim }]}>OVERALL ROUTE RISK</Text>
            <Text style={[rap.scoreValue, { color: overallColor }]}>{avgScore}</Text>
            <View style={[rap.scorePill, { backgroundColor: overallColor + '22', borderColor: overallColor }]}>
              <Text style={[rap.scorePillText, { color: overallColor }]}>
                {RISK_ICON[overallClass]} {RISK_LABEL[overallClass]}
              </Text>
            </View>
          </View>
          <View style={rap.scoreRight}>
            <Text style={[rap.scoreZoneCount, { color: textPrimary }]}>{routeZones.length}</Text>
            <Text style={[rap.scoreZoneLabel, { color: textMuted }]}>zones scanned</Text>
            {isNight && (
              <View style={rap.nightBadge}>
                <Text style={rap.nightBadgeText}>🌙 Night Mode</Text>
              </View>
            )}
          </View>
        </View>

        {/* Travel advice */}
        {advice.length > 0 && (
          <View style={rap.section}>
            <Text style={[rap.sectionTitle, { color: textDim }]}>TRAVEL ADVICE</Text>
            {advice.map((a, i) => (
              <View key={i} style={[rap.adviceRow, { borderLeftColor: a.color, backgroundColor: adviceBg }]}>
                <Text style={rap.adviceIcon}>{a.icon}</Text>
                <Text style={[rap.adviceText, { color: textSecond }]}>{a.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Avoid zones */}
        {avoidZones.length > 0 && (
          <View style={rap.section}>
            <Text style={[rap.sectionTitle, { color: textDim }]}>AREAS TO AVOID</Text>
            {avoidZones.map((z, i) => (
              <View key={z.zoneId || i} style={[rap.avoidRow, { borderBottomColor: dividerColor }]}>
                <Text style={rap.avoidIcon}>⛔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[rap.avoidName, { color: textPrimary }]}>{z.name || z.district || z.city || z.zoneId}</Text>
                  <Text style={[rap.avoidScore, { color: textMuted }]}>Risk score: {z.score}</Text>
                </View>
                <View style={[rap.avoidBadge, { backgroundColor: '#EF535022', borderColor: '#EF5350' }]}>
                  <Text style={[rap.avoidBadgeText, { color: '#EF5350' }]}>High Risk</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Zone breakdown */}
        {sortedZones.length > 0 ? (
          <View style={rap.section}>
            <Text style={[rap.sectionTitle, { color: textDim }]}>ZONE BREAKDOWN ({sortedZones.length})</Text>
            {sortedZones.slice(0, 12).map((z, i) => {
              const cls = z.classification || classifyScore(z.score || 0);
              const color = RISK_COLOR[cls] || '#888';
              return (
                <div key={z.zoneId || i} className="rap-zone-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
                  <View style={[rap.zoneColorDot, { backgroundColor: color }]} />
                  <Text style={[rap.zoneName, { color: textSecond }]} numberOfLines={1}>
                    {z.name || z.district || z.city || z.zoneId}
                  </Text>
                  <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: color + '22', overflow: 'hidden' }}>
                    <View style={{ height: '100%', borderRadius: 2, backgroundColor: color, width: `${z.score || 0}%` }} />
                  </View>
                  <Text style={[rap.zoneScore, { color }]}>{z.score || 0}</Text>
                  <View style={[rap.zonePill, { backgroundColor: color + '18', borderColor: color }]}>
                    <Text style={[rap.zonePillText, { color }]}>{RISK_ICON[cls]}</Text>
                  </View>
                </div>
              );
            })}
            {sortedZones.length > 12 && (
              <Text style={[rap.moreText, { color: textDim }]}>+{sortedZones.length - 12} more zones</Text>
            )}
          </View>
        ) : (
          <View style={rap.emptyState}>
            <Text style={rap.emptyIcon}>🗺</Text>
            <Text style={[rap.emptyText, { color: textSecond }]}>No risk zones found along this route corridor.</Text>
            <Text style={[rap.emptySubText, { color: textMuted }]}>Route appears clear of monitored zones.</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const rap = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1004,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '75%',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, elevation: 20,
  },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  closeIcon: { fontSize: 16 },
  scroll: { paddingHorizontal: 16 },
  scoreCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14,
  },
  scoreLeft: { flex: 1 },
  scoreLabel: { fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  scoreValue: { fontSize: 42, fontWeight: '800', lineHeight: 46 },
  scorePill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  scorePillText: { fontSize: 11, fontWeight: '700' },
  scoreRight: { alignItems: 'flex-end', gap: 4 },
  scoreZoneCount: { fontSize: 28, fontWeight: '800' },
  scoreZoneLabel: { fontSize: 10 },
  nightBadge: { backgroundColor: 'rgba(239,83,80,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  nightBadgeText: { fontSize: 10, color: '#EF5350', fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  adviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, marginBottom: 6, borderRadius: 6 },
  adviceIcon: { fontSize: 14, marginTop: 1 },
  adviceText: { flex: 1, fontSize: 12, lineHeight: 17 },
  avoidRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  avoidIcon: { fontSize: 14 },
  avoidName: { fontSize: 12, fontWeight: '600' },
  avoidScore: { fontSize: 10, marginTop: 2 },
  avoidBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  avoidBadgeText: { fontSize: 10, fontWeight: '700' },
  zoneColorDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  zoneName: { fontSize: 11, width: 110 },
  zoneScore: { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  zonePill: { borderWidth: 1, borderRadius: 6, width: 24, height: 20, alignItems: 'center', justifyContent: 'center' },
  zonePillText: { fontSize: 10, fontWeight: '700' },
  moreText: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  emptySubText: { fontSize: 11 },
});
