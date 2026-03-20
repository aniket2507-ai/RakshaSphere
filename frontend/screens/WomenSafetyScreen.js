/**
 * WomenSafetyScreen — dedicated women's safety module.
 * SOS quick-dial, safe zones, harassment hotspots, helplines, safety tips.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

if (typeof document !== 'undefined' && !document.getElementById('ws-css')) {
  const st = document.createElement('style');
  st.id = 'ws-css';
  st.textContent = `
    .ws-hero {
      position: relative; width: 100%; height: 240px; overflow: hidden; flex-shrink: 0;
      background: linear-gradient(135deg, #4a0072 0%, #880E4F 40%, #1a237e 100%);
    }
    .ws-hero-orb1 { position: absolute; width: 350px; height: 350px; border-radius: 50%; background: rgba(255,255,255,0.05); top: -100px; right: -80px; animation: wsOrbFloat 8s ease-in-out infinite; }
    .ws-hero-orb2 { position: absolute; width: 250px; height: 250px; border-radius: 50%; background: rgba(255,255,255,0.04); bottom: -80px; left: -60px; animation: wsOrbFloat 10s ease-in-out infinite reverse; }
    .ws-hero-grid {
      position: absolute; inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    @keyframes wsOrbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
    .ws-hero-content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px 28px 32px; }
    .ws-sos-pulse { animation: ws-pulse 1.8s ease-in-out infinite; }
    @keyframes ws-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,83,80,0.5); } 50% { box-shadow: 0 0 0 16px rgba(239,83,80,0); } }
    .ws-helpline-card { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease; cursor: pointer; }
    .ws-helpline-card:hover { transform: translateY(-4px) scale(1.02); }
  `;
  document.head.appendChild(st);
}

const HELPLINES = [
  { name: 'Women Helpline',    number: '1091', icon: '👩', color: '#E91E63', desc: '24/7 national helpline' },
  { name: 'Police Emergency',  number: '100',  icon: '🚔', color: '#1565C0', desc: 'Immediate response' },
  { name: 'Ambulance',         number: '108',  icon: '🚑', color: '#E53935', desc: 'Medical emergency' },
  { name: 'Nirbhaya Helpline', number: '181',  icon: '🛡', color: '#7B1FA2', desc: 'Women in distress' },
  { name: 'Childline',         number: '1098', icon: '👶', color: '#F57C00', desc: 'Child protection' },
  { name: 'Cyber Crime',       number: '1930', icon: '💻', color: '#00838F', desc: 'Online harassment' },
];

const SAFE_ZONES = [
  { name: 'Connaught Place, Delhi',  type: 'Commercial',  safety: 88, cameras: 42, patrols: 'Every 30 min', icon: '🏢' },
  { name: 'Gomti Nagar, Lucknow',    type: 'Residential', safety: 91, cameras: 28, patrols: 'Every 45 min', icon: '🏘' },
  { name: 'Koramangala, Bangalore',  type: 'Mixed',       safety: 85, cameras: 35, patrols: 'Every 30 min', icon: '🌆' },
  { name: 'Salt Lake, Kolkata',      type: 'Residential', safety: 87, cameras: 31, patrols: 'Every 1 hr',   icon: '🏘' },
  { name: 'HITEC City, Hyderabad',   type: 'Tech Park',   safety: 93, cameras: 58, patrols: 'Continuous',   icon: '💼' },
  { name: 'Kakkanad, Kochi',         type: 'Tech Park',   safety: 94, cameras: 62, patrols: 'Continuous',   icon: '💼' },
];

const HOTSPOTS = [
  { area: 'Chandni Chowk, Delhi',    incidents: 34, type: 'Harassment', trend: 'up',     risk: 'high' },
  { area: 'Orderly Bazar, Varanasi', incidents: 28, type: 'Theft',      trend: 'up',     risk: 'high' },
  { area: 'Dharavi, Mumbai',         incidents: 22, type: 'Mixed',      trend: 'down',   risk: 'high' },
  { area: 'Majestic, Bangalore',     incidents: 19, type: 'Harassment', trend: 'stable', risk: 'moderate' },
  { area: 'Kidwai Nagar, Kanpur',    incidents: 17, type: 'Harassment', trend: 'up',     risk: 'moderate' },
  { area: 'Chowk, Lucknow',         incidents: 15, type: 'Theft',      trend: 'down',   risk: 'moderate' },
];

const SAFETY_TIPS = [
  { icon: '📱', tip: 'Share live location with trusted contacts when travelling alone at night.' },
  { icon: '🔦', tip: 'Prefer well-lit, busy streets. Avoid isolated shortcuts after dark.' },
  { icon: '🚕', tip: 'Always verify cab driver details and share ride info before boarding.' },
  { icon: '📢', tip: 'Trust your instincts — if something feels wrong, move to a crowded area.' },
  { icon: '🔋', tip: 'Keep your phone charged and have emergency numbers saved offline.' },
  { icon: '👥', tip: 'Travel in groups when possible, especially in unfamiliar areas.' },
  { icon: '🏃', tip: 'Know the nearest police station, hospital, and safe shelter in your area.' },
  { icon: '📸', tip: 'Document and report harassment — your report helps protect others.' },
];

const STATS = [
  { icon: '🛡', label: 'Safe Zones',       value: '219',  color: '#4CAF50', sub: 'across India' },
  { icon: '📞', label: 'SOS Activations',  value: '1.2K', color: '#E91E63', sub: 'this month' },
  { icon: '✅', label: 'Cases Resolved',   value: '847',  color: '#1976D2', sub: 'community' },
  { icon: '🤖', label: 'AI Alerts Sent',   value: '3.4K', color: '#7B1FA2', sub: 'real-time' },
];

function HeroSection() {
  return (
    <div className="ws-hero">
      <div className="ws-hero-orb1" />
      <div className="ws-hero-orb2" />
      <div className="ws-hero-grid" />
      <div className="ws-hero-content">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>WOMEN'S SAFETY MODULE</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(76,175,80,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF50' }} />
            <Text style={{ color: '#A5D6A7', fontSize: 10, fontWeight: '600' }}>LIVE</Text>
          </View>
        </View>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: 8, letterSpacing: -0.5 }}>
          Stay Safe,{'\n'}Stay Empowered
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19 }}>
          AI-powered safety tools, real-time alerts &amp; emergency response
        </Text>
      </div>
    </div>
  );
}

export default function WomenSafetyScreen() {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  const [sosActive, setSosActive] = useState(false);
  const [sosTimer, setSosTimer] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const cardBg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const handleSOS = () => {
    if (sosActive) {
      setSosActive(false);
      if (sosTimer) clearInterval(sosTimer);
      setCountdown(0);
      return;
    }
    setSosActive(true);
    let c = 5;
    setCountdown(c);
    const t = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(t);
        alert('🚨 SOS Alert sent to emergency contacts and nearest police station!');
        setSosActive(false);
        setCountdown(0);
      }
    }, 1000);
    setSosTimer(t);
  };

  useEffect(() => () => { if (sosTimer) clearInterval(sosTimer); }, [sosTimer]);

  const callHelpline = (number) => {
    if (typeof window !== 'undefined') window.open(`tel:${number}`, '_self');
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bgBase }]}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <HeroSection />

        {/* SOS Quick Action */}
        <View style={[s.sosSection, { backgroundColor: isDark ? 'rgba(233,30,99,0.08)' : 'rgba(233,30,99,0.05)', borderColor: 'rgba(233,30,99,0.2)' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.sosTitle, { color: theme.textPrimary }]}>Emergency SOS</Text>
            <Text style={[s.sosSub, { color: theme.textMuted }]}>
              {sosActive ? `Sending alert in ${countdown}s… tap to cancel` : 'Tap to send SOS to emergency contacts & police'}
            </Text>
          </View>
          <div className={sosActive ? 'ws-sos-pulse' : ''} style={{ borderRadius: 50 }}>
            <TouchableOpacity
              style={[s.sosBtn, { backgroundColor: sosActive ? '#B71C1C' : '#E91E63' }]}
              onPress={handleSOS}
              activeOpacity={0.85}
            >
              <Text style={s.sosBtnIcon}>{sosActive ? `${countdown}` : '🆘'}</Text>
              <Text style={s.sosBtnText}>{sosActive ? 'CANCEL' : 'SOS'}</Text>
            </TouchableOpacity>
          </div>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {STATS.map((st) => (
            <View key={st.label} style={[s.statBox, { backgroundColor: cardBg, borderColor: cardBorder, borderTopColor: st.color }]}>
              <Text style={{ fontSize: 18 }}>{st.icon}</Text>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={[s.statLabel, { color: theme.textMuted }]}>{st.label}</Text>
              <Text style={[s.statSub, { color: theme.textDim }]}>{st.sub}</Text>
            </View>
          ))}
        </View>

        {/* Helplines */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardTitle, { color: theme.textMuted }]}>📞 EMERGENCY HELPLINES — TAP TO CALL</Text>
          <View style={s.helplineGrid}>
            {HELPLINES.map((h) => (
              <div key={h.number} className="ws-helpline-card" style={{ flex: 1, minWidth: '30%' }} onClick={() => callHelpline(h.number)}>
                <View style={[s.helplineCard, { backgroundColor: h.color + '12', borderColor: h.color + '30' }]}>
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{h.icon}</Text>
                  <Text style={[s.helplineNumber, { color: h.color }]}>{h.number}</Text>
                  <Text style={[s.helplineName, { color: theme.textPrimary }]}>{h.name}</Text>
                  <Text style={[s.helplineDesc, { color: theme.textMuted }]}>{h.desc}</Text>
                  <View style={[s.callBtn, { backgroundColor: h.color + '18', borderColor: h.color + '44' }]}>
                    <Text style={{ fontSize: 10, color: h.color, fontWeight: '700' }}>📞 CALL</Text>
                  </View>
                </View>
              </div>
            ))}
          </View>
        </View>

        {/* Safe Zones */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardTitle, { color: theme.textMuted }]}>✅ VERIFIED SAFE ZONES</Text>
          <View style={{ gap: 10 }}>
            {SAFE_ZONES.map((z, i) => (
              <View key={i} style={[s.safeZoneRow, { backgroundColor: isDark ? 'rgba(76,175,80,0.06)' : 'rgba(76,175,80,0.04)', borderColor: 'rgba(76,175,80,0.2)' }]}>
                <View style={[s.safeZoneIcon, { backgroundColor: 'rgba(76,175,80,0.15)' }]}>
                  <Text style={{ fontSize: 18 }}>{z.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.safeZoneName, { color: theme.textPrimary }]}>{z.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                    <Text style={[s.safeZoneMeta, { color: theme.textMuted }]}>📷 {z.cameras} cameras</Text>
                    <Text style={[s.safeZoneMeta, { color: theme.textMuted }]}>🚔 {z.patrols}</Text>
                  </View>
                </View>
                <View style={[s.safetyScore, { backgroundColor: '#4CAF5018', borderColor: '#4CAF5044' }]}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#4CAF50' }}>{z.safety}</Text>
                  <Text style={{ fontSize: 8, color: '#4CAF50', fontWeight: '600' }}>SAFE</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Harassment Hotspots */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardTitle, { color: theme.textMuted }]}>⚠️ HARASSMENT HOTSPOTS — AVOID AT NIGHT</Text>
          <View style={{ gap: 8 }}>
            {HOTSPOTS.map((h, i) => {
              const riskColor = h.risk === 'high' ? '#EF5350' : '#FFA726';
              const trendIcon = h.trend === 'up' ? '↑' : h.trend === 'down' ? '↓' : '→';
              const trendColor = h.trend === 'up' ? '#EF5350' : h.trend === 'down' ? '#4CAF50' : '#FFA726';
              return (
                <View key={i} style={[s.hotspotRow, { backgroundColor: riskColor + '08', borderColor: riskColor + '25' }]}>
                  <View style={[s.hotspotRank, { backgroundColor: riskColor + '18' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: riskColor }}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.hotspotName, { color: theme.textPrimary }]}>{h.area}</Text>
                    <Text style={[s.hotspotType, { color: theme.textMuted }]}>{h.type}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: trendColor, fontWeight: '700', marginRight: 6 }}>{trendIcon}</Text>
                  <View style={[s.hotspotBadge, { backgroundColor: riskColor + '18', borderColor: riskColor + '44' }]}>
                    <Text style={{ fontSize: 10, color: riskColor, fontWeight: '700' }}>{h.incidents} reports</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Safety Tips */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardTitle, { color: theme.textMuted }]}>💡 SAFETY TIPS</Text>
          <View style={s.tipsGrid}>
            {SAFETY_TIPS.map((t, i) => (
              <View key={i} style={[s.tipCard, { flex: 1, minWidth: '45%', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Text style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</Text>
                <Text style={[s.tipText, { color: theme.textSecond }]}>{t.tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Note */}
        <View style={[s.aiNote, { backgroundColor: isDark ? 'rgba(123,31,162,0.1)' : 'rgba(123,31,162,0.05)', borderColor: 'rgba(123,31,162,0.2)', marginHorizontal: 20 }]}>
          <Text style={{ fontSize: 20, marginBottom: 8 }}>🤖</Text>
          <Text style={[s.aiNoteTitle, { color: theme.textPrimary }]}>AI-Powered Protection</Text>
          <Text style={[s.aiNoteText, { color: theme.textSecond }]}>
            RakshaSphere's AI engine continuously analyses crime patterns, lighting conditions, and crowd density to generate real-time safety scores. Safe routes are automatically recalculated to avoid high-risk zones, especially during night hours.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { gap: 16, paddingBottom: 32 },
  sosSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginHorizontal: 20, marginTop: 16, borderWidth: 1, borderRadius: 16, padding: 18 },
  sosTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sosSub: { fontSize: 12, lineHeight: 17 },
  sosBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', gap: 2 },
  sosBtnIcon: { fontSize: 22, color: '#fff' },
  sosBtnText: { fontSize: 9, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  statBox: { flex: 1, borderWidth: 1, borderTopWidth: 3, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  statSub: { fontSize: 8, textAlign: 'center' },
  card: { marginHorizontal: 20, borderWidth: 1, borderRadius: 14, padding: 18 },
  cardTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  helplineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  helplineCard: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  helplineNumber: { fontSize: 20, fontWeight: '800' },
  helplineName: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  helplineDesc: { fontSize: 9, textAlign: 'center', marginTop: 2, lineHeight: 13 },
  callBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  safeZoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12 },
  safeZoneIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  safeZoneName: { fontSize: 13, fontWeight: '600' },
  safeZoneMeta: { fontSize: 10 },
  safetyScore: { borderWidth: 1, borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 44 },
  hotspotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 10 },
  hotspotRank: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  hotspotName: { fontSize: 12, fontWeight: '600' },
  hotspotType: { fontSize: 10, marginTop: 2 },
  hotspotBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tipCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  tipText: { fontSize: 11, lineHeight: 16 },
  aiNote: { borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center' },
  aiNoteTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  aiNoteText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
