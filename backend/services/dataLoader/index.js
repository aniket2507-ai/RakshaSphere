/**
 * Data_Loader — loads and watches the data/ directory datasets.
 *
 * Responsibilities:
 *  - Parse crime_data.csv, weather_data.json, sample_issues.json
 *  - Gracefully handle missing / malformed files (log warning, use defaults)
 *  - Emit 'data:refreshed' on the EventBus after a successful load
 *  - Watch the data/ directory for changes and reload automatically
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

'use strict';

const fs = require('fs');
const path = require('path');
const eventBus = require('../../utils/eventBus');

// Resolve the data/ directory relative to the project root (two levels up from this file)
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');

const CRIME_FILE   = path.join(DATA_DIR, 'crime_data.csv');
const WEATHER_FILE = path.join(DATA_DIR, 'weather_data.json');
const ISSUES_FILE  = path.join(DATA_DIR, 'sample_issues.json');

// ─── CSV Parser ──────────────────────────────────────────────────────────────

/**
 * Minimal CSV parser — handles quoted fields and trims whitespace.
 * Returns an array of objects keyed by the header row.
 *
 * @param {string} text - Raw CSV string
 * @returns {Object[]}
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const record = {};
    headers.forEach((header, i) => {
      record[header] = values[i] !== undefined ? values[i].trim() : '';
    });
    return record;
  });
}

/**
 * Split a single CSV line respecting double-quoted fields.
 *
 * @param {string} line
 * @returns {string[]}
 */
function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Handle escaped quote ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── File Readers ─────────────────────────────────────────────────────────────

/**
 * Safely read and parse crime_data.csv.
 * On any error: log warning, return [] and record the filename.
 *
 * @param {string[]} missingFiles - Mutated in-place on failure
 * @returns {Object[]}
 */
function loadCrimeData(missingFiles) {
  try {
    const text = fs.readFileSync(CRIME_FILE, 'utf8');
    const records = parseCsv(text);
    return records;
  } catch (err) {
    console.warn(`[DataLoader] Warning: could not load crime_data.csv — ${err.message}`);
    missingFiles.push('crime_data.csv');
    return [];
  }
}

/**
 * Safely read and parse weather_data.json.
 * On any error: log warning, return {} and record the filename.
 *
 * @param {string[]} missingFiles - Mutated in-place on failure
 * @returns {Object}
 */
function loadWeatherData(missingFiles) {
  try {
    const text = fs.readFileSync(WEATHER_FILE, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    console.warn(`[DataLoader] Warning: could not load weather_data.json — ${err.message}`);
    missingFiles.push('weather_data.json');
    return {};
  }
}

/**
 * Safely read and parse sample_issues.json.
 * On any error: log warning, return [] and record the filename.
 *
 * @param {string[]} missingFiles - Mutated in-place on failure
 * @returns {Object[]}
 */
function loadIssueData(missingFiles) {
  try {
    const text = fs.readFileSync(ISSUES_FILE, 'utf8');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[DataLoader] Warning: could not load sample_issues.json — ${err.message}`);
    missingFiles.push('sample_issues.json');
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load all datasets from the data/ directory.
 * Missing or malformed files are handled gracefully — they are logged,
 * replaced with safe defaults, and recorded in missingFiles[].
 * Emits 'data:refreshed' on the EventBus with the DataSources payload.
 *
 * @returns {import('../../models').DataSources}
 */
function loadAll() {
  const missingFiles = [];

  const crimeData   = loadCrimeData(missingFiles);
  const weatherData = loadWeatherData(missingFiles);
  const issueData   = loadIssueData(missingFiles);

  /** @type {import('../../models').DataSources} */
  const dataSources = {
    crimeData,
    weatherData,
    issueData,
    loadedAt: new Date().toISOString(),
    missingFiles,
  };

  eventBus.emit('data:refreshed', dataSources);

  return dataSources;
}

/**
 * Watch the data/ directory for file changes and call loadAll() on any change.
 * Uses fs.watch with a short debounce to avoid duplicate events.
 */
function watchForChanges() {
  let debounceTimer = null;

  try {
    fs.watch(DATA_DIR, { persistent: false }, (eventType, filename) => {
      if (!filename) return;

      // Debounce: wait 300 ms after the last event before reloading
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log(`[DataLoader] File change detected (${eventType}: ${filename}) — reloading datasets`);
        loadAll();
      }, 300);
    });

    console.log(`[DataLoader] Watching ${DATA_DIR} for changes`);
  } catch (err) {
    console.warn(`[DataLoader] Warning: could not watch data directory — ${err.message}`);
  }
}

/**
 * Return empty/safe defaults for all data sources.
 * Used as a fallback when loadAll() cannot be called.
 *
 * @returns {import('../../models').DataSources}
 */
function getDefaults() {
  return {
    crimeData: [],
    weatherData: {},
    issueData: [],
    loadedAt: new Date().toISOString(),
    missingFiles: [],
  };
}

module.exports = { loadAll, watchForChanges, getDefaults };
