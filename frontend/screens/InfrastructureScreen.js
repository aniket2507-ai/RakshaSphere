/**
 * InfrastructureScreen — infrastructure reports grouped by city/district.
 * Accordion layout, AI image analysis, seed data, report cards with badges.
 * Hero section with parallax slideshow of infrastructure/incident photos.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import sseClient from '../services/sseClient';

// ── Scan + Dialog CSS ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('rs-scan-css')) {
  const st = document.createElement('style');
  st.id = 'rs-scan-css';
  st.textContent = `
    .rs-scan-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.82);
      display: flex; align-items: center; justify-content: center;
      animation: rs-fade-in 0.2s ease;
    }
    .rs-scan-card {
      background: linear-gradient(145deg, #0d1b2a, #0a1628);
      border: 1px solid rgba(56,189,248,0.25);
      border-radius: 20px; padding: 36px 40px;
      display: flex; flex-direction: column; align-items: center; gap: 20px;
      box-shadow: 0 0 60px rgba(56,189,248,0.15), 0 20px 60px rgba(0,0,0,0.6);
      min-width: 300px; position: relative; overflow: hidden;
    }
    .rs-scan-card::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .rs-scan-ring {
      width: 80px; height: 80px; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .rs-scan-ring::before {
      content: ''; position: absolute; inset: 0;
      border-radius: 50%;
      border: 2px solid transparent;
      border-top-color: #38bdf8;
      border-right-color: rgba(56,189,248,0.4);
      animation: rs-spin 1s linear infinite;
    }
    .rs-scan-ring::after {
      content: ''; position: absolute; inset: 8px;
      border-radius: 50%;
      border: 2px solid transparent;
      border-bottom-color: #818cf8;
      border-left-color: rgba(129,140,248,0.4);
      animation: rs-spin 0.7s linear infinite reverse;
    }
    .rs-scan-icon { font-size: 28px; animation: rs-pulse-icon 1.2s ease-in-out infinite; }
    .rs-scan-beam {
      width: 260px; height: 3px; border-radius: 2px; position: relative; overflow: hidden;
      background: rgba(56,189,248,0.1);
    }
    .rs-scan-beam::after {
      content: ''; position: absolute; top: 0; left: -60%;
      width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, #38bdf8, rgba(56,189,248,0.3), transparent);
      animation: rs-beam-slide 1.4s ease-in-out infinite;
    }
    .rs-scan-label { color: #94a3b8; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
    .rs-scan-sublabel {
      color: rgba(56,189,248,0.7); font-size: 11px; letter-spacing: 1px;
      animation: rs-blink 1.5s ease-in-out infinite;
    }
    .rs-result-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      animation: rs-fade-in 0.25s ease;
      padding: 20px;
    }
    .rs-result-card {
      background: linear-gradient(145deg, #0f172a, #0d1b2a);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; width: 100%; max-width: 420px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.7); overflow: hidden;
      animation: rs-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    .rs-result-img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .rs-result-body { padding: 22px 24px 24px; }
    .rs-result-verdict {
      display: inline-flex; align-items: center; gap: 7px;
      border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 700;
      letter-spacing: 0.5px; margin-bottom: 14px;
    }
    .rs-result-title { color: #f1f5f9; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .rs-result-msg { color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
    .rs-conf-bar-wrap { margin-bottom: 18px; }
    .rs-conf-label { color: #64748b; font-size: 11px; font-weight: 600; margin-bottom: 6px; }
    .rs-conf-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); overflow: hidden; }
    .rs-conf-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
    .rs-result-actions { display: flex; gap: 10px; }
    .rs-result-btn {
      flex: 1; padding: 11px 0; border-radius: 10px; border: none;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .rs-result-btn:hover { transform: scale(1.03); opacity: 0.92; }
    .rs-result-btn.primary { background: linear-gradient(135deg, #1d4ed8, #3b82f6); color: #fff; }
    .rs-result-btn.secondary { background: rgba(255,255,255,0.07); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
    @keyframes rs-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rs-slide-up { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes rs-spin { to { transform: rotate(360deg); } }
    @keyframes rs-pulse-icon { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }
    @keyframes rs-beam-slide { 0% { left: -60%; } 100% { left: 110%; } }
    @keyframes rs-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  `;
  document.head.appendChild(st);
}

// ── Hero CSS ──────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('infra-hero-css')) {
  const st = document.createElement('style');
  st.id = 'infra-hero-css';
  st.textContent = `
    .infra-hero {
      position: relative; width: 100%; height: 260px; overflow: hidden;
      flex-shrink: 0;
    }
    .infra-hero-slide {
      position: absolute; inset: 0;
      background-size: cover; background-position: center 50%;
      opacity: 0; transition: opacity 1.1s ease-in-out;
      will-change: opacity, background-position;
    }
    .infra-hero-slide.active {
      opacity: 1;
      animation: infra-parallax-pan 9s ease-in-out infinite;
    }
    @keyframes infra-parallax-pan {
      0%   { background-position: center 40%; }
      50%  { background-position: center 60%; }
      100% { background-position: center 40%; }
    }
    .infra-hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%);
      display: flex; flex-direction: column;
      align-items: flex-start; justify-content: flex-end;
      padding: 24px 24px 32px;
      pointer-events: none;
    }
    .infra-hero-tag {
      background: rgba(56,142,60,0.9); color: #fff;
      font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      border-radius: 20px; padding: 4px 12px; margin-bottom: 10px;
      text-transform: uppercase; pointer-events: none;
    }
    .infra-hero-title {
      color: #fff; font-size: 28px; font-weight: 800;
      line-height: 1.2; margin-bottom: 6px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.55);
      pointer-events: none;
    }
    .infra-hero-sub {
      color: rgba(255,255,255,0.85); font-size: 13px;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
      pointer-events: none;
    }
    .infra-hero-dots {
      position: absolute; bottom: 14px; left: 24px;
      display: flex; gap: 6px; pointer-events: none;
    }
    .infra-hero-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,0.4);
      transition: background 0.3s ease, transform 0.3s ease, width 0.3s ease;
    }
    .infra-hero-dot.active {
      background: #fff; width: 18px; border-radius: 3px;
    }
    .infra-report-btn {
      position: absolute; bottom: 20px; right: 20px;
      background: linear-gradient(135deg, #43A047, #1B5E20);
      color: #fff; font-size: 13px; font-weight: 700;
      border: none; border-radius: 24px;
      padding: 11px 22px; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: flex; align-items: center; gap: 7px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      pointer-events: all; letter-spacing: 0.3px;
    }
    .infra-report-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0,0,0,0.45);
    }
  `;
  document.head.appendChild(st);
}

// Unsplash photos representing infrastructure/incident categories
const HERO_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80', caption: 'Road damage & potholes' },
  { url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&q=80', caption: 'Urban flooding & waterlogging' },
  { url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80', caption: 'Waste & garbage management' },
  { url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80', caption: 'Street lighting failures' },
  { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80', caption: 'Bridge & structural hazards' },
];

function HeroSection({ onReportClick }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="infra-hero">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`infra-hero-slide${activeIdx === i ? ' active' : ''}`}
          style={{ backgroundImage: `url(${slide.url})` }}
        />
      ))}
      <div className="infra-hero-overlay">
        <span className="infra-hero-tag">🏗 Infrastructure Watch</span>
        <span className="infra-hero-title">City Infrastructure<br />Reports</span>
        <span className="infra-hero-sub">{HERO_SLIDES[activeIdx].caption}</span>
      </div>
      <div className="infra-hero-dots">
        {HERO_SLIDES.map((_, i) => (
          <div key={i} className={`infra-hero-dot${activeIdx === i ? ' active' : ''}`} />
        ))}
      </div>
      <button className="infra-report-btn" onClick={onReportClick}>
        <span>📋</span> Report Incident
      </button>
    </div>
  );
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const SEED_REPORTS = [
  { id: 1,  city: 'Delhi',    district: 'North East Delhi',  title: 'Large pothole on NH-24 near Ghazipur',       type: 'road_damage',   severity: 'high',     time: '1h ago',  upvotes: 34, verified: true,  aiVerified: true,  description: 'Deep pothole causing accidents. Multiple vehicles damaged.', infraType: 'road',        placeName: 'NH-24 Ghazipur flyover',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80' },
  { id: 2,  city: 'Delhi',    district: 'North East Delhi',  title: 'Waterlogging near Mustafabad underpass',     type: 'waterlogging',  severity: 'high',     time: '3h ago',  upvotes: 21, verified: true,  aiVerified: false, description: 'Severe waterlogging blocking traffic after rain.', infraType: 'drainage',    placeName: 'Mustafabad underpass',
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=700&q=80' },
  { id: 3,  city: 'Delhi',    district: 'South Delhi',       title: 'Broken street light near Saket metro',      type: 'low_lighting',  severity: 'moderate', time: '5h ago',  upvotes: 12, verified: false, aiVerified: true,  description: '3 consecutive street lights non-functional since 2 weeks.', infraType: 'streetlight', placeName: 'Saket metro exit 2',
    image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=700&q=80' },
  { id: 4,  city: 'Delhi',    district: 'South Delhi',       title: 'Garbage pile near Malviya Nagar market',    type: 'garbage',       severity: 'moderate', time: '2h ago',  upvotes: 18, verified: false, aiVerified: false, description: 'Uncollected garbage for 4 days. Health hazard.', infraType: 'park',        placeName: 'Malviya Nagar market',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&q=80' },
  { id: 5,  city: 'Kanpur',   district: 'Kanpur Nagar',      title: 'Road cave-in near Phool Bagh',              type: 'road_damage',   severity: 'high',     time: '30m ago', upvotes: 47, verified: true,  aiVerified: true,  description: 'Road has caved in near Phool Bagh crossing. Dangerous.', infraType: 'road',        placeName: 'Phool Bagh crossing',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80' },
  { id: 6,  city: 'Kanpur',   district: 'Kanpur Nagar',      title: 'Broken footpath near Armapur Estate',       type: 'road_damage',   severity: 'low',      time: '1d ago',  upvotes: 9,  verified: false, aiVerified: false, description: 'Footpath tiles broken and uneven. Risk of tripping.', infraType: 'footpath',    placeName: 'Armapur Estate gate',
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=700&q=80' },
  { id: 7,  city: 'Kanpur',   district: 'Kanpur Dehat',      title: 'Bridge crack on NH-19 near Rura',           type: 'road_damage',   severity: 'high',     time: '6h ago',  upvotes: 56, verified: true,  aiVerified: true,  description: 'Visible crack on bridge structure. Needs urgent inspection.', infraType: 'bridge',      placeName: 'NH-19 Rura bridge',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80' },
  { id: 8,  city: 'Lucknow',  district: 'Lucknow Central',   title: 'Waterlogging at Hazratganj underpass',      type: 'waterlogging',  severity: 'moderate', time: '4h ago',  upvotes: 23, verified: true,  aiVerified: false, description: 'Underpass floods during rain. Drainage blocked.', infraType: 'drainage',    placeName: 'Hazratganj underpass',
    image: 'https://images.unsplash.com/photo-1583245177184-4ab53e5e2b7c?w=700&q=80' },
  { id: 9,  city: 'Lucknow',  district: 'Gomti Nagar',       title: 'Garbage overflow near Gomti Nagar Ext.',    type: 'garbage',       severity: 'low',      time: '2d ago',  upvotes: 7,  verified: false, aiVerified: false, description: 'Garbage bins overflowing. Collection irregular.', infraType: 'park',        placeName: 'Gomti Nagar Ext. sector 3',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=700&q=80' },
  { id: 10, city: 'Varanasi', district: 'Varanasi City',     title: 'Broken railing near Dashashwamedh Ghat',    type: 'road_damage',   severity: 'moderate', time: '1d ago',  upvotes: 15, verified: true,  aiVerified: true,  description: 'Railing near ghat steps broken. Safety risk for pilgrims.', infraType: 'footpath',    placeName: 'Dashashwamedh Ghat steps',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=700&q=80' },
  { id: 11, city: 'Varanasi', district: 'Varanasi City',     title: 'Street light outage near BHU gate',         type: 'low_lighting',  severity: 'low',      time: '3d ago',  upvotes: 11, verified: false, aiVerified: false, description: 'Multiple lights out near BHU main gate. Dark at night.', infraType: 'streetlight', placeName: 'BHU main gate',
    image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=700&q=80' },
  { id: 12, city: 'Agra',     district: 'Agra City',         title: 'Pothole near Taj Mahal East Gate',          type: 'road_damage',   severity: 'moderate', time: '5h ago',  upvotes: 29, verified: true,  aiVerified: true,  description: 'Large pothole on tourist route. Causing traffic jams.', infraType: 'road',        placeName: 'Taj Mahal East Gate road',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=700&q=80' },
];

const TYPE_META = {
  road_damage:  { icon: '🛣', color: '#EF5350', label: 'Road Damage' },
  waterlogging: { icon: '🌊', color: '#1976D2', label: 'Waterlogging' },
  low_lighting: { icon: '💡', color: '#FFA726', label: 'Low Lighting' },
  garbage:      { icon: '🗑', color: '#78909C', label: 'Garbage' },
  no_issue:     { icon: '✅', color: '#4CAF50', label: 'No Issue' },
};

const INFRA_TYPES = [
  { key: 'road',        label: 'Road',         icon: '🛣' },
  { key: 'bridge',      label: 'Bridge',       icon: '🌉' },
  { key: 'footpath',    label: 'Footpath',     icon: '🚶' },
  { key: 'drainage',    label: 'Drainage',     icon: '🌊' },
  { key: 'streetlight', label: 'Street Light', icon: '💡' },
  { key: 'building',    label: 'Building',     icon: '🏢' },
  { key: 'park',        label: 'Park / Open',  icon: '🌳' },
  { key: 'other',       label: 'Other',        icon: '📌' },
];

const SEV_COLOR = { high: '#EF5350', moderate: '#FFA726', low: '#66BB6A' };

const SEVERITY_META = {
  high:       { color: '#EF5350', label: 'HIGH RISK',  icon: '🔴' },
  moderate:   { color: '#FFA726', label: 'MODERATE',   icon: '🟡' },
  low:        { color: '#66BB6A', label: 'LOW RISK',   icon: '🟢' },
  none:       { color: '#4CAF50', label: 'NO ISSUE',   icon: '✅' },
  irrelevant: { color: '#78909C', label: 'IRRELEVANT', icon: '⛔' },
};

const VALID_AI_SEVERITIES = new Set(['high', 'moderate', 'low']);

function hasRealWords(v) { return /[a-zA-Z\u0900-\u097F]{2,}/.test(v); }
function validatePlace(v) {
  const t = v.trim();
  if (!t) return 'City is required.';
  if (t.length < 3) return 'City name must be at least 3 characters.';
  if (/^\d+$/.test(t)) return 'City name cannot be all numbers.';
  if (!hasRealWords(t)) return 'Enter a valid city or place name.';
  if (/(.)\1{3,}/.test(t)) return 'City name looks invalid.';
  return null;
}
function validateTitle(v) {
  const t = v.trim();
  if (!t) return 'Title is required.';
  if (t.length < 5) return 'Title must be at least 5 characters.';
  if (!hasRealWords(t)) return 'Title must contain real words.';
  if (/(.)\1{4,}/.test(t)) return 'Title looks invalid.';
  return null;
}
function validateDescription(v) {
  const t = v.trim();
  if (!t) return null;
  if (t.length < 10) return 'Description must be at least 10 characters.';
  if (!hasRealWords(t)) return 'Description must contain meaningful text.';
  return null;
}

function groupByCity(reports) {
  const map = {};
  for (const r of reports) {
    if (!map[r.city]) map[r.city] = {};
    if (!map[r.city][r.district]) map[r.city][r.district] = [];
    map[r.city][r.district].push(r);
  }
  return map;
}

function ReportCard({ report, theme, isDark }) {
  const meta = TYPE_META[report.type] || { icon: '📌', color: '#78909C', label: report.type };
  const sc   = SEV_COLOR[report.severity] || '#78909C';
  const cardBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const [upvoted, setUpvoted] = useState(false);
  const [votes, setVotes]     = useState(report.upvotes);
  const infraIcon = INFRA_TYPES.find(t => t.key === report.infraType)?.icon || '🏗';
  return (
    <View style={[rc.card, { backgroundColor: cardBg, borderColor: cardBorder, borderLeftColor: meta.color }]}>
      <View style={rc.top}>
        <View style={[rc.typeBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
          <Text style={rc.typeIcon}>{meta.icon}</Text>
          <Text style={[rc.typeLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={[rc.sevBadge, { backgroundColor: sc + '18', borderColor: sc + '44' }]}>
          <Text style={[rc.sevText, { color: sc }]}>{report.severity.toUpperCase()}</Text>
        </View>
        {report.verified && (
          <View style={rc.verifiedBadge}>
            <Text style={rc.verifiedText}>✓ Verified</Text>
          </View>
        )}
        {report.aiVerified && (
          <View style={[rc.verifiedBadge, { backgroundColor: 'rgba(25,118,210,0.15)' }]}>
            <Text style={[rc.verifiedText, { color: '#64B5F6' }]}>🤖 AI</Text>
          </View>
        )}
        <Text style={[rc.time, { color: theme.textDim }]}>{report.time}</Text>
      </View>
      <View style={rc.titleRow}>
        <Text style={rc.infraIcon}>{infraIcon}</Text>
        <Text style={[rc.title, { color: theme.textPrimary }]}>{report.title}</Text>
      </View>
      {report.placeName && (
        <Text style={[rc.place, { color: theme.textMuted }]}>📍 {report.placeName}</Text>
      )}
      <Text style={[rc.desc, { color: theme.textSecond }]} numberOfLines={2}>{report.description}</Text>
      {report.image && (
        <img src={report.image} alt="report" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
      )}
      <View style={rc.footer}>
        <TouchableOpacity
          style={[rc.upvoteBtn, upvoted && { backgroundColor: '#1976D222' }]}
          onPress={() => { if (!upvoted) { setVotes(v => v + 1); setUpvoted(true); } }}
          activeOpacity={0.7}
        >
          <Text style={[rc.upvoteIcon, { color: upvoted ? '#1976D2' : theme.textMuted }]}>▲</Text>
          <Text style={[rc.upvoteCount, { color: upvoted ? '#1976D2' : theme.textMuted }]}>{votes}</Text>
        </TouchableOpacity>
        <Text style={[rc.districtTag, { color: theme.textDim }]}>📍 {report.district}</Text>
      </View>
    </View>
  );
}

export default function InfrastructureScreen() {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';

  const [reports, setReports]             = useState(SEED_REPORTS);
  const [expandedCities, setExpanded]     = useState({});
  const [expandedDistricts, setExpandedD] = useState({});
  const [showForm, setShowForm]           = useState(false);
  const [filter, setFilter]               = useState('all');

  const [newCity, setNewCity]         = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newTitle, setNewTitle]       = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [newType, setNewType]         = useState('road_damage');
  const [newSev, setNewSev]           = useState('moderate');
  const [newInfraType, setNewInfraType] = useState(null);
  const [newImageFile, setNewImageFile]       = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [newPlaceName, setNewPlaceName]       = useState('');

  const [fieldErrors, setFieldErrors]       = useState({});
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState(null);
  const [imageStatus, setImageStatus]       = useState(null);
  const [imageStatusMsg, setImageStatusMsg] = useState('');
  const [showScanOverlay, setShowScanOverlay] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [analysisResult, setAnalysisResult]   = useState(null);

  const cardBg      = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)';
  const chipBg      = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const chipBorder  = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';

  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewImageFile(file);
    setImageStatus('analyzing');
    setImageStatusMsg('Analysing image with AI…');
    setSubmitError(null);
    setShowResultDialog(false);
    setAnalysisResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setNewImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    setShowScanOverlay(true);
    const scanStart = Date.now();

    let result = null;
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('location', JSON.stringify({ lat: 28.6139, lng: 77.209 }));
      const res  = await fetch(`${BASE_URL}/api/detect`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        result = { valid: false, title: 'Processing Failed', msg: 'Image could not be processed.', confidence: 0, color: '#EF5350', icon: '⛔' };
      } else {
        const { classification } = data;
        if (!classification) {
          result = { valid: false, title: 'Analysis Failed', msg: 'Could not analyse image.', confidence: 0, color: '#EF5350', icon: '⛔' };
        } else {
          const sev = classification.severity;
          const conf = Math.round(classification.confidence * 100);
          const sevMeta = SEVERITY_META[sev] || SEVERITY_META.irrelevant;
          if (sev === 'irrelevant') {
            result = { valid: false, title: 'Not Infrastructure Content', msg: 'Image does not appear to contain infrastructure content.', confidence: conf, color: '#78909C', icon: '⛔' };
          } else if (sev === 'none') {
            result = { valid: false, title: 'No Issue Detected', msg: 'Image shows no visible infrastructure issue.', confidence: conf, color: '#FFA726', icon: '🟡' };
          } else if (classification.confidence < 0.45) {
            result = { valid: false, title: 'Low Confidence', msg: `Image is unclear (${conf}% confidence). Please upload a clearer photo.`, confidence: conf, color: '#FFA726', icon: '⚠️' };
          } else {
            const typeKey = TYPE_META[classification.label] ? classification.label : 'road_damage';
            setNewType(typeKey);
            if (VALID_AI_SEVERITIES.has(sev)) setNewSev(sev);
            const label = TYPE_META[classification.label]?.label || classification.label;
            result = { valid: true, title: `${sevMeta.label} — ${label}`, msg: `AI detected ${label.toLowerCase()} with ${conf}% confidence. Type and severity have been auto-filled.`, confidence: conf, color: sevMeta.color, icon: sevMeta.icon };
          }
        }
      }
    } catch {
      result = { valid: false, title: 'Analysis Error', msg: 'Image could not be analysed. Please upload a clear photo of garbage, flooding, road damage, or infrastructure damage.', confidence: 0, color: '#EF5350', icon: '⛔' };
    }

    const elapsed = Date.now() - scanStart;
    const remaining = Math.max(0, 1500 - elapsed);
    setTimeout(() => {
      setShowScanOverlay(false);
      setAnalysisResult(result);
      setShowResultDialog(true);
      setImageStatus(result.valid ? 'valid' : 'invalid');
      setImageStatusMsg(`${result.icon} ${result.title}${result.confidence > 0 ? ` (${result.confidence}% confidence)` : ''}`);
    }, remaining);
  }, []);

  const validate = useCallback(() => {
    const errors = {};
    const cityErr  = validatePlace(newCity);
    const titleErr = validateTitle(newTitle);
    const descErr  = validateDescription(newDesc);
    if (cityErr)  errors.city  = cityErr;
    if (titleErr) errors.title = titleErr;
    if (descErr)  errors.desc  = descErr;
    if (newImageFile && imageStatus === 'invalid') errors.image = imageStatusMsg;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newCity, newTitle, newDesc, newImageFile, imageStatus, imageStatusMsg]);

  const submitReport = useCallback(async () => {
    setSubmitError(null);
    if (!validate()) return;
    if (newImageFile && imageStatus === 'analyzing') { setSubmitError('Please wait — image is still being analysed.'); return; }
    setSubmitting(true);
    try {
      const entry = {
        id: Date.now(), city: newCity.trim(),
        district: newDistrict.trim() || newCity.trim(),
        title: newTitle.trim(), type: newType, severity: newSev,
        time: 'just now', upvotes: 0, verified: false,
        aiVerified: imageStatus === 'valid' && newImageFile != null,
        description: newDesc.trim(), image: newImagePreview,
        infraType: newInfraType || 'other', placeName: newPlaceName.trim(),
      };
      setReports(prev => [entry, ...prev]);
      setExpanded(prev => ({ ...prev, [entry.city]: true }));
      setExpandedD(prev => ({ ...prev, [`${entry.city}::${entry.district}`]: true }));
      setNewCity(''); setNewDistrict(''); setNewTitle(''); setNewDesc('');
      setNewType('road_damage'); setNewSev('moderate'); setNewInfraType(null);
      setNewImageFile(null); setNewImagePreview(null); setNewPlaceName('');
      setImageStatus(null); setImageStatusMsg(''); setFieldErrors({});
      setShowForm(false);
    } finally { setSubmitting(false); }
  }, [validate, newCity, newDistrict, newTitle, newDesc, newType, newSev, newInfraType, newImageFile, newImagePreview, newPlaceName, imageStatus]);

  const toggleCity     = (city) => setExpanded(prev => ({ ...prev, [city]: !prev[city] }));
  const toggleDistrict = (key)  => setExpandedD(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered  = filter === 'all' ? reports : reports.filter(r => r.type === filter || (filter === 'high' && r.severity === 'high'));
  const grouped   = groupByCity(filtered);
  const cities    = Object.keys(grouped).sort();
  const highRisk  = reports.filter(r => r.severity === 'high').length;
  const aiVerifiedCount = reports.filter(r => r.aiVerified).length;

  const openForm = useCallback(() => {
    setShowForm(true);
    setFieldErrors({});
    setSubmitError(null);
  }, []);

  // ── Real-time updates via SSE ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (data) => {
      if (!data?.type || !data?.severity) return;
      const TYPE_MAP = {
        road_damage: 'road_damage', waterlogging: 'waterlogging',
        garbage: 'garbage', low_lighting: 'low_lighting',
        flood: 'waterlogging', fire_hazard: 'road_damage',
        building_collapse: 'road_damage',
      };
      const SEV_MAP = { high: 'high', moderate: 'moderate', low: 'low' };
      const type = TYPE_MAP[data.type] || 'road_damage';
      const sev  = SEV_MAP[data.severity] || 'moderate';
      const entry = {
        id: `sse-${Date.now()}-${Math.random()}`,
        city: data.city || 'Unknown',
        district: data.district || data.city || 'Unknown',
        title: data.title || `${type.replace('_', ' ')} detected`,
        type, severity: sev,
        time: 'just now', upvotes: 0, verified: false, aiVerified: true,
        description: data.description || 'AI-detected infrastructure issue.',
        image: null, infraType: 'other', placeName: data.placeName || '',
      };
      setReports(prev => {
        if (prev.some(r => r.id === entry.id)) return prev;
        return [entry, ...prev];
      });
    };
    sseClient.subscribe('issue_created', handler);
    return () => sseClient.unsubscribe('issue_created', handler);
  }, []);

  return (
    <View style={[s.root, { backgroundColor: theme.bgBase }]}>
      {/* AI Scan overlay */}
      {showScanOverlay && typeof document !== 'undefined' && (
        <div className="rs-scan-backdrop">
          <div className="rs-scan-card">
            <div className="rs-scan-ring">
              <span className="rs-scan-icon">🧠</span>
            </div>
            <div className="rs-scan-beam" />
            <span className="rs-scan-label">Analysing with AI…</span>
            <span className="rs-scan-sublabel">REKOGNITION · RAKSHASPHERE AI</span>
          </div>
        </div>
      )}
      {/* Result dialog */}
      {showResultDialog && analysisResult && typeof document !== 'undefined' && (
        <div className="rs-result-backdrop" onClick={() => setShowResultDialog(false)}>
          <div className="rs-result-card" onClick={e => e.stopPropagation()}>
            {newImagePreview && <img className="rs-result-img" src={newImagePreview} alt="analysed" />}
            <div className="rs-result-body">
              <div className="rs-result-verdict" style={{ background: analysisResult.color + '22', color: analysisResult.color, border: `1px solid ${analysisResult.color}44` }}>
                <span>{analysisResult.icon}</span>
                <span>{analysisResult.valid ? 'AI Verified' : 'Not Accepted'}</span>
              </div>
              <div className="rs-result-title">{analysisResult.title}</div>
              <div className="rs-result-msg">{analysisResult.msg}</div>
              {analysisResult.confidence > 0 && (
                <div className="rs-conf-bar-wrap">
                  <div className="rs-conf-label">CONFIDENCE — {analysisResult.confidence}%</div>
                  <div className="rs-conf-bar">
                    <div className="rs-conf-fill" style={{ width: `${analysisResult.confidence}%`, background: analysisResult.color }} />
                  </div>
                </div>
              )}
              <div className="rs-result-actions">
                {analysisResult.valid
                  ? <button className="rs-result-btn primary" onClick={() => setShowResultDialog(false)}>✓ Use This Image</button>
                  : <button className="rs-result-btn primary" onClick={() => { setShowResultDialog(false); setNewImageFile(null); setNewImagePreview(null); setImageStatus(null); }}>Try Another</button>
                }
                <button className="rs-result-btn secondary" onClick={() => setShowResultDialog(false)}>Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <HeroSection onReportClick={openForm} />

        <View style={[s.subHeader, { backgroundColor: isDark ? '#0b1120' : '#fff', borderBottomColor: cardBorder }]}>
          <View style={[s.headerIcon, { backgroundColor: 'rgba(56,142,60,0.12)', borderColor: 'rgba(56,142,60,0.25)' }]}>
            <Text style={{ fontSize: 20 }}>🏗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: theme.textPrimary }]}>Infrastructure Reports</Text>
            <Text style={[s.headerSub, { color: theme.textMuted }]}>AI-verified damage &amp; hazard reports by city &amp; district</Text>
          </View>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: showForm ? '#37474F' : '#388E3C' }]}
            onPress={() => { setShowForm(v => !v); setFieldErrors({}); setSubmitError(null); }}
            activeOpacity={0.85}
          >
            <Text style={s.addBtnText}>{showForm ? '✕ Cancel' : '+ Report'}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.contentPad}>
        <View style={s.statsRow}>
          {[
            { label: 'Total Reports', value: reports.length, color: '#64B5F6', icon: '📋' },
            { label: 'High Risk',     value: highRisk,       color: '#EF5350', icon: '🔴' },
            { label: 'AI Verified',   value: aiVerifiedCount, color: '#4CAF50', icon: '🤖' },
            { label: 'Cities',        value: Object.keys(groupByCity(reports)).length, color: '#FFA726', icon: '🏙' },
          ].map((st) => (
            <View key={st.label} style={[s.statBox, { backgroundColor: cardBg, borderColor: cardBorder, borderTopColor: st.color }]}>
              <Text style={{ fontSize: 18 }}>{st.icon}</Text>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={[s.statLabel, { color: theme.textMuted }]}>{st.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={s.filterRow}>
            {[['all','🌐','All'],['high','🔴','High Risk'],['road_damage','🛣','Road Damage'],['waterlogging','🌊','Waterlogging'],['low_lighting','💡','Low Lighting'],['garbage','🗑','Garbage']].map(([key, icon, label]) => (
              <TouchableOpacity key={key} style={[s.filterChip, { backgroundColor: filter === key ? '#388E3C' : cardBg, borderColor: filter === key ? '#388E3C' : cardBorder }]} onPress={() => setFilter(key)} activeOpacity={0.8}>
                <Text style={{ fontSize: 12 }}>{icon}</Text>
                <Text style={[s.filterLabel, { color: filter === key ? '#fff' : theme.textSecond }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {showForm && (
          <View style={[s.card, { backgroundColor: cardBg, borderColor: '#388E3C' }]}>
            <Text style={[s.cardTitle, { color: theme.textMuted }]}>NEW INFRASTRUCTURE REPORT</Text>
            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: theme.textSecond }]}>City *</Text>
                <TextInput style={[s.input, { backgroundColor: inputBg, borderColor: fieldErrors.city ? '#EF5350' : inputBorder, color: theme.textPrimary }]} placeholder="e.g. Delhi" placeholderTextColor={theme.textMuted} value={newCity} onChangeText={(t) => { setNewCity(t); if (fieldErrors.city) setFieldErrors(p => ({ ...p, city: null })); }} />
                {fieldErrors.city && <Text style={s.fieldError}>{fieldErrors.city}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: theme.textSecond }]}>District</Text>
                <TextInput style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.textPrimary }]} placeholder="e.g. South Delhi" placeholderTextColor={theme.textMuted} value={newDistrict} onChangeText={setNewDistrict} />
              </View>
            </View>
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>📍 Place / Address</Text>
            <TextInput style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.textPrimary }]} placeholder="e.g. MG Road near Metro Station" placeholderTextColor={theme.textMuted} value={newPlaceName} onChangeText={setNewPlaceName} />
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Title *</Text>
            <TextInput style={[s.input, { backgroundColor: inputBg, borderColor: fieldErrors.title ? '#EF5350' : inputBorder, color: theme.textPrimary }]} placeholder="Brief description of the issue" placeholderTextColor={theme.textMuted} value={newTitle} onChangeText={(t) => { setNewTitle(t); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: null })); }} />
            {fieldErrors.title && <Text style={s.fieldError}>{fieldErrors.title}</Text>}
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Details</Text>
            <TextInput style={[s.input, s.textArea, { backgroundColor: inputBg, borderColor: fieldErrors.desc ? '#EF5350' : inputBorder, color: theme.textPrimary }]} placeholder="Describe the infrastructure issue…" placeholderTextColor={theme.textMuted} value={newDesc} onChangeText={(t) => { setNewDesc(t); if (fieldErrors.desc) setFieldErrors(p => ({ ...p, desc: null })); }} multiline numberOfLines={3} />
            {fieldErrors.desc && <Text style={s.fieldError}>{fieldErrors.desc}</Text>}
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>🏗 Infrastructure Type</Text>
            <View style={s.chipGrid}>
              {INFRA_TYPES.map((t) => {
                const active = newInfraType === t.key;
                return (
                  <TouchableOpacity key={t.key} style={[s.chip, { backgroundColor: active ? 'rgba(56,142,60,0.18)' : chipBg, borderColor: active ? '#388E3C' : chipBorder }]} onPress={() => setNewInfraType(t.key)} activeOpacity={0.75}>
                    <Text style={{ fontSize: 13 }}>{t.icon}</Text>
                    <Text style={[s.chipLabel, { color: active ? '#81C784' : theme.textSecond }, active && { fontWeight: '700' }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Issue Type</Text>
            <View style={s.miniChips}>
              {Object.entries(TYPE_META).filter(([k]) => k !== 'no_issue').map(([k, v]) => (
                <TouchableOpacity key={k} style={[s.miniChip, { backgroundColor: newType === k ? v.color + '22' : cardBg, borderColor: newType === k ? v.color : cardBorder }]} onPress={() => setNewType(k)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 11 }}>{v.icon}</Text>
                  <Text style={[s.miniChipLabel, { color: newType === k ? v.color : theme.textMuted }]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Severity</Text>
            <View style={s.sevRow}>
              {[['low','#66BB6A'],['moderate','#FFA726'],['high','#EF5350']].map(([k, c]) => (
                <TouchableOpacity key={k} style={[s.sevBtn, { backgroundColor: newSev === k ? c + '22' : cardBg, borderColor: newSev === k ? c : cardBorder }]} onPress={() => setNewSev(k)} activeOpacity={0.8}>
                  <Text style={[s.sevBtnText, { color: newSev === k ? c : theme.textMuted }]}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Photo (optional — AI verified)</Text>
            <View style={[s.photoBox, { borderColor: imageStatus === 'invalid' ? '#EF5350' : imageStatus === 'valid' ? '#4CAF50' : cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
              {newImagePreview ? <img src={newImagePreview} alt="preview" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 6 }} /> : <Text style={[s.photoHint, { color: theme.textMuted }]}>📷 Click to attach photo</Text>}
              {typeof document !== 'undefined' && <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />}
            </View>
            {imageStatus === 'analyzing' && <View style={s.imageStatusRow}><ActivityIndicator size="small" color="#388E3C" /><Text style={[s.imageStatusText, { color: '#81C784' }]}>{imageStatusMsg}</Text></View>}
            {imageStatus === 'valid'     && <View style={s.imageStatusRow}><Text style={[s.imageStatusText, { color: '#4CAF50' }]}>✓ {imageStatusMsg}</Text></View>}
            {imageStatus === 'invalid'   && <View style={s.imageStatusRow}><Text style={[s.imageStatusText, { color: '#EF5350' }]}>✗ {imageStatusMsg}</Text></View>}
            {fieldErrors.image && <Text style={s.fieldError}>{fieldErrors.image}</Text>}
            {submitError && <View style={s.submitErrorBox}><Text style={s.submitErrorText}>⚠ {submitError}</Text></View>}
            <TouchableOpacity style={[s.submitBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={submitReport} activeOpacity={0.85} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Report</Text>}
            </TouchableOpacity>
          </View>
        )}

        {cities.map((city) => {
          const cityReports = Object.values(grouped[city]).flat();
          const highCount   = cityReports.filter(r => r.severity === 'high').length;
          const isOpen      = expandedCities[city] === true;
          const districts   = Object.keys(grouped[city]).sort();
          return (
            <View key={city} style={[s.citySection, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <TouchableOpacity style={s.cityHeader} onPress={() => toggleCity(city)} activeOpacity={0.8}>
                <View style={s.cityLeft}>
                  <Text style={[s.cityName, { color: theme.textPrimary }]}>🏙 {city}</Text>
                  <View style={[s.cityCount, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[s.cityCountText, { color: theme.textSecond }]}>{cityReports.length} reports</Text>
                  </View>
                  {highCount > 0 && (
                    <View style={[s.cityHighBadge, { backgroundColor: 'rgba(239,83,80,0.15)', borderColor: 'rgba(239,83,80,0.3)' }]}>
                      <Text style={s.cityHighText}>{highCount} high risk</Text>
                    </View>
                  )}
                </View>
                <Text style={[s.chevron, { color: theme.textMuted }]}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {isOpen && districts.map((district) => {
                const dKey     = `${city}::${district}`;
                const dReports = grouped[city][district];
                const dOpen    = expandedDistricts[dKey] === true;
                return (
                  <View key={district} style={[s.districtSection, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <TouchableOpacity style={s.districtHeader} onPress={() => toggleDistrict(dKey)} activeOpacity={0.8}>
                      <Text style={[s.districtName, { color: theme.textSecond }]}>📍 {district}</Text>
                      <View style={[s.districtCount, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                        <Text style={[s.districtCountText, { color: theme.textMuted }]}>{dReports.length}</Text>
                      </View>
                      <Text style={[s.chevronSm, { color: theme.textDim }]}>{dOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {dOpen && (
                      <View style={s.reportsList}>
                        {dReports.map((r) => <ReportCard key={r.id} report={r} theme={theme} isDark={isDark} />)}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {cities.length === 0 && (
          <View style={[s.emptyState, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
            <Text style={[s.emptyText, { color: theme.textSecond }]}>No reports match this filter</Text>
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
}

const rc = StyleSheet.create({
  card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 10, padding: 12, marginBottom: 0 },
  top: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  typeIcon: { fontSize: 12 },
  typeLabel: { fontSize: 11, fontWeight: '700' },
  sevBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  sevText: { fontSize: 10, fontWeight: '700' },
  verifiedBadge: { backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  verifiedText: { fontSize: 10, color: '#81C784', fontWeight: '600' },
  time: { fontSize: 10, marginLeft: 'auto' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  infraIcon: { fontSize: 14, marginTop: 1 },
  title: { fontSize: 13, fontWeight: '600', flex: 1 },
  place: { fontSize: 11, marginBottom: 4 },
  desc: { fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  upvoteIcon: { fontSize: 11 },
  upvoteCount: { fontSize: 12, fontWeight: '600' },
  districtTag: { fontSize: 10, marginLeft: 'auto' },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, borderBottomWidth: 1 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  body: { gap: 16, paddingBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderWidth: 1, borderTopWidth: 3, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  filterLabel: { fontSize: 12, fontWeight: '500' },
  card: { borderWidth: 1, borderRadius: 14, padding: 18 },
  cardTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  formRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  fieldError: { fontSize: 11, color: '#EF5350', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, outlineStyle: 'none' },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 11 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipLabel: { fontSize: 12, fontWeight: '500' },
  miniChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  miniChipLabel: { fontSize: 11, fontWeight: '500' },
  sevRow: { flexDirection: 'row', gap: 10 },
  sevBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  sevBtnText: { fontSize: 12, fontWeight: '700' },
  photoBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, minHeight: 100, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: 8 },
  photoHint: { fontSize: 13, padding: 20 },
  imageStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  imageStatusText: { fontSize: 12, flex: 1 },
  submitErrorBox: { backgroundColor: 'rgba(239,83,80,0.1)', borderWidth: 1, borderColor: 'rgba(239,83,80,0.3)', borderRadius: 8, padding: 10, marginBottom: 10 },
  submitErrorText: { color: '#EF9A9A', fontSize: 13 },
  submitBtn: { backgroundColor: '#388E3C', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  citySection: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  cityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  cityLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cityName: { fontSize: 14, fontWeight: '700' },
  cityCount: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  cityCountText: { fontSize: 11 },
  cityHighBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  cityHighText: { fontSize: 10, color: '#EF5350', fontWeight: '600' },
  chevron: { fontSize: 12 },
  districtSection: { borderTopWidth: 1 },
  districtHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  districtName: { fontSize: 12, fontWeight: '600', flex: 1 },
  districtCount: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  districtCountText: { fontSize: 11 },
  chevronSm: { fontSize: 10 },
  reportsList: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  emptyState: { borderWidth: 1, borderRadius: 14, padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  contentPad: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
});
