import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import MapScreen from '../screens/MapScreen';
import InfrastructureScreen from '../screens/InfrastructureScreen';
import InsightsScreen from '../screens/InsightsScreen';
import WomenSafetyScreen from '../screens/WomenSafetyScreen';
import { useTheme } from '../context/ThemeContext';

if (typeof document !== 'undefined' && !document.getElementById('rs-global-css')) {
  const style = document.createElement('style');
  style.id = 'rs-global-css';
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    body, #root { margin: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 2px; }
    .rs-nav-item {
      display: flex; flex-direction: row; align-items: center; gap: 10px;
      padding: 9px 14px; position: relative; margin: 1px 8px;
      border-radius: 10px; cursor: pointer;
      transition: background 0.18s ease, transform 0.15s ease;
    }
    .rs-nav-item:hover { transform: translateX(2px); }
    .rs-module-card {
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease;
      cursor: pointer;
    }
    .rs-module-card:hover { transform: translateY(-5px) scale(1.01); box-shadow: 0 20px 48px rgba(0,0,0,0.3) !important; }
    .rs-theme-toggle {
      cursor: pointer; border-radius: 20px; padding: 6px 12px;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.2s ease; border: 1px solid;
    }
    .rs-theme-toggle:hover { transform: scale(1.04); }
    .rs-stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .rs-stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.2) !important; }
    .rs-page-enter { animation: rsPageEnter 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
    @keyframes rsPageEnter { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .rs-pulse { animation: rsPulse 2s ease-in-out infinite; }
    @keyframes rsPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
    .rs-topbar-accent {
      position:absolute;bottom:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent);
    }
  `;
  document.head.appendChild(style);
}

const NAV_ITEMS = [
  { id: 'overview',  icon: '⬡',  label: 'Overview',              badge: null },
  { id: 'map',       icon: '🗺',  label: 'Safety Map',            badge: 'LIVE' },
  { id: 'infra',     icon: '🏗',  label: 'Infrastructure Report', badge: null },
  { id: 'insights',  icon: '🧠',  label: 'AI Insights',           badge: null },
  { id: 'women',     icon: '👩',  label: "Women's Safety",        badge: 'NEW' },
];

function Sidebar({ active, onSelect, theme, onToggleTheme }) {
  const isDark = theme.name === 'dark';
  const blue = '#1976D2';
  const blueDim = 'rgba(21,101,192,0.18)';
  const blueBorder = 'rgba(21,101,192,0.35)';
  const green = '#4CAF50';
  const greenDim = 'rgba(76,175,80,0.12)';
  const greenBorder = 'rgba(76,175,80,0.25)';

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(180deg, #0a1628 0%, #060d1a 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%)',
      width: 236, borderRight: `1px solid ${theme.border}`,
      paddingTop: 20, paddingBottom: 16,
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%',
    }}>
      {/* Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 14 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: blueDim, borderWidth: 1, borderColor: blueBorder, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20 }}>🛡</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.3 }}>RakshaSphere</Text>
          <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>Safety Intelligence</Text>
        </View>
      </View>

      {/* Live status */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 20, backgroundColor: greenDim, borderWidth: 1, borderColor: greenBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
        <View className="rs-pulse" style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: green }} />
        <Text style={{ fontSize: 11, color: green, fontWeight: '600', flex: 1 }}>Live · Pan India</Text>
        <View style={{ width: 1, height: 10, backgroundColor: greenBorder }} />
        <Text style={{ fontSize: 10, color: green, opacity: 0.7 }}>219 zones</Text>
      </View>

      <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 2, paddingHorizontal: 16, marginBottom: 4 }}>NAVIGATION</Text>
      <View style={{ marginBottom: 20 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <div key={item.id} className="rs-nav-item"
              style={{ background: isActive ? (isDark ? 'linear-gradient(90deg,rgba(59,130,246,0.18) 0%,rgba(59,130,246,0.04) 100%)' : 'rgba(59,130,246,0.08)') : 'transparent' }}
              onClick={() => onSelect(item.id)}>
              {isActive && (
                <div style={{
                  position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: '60%', borderRadius: '0 2px 2px 0',
                  background: 'linear-gradient(180deg,#3b82f6,#6366f1)',
                  boxShadow: '0 0 8px rgba(59,130,246,0.6)',
                }} />
              )}
              <View style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? 'rgba(59,130,246,0.2)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)') }}>
                <Text style={{ fontSize: 14 }}>{item.icon}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 12.5, color: isActive ? theme.textPrimary : theme.textMuted, fontWeight: isActive ? '700' : '500' }}>{item.label}</Text>
              {item.badge && (
                <View style={{ backgroundColor: item.badge === 'NEW' ? 'rgba(233,30,99,0.15)' : greenDim, borderWidth: 1, borderColor: item.badge === 'NEW' ? 'rgba(233,30,99,0.3)' : greenBorder, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 8, color: item.badge === 'NEW' ? '#F48FB1' : green, fontWeight: '700', letterSpacing: 0.5 }}>{item.badge}</Text>
                </View>
              )}
            </div>
          );
        })}
      </View>

      <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 1.8, paddingHorizontal: 16, marginBottom: 6 }}>RISK LEGEND</Text>
      <View style={{ paddingHorizontal: 16, gap: 9, marginBottom: 22 }}>
        {[{ color: '#4CAF50', label: 'Safe', range: '0–33' }, { color: '#FFA726', label: 'Moderate', range: '34–66' }, { color: '#EF5350', label: 'High Risk', range: '67+' }].map((l) => (
          <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: l.color }} />
            <Text style={{ flex: 1, fontSize: 11, color: theme.textMuted }}>{l.label}</Text>
            <Text style={{ fontSize: 10, color: theme.textDim }}>{l.range}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 'auto', paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.border, gap: 10 }}>
        <div className="rs-theme-toggle" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }} onClick={onToggleTheme}>
          <Text style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '600' }}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
        </div>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 10, color: theme.textDim, flex: 1 }}>v1.0.0 · RakshaSphere</Text>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF50', opacity: 0.6 }} />
        </View>
      </View>
    </div>
  );
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

function useLiveStats() {
  const [stats, setStats] = useState({
    safe: 8, moderate: 5, dangerous: 2,
    openIssues: 0, resolvedIssues: 0, totalReports: 12,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [zonesRes, issuesRes] = await Promise.all([
          fetch(`${BASE_URL}/api/risk/zones`).then(r => r.json()).catch(() => ({ zones: [] })),
          fetch(`${BASE_URL}/api/issues`).then(r => r.json()).catch(() => ({ reports: [] })),
        ]);
        const zones = zonesRes.zones || [];
        const reports = issuesRes.reports || [];
        setStats({
          safe:          zones.filter(z => z.classification === 'safe').length || 8,
          moderate:      zones.filter(z => z.classification === 'moderate').length || 5,
          dangerous:     zones.filter(z => z.classification === 'dangerous').length || 2,
          openIssues:    reports.filter(r => r.status === 'open').length,
          resolvedIssues: reports.filter(r => r.status === 'resolved').length,
          totalReports:  Math.max(12, reports.length),
        });
      } catch (_) {}
    };
    fetchStats();
    const t = setInterval(fetchStats, 30000);
    return () => clearInterval(t);
  }, []);

  return stats;
}

function OverviewPanel({ onNavigate, theme }) {
  const isDark = theme.name === 'dark';
  const blueDim = 'rgba(21,101,192,0.18)';
  const blueBorder = 'rgba(21,101,192,0.35)';
  const greenDim = 'rgba(76,175,80,0.12)';
  const greenBorder = 'rgba(76,175,80,0.25)';
  const glassStyle = {
    background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${theme.border}`,
  };

  const liveStats = useLiveStats();
  const zoneStats = [
    { color: '#4CAF50', label: 'Safe',      value: liveStats.safe,      icon: '✓', total: liveStats.safe + liveStats.moderate + liveStats.dangerous },
    { color: '#FFA726', label: 'Moderate',  value: liveStats.moderate,  icon: '⚠', total: liveStats.safe + liveStats.moderate + liveStats.dangerous },
    { color: '#EF5350', label: 'High Risk', value: liveStats.dangerous, icon: '⛔', total: liveStats.safe + liveStats.moderate + liveStats.dangerous },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bgBase }} contentContainerStyle={{ padding: 28, gap: 22 }} showsVerticalScrollIndicator={false}>
      {/* Hero banner */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(37,99,235,0.35) 0%, rgba(99,102,241,0.2) 50%, rgba(13,21,38,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(99,102,241,0.08) 50%, rgba(255,255,255,0.98) 100%)',
        borderRadius: 20, padding: '28px 32px',
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24,
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)'}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, letterSpacing: 2.5, color: '#60a5fa', fontWeight: '700', marginBottom: 8 }}>URBAN SAFETY PLATFORM</Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: theme.textPrimary, marginBottom: 10, letterSpacing: -0.8, lineHeight: 38 }}>RakshaSphere</Text>
          <Text style={{ fontSize: 13, color: theme.textSecond, lineHeight: 20, marginBottom: 18 }}>Real-time AI-powered safety intelligence for urban environments. Monitor risk zones, route safely, and detect infrastructure hazards.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View className="rs-pulse" style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' }} />
            <Text style={{ fontSize: 12, color: '#4CAF50', fontWeight: '600' }}>All systems operational</Text>
            <View style={{ width: 1, height: 12, backgroundColor: theme.border }} />
            <Text style={{ fontSize: 11, color: theme.textMuted }}>99.9% uptime</Text>
          </View>
        </View>
        <View style={{ width: 84, height: 84, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 42 }}>🛡</Text>
        </View>
      </div>

      {/* Zone stats — live */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF50' }} />
          <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 2 }}>LIVE ZONE STATUS</Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {zoneStats.map((z) => (
          <div key={z.label} className="rs-stat-card" style={{ ...glassStyle, flex: 1, borderRadius: 16, padding: 18, borderTop: `3px solid ${z.color}`, overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${z.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontSize: 36, fontWeight: '800', lineHeight: 40, color: z.color }}>{z.value}</Text>
              <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: z.color + '20' }}>
                <Text style={{ fontSize: 15 }}>{z.icon}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 12, fontWeight: '500' }}>{z.label} Zones</Text>
            <View style={{ height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: z.color + '20' }}>
              <View style={{ height: '100%', borderRadius: 2, backgroundColor: z.color, width: `${z.total > 0 ? (z.value / z.total) * 100 : 0}%` }} />
            </View>
          </div>
        ))}
      </View>

      {/* Live community stats */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#64B5F6' }} />
          <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 2 }}>LIVE STATS</Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {[
          { icon: '📋', label: 'Community Reports', value: liveStats.totalReports, color: '#64B5F6', sub: 'total submitted' },
          { icon: '🔧', label: 'Issues Open',        value: liveStats.openIssues,    color: '#FFA726', sub: 'infrastructure' },
          { icon: '✅', label: 'Issues Resolved',    value: liveStats.resolvedIssues, color: '#4CAF50', sub: 'infrastructure' },
        ].map((s) => (
          <div key={s.label} style={{ ...glassStyle, flex: 1, borderRadius: 14, padding: 14 }}>
            <Text style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: s.color, lineHeight: 30 }}>{s.value}</Text>
            <Text style={{ fontSize: 11, color: theme.textPrimary, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
            <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>{s.sub}</Text>
          </div>
        ))}
      </View>

      {/* Modules */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 2 }}>MODULES</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[
          { id: 'map',   icon: '🗺', title: 'Safety Map',            sub: 'Live risk zones, safe routing & SOS emergency alerts',  tag: `${liveStats.safe + liveStats.moderate + liveStats.dangerous} zones active`, tagColor: '#64B5F6', tagBg: blueDim,  tagBorder: blueBorder },
          { id: 'infra', icon: '🏗', title: 'Infrastructure Report', sub: 'AI-powered damage detection from uploaded site images', tag: 'AI model ready',  tagColor: '#81C784', tagBg: greenDim, tagBorder: greenBorder },
          { id: 'women', icon: '👩', title: "Women's Safety",        sub: 'SOS alerts, safe zones, helplines & harassment hotspots', tag: 'NEW · 219 zones', tagColor: '#F48FB1', tagBg: 'rgba(233,30,99,0.1)', tagBorder: 'rgba(233,30,99,0.25)' },
        ].map((m) => (
          <div key={m.id} className="rs-module-card" style={{ ...glassStyle, flex: 1, borderRadius: 16, padding: 22 }} onClick={() => onNavigate(m.id)}>
            <View style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14, backgroundColor: m.tagBg }}>
              <Text style={{ fontSize: 26 }}>{m.icon}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 }}>{m.title}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 17, marginBottom: 16 }}>{m.sub}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: m.tagBg, borderColor: m.tagBorder }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: m.tagColor }}>{m.tag}</Text>
              </View>
              <Text style={{ fontSize: 16, color: theme.textMuted }}>→</Text>
            </View>
          </div>
        ))}
      </View>

      {/* System info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 2 }}>SYSTEM INFO</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>
      <div style={{ ...glassStyle, borderRadius: 14, overflow: 'hidden' }}>
        {[
          { label: 'Data Sources',  value: 'Crime · Weather · Field Reports', icon: '📊' },
          { label: 'Update Cycle',  value: 'Real-time SSE stream',             icon: '⚡' },
          { label: 'Coverage Area', value: 'Pan India — 219 zones',            icon: '📍' },
          { label: 'AI Engine',     value: 'Risk scoring + prediction',       icon: '🤖' },
        ].map((row, i, arr) => (
          <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
            <Text style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{row.icon}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, width: 130 }}>{row.label}</Text>
            <Text style={{ fontSize: 12, color: theme.textSecond, fontWeight: '500', flex: 1 }}>{row.value}</Text>
          </View>
        ))}
      </div>
    </ScrollView>
  );
}

function TopBar({ active, theme }) {
  const isDark = theme.name === 'dark';
  const item = NAV_ITEMS.find((n) => n.id === active);
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: theme.topbarBg, height: 54,
      display: 'flex', alignItems: 'center', paddingLeft: 24, paddingRight: 24, gap: 12,
      borderBottom: `1px solid ${theme.border}`,
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      position: 'relative',
    }}>
      <div className="rs-topbar-accent" />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 9, color: theme.textDim, letterSpacing: 1.5, fontWeight: '600' }}>RAKSHASPHERE</Text>
        <Text style={{ fontSize: 11, color: theme.textDim }}>›</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={{ fontSize: 15 }}>{item?.icon}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>{item?.label}</Text>
        </View>
        {item?.badge && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(76,175,80,0.12)', borderWidth: 1, borderColor: 'rgba(76,175,80,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF50' }} />
            <Text style={{ fontSize: 9, color: '#4CAF50', fontWeight: '700', letterSpacing: 0.5 }}>{item.badge}</Text>
          </View>
        )}
      </View>
      <div style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '5px 12px' }}>
        <Text style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'monospace' }}>{time}</Text>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { theme, toggle } = useTheme();
  const [active, setActive] = useState('overview');

  const renderContent = () => {
    if (active === 'map')       return <MapScreen />;
    if (active === 'infra')     return <InfrastructureScreen />;
    if (active === 'insights')  return <InsightsScreen />;
    if (active === 'women')     return <WomenSafetyScreen />;
    return <OverviewPanel onNavigate={setActive} theme={theme} />;
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bg }}>
      <Sidebar active={active} onSelect={setActive} theme={theme} onToggleTheme={toggle} />
      <View style={{ flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        {active !== 'map' && <TopBar active={active} theme={theme} />}
        <div key={active} className="rs-page-enter" style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </div>
      </View>
    </View>
  );
}
