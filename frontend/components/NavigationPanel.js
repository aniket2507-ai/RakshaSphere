/**
 * NavigationPanel — clean single-route bottom sheet.
 * Shows route info (ETA, distance, risk) with inline AI Advice + Start/Stop buttons.
 */
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

if (typeof document !== 'undefined' && !document.getElementById('navpanel-css')) {
  const s = document.createElement('style');
  s.id = 'navpanel-css';
  s.textContent = `
    .np-ai-btn {
      background: linear-gradient(135deg, #7B1FA2, #4A148C);
      border-radius: 12px; cursor: pointer;
      transition: opacity 0.15s ease;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .np-ai-btn:hover { opacity: 0.88; }
    .np-ai-btn.active { background: linear-gradient(135deg, #4A148C, #1A0033); }
    .np-start-btn {
      background: linear-gradient(135deg, #1976D2, #0D47A1);
      border-radius: 12px; cursor: pointer;
      transition: opacity 0.15s ease;
    }
    .np-start-btn:hover { opacity: 0.88; }
    .np-stop-btn {
      background: linear-gradient(135deg, #E53935, #B71C1C);
      border-radius: 12px; cursor: pointer;
      transition: opacity 0.15s ease;
    }
    .np-stop-btn:hover { opacity: 0.88; }
  `;
  document.head.appendChild(s);
}

const RISK_COLOR = { Low: '#4CAF50', Moderate: '#FFA726', High: '#EF5350' };
const RISK_ICON  = { Low: '✓', Moderate: '⚠', High: '⛔' };
const TRAFFIC_COLOR = { low: '#4CAF50', moderate: '#FFA726', high: '#EF5350', unknown: '#90A4AE' };
const TRAFFIC_LABEL = { low: 'Light traffic', moderate: 'Moderate', high: 'Heavy traffic', unknown: '' };
const TRAFFIC_ICON  = { low: '🟢', moderate: '🟡', high: '🔴', unknown: '⚪' };

export default function NavigationPanel({
  fastest, safest, activeRoute, onSelectRoute,
  isNavigating, onStart, onStop, onClose, arrived,
  trafficLevel, usingGoogleMaps,
  showAnalysis, onToggleAnalysis,
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, []);

  if (!fastest) return null;

  const route = (activeRoute === 'safest' && safest) ? safest : fastest;
  const rc = RISK_COLOR[route.riskLevel] || '#888';
  const ri = RISK_ICON[route.riskLevel] || '?';
  const tc = TRAFFIC_COLOR[trafficLevel] || '#90A4AE';
  const hasTraffic = route.durationInTrafficMins && route.durationInTrafficMins !== route.durationMins;

  if (arrived) {
    return (
      <Animated.View style={[np.panel, { transform: [{ translateY: slideAnim }] }]}>
        <View style={np.handle} />
        <View style={np.arrivedBox}>
          <Text style={np.arrivedEmoji}>🎉</Text>
          <Text style={np.arrivedTitle}>You have arrived!</Text>
          <Text style={np.arrivedSub}>Destination reached</Text>
          <TouchableOpacity style={np.stopBtnStyle} onPress={onStop}>
            <Text style={np.stopBtnText}>End Navigation</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[np.panel, { transform: [{ translateY: slideAnim }] }]}>
      <View style={np.handle} />

      {fastest && safest && (
        <View style={np.tabs}>
          {[fastest, safest].map(r => {
            const isActive = activeRoute === r.type;
            const color = RISK_COLOR[r.riskLevel] || '#888';
            return (
              <TouchableOpacity
                key={r.type}
                style={[np.tab, isActive && np.tabActive]}
                onPress={() => !isNavigating && onSelectRoute(r.type)}
                activeOpacity={0.8}
              >
                <Text style={[np.tabLabel, isActive && np.tabLabelActive]}>
                  {r.type === 'fastest' ? '⚡ Fastest' : '🛡 Safest'}
                </Text>
                <View style={[np.tabRisk, { backgroundColor: color + '22', borderColor: color }]}>
                  <Text style={[np.tabRiskText, { color }]}>{r.riskLevel}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={np.metricsRow}>
        <View style={np.metricBlock}>
          <Text style={np.metricBig}>{route.durationMins}</Text>
          <Text style={np.metricUnit}>min</Text>
          <Text style={np.metricLabel}>ETA</Text>
        </View>

        {hasTraffic && (
          <>
            <View style={np.metricDivider} />
            <View style={np.metricBlock}>
              <Text style={[np.metricBig, { color: tc }]}>{route.durationInTrafficMins}</Text>
              <Text style={np.metricUnit}>min</Text>
              <Text style={np.metricLabel}>w/ Traffic</Text>
            </View>
          </>
        )}

        <View style={np.metricDivider} />
        <View style={np.metricBlock}>
          <Text style={np.metricBig}>{route.distanceKm}</Text>
          <Text style={np.metricUnit}>km</Text>
          <Text style={np.metricLabel}>Distance</Text>
        </View>

        <View style={np.metricDivider} />
        <View style={np.metricBlock}>
          <View style={[np.riskPill, { backgroundColor: rc + '22', borderColor: rc }]}>
            <Text style={[np.riskPillText, { color: rc }]}>{ri} {route.riskLevel}</Text>
          </View>
          <Text style={np.metricLabel}>Risk</Text>
        </View>
      </View>

      {((trafficLevel && trafficLevel !== 'unknown') || route.highRiskSegments > 0) && (
        <View style={np.infoStrip}>
          {trafficLevel && trafficLevel !== 'unknown' && (
            <View style={[np.infoPill, { backgroundColor: tc + '18', borderColor: tc }]}>
              <Text style={np.infoPillText}>{TRAFFIC_ICON[trafficLevel]} </Text>
              <Text style={[np.infoPillText, { color: tc }]}>{TRAFFIC_LABEL[trafficLevel]}</Text>
              {usingGoogleMaps && <Text style={np.gmTag}> · Maps</Text>}
            </View>
          )}
          {route.highRiskSegments > 0 && (
            <View style={[np.infoPill, { backgroundColor: '#FFEBEE', borderColor: '#EF5350' }]}>
              <Text style={[np.infoPillText, { color: '#EF5350' }]}>
                ⛔ {route.highRiskSegments} high-risk segment{route.highRiskSegments > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {isNavigating && (
        <View style={[np.liveBar, { borderColor: rc + '55' }]}>
          <View style={[np.liveDot, { backgroundColor: rc }]} />
          <Text style={np.liveText}>Navigating · {route.durationMins} min · {route.distanceKm} km</Text>
          <View style={[np.liveRiskBadge, { backgroundColor: rc + '22', borderColor: rc }]}>
            <Text style={[np.liveRiskText, { color: rc }]}>{route.riskLevel}</Text>
          </View>
        </View>
      )}

      <View style={np.actions}>
        {!isNavigating ? (
          <div
            className="np-start-btn"
            style={{ flex: 1, paddingTop: 13, paddingBottom: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onStart}
          >
            <Text style={np.startBtnText}>▶  Start Navigation</Text>
          </div>
        ) : (
          <div
            className="np-stop-btn"
            style={{ flex: 1, paddingTop: 13, paddingBottom: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onStop}
          >
            <Text style={np.stopBtnText}>⏹  End Navigation</Text>
          </div>
        )}

        <div
          className={`np-ai-btn${showAnalysis ? ' active' : ''}`}
          style={{ width: 48, height: 48 }}
          onClick={onToggleAnalysis}
          title="AI Route Analysis"
        >
          <Text style={{ fontSize: 20 }}>🤖</Text>
        </div>

        <TouchableOpacity style={np.closeBtn} onPress={onClose}>
          <Text style={np.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const np = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1002,
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: 28, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 20, elevation: 14,
  },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: '#1976D2', backgroundColor: '#EBF3FD' },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabLabelActive: { color: '#1976D2' },
  tabRisk: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tabRiskText: { fontSize: 10, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metricBlock: { flex: 1, alignItems: 'center' },
  metricBig: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  metricUnit: { fontSize: 10, color: '#999', marginTop: -2 },
  metricLabel: { fontSize: 9, color: '#aaa', marginTop: 3 },
  metricDivider: { width: 1, height: 32, backgroundColor: '#EEEEEE' },
  riskPill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  riskPillText: { fontSize: 11, fontWeight: '700' },
  infoStrip: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  infoPill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  infoPillText: { fontSize: 11, fontWeight: '600', color: '#555' },
  gmTag: { fontSize: 10, color: '#1A73E8', fontWeight: '700' },
  liveBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.02)' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { flex: 1, fontSize: 11, color: '#37474F', fontWeight: '500' },
  liveRiskBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  liveRiskText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stopBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  closeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: '#999' },
  arrivedBox: { alignItems: 'center', paddingVertical: 20 },
  arrivedEmoji: { fontSize: 48, marginBottom: 10 },
  arrivedTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  arrivedSub: { fontSize: 13, color: '#78909C', marginBottom: 20 },
  stopBtnStyle: { backgroundColor: '#E53935', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, alignItems: 'center' },
});
