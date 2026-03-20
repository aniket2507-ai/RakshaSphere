/**
 * IncidentsScreen — community incident reports grouped by city/district.
 * Includes place validation, AI image analysis via /api/detect, and
 * accordion sections collapsed by default.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import sseClient from '../services/sseClient';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Inject shared scan/dialog CSS (shared with InfrastructureScreen via same id)
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
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      border: 2px solid transparent;
      border-top-color: #38bdf8; border-right-color: rgba(56,189,248,0.4);
      animation: rs-spin 1s linear infinite;
    }
    .rs-scan-ring::after {
      content: ''; position: absolute; inset: 8px; border-radius: 50%;
      border: 2px solid transparent;
      border-bottom-color: #818cf8; border-left-color: rgba(129,140,248,0.4);
      animation: rs-spin 0.7s linear infinite reverse;
    }
    .rs-scan-icon { font-size: 28px; animation: rs-pulse-icon 1.2s ease-in-out infinite; }
    .rs-scan-beam {
      width: 260px; height: 3px; border-radius: 2px; position: relative; overflow: hidden;
      background: rgba(56,189,248,0.1);
    }
    .rs-scan-beam::after {
      content: ''; position: absolute; top: 0; left: -60%; width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, #38bdf8, rgba(56,189,248,0.3), transparent);
      animation: rs-beam-slide 1.4s ease-in-out infinite;
    }
    .rs-scan-label { color: #94a3b8; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
    .rs-scan-sublabel { color: rgba(56,189,248,0.7); font-size: 11px; letter-spacing: 1px; animation: rs-blink 1.5s ease-in-out infinite; }
    .rs-result-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      animation: rs-fade-in 0.25s ease; padding: 20px;
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

const SEED_REPORTS = [
  { id: 1,  city: 'Kanpur',   district: 'Kanpur Nagar',    title: 'Chain snatching near Phool Bagh',        type: 'theft',      severity: 'high',     time: '2h ago',  upvotes: 24, verified: true,  description: 'Two men on motorcycle snatched chain from woman near Phool Bagh crossing.',
    image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=75' },
  { id: 2,  city: 'Kanpur',   district: 'Kanpur Nagar',    title: 'Suspicious activity near Armapur',       type: 'suspicious', severity: 'moderate', time: '5h ago',  upvotes: 11, verified: false, description: 'Group of 4-5 men loitering near Armapur Estate gate after midnight.',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=75' },
  { id: 3,  city: 'Kanpur',   district: 'Kanpur Dehat',    title: 'Road robbery on NH-19',                  type: 'robbery',    severity: 'high',     time: '1d ago',  upvotes: 38, verified: true,  description: 'Truck driver robbed at gunpoint on NH-19 near Rura bypass.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75' },
  { id: 4,  city: 'Kanpur',   district: 'Kanpur Nagar',    title: 'Eve teasing near Kidwai Nagar metro',    type: 'harassment', severity: 'moderate', time: '3h ago',  upvotes: 17, verified: false, description: 'Women harassed near Kidwai Nagar metro exit in evening hours.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=75' },
  { id: 5,  city: 'Lucknow',  district: 'Lucknow Central', title: 'Pickpocket at Hazratganj market',         type: 'theft',      severity: 'low',      time: '1h ago',  upvotes: 8,  verified: false, description: 'Multiple pickpocket incidents reported in Hazratganj shopping area.',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=75' },
  { id: 6,  city: 'Lucknow',  district: 'Lucknow Central', title: 'Drunk driving near Aminabad',             type: 'traffic',    severity: 'moderate', time: '4h ago',  upvotes: 5,  verified: false, description: 'Reckless driving by intoxicated driver near Aminabad chowk.',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=75' },
  { id: 7,  city: 'Lucknow',  district: 'Gomti Nagar',     title: 'Safe area — increased patrolling',       type: 'positive',   severity: 'low',      time: '6h ago',  upvotes: 42, verified: true,  description: 'Police increased night patrolling in Gomti Nagar Ext. Area feels safer.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=75' },
  { id: 8,  city: 'Delhi',    district: 'North East Delhi', title: 'Communal tension near Mustafabad',       type: 'alert',      severity: 'high',     time: '30m ago', upvotes: 67, verified: true,  description: 'Minor altercation reported. Police deployed. Avoid area.',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=75' },
  { id: 9,  city: 'Delhi',    district: 'South Delhi',      title: 'Safe zone — Saket mall area',            type: 'positive',   severity: 'low',      time: '2h ago',  upvotes: 29, verified: true,  description: 'Heavy security presence at Saket mall. Very safe for families.',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=75' },
  { id: 10, city: 'Varanasi', district: 'Varanasi City',    title: 'Theft at Dashashwamedh Ghat',            type: 'theft',      severity: 'moderate', time: '3h ago',  upvotes: 14, verified: false, description: 'Tourist reported bag theft near Dashashwamedh Ghat steps.',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=600&q=75' },
  { id: 11, city: 'Varanasi', district: 'Varanasi City',    title: 'Safe — BHU campus area',                 type: 'positive',   severity: 'low',      time: '1d ago',  upvotes: 31, verified: true,  description: 'BHU campus and surrounding areas well-lit and patrolled.',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=75' },
  { id: 12, city: 'Agra',     district: 'Agra City',        title: 'Tourist scam near Taj Mahal',            type: 'fraud',      severity: 'moderate', time: '5h ago',  upvotes: 22, verified: true,  description: 'Fake guides overcharging tourists near East Gate of Taj Mahal.',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=75' },
];

const TYPE_META = {
  theft:        { icon: '💰', color: '#EF5350', label: 'Theft' },
  robbery:      { icon: '🔫', color: '#B71C1C', label: 'Robbery' },
  harassment:   { icon: '⚠️', color: '#FF7043', label: 'Harassment' },
  suspicious:   { icon: '👁',  color: '#FFA726', label: 'Suspicious' },
  alert:        { icon: '🚨', color: '#E53935', label: 'Alert' },
  traffic:      { icon: '🚗', color: '#FFC107', label: 'Traffic' },
  fraud:        { icon: '🎭', color: '#AB47BC', label: 'Fraud' },
  positive:     { icon: '✅', color: '#4CAF50', label: 'Safe Zone' },
  road_damage:  { icon: '🛣', color: '#EF5350', label: 'Road Damage' },
  waterlogging: { icon: '🌊', color: '#1976D2', label: 'Waterlogging' },
  low_lighting: { icon: '💡', color: '#FFA726', label: 'Low Lighting' },
  garbage:      { icon: '🗑', color: '#78909C', label: 'Garbage' },
};

const SEV_COLOR = { high: '#EF5350', moderate: '#FFA726', low: '#66BB6A' };

// ── Validation helpers ────────────────────────────────────────────────────────

function hasRealWords(v) {
  return /[a-zA-Z\u0900-\u097F]{2,}/.test(v);
}

function validatePlace(value) {
  const v = value.trim();
  if (!v) return 'City is required.';
  if (v.length < 3) return 'City name must be at least 3 characters.';
  if (/^\d+$/.test(v)) return 'City name cannot be all numbers.';
  if (!hasRealWords(v)) return 'Enter a valid city or place name.';
  if (/(.)\1{3,}/.test(v)) return 'City name looks invalid — please check.';
  return null;
}

function validateTitle(value) {
  const v = value.trim();
  if (!v) return 'Title is required.';
  if (v.length < 5) return 'Title must be at least 5 characters.';
  if (!hasRealWords(v)) return 'Title must contain real words describing the incident.';
  if (/(.)\1{4,}/.test(v)) return 'Title looks invalid — please check.';
  return null;
}

function validateDescription(value) {
  const v = value.trim();
  if (!v) return null; // optional
  if (v.length < 10) return 'Description must be at least 10 characters.';
  if (!hasRealWords(v)) return 'Description must contain meaningful text.';
  if (/(.)\1{5,}/.test(v)) return 'Description looks invalid — please describe the incident clearly.';
  return null;
}

// Severity tier display metadata
const SEVERITY_META = {
  high:       { color: '#EF5350', label: 'HIGH RISK',  icon: '🔴' },
  moderate:   { color: '#FFA726', label: 'MODERATE',   icon: '🟡' },
  low:        { color: '#66BB6A', label: 'LOW RISK',   icon: '🟢' },
  none:       { color: '#4CAF50', label: 'NO ISSUE',   icon: '✅' },
  irrelevant: { color: '#78909C', label: 'IRRELEVANT', icon: '⛔' },
};

// Only these severity tiers represent real infrastructure issues
const VALID_AI_SEVERITIES = new Set(['high', 'moderate', 'low']);

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
        {report.verified && <View style={rc.verifiedBadge}><Text style={rc.verifiedText}>✓ Verified</Text></View>}
        {report.aiVerified && (
          <View style={[rc.verifiedBadge, { backgroundColor: 'rgba(25,118,210,0.15)' }]}>
            <Text style={[rc.verifiedText, { color: '#64B5F6' }]}>🤖 AI Verified</Text>
          </View>
        )}
        <Text style={[rc.time, { color: theme.textDim }]}>{report.time}</Text>
      </View>
      <Text style={[rc.title, { color: theme.textPrimary }]}>{report.title}</Text>
      <Text style={[rc.desc, { color: theme.textSecond }]} numberOfLines={2}>{report.description}</Text>
      {report.image && <img src={report.image} alt="report" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
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

export default function IncidentsScreen() {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';

  const [reports, setReports]             = useState(SEED_REPORTS);
  // All cities collapsed by default
  const [expandedCities, setExpanded]     = useState({});
  const [expandedDistricts, setExpandedD] = useState({});
  const [showForm, setShowForm]           = useState(false);
  const [filter, setFilter]               = useState('all');

  // Form fields
  const [newCity, setNewCity]         = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newTitle, setNewTitle]       = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [newType, setNewType]         = useState('theft');
  const [newSev, setNewSev]           = useState('moderate');
  const [newImageFile, setNewImageFile]       = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  // Validation & submission state
  const [fieldErrors, setFieldErrors]       = useState({});
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState(null);
  const [imageStatus, setImageStatus]       = useState(null); // null | 'analyzing' | 'valid' | 'invalid'
  const [imageStatusMsg, setImageStatusMsg] = useState('');
  const [showScanOverlay, setShowScanOverlay] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [analysisResult, setAnalysisResult]   = useState(null);

  const cardBg      = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)';

  // ── Image selection + AI analysis ──────────────────────────────────────────

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
        result = { valid: false, title: 'Processing Failed', msg: 'Image could not be processed. Please upload a clear photo.', confidence: 0, color: '#EF5350', icon: '⛔' };
      } else {
        const { classification } = data;
        if (!classification) {
          result = { valid: false, title: 'Analysis Failed', msg: 'Could not analyse image. Please upload a relevant photo.', confidence: 0, color: '#EF5350', icon: '⛔' };
        } else {
          const sev     = classification.severity;
          const conf    = Math.round(classification.confidence * 100);
          const sevMeta = SEVERITY_META[sev] || SEVERITY_META.irrelevant;
          if (sev === 'irrelevant') {
            result = { valid: false, title: 'Not Relevant Content', msg: 'Image does not appear to contain infrastructure or incident content. Please upload a relevant photo.', confidence: conf, color: '#78909C', icon: '⛔' };
          } else if (sev === 'none') {
            result = { valid: false, title: 'No Issue Detected', msg: 'Image shows no visible issue or hazard. Only photos showing actual problems can be submitted.', confidence: conf, color: '#FFA726', icon: '🟡' };
          } else if (classification.confidence < 0.45) {
            result = { valid: false, title: 'Low Confidence', msg: `Image is unclear or unrelated (${conf}% confidence). Please upload a clearer photo.`, confidence: conf, color: '#FFA726', icon: '⚠️' };
          } else {
            const typeKey = TYPE_META[classification.label] ? classification.label : 'suspicious';
            setNewType(typeKey);
            if (sev === 'high')     setNewSev('high');
            if (sev === 'moderate') setNewSev('moderate');
            if (sev === 'low')      setNewSev('low');
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

  // ── Validation ──────────────────────────────────────────────────────────────

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

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submitReport = useCallback(async () => {
    setSubmitError(null);
    if (!validate()) return;
    if (newImageFile && imageStatus === 'analyzing') {
      setSubmitError('Please wait — image is still being analysed.');
      return;
    }

    setSubmitting(true);
    try {
      const entry = {
        id: Date.now(),
        city: newCity.trim(),
        district: newDistrict.trim() || newCity.trim(),
        title: newTitle.trim(),
        type: newType,
        severity: newSev,
        time: 'just now',
        upvotes: 0,
        verified: false,
        aiVerified: imageStatus === 'valid' && newImageFile != null,
        description: newDesc.trim(),
        image: newImagePreview,
      };

      setReports(prev => [entry, ...prev]);
      setExpanded(prev => ({ ...prev, [entry.city]: true }));
      setExpandedD(prev => ({ ...prev, [`${entry.city}::${entry.district}`]: true }));

      setNewCity(''); setNewDistrict(''); setNewTitle(''); setNewDesc('');
      setNewType('theft'); setNewSev('moderate');
      setNewImageFile(null); setNewImagePreview(null);
      setImageStatus(null); setImageStatusMsg('');
      setFieldErrors({});
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }, [validate, newCity, newDistrict, newTitle, newDesc, newType, newSev, newImageFile, newImagePreview, imageStatus]);

  const toggleCity     = (city) => setExpanded(prev => ({ ...prev, [city]: !prev[city] }));
  const toggleDistrict = (key)  => setExpandedD(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Real-time updates via SSE ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (data) => {
      if (!data?.type || !data?.severity) return;
      const TYPE_MAP = {
        theft: 'theft', robbery: 'robbery', harassment: 'harassment',
        suspicious: 'suspicious', alert: 'alert', traffic: 'traffic',
        fraud: 'fraud', positive: 'positive',
        road_damage: 'road_damage', waterlogging: 'waterlogging',
        garbage: 'garbage', low_lighting: 'low_lighting',
      };
      const SEV_MAP = { high: 'high', moderate: 'moderate', low: 'low' };
      const type = TYPE_MAP[data.type] || 'alert';
      const sev  = SEV_MAP[data.severity] || 'moderate';
      const entry = {
        id: `sse-${Date.now()}-${Math.random()}`,
        city: data.city || 'Unknown',
        district: data.district || data.city || 'Unknown',
        title: data.title || `${type} reported`,
        type, severity: sev,
        time: 'just now', upvotes: 0, verified: false, aiVerified: true,
        description: data.description || 'AI-detected incident.',
        image: null,
      };
      setReports(prev => {
        if (prev.some(r => r.id === entry.id)) return prev;
        return [entry, ...prev];
      });
    };
    sseClient.subscribe('issue_created', handler);
    return () => sseClient.unsubscribe('issue_created', handler);
  }, []);

  const filtered     = filter === 'all' ? reports : reports.filter(r => r.type === filter || (filter === 'high' && r.severity === 'high'));
  const grouped      = groupByCity(filtered);
  const cities       = Object.keys(grouped).sort();
  const totalReports = reports.length;
  const highRisk     = reports.filter(r => r.severity === 'high').length;
  const verified     = reports.filter(r => r.verified || r.aiVerified).length;

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
      {/* Header */}
      <View style={[s.header, { backgroundColor: isDark ? '#0b1120' : '#fff', borderBottomColor: cardBorder }]}>
        <View style={[s.headerIcon, { backgroundColor: 'rgba(239,83,80,0.12)', borderColor: 'rgba(239,83,80,0.25)' }]}>
          <Text style={{ fontSize: 22 }}>🚨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.textPrimary }]}>Incidents &amp; Reports</Text>
          <Text style={[s.headerSub, { color: theme.textMuted }]}>Community safety reports by city &amp; district</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: showForm ? '#37474F' : '#1976D2' }]}
          onPress={() => { setShowForm(v => !v); setFieldErrors({}); setSubmitError(null); }}
          activeOpacity={0.85}
        >
          <Text style={s.addBtnText}>{showForm ? '✕ Cancel' : '+ Report'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Reports', value: totalReports, color: '#64B5F6', icon: '📋' },
            { label: 'High Risk',     value: highRisk,     color: '#EF5350', icon: '🔴' },
            { label: 'Verified',      value: verified,     color: '#4CAF50', icon: '✓' },
            { label: 'Cities',        value: cities.length, color: '#FFA726', icon: '🏙' },
          ].map((st) => (
            <View key={st.label} style={[s.statBox, { backgroundColor: cardBg, borderColor: cardBorder, borderTopColor: st.color }]}>
              <Text style={{ fontSize: 18 }}>{st.icon}</Text>
              <Text style={[s.statVal, { color: st.color }]}>{st.value}</Text>
              <Text style={[s.statLabel, { color: theme.textMuted }]}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={s.filterRow}>
            {[['all','🌐','All'],['high','🔴','High Risk'],['theft','💰','Theft'],['robbery','🔫','Robbery'],['harassment','⚠️','Harassment'],['positive','✅','Safe Zones'],['alert','🚨','Alerts']].map(([key, icon, label]) => (
              <TouchableOpacity key={key} style={[s.filterChip, { backgroundColor: filter === key ? '#1976D2' : cardBg, borderColor: filter === key ? '#1976D2' : cardBorder }]} onPress={() => setFilter(key)} activeOpacity={0.8}>
                <Text style={{ fontSize: 12 }}>{icon}</Text>
                <Text style={[s.filterLabel, { color: filter === key ? '#fff' : theme.textSecond }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Report form */}
        {showForm && (
          <View style={[s.card, { backgroundColor: cardBg, borderColor: '#1976D2' }]}>
            <Text style={[s.cardTitle, { color: theme.textMuted }]}>NEW REPORT</Text>

            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: theme.textSecond }]}>City *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, borderColor: fieldErrors.city ? '#EF5350' : inputBorder, color: theme.textPrimary }]}
                  placeholder="e.g. Kanpur"
                  placeholderTextColor={theme.textMuted}
                  value={newCity}
                  onChangeText={(t) => { setNewCity(t); if (fieldErrors.city) setFieldErrors(p => ({ ...p, city: null })); }}
                />
                {fieldErrors.city && <Text style={s.fieldError}>{fieldErrors.city}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: theme.textSecond }]}>District</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: theme.textPrimary }]}
                  placeholder="e.g. Kanpur Nagar"
                  placeholderTextColor={theme.textMuted}
                  value={newDistrict}
                  onChangeText={setNewDistrict}
                />
              </View>
            </View>

            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Title *</Text>
            <TextInput
              style={[s.input, { backgroundColor: inputBg, borderColor: fieldErrors.title ? '#EF5350' : inputBorder, color: theme.textPrimary }]}
              placeholder="Brief description of incident"
              placeholderTextColor={theme.textMuted}
              value={newTitle}
              onChangeText={(t) => { setNewTitle(t); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: null })); }}
            />
            {fieldErrors.title && <Text style={s.fieldError}>{fieldErrors.title}</Text>}

            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Details</Text>
            <TextInput
              style={[s.input, s.textArea, { backgroundColor: inputBg, borderColor: fieldErrors.desc ? '#EF5350' : inputBorder, color: theme.textPrimary }]}
              placeholder="What happened? Where exactly?"
              placeholderTextColor={theme.textMuted}
              value={newDesc}
              onChangeText={(t) => { setNewDesc(t); if (fieldErrors.desc) setFieldErrors(p => ({ ...p, desc: null })); }}
              multiline
              numberOfLines={3}
            />
            {fieldErrors.desc && <Text style={s.fieldError}>{fieldErrors.desc}</Text>}

            <Text style={[s.fieldLabel, { color: theme.textSecond, marginTop: 10 }]}>Type</Text>
            <View style={s.miniChips}>
              {Object.entries(TYPE_META).map(([k, v]) => (
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
            <View style={[s.photoBox, {
              borderColor: imageStatus === 'invalid' ? '#EF5350' : imageStatus === 'valid' ? '#4CAF50' : cardBorder,
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            }]}>
              {newImagePreview
                ? <img src={newImagePreview} alt="preview" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 6 }} />
                : <Text style={[s.photoHint, { color: theme.textMuted }]}>📷 Upload photo — garbage, flooding, road damage, natural disaster</Text>
              }
              {typeof document !== 'undefined' && (
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              )}
            </View>

            {imageStatus === 'analyzing' && (
              <View style={s.imageStatusRow}>
                <ActivityIndicator size="small" color="#1976D2" />
                <Text style={[s.imageStatusText, { color: '#64B5F6' }]}>{imageStatusMsg}</Text>
              </View>
            )}
            {imageStatus === 'valid' && (
              <View style={s.imageStatusRow}>
                <Text style={[s.imageStatusText, { color: '#4CAF50' }]}>✓ {imageStatusMsg}</Text>
              </View>
            )}
            {imageStatus === 'invalid' && (
              <View style={s.imageStatusRow}>
                <Text style={[s.imageStatusText, { color: '#EF5350' }]}>✗ {imageStatusMsg}</Text>
              </View>
            )}
            {fieldErrors.image && <Text style={s.fieldError}>{fieldErrors.image}</Text>}

            {submitError && (
              <View style={s.submitErrorBox}>
                <Text style={s.submitErrorText}>⚠ {submitError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, { opacity: submitting ? 0.6 : 1 }]}
              onPress={submitReport}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>Submit Report</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* City accordions — all collapsed by default */}
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
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20, borderBottomWidth: 1 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 16, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderWidth: 1, borderTopWidth: 3, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  filterLabel: { fontSize: 11, fontWeight: '600' },
  card: { borderWidth: 1, borderRadius: 14, padding: 18 },
  cardTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  formRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  fieldError: { fontSize: 10, color: '#EF5350', marginTop: 4, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, outlineStyle: 'none' },
  textArea: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
  miniChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  miniChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 5 },
  miniChipLabel: { fontSize: 10, fontWeight: '600' },
  sevRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sevBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  sevBtnText: { fontSize: 12, fontWeight: '700' },
  photoBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, minHeight: 80, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 4, overflow: 'hidden' },
  photoHint: { fontSize: 12, padding: 20 },
  imageStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  imageStatusText: { fontSize: 11, fontWeight: '600', flex: 1 },
  submitErrorBox: { marginTop: 10, backgroundColor: 'rgba(239,83,80,0.1)', borderWidth: 1, borderColor: 'rgba(239,83,80,0.3)', borderRadius: 8, padding: 10 },
  submitErrorText: { color: '#EF9A9A', fontSize: 12 },
  submitBtn: { marginTop: 14, backgroundColor: '#1976D2', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  citySection: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  cityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  cityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cityName: { fontSize: 15, fontWeight: '700' },
  cityCount: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  cityCountText: { fontSize: 11, fontWeight: '600' },
  cityHighBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  cityHighText: { fontSize: 10, color: '#EF5350', fontWeight: '700' },
  chevron: { fontSize: 11 },
  districtSection: { borderTopWidth: 1 },
  districtHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 11 },
  districtName: { fontSize: 12, fontWeight: '600', flex: 1 },
  districtCount: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  districtCountText: { fontSize: 11, fontWeight: '600' },
  chevronSm: { fontSize: 10 },
  reportsList: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  emptyState: { borderWidth: 1, borderRadius: 14, padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500' },
});

const rc = StyleSheet.create({
  card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 10, padding: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  typeIcon: { fontSize: 11 },
  typeLabel: { fontSize: 10, fontWeight: '700' },
  sevBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  sevText: { fontSize: 9, fontWeight: '800' },
  verifiedBadge: { backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  verifiedText: { fontSize: 9, color: '#4CAF50', fontWeight: '700' },
  time: { fontSize: 10, marginLeft: 'auto' },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  upvoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
  upvoteIcon: { fontSize: 10 },
  upvoteCount: { fontSize: 11, fontWeight: '700' },
  districtTag: { fontSize: 10, marginLeft: 'auto' },
});
