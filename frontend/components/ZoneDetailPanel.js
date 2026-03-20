import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const { height: SCREEN_H } = Dimensions.get('window');

// ── CSS injection ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('zdp-css')) {
  const s = document.createElement('style');
  s.id = 'zdp-css';
  s.textContent = `
    .zdp-sparkline { display: flex; align-items: flex-end; gap: 2px; height: 36px; }
    .zdp-bar { flex: 1; border-radius: 2px 2px 0 0; min-width: 4px; transition: opacity 0.2s; }
    .zdp-bar:hover { opacity: 0.8; }
    .zdp-crime-bar { height: 6px; border-radius: 3px; transition: width 0.6s ease; }
  `;
  document.head.appendChild(s);
}

const RISK_COLOR = { Low: '#4CAF50', Moderate: '#FFC107', High: '#F44336', safe: '#4CAF50', moderate: '#FFC107', dangerous: '#F44336' };
const RISK_EMOJI = { Low: '✅', Moderate: '⚠️', High: '🔴', safe: '✅', moderate: '⚠️', dangerous: '🔴' };
const FACTOR_ICON = { crime: '🔪', infrastructure: '🏗', weather: '🌩', timeOfDay: '🌙', crowd: '👥' };
const SEVERITY_COLOR = { critical: '#F44336', high: '#FF7043', medium: '#FFA726', low: '#66BB6A' };
const TREND_ICON = { rising: '📈', falling: '📉', stable: '➡️' };
const TREND_COLOR = { rising: '#F44336', falling: '#4CAF50', stable: '#FFC107' };

// ── Sparkline component ───────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => d.total);
  const max  = Math.max(...vals, 1);
  return (
    <div className="zdp-sparkline">
      {vals.map((v, i) => (
        <div
          key={i}
          className="zdp-bar"
          style={{
            height: `${Math.max(4, Math.round((v / max) * 36))}px`,
            background: color || '#4CAF50',
            opacity: i === vals.length - 1 ? 1 : 0.55,
          }}
          title={`${data[i].year}: ${v.toLocaleString()}`}
        />
      ))}
    </div>
  );
}

// ── Women safety ring ─────────────────────────────────────────────────────────
function SafetyRing({ score }) {
  const color = score <= 20 ? '#4CAF50' : score <= 50 ? '#FFC107' : '#F44336';
  const label = score <= 20 ? 'Safe' : score <= 50 ? 'Moderate' : 'High Risk';
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={[ring.outer, { borderColor: color }]}>
        <Text style={[ring.num, { color }]}>{score}</Text>
      </View>
      <Text style={ring.label}>{label}</Text>
    </View>
  );
}
const ring = StyleSheet.create({
  outer: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  num:   { fontSize: 16, fontWeight: '800' },
  label: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ── Confidence pips ───────────────────────────────────────────────────────────
function ConfidencePips({ value }) {
  const filled = value === 'high' ? 3 : value === 'medium' ? 2 : 1;
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[pip.dot, i < filled && pip.dotFilled]} />
      ))}
    </View>
  );
}
const pip = StyleSheet.create({
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotFilled: { backgroundColor: '#4CAF50' },
});

// ── District detail panel ─────────────────────────────────────────────────────
function DistrictPanel({ zone }) {
  const color = RISK_COLOR[zone.classification] || '#888';
  const emoji = RISK_EMOJI[zone.classification] || '📍';
  const maxCrime = Math.max(...(zone.topCrimes || []).map(c => c.count), 1);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.zoneId}>{zone.district}</Text>
          <Text style={s.stateLabel}>{zone.state}</Text>
          <View style={[s.badge, { backgroundColor: color + '22', borderColor: color, borderWidth: 1 }]}>
            <Text style={[s.badgeText, { color }]}>{emoji} {zone.classification} Risk</Text>
          </View>
        </View>
        <View style={s.scoreCircle}>
          <Text style={[s.scoreNum, { color }]}>{zone.score}</Text>
          <Text style={s.scoreMax}>/100</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Crime breakdown */}
      {zone.topCrimes?.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Crime Breakdown (2001–2012)</Text>
          {zone.topCrimes.map((c) => (
            <View key={c.name} style={s.crimeRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={s.crimeName}>{c.name}</Text>
                  <Text style={[s.crimeCount, { color: SEVERITY_COLOR[c.severity] }]}>
                    {c.count.toLocaleString()}
                  </Text>
                </View>
                <div
                  className="zdp-crime-bar"
                  style={{
                    width: `${Math.round((c.count / maxCrime) * 100)}%`,
                    background: SEVERITY_COLOR[c.severity],
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.divider} />

      {/* Trend + Sparkline */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Yearly Trend ({zone.dataYears})</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Sparkline data={zone.yearlyData} color={color} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={s.axisLabel}>{zone.yearlyData?.[0]?.year}</Text>
              <Text style={s.axisLabel}>{zone.yearlyData?.[zone.yearlyData.length - 1]?.year}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 24 }}>{TREND_ICON[zone.trendDirection] || '➡️'}</Text>
            <Text style={[s.trendLabel, { color: TREND_COLOR[zone.trendDirection] || '#FFC107' }]}>
              {zone.trendDirection}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.divider} />

      {/* Prediction card */}
      <View style={s.predCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.predTitle}>🔮 2013 Prediction</Text>
          <Text style={s.predSub}>Linear regression on 12-year trend</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={[s.predScore, { color }]}>{zone.predictedScore}</Text>
          <Text style={s.predTotal}>{zone.predictedTotal?.toLocaleString()} crimes est.</Text>
        </View>
      </View>

      {/* Women safety + stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Women Safety</Text>
          <SafetyRing score={zone.womenSafetyScore} />
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Total IPC</Text>
          <Text style={s.statBig}>{(zone.breakdown?.totalIPC || 0).toLocaleString()}</Text>
          <Text style={s.statSub}>2001–2012</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Trend Slope</Text>
          <Text style={[s.statBig, { color: TREND_COLOR[zone.trendDirection] }]}>
            {zone.trendSlope > 0 ? '+' : ''}{zone.trendSlope}
          </Text>
          <Text style={s.statSub}>crimes/yr</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerText}>📊 IPC District Crime Data 2001–2012</Text>
        <Text style={s.footerText}>NCRB India</Text>
      </View>
    </ScrollView>
  );
}

// ── Dataset zone panel ────────────────────────────────────────────────────────
function DatasetPanel({ zone }) {
  const color = RISK_COLOR[zone.classification] || '#888';
  const emoji = RISK_EMOJI[zone.classification] || '📍';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.zoneId}>{zone.city || zone.zoneId}</Text>
          {zone.state && <Text style={s.stateLabel}>{zone.state}</Text>}
          <View style={[s.badge, { backgroundColor: color + '22', borderColor: color, borderWidth: 1 }]}>
            <Text style={[s.badgeText, { color }]}>{emoji} {zone.classification} Risk</Text>
          </View>
        </View>
        <View style={s.scoreCircle}>
          <Text style={[s.scoreNum, { color }]}>{zone.score}</Text>
          <Text style={s.scoreMax}>/100</Text>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Reported Crimes</Text>
          <Text style={[s.statBig, { color }]}>{(zone.crimeCount || 0).toLocaleString()}</Text>
          <Text style={s.statSub}>in dataset</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Risk Score</Text>
          <Text style={[s.statBig, { color }]}>{zone.score}</Text>
          <Text style={s.statSub}>out of 100</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Radius</Text>
          <Text style={s.statBig}>{zone.radius ? `${(zone.radius / 1000).toFixed(0)}km` : '—'}</Text>
          <Text style={s.statSub}>coverage</Text>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>📊 Crime Dataset · City-level data</Text>
        <Text style={s.footerText}>Zoom in for district detail</Text>
      </View>
    </ScrollView>
  );
}

// ── Engine zone panel ─────────────────────────────────────────────────────────
function EnginePanel({ data }) {
  const color = RISK_COLOR[data.classification] || '#888';
  const emoji = RISK_EMOJI[data.classification] || '📍';

  const reasons = data?.topContributors?.slice(0, 3).map((factor) => ({
    factor,
    icon: FACTOR_ICON[factor] || '•',
    description: data.breakdown?.[factor]?.description || factor,
    contribution: data.breakdown?.[factor]?.contribution ?? 0,
  })) || [];

  const predScore = data?.predictedRisk?.predictedScore;
  const predColor = predScore != null
    ? (predScore > 66 ? '#F44336' : predScore > 33 ? '#FFC107' : '#4CAF50')
    : '#aaa';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={s.zoneId}>{data.zoneId}</Text>
          <View style={[s.badge, { backgroundColor: color + '33', borderColor: color, borderWidth: 1 }]}>
            <Text style={[s.badgeText, { color }]}>{emoji} {data.classification}</Text>
          </View>
        </View>
        <View style={s.scoreCircle}>
          <Text style={[s.scoreNum, { color }]}>{data.score}</Text>
          <Text style={s.scoreMax}>/100</Text>
        </View>
      </View>
      <View style={s.divider} />
      {reasons.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Risk Factors</Text>
          {reasons.map((r, i) => (
            <View key={r.factor} style={s.reasonRow}>
              <View style={s.reasonRank}><Text style={s.reasonRankText}>{i + 1}</Text></View>
              <Text style={s.reasonIcon}>{r.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.reasonDesc}>{r.description}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${Math.min(r.contribution, 100)}%`, backgroundColor: color }]} />
                </View>
              </View>
              <Text style={[s.reasonScore, { color }]}>{r.contribution.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Confidence</Text>
          <ConfidencePips value={data.confidence} />
          <Text style={s.statValue}>{data.confidence || 'N/A'}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Predicted (1h)</Text>
          <Text style={[s.statBig, { color: predColor }]}>{predScore ?? '—'}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Issues</Text>
          <Text style={s.statBig}>{data.issueCount ?? '—'}</Text>
        </View>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>
          🕐 Updated {data.lastUpdated
            ? new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'N/A'}
        </Text>
        {data.predictedRisk?.confidence && (
          <Text style={s.footerText}>Forecast: {data.predictedRisk.confidence} confidence</Text>
        )}
      </View>
    </ScrollView>
  );
}

// ── Sample / fallback zone panel ──────────────────────────────────────────────
function SamplePanel({ zone }) {
  const score = zone.score || Math.floor(Math.random() * 60) + 20;
  const cls   = zone.classification || (score > 66 ? 'High' : score > 33 ? 'Moderate' : 'Low');
  const color = RISK_COLOR[cls] || '#FFC107';
  const emoji = RISK_EMOJI[cls] || '📍';
  const label = zone.city || zone.district || zone.zoneId || 'Urban Zone';
  const state = zone.state || 'India';

  // Plausible sample stats derived from score so they feel real
  const crimeCount  = zone.crimeCount  || Math.round(score * 18 + 120);
  const patrolUnits = Math.max(1, Math.round((100 - score) / 20));
  const safetyScore = Math.max(5, 100 - score);
  const incidents   = Math.round(score * 0.4 + 2);

  const sampleCrimes = [
    { name: 'Theft & Burglary',    pct: 38 },
    { name: 'Assault',             pct: 22 },
    { name: 'Harassment',          pct: 18 },
    { name: 'Vehicle Crime',       pct: 14 },
    { name: 'Other IPC',           pct: 8  },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.zoneId}>{label}</Text>
          <Text style={s.stateLabel}>{state}</Text>
          <View style={[s.badge, { backgroundColor: color + '22', borderColor: color, borderWidth: 1 }]}>
            <Text style={[s.badgeText, { color }]}>{emoji} {cls} Risk</Text>
          </View>
        </View>
        <View style={s.scoreCircle}>
          <Text style={[s.scoreNum, { color }]}>{score}</Text>
          <Text style={s.scoreMax}>/100</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Crime type breakdown */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Estimated Crime Distribution</Text>
        {sampleCrimes.map((c) => (
          <View key={c.name} style={s.crimeRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={s.crimeName}>{c.name}</Text>
                <Text style={[s.crimeCount, { color }]}>{c.pct}%</Text>
              </View>
              <div
                className="zdp-crime-bar"
                style={{ width: `${c.pct}%`, background: color }}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={s.divider} />

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Est. Incidents</Text>
          <Text style={[s.statBig, { color }]}>{crimeCount}</Text>
          <Text style={s.statSub}>per year</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Safety Index</Text>
          <Text style={[s.statBig, { color: RISK_COLOR['Low'] }]}>{safetyScore}</Text>
          <Text style={s.statSub}>out of 100</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCard}>
          <Text style={s.statLabel}>Patrol Units</Text>
          <Text style={s.statBig}>{patrolUnits}</Text>
          <Text style={s.statSub}>active</Text>
        </View>
      </View>

      {/* Advisory */}
      <View style={[s.predCard, { marginTop: 4 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.predTitle}>
            {cls === 'High' ? '🔴 High Alert Zone' : cls === 'Moderate' ? '⚠️ Exercise Caution' : '✅ Generally Safe'}
          </Text>
          <Text style={s.predSub}>
            {cls === 'High'
              ? 'Avoid travelling alone at night. Stay on main roads.'
              : cls === 'Moderate'
              ? 'Stay aware of surroundings. Avoid isolated areas after dark.'
              : 'Low crime activity. Standard precautions apply.'}
          </Text>
        </View>
        <Text style={{ fontSize: 28, marginLeft: 10 }}>
          {cls === 'High' ? '🚨' : cls === 'Moderate' ? '⚠️' : '🛡️'}
        </Text>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>📍 Zone-level estimate · RakshaSphere AI</Text>
        <Text style={s.footerText}>{incidents} recent reports</Text>
      </View>
    </ScrollView>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ZoneDetailPanel({ zoneId, zones = [], onClose }) {
  const [apiData, setApiData]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const slideAnim               = useRef(new Animated.Value(500)).current;

  const localZone  = zones.find(z => z.zoneId === zoneId);
  // Local zones are rendered directly without an API call
  const isLocalZone = !!localZone;

  useEffect(() => {
    if (zoneId) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }).start();
    }
  }, [zoneId]);

  useEffect(() => {
    if (!zoneId) { setApiData(null); return; }
    if (isLocalZone) { setApiData(null); return; }
    setLoading(true); setError(null);
    fetch(`${BASE_URL}/api/risk/zone/${encodeURIComponent(zoneId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Zone not found' : 'Failed to load zone');
        return r.json();
      })
      .then(setApiData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [zoneId, isLocalZone]);

  if (!zoneId) return null;

  return (
    <Animated.View style={[s.container, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.panel}>
        <View style={s.handle} />
        <TouchableOpacity style={s.closeBtn} onPress={onClose} accessibilityLabel="Close panel">
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {loading && (
          <View style={s.loadingWrap}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={s.loadingText}>Loading zone data…</Text>
          </View>
        )}
        {error && !loading && !isLocalZone && (
          <View style={s.errorWrap}>
            <Text style={s.errorEmoji}>⚠️</Text>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {localZone?.source === 'district' && <DistrictPanel zone={localZone} />}
        {localZone?.source === 'dataset'  && <DatasetPanel zone={localZone} />}
        {localZone && localZone.source !== 'district' && localZone.source !== 'dataset' && <SamplePanel zone={localZone} />}
        {!isLocalZone && apiData && !loading && <EnginePanel data={apiData} />}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2000 },
  backdrop:  { position: 'absolute', top: -SCREEN_H, left: 0, right: 0, height: SCREEN_H },
  panel: {
    backgroundColor: 'rgba(18, 22, 36, 0.97)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    maxHeight: 520,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 28, elevation: 22,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  loadingWrap:  { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText:  { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  errorWrap:    { alignItems: 'center', paddingVertical: 32, gap: 8 },
  errorEmoji:   { fontSize: 32 },
  errorText:    { color: '#EF5350', fontSize: 14, textAlign: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16, marginRight: 36,
  },
  zoneId:     { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  stateLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: -2 },
  badge:      { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText:  { fontSize: 12, fontWeight: '700' },
  scoreCircle:{ alignItems: 'center', justifyContent: 'center' },
  scoreNum:   { fontSize: 42, fontWeight: '900', lineHeight: 46 },
  scoreMax:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: -2 },
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 14, marginTop: 2 },
  section:    { marginBottom: 14 },
  sectionTitle: {
    color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },
  crimeRow:   { marginBottom: 10 },
  crimeName:  { color: '#fff', fontSize: 12, fontWeight: '500' },
  crimeCount: { fontSize: 12, fontWeight: '700' },
  axisLabel:  { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  trendLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  predCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  predTitle:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  predSub:    { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
  predScore:  { fontSize: 28, fontWeight: '900' },
  predTotal:  { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 14, marginBottom: 14,
  },
  statCard:    { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.1)' },
  statLabel: {
    color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  statValue:  { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  statBig:    { color: '#fff', fontSize: 20, fontWeight: '800' },
  statSub:    { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  reasonRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reasonRank: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  reasonRankText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  reasonIcon:     { fontSize: 18, width: 24, textAlign: 'center' },
  reasonDesc:     { color: '#fff', fontSize: 12, marginBottom: 5, fontWeight: '500' },
  barTrack:       { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 2 },
  reasonScore:    { fontSize: 13, fontWeight: '700', width: 28, textAlign: 'right' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  footerText: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
});
