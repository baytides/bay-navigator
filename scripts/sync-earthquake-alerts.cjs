#!/usr/bin/env node
/**
 * Sync Earthquake Alerts
 * Fetches recent earthquake data from USGS and filters to the Bay Area.
 *
 * Data source: USGS Earthquake Hazards Program (earthquake.usgs.gov)
 * Output: Azure Blob Storage (api-data/earthquake-alerts.json)
 *
 * Usage: node scripts/sync-earthquake-alerts.cjs [--verbose]
 *
 * No API key required. USGS feeds are freely available.
 */

const https = require('https');
const { uploadToBlob } = require('./lib/azure-blob-upload.cjs');

const VERBOSE = process.argv.includes('--verbose');

// USGS feeds — "all" includes magnitude < 1.0, good for Bay Area coverage
const USGS_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

// Bay Area bounding box (generous to catch nearby quakes residents would feel)
const BAY_AREA_BOUNDS = {
  minLat: 36.9,
  maxLat: 38.5,
  minLng: -123.1,
  maxLng: -121.2,
};

// Minimum magnitude to include (filter out micro-quakes nobody feels)
const MIN_MAGNITUDE = 1.0;

function log(...args) {
  if (VERBOSE) console.log('[EQ]', ...args);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'BayNavigator/2.0 (info@baytides.org)' } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          res.resume();
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function isInBayArea(coords) {
  if (!coords || coords.length < 2) return false;
  const [lng, lat] = coords;
  return (
    lat >= BAY_AREA_BOUNDS.minLat &&
    lat <= BAY_AREA_BOUNDS.maxLat &&
    lng >= BAY_AREA_BOUNDS.minLng &&
    lng <= BAY_AREA_BOUNDS.maxLng
  );
}

function severityLevel(mag) {
  if (mag >= 5.0) return 'major';
  if (mag >= 4.0) return 'moderate';
  if (mag >= 3.0) return 'light';
  if (mag >= 2.0) return 'minor';
  return 'micro';
}

async function main() {
  console.log('Fetching USGS earthquake data...');

  const geojson = await fetch(USGS_FEED_URL);
  log(`Total features from USGS: ${geojson.metadata.count}`);

  // Filter to Bay Area and minimum magnitude
  const bayQuakes = geojson.features.filter((f) => {
    if (!f.geometry) return false;
    const mag = f.properties.mag;
    if (mag === null || mag < MIN_MAGNITUDE) return false;
    return isInBayArea(f.geometry.coordinates);
  });

  log(`Bay Area quakes (M${MIN_MAGNITUDE}+): ${bayQuakes.length}`);

  // Transform to our output format, sorted by time descending (newest first)
  const alerts = bayQuakes
    .sort((a, b) => b.properties.time - a.properties.time)
    .map((f) => {
      const p = f.properties;
      const [lng, lat, depth] = f.geometry.coordinates;
      return {
        id: f.id,
        magnitude: p.mag,
        place: p.place,
        time: new Date(p.time).toISOString(),
        timestamp: p.time,
        url: p.url,
        depth: Math.round(depth * 10) / 10,
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
        felt: p.felt || 0,
        tsunami: p.tsunami === 1,
        severity: severityLevel(p.mag),
        title: p.title,
        status: p.status,
        magType: p.magType,
        sig: p.sig,
      };
    });

  const output = {
    generated: new Date().toISOString(),
    source: 'USGS Earthquake Hazards Program',
    sourceUrl: 'https://earthquake.usgs.gov/',
    feed: USGS_FEED_URL,
    region: 'San Francisco Bay Area',
    count: alerts.length,
    alerts,
  };

  const jsonString = JSON.stringify(output, null, 2) + '\n';
  await uploadToBlob({ container: 'api-data', blob: 'earthquake-alerts.json', data: jsonString, label: 'earthquake' });
  console.log(`Uploaded ${alerts.length} earthquake alerts to blob storage`);
}

main().catch((err) => {
  console.error('Error syncing earthquake alerts:', err.message);
  process.exit(1);
});
