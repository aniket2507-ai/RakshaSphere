'use strict';
/**
 * districtParser.js — parses 01_District_wise_crimes_committed_IPC_2001_2012.csv
 * Aggregates per district across all years, computes multi-factor risk scores,
 * trend analysis (2001→2012), and linear prediction.
 */
const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', '..', '..', 'data');
const DIST_FILE = path.join(DATA_DIR, '01_District_wise_crimes_committed_IPC_2001_2012.csv');

// ── District → lat/lng lookup ─────────────────────────────────────────────────
const DISTRICT_COORDS = {
  // UTTAR PRADESH
  'AGRA':             { lat: 27.1767, lng: 78.0081 },
  'ALIGARH':          { lat: 27.8974, lng: 78.0880 },
  'ALLAHABAD':        { lat: 25.4358, lng: 81.8463 },
  'AZAMGARH':         { lat: 26.0678, lng: 83.1837 },
  'BAHRAICH':         { lat: 27.5742, lng: 81.5960 },
  'BALLIA':           { lat: 25.7594, lng: 84.1476 },
  'BANDA':            { lat: 25.4800, lng: 80.3360 },
  'BAREILLY':         { lat: 28.3670, lng: 79.4304 },
  'BIJNOR':           { lat: 29.3720, lng: 78.1350 },
  'BULANDSHAHAR':     { lat: 28.4070, lng: 77.8490 },
  'DEORIA':           { lat: 26.5020, lng: 83.7840 },
  'ETAH':             { lat: 27.5590, lng: 78.6640 },
  'ETAWAH':           { lat: 26.7860, lng: 79.0200 },
  'FAIZABAD':         { lat: 26.7750, lng: 82.1440 },
  'FATEHPUR':         { lat: 25.9300, lng: 80.8130 },
  'FIROZABAD':        { lat: 27.1520, lng: 78.3950 },
  'GAUTAMBUDH NAGAR': { lat: 28.5355, lng: 77.3910 },
  'GHAZIABAD':        { lat: 28.6692, lng: 77.4538 },
  'GHAZIPUR':         { lat: 25.5780, lng: 83.5780 },
  'GONDA':            { lat: 27.1340, lng: 81.9600 },
  'GORAKHPUR':        { lat: 26.7606, lng: 83.3732 },
  'HARDOI':           { lat: 27.3960, lng: 80.1320 },
  'JALAUN':           { lat: 26.1440, lng: 79.3360 },
  'JAUNPUR':          { lat: 25.7460, lng: 82.6840 },
  'JHANSI':           { lat: 25.4484, lng: 78.5685 },
  'KANPUR DEHAT':     { lat: 26.4100, lng: 79.9000 },
  'KANPUR NAGAR':     { lat: 26.4499, lng: 80.3319 },
  'KAUSHAMBI':        { lat: 25.5400, lng: 81.3900 },
  'KHIRI':            { lat: 27.9000, lng: 80.7800 },
  'LALITPUR':         { lat: 24.6880, lng: 78.4140 },
  'LUCKNOW':          { lat: 26.8467, lng: 80.9462 },
  'MATHURA':          { lat: 27.4924, lng: 77.6737 },
  'MAU':              { lat: 25.9440, lng: 83.5610 },
  'MEERUT':           { lat: 28.9845, lng: 77.7064 },
  'MIRZAPUR':         { lat: 25.1460, lng: 82.5690 },
  'MORADABAD':        { lat: 28.8386, lng: 78.7733 },
  'MUZAFFARNAGAR':    { lat: 29.4727, lng: 77.7085 },
  'PILIBHIT':         { lat: 28.6310, lng: 79.8050 },
  'PRATAPGARH':       { lat: 25.8960, lng: 81.9860 },
  'RAIBAREILLY':      { lat: 26.2300, lng: 81.2400 },
  'RAMPUR':           { lat: 28.8190, lng: 79.0250 },
  'SAHARANPUR':       { lat: 29.9640, lng: 77.5460 },
  'SHAHJAHANPUR':     { lat: 27.8810, lng: 79.9050 },
  'SITAPUR':          { lat: 27.5630, lng: 80.6830 },
  'SULTANPUR':        { lat: 26.2650, lng: 82.0720 },
  'UNNAO':            { lat: 26.5470, lng: 80.4990 },
  'VARANASI':         { lat: 25.3176, lng: 82.9739 },
  // DELHI
  'CENTRAL DELHI':    { lat: 28.6508, lng: 77.2219 },
  'EAST DELHI':       { lat: 28.6600, lng: 77.3100 },
  'NEW DELHI':        { lat: 28.6139, lng: 77.2090 },
  'NORTH DELHI':      { lat: 28.7200, lng: 77.2100 },
  'NORTH EAST DELHI': { lat: 28.6900, lng: 77.3000 },
  'NORTH WEST DELHI': { lat: 28.7200, lng: 77.1400 },
  'SOUTH DELHI':      { lat: 28.5200, lng: 77.2200 },
  'SOUTH WEST DELHI': { lat: 28.5700, lng: 77.0700 },
  'WEST DELHI':       { lat: 28.6500, lng: 77.1000 },
  // MAHARASHTRA
  'MUMBAI':           { lat: 19.0760, lng: 72.8777 },
  'PUNE':             { lat: 18.5204, lng: 73.8567 },
  'NAGPUR':           { lat: 21.1458, lng: 79.0882 },
  'NASHIK':           { lat: 19.9975, lng: 73.7898 },
  'THANE':            { lat: 19.2183, lng: 72.9781 },
  'AURANGABAD':       { lat: 19.8762, lng: 75.3433 },
  'SOLAPUR':          { lat: 17.6805, lng: 75.9064 },
  'AMRAVATI':         { lat: 20.9374, lng: 77.7796 },
  // ANDHRA PRADESH / TELANGANA
  'HYDERABAD CITY':   { lat: 17.3850, lng: 78.4867 },
  'RANGA REDDY':      { lat: 17.3616, lng: 78.4747 },
  'VISAKHAPATNAM':    { lat: 17.6868, lng: 83.2185 },
  'GUNTUR':           { lat: 16.3067, lng: 80.4365 },
  'KRISHNA':          { lat: 16.6100, lng: 80.7200 },
  'KARIMNAGAR':       { lat: 18.4386, lng: 79.1288 },
  'WARANGAL':         { lat: 17.9784, lng: 79.5941 },
  'NALGONDA':         { lat: 17.0575, lng: 79.2671 },
  'KURNOOL':          { lat: 15.8281, lng: 78.0373 },
  'ANANTAPUR':        { lat: 14.6819, lng: 77.6006 },
  // KARNATAKA
  'BANGALORE':        { lat: 12.9716, lng: 77.5946 },
  'MYSORE':           { lat: 12.2958, lng: 76.6394 },
  'BELGAUM':          { lat: 15.8497, lng: 74.4977 },
  'GULBARGA':         { lat: 17.3297, lng: 76.8343 },
  // RAJASTHAN
  'JAIPUR':           { lat: 26.9124, lng: 75.7873 },
  'JODHPUR':          { lat: 26.2389, lng: 73.0243 },
  'KOTA':             { lat: 25.2138, lng: 75.8648 },
  'AJMER':            { lat: 26.4499, lng: 74.6399 },
  'BIKANER':          { lat: 28.0229, lng: 73.3119 },
  'UDAIPUR':          { lat: 24.5854, lng: 73.7125 },
  'ALWAR':            { lat: 27.5530, lng: 76.6346 },
  // GUJARAT
  'AHMEDABAD':        { lat: 23.0225, lng: 72.5714 },
  'SURAT':            { lat: 21.1702, lng: 72.8311 },
  'VADODARA':         { lat: 22.3072, lng: 73.1812 },
  'RAJKOT':           { lat: 22.3039, lng: 70.8022 },
  // WEST BENGAL
  'KOLKATA':          { lat: 22.5726, lng: 88.3639 },
  'HOWRAH':           { lat: 22.5958, lng: 88.2636 },
  // MADHYA PRADESH
  'BHOPAL':           { lat: 23.2599, lng: 77.4126 },
  'INDORE':           { lat: 22.7196, lng: 75.8577 },
  'GWALIOR':          { lat: 26.2183, lng: 78.1828 },
  'JABALPUR':         { lat: 23.1815, lng: 79.9864 },
  // BIHAR
  'PATNA':            { lat: 25.5941, lng: 85.1376 },
  'GAYA':             { lat: 24.7955, lng: 85.0002 },
  'MUZAFFARPUR':      { lat: 26.1209, lng: 85.3647 },
  // PUNJAB
  'LUDHIANA':         { lat: 30.9010, lng: 75.8573 },
  'AMRITSAR':         { lat: 31.6340, lng: 74.8723 },
  'JALANDHAR':        { lat: 31.3260, lng: 75.5762 },
  // HARYANA
  'FARIDABAD':        { lat: 28.4089, lng: 77.3178 },
  'GURGAON':          { lat: 28.4595, lng: 77.0266 },
  'AMBALA':           { lat: 30.3782, lng: 76.7767 },
  // TAMIL NADU
  'CHENNAI':          { lat: 13.0827, lng: 80.2707 },
  'COIMBATORE':       { lat: 11.0168, lng: 76.9558 },
  'MADURAI':          { lat: 9.9252,  lng: 78.1198 },
  // KERALA
  'THIRUVANANTHAPURAM': { lat: 8.5241, lng: 76.9366 },
  'ERNAKULAM':        { lat: 9.9816,  lng: 76.2999 },
  // JHARKHAND
  'RANCHI':           { lat: 23.3441, lng: 85.3096 },
  'DHANBAD':          { lat: 23.7957, lng: 86.4304 },
};

// ── CSV helpers ───────────────────────────────────────────────────────────────
function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  });
}

function num(v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

function linearRegression(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 };
  const xs = ys.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num2  = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const den   = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const slope = den === 0 ? 0 : num2 / den;
  return { slope, intercept: yMean - slope * xMean };
}

function predictNextYear(ys) {
  const { slope, intercept } = linearRegression(ys);
  return Math.max(0, Math.round(intercept + slope * ys.length));
}

function aggregateDistrictData() {
  let rows;
  try {
    const text = fs.readFileSync(DIST_FILE, 'utf8');
    rows = parseCsvRows(text);
  } catch (err) {
    console.warn('[districtParser] Cannot read district CSV:', err.message);
    return new Map();
  }
  const distMap = new Map();
  for (const row of rows) {
    const state    = (row['STATE/UT'] || '').trim();
    const district = (row['DISTRICT'] || '').trim();
    const year     = parseInt(row['YEAR'], 10);
    if (!state || !district || district === 'TOTAL' || state.includes('TOTAL')) continue;
    const key = `${state}|${district}`;
    if (!distMap.has(key)) {
      distMap.set(key, {
        state, district, yearlyTotals: {},
        breakdown: {
          murder:0, attemptMurder:0, rape:0, kidnapping:0, dacoity:0, robbery:0,
          burglary:0, theft:0, riots:0, dowryDeaths:0, assaultWomen:0,
          crueltyHusband:0, arson:0, hurt:0, cheating:0, totalIPC:0,
        },
      });
    }
    const d = distMap.get(key);
    if (!isNaN(year)) d.yearlyTotals[year] = num(row['TOTAL IPC CRIMES']);
    d.breakdown.murder         += num(row['MURDER']);
    d.breakdown.attemptMurder  += num(row['ATTEMPT TO MURDER']);
    d.breakdown.rape           += num(row['RAPE']);
    d.breakdown.kidnapping     += num(row['KIDNAPPING & ABDUCTION']);
    d.breakdown.dacoity        += num(row['DACOITY']);
    d.breakdown.robbery        += num(row['ROBBERY']);
    d.breakdown.burglary       += num(row['BURGLARY']);
    d.breakdown.theft          += num(row['THEFT']);
    d.breakdown.riots          += num(row['RIOTS']);
    d.breakdown.dowryDeaths    += num(row['DOWRY DEATHS']);
    d.breakdown.assaultWomen   += num(row['ASSAULT ON WOMEN WITH INTENT TO OUTRAGE HER MODESTY']);
    d.breakdown.crueltyHusband += num(row['CRUELTY BY HUSBAND OR HIS RELATIVES']);
    d.breakdown.arson          += num(row['ARSON']);
    d.breakdown.hurt           += num(row['HURT/GREVIOUS HURT']);
    d.breakdown.cheating       += num(row['CHEATING']);
    d.breakdown.totalIPC       += num(row['TOTAL IPC CRIMES']);
  }
  return distMap;
}

function computeDistrictScore(b) {
  const raw = b.murder*10 + b.attemptMurder*5 + b.rape*8 + b.kidnapping*6 +
    b.dacoity*7 + b.robbery*5 + b.burglary*3 + b.theft*1 + b.riots*4 +
    b.dowryDeaths*7 + b.assaultWomen*5 + b.crueltyHusband*4 + b.arson*4 + b.hurt*3 + b.cheating*2;
  return Math.min(100, Math.round(Math.log1p(raw) * 4.5));
}

function scoreToClassification(s) { return s <= 33 ? 'Low' : s <= 66 ? 'Moderate' : 'High'; }
function scoreToColor(s) { return s <= 33 ? '#4CAF50' : s <= 66 ? '#FFC107' : '#F44336'; }

function buildDistrictZones() {
  const distMap   = aggregateDistrictData();
  const allScores = [];
  for (const d of distMap.values()) {
    d._raw = computeDistrictScore(d.breakdown);
    allScores.push(d._raw);
  }
  const maxScore = Math.max(...allScores, 1);
  const zones    = [];

  for (const d of distMap.values()) {
    const coords = DISTRICT_COORDS[d.district];
    if (!coords) continue;

    const score  = Math.round((d._raw / maxScore) * 100);
    const years  = Object.keys(d.yearlyTotals).map(Number).sort();
    const totals = years.map(y => d.yearlyTotals[y]);
    const { slope } = linearRegression(totals);
    const trendDir  = slope > 50 ? 'rising' : slope < -50 ? 'falling' : 'stable';
    const predictedTotal = predictNextYear(totals);
    const lastTotal = totals[totals.length - 1] || 1;
    const predictedScore = Math.min(100, Math.round((predictedTotal / lastTotal) * score));

    const bk = d.breakdown;
    const topCrimes = [
      { name: 'Murder',            count: bk.murder,          severity: 'critical' },
      { name: 'Attempt to Murder', count: bk.attemptMurder,   severity: 'critical' },
      { name: 'Rape',              count: bk.rape,            severity: 'critical' },
      { name: 'Kidnapping',        count: bk.kidnapping,      severity: 'high' },
      { name: 'Dacoity',           count: bk.dacoity,         severity: 'high' },
      { name: 'Robbery',           count: bk.robbery,         severity: 'high' },
      { name: 'Riots',             count: bk.riots,           severity: 'medium' },
      { name: 'Dowry Deaths',      count: bk.dowryDeaths,     severity: 'high' },
      { name: 'Assault on Women',  count: bk.assaultWomen,    severity: 'high' },
      { name: 'Cruelty by Husband',count: bk.crueltyHusband,  severity: 'medium' },
      { name: 'Burglary',          count: bk.burglary,        severity: 'medium' },
      { name: 'Theft',             count: bk.theft,           severity: 'low' },
    ].filter(c => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);

    const womenCrimes = bk.rape + bk.dowryDeaths + bk.assaultWomen + bk.crueltyHusband;
    const womenSafetyScore = Math.min(100, Math.round((womenCrimes / Math.max(bk.totalIPC, 1)) * 300));

    zones.push({
      zoneId: `dist-${d.district.toLowerCase().replace(/[\s.&/]+/g, '-')}`,
      district: d.district,
      state: d.state,
      lat: coords.lat,
      lng: coords.lng,
      score,
      classification: scoreToClassification(score),
      color: scoreToColor(score),
      radius: 25000,
      source: 'district',
      breakdown: bk,
      topCrimes,
      yearlyData: years.map(y => ({ year: y, total: d.yearlyTotals[y] })),
      trendDirection: trendDir,
      trendSlope: Math.round(slope),
      predictedTotal,
      predictedScore,
      womenSafetyScore,
      dataYears: years.length ? `${years[0]}–${years[years.length - 1]}` : 'N/A',
    });
  }

  zones.sort((a, b) => b.score - a.score);
  return zones;
}

let _cache = null;
function getDistrictZones() { if (!_cache) _cache = buildDistrictZones(); return _cache; }
function invalidateCache() { _cache = null; }

module.exports = { getDistrictZones, invalidateCache };
