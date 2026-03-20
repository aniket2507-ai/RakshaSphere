'use strict';

/**
 * csvParser — parses crime_dataset_india.csv and MR data CSV,
 * aggregates crime counts per city, maps to lat/lng, computes risk scores.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');

// ── City → coordinates mapping (major Indian cities) ─────────────────────────
const CITY_COORDS = {
  'Ahmedabad':      { lat: 23.0225, lng: 72.5714 },
  'Bangalore':      { lat: 12.9716, lng: 77.5946 },
  'Bengaluru':      { lat: 12.9716, lng: 77.5946 },
  'Bhopal':         { lat: 23.2599, lng: 77.4126 },
  'Chennai':        { lat: 13.0827, lng: 80.2707 },
  'Delhi':          { lat: 28.6139, lng: 77.2090 },
  'Ghaziabad':      { lat: 28.6692, lng: 77.4538 },
  'Hyderabad':      { lat: 17.3850, lng: 78.4867 },
  'Indore':         { lat: 22.7196, lng: 75.8577 },
  'Jaipur':         { lat: 26.9124, lng: 75.7873 },
  'Kalyan':         { lat: 19.2403, lng: 73.1305 },
  'Kanpur':         { lat: 26.4499, lng: 80.3319 },
  'Kolkata':        { lat: 22.5726, lng: 88.3639 },
  'Lucknow':        { lat: 26.8467, lng: 80.9462 },
  'Ludhiana':       { lat: 30.9010, lng: 75.8573 },
  'Meerut':         { lat: 28.9845, lng: 77.7064 },
  'Mumbai':         { lat: 19.0760, lng: 72.8777 },
  'Nagpur':         { lat: 21.1458, lng: 79.0882 },
  'Nashik':         { lat: 19.9975, lng: 73.7898 },
  'Patna':          { lat: 25.5941, lng: 85.1376 },
  'Pune':           { lat: 18.5204, lng: 73.8567 },
  'Rajkot':         { lat: 22.3039, lng: 70.8022 },
  'Srinagar':       { lat: 34.0837, lng: 74.7973 },
  'Surat':          { lat: 21.1702, lng: 72.8311 },
  'Thane':          { lat: 19.2183, lng: 72.9781 },
  'Vasai':          { lat: 19.3919, lng: 72.8397 },
  'Varanasi':       { lat: 25.3176, lng: 82.9739 },
  'Visakhapatnam':  { lat: 17.6868, lng: 83.2185 },
  'Agra':           { lat: 27.1767, lng: 78.0081 },
  'Amritsar':       { lat: 31.6340, lng: 74.8723 },
  'Coimbatore':     { lat: 11.0168, lng: 76.9558 },
  'Faridabad':      { lat: 28.4089, lng: 77.3178 },
  'Gurgaon':        { lat: 28.4595, lng: 77.0266 },
  'Gurugram':       { lat: 28.4595, lng: 77.0266 },
  'Kochi':          { lat: 9.9312,  lng: 76.2673 },
  'Noida':          { lat: 28.5355, lng: 77.3910 },
  'Pimpri':         { lat: 18.6279, lng: 73.7997 },
  'Vadodara':       { lat: 22.3072, lng: 73.1812 },
};

// Crime domain → weight multiplier for risk scoring
const DOMAIN_WEIGHTS = {
  'Violent Crime':    3.0,
  'Fire Accident':    2.0,
  'Traffic Fatality': 1.5,
  'Other Crime':      1.0,
};

// High-severity crime descriptions
const HIGH_SEVERITY = new Set([
  'HOMICIDE', 'SEXUAL ASSAULT', 'ROBBERY', 'ASSAULT', 'KIDNAPPING',
  'ARSON', 'FIREARM OFFENSE', 'EXTORTION',
]);

function splitLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = vals[i] !== undefined ? vals[i] : ''; });
    return row;
  });
}

function aggregateCrimeDataset() {
  const cityStats = new Map();
  let rows;
  try {
    const text = fs.readFileSync(path.join(DATA_DIR, 'crime_dataset_india.csv'), 'utf8');
    rows = parseCsvRows(text);
  } catch (err) {
    console.warn('[csvParser] Could not read crime_dataset_india.csv:', err.message);
    return cityStats;
  }
  for (const row of rows) {
    const city = (row['City'] || '').trim();
    if (!city) continue;
    const domain   = (row['Crime Domain'] || 'Other Crime').trim();
    const desc     = (row['Crime Description'] || '').trim().toUpperCase();
    const weight   = DOMAIN_WEIGHTS[domain] || 1.0;
    const severity = HIGH_SEVERITY.has(desc) ? 1.5 : 1.0;
    if (!cityStats.has(city)) cityStats.set(city, { total: 0, violent: 0, weighted: 0 });
    const s = cityStats.get(city);
    s.total++;
    if (domain === 'Violent Crime') s.violent++;
    s.weighted += weight * severity;
  }
  return cityStats;
}

function aggregateMRDataset() {
  const cityStats = new Map();
  let rows;
  try {
    const text = fs.readFileSync(path.join(DATA_DIR, 'MR data - Compiled Data Set.csv'), 'utf8');
    rows = parseCsvRows(text);
  } catch (err) {
    console.warn('[csvParser] Could not read MR data CSV:', err.message);
    return cityStats;
  }
  for (const row of rows) {
    const city = (row['City '] || row['City'] || '').trim();
    if (!city) continue;
    const victimCols = [
      'Number of child victims',
      'Number of male victims(adult)',
      'Number of female victims(adult)',
      'Number of adult victims',
      'Number of childs invoved',
    ];
    let victims = 0;
    for (const col of victimCols) {
      const v = parseInt(row[col], 10);
      if (!isNaN(v)) victims += v;
    }
    if (!cityStats.has(city)) cityStats.set(city, { total: 0, victimCount: 0 });
    const s = cityStats.get(city);
    s.total++;
    s.victimCount += victims;
  }
  return cityStats;
}

function computeCityRiskScore(crimeStats, mrStats) {
  let score = 0;
  if (crimeStats) {
    const crimeContrib  = Math.min(60, Math.log1p(crimeStats.weighted) * 6);
    const violentRatio  = crimeStats.total > 0 ? crimeStats.violent / crimeStats.total : 0;
    score += crimeContrib + violentRatio * 20;
  }
  if (mrStats) {
    score += Math.min(20, Math.log1p(mrStats.victimCount + mrStats.total) * 3);
  }
  return Math.min(100, Math.round(score));
}

function scoreToClassification(score) {
  if (score <= 33) return 'Low';
  if (score <= 66) return 'Moderate';
  return 'High';
}

function scoreToColor(score) {
  if (score <= 33) return '#4CAF50';
  if (score <= 66) return '#FFC107';
  return '#F44336';
}

function buildDatasetZones() {
  const crimeMap  = aggregateCrimeDataset();
  const mrMap     = aggregateMRDataset();
  const allCities = new Set([...crimeMap.keys(), ...mrMap.keys()]);
  const zones     = [];

  for (const city of allCities) {
    const coords = CITY_COORDS[city];
    if (!coords) continue;
    const crimeStats = crimeMap.get(city) || null;
    const mrStats    = mrMap.get(city) || null;
    const score      = computeCityRiskScore(crimeStats, mrStats);
    zones.push({
      zoneId:         `ds-${city.toLowerCase().replace(/\s+/g, '-')}`,
      city,
      lat:            coords.lat,
      lng:            coords.lng,
      score,
      classification: scoreToClassification(score),
      color:          scoreToColor(score),
      crimeCount:     crimeStats ? crimeStats.total : 0,
      mrIncidents:    mrStats ? mrStats.total : 0,
      radius:         15000,
      source:         'dataset',
    });
  }

  zones.sort((a, b) => b.score - a.score);
  return zones;
}

let _cachedZones = null;

function getDatasetZones() {
  if (!_cachedZones) _cachedZones = buildDatasetZones();
  return _cachedZones;
}

function invalidateCache() { _cachedZones = null; }

module.exports = { getDatasetZones, invalidateCache, buildDatasetZones };
