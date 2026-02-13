#!/usr/bin/env node
/**
 * Sync REFUGE Restrooms
 * Fetches gender-neutral and accessible restroom locations across the Bay Area.
 *
 * Data source: REFUGE Restrooms (refugerestrooms.org)
 * Output: public/data/refuge-restrooms.json
 *
 * Usage: node scripts/sync-refuge-restrooms.cjs [--verbose]
 *
 * No API key required. REFUGE Restrooms API is freely available.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const VERBOSE = process.argv.includes('--verbose');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'refuge-restrooms.json');

function log(...args) {
  if (VERBOSE) console.log('[RR]', ...args);
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

// Anchor points spread across all 9 Bay Area counties
const ANCHOR_POINTS = [
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'Oakland', lat: 37.8044, lon: -122.2712 },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
  { name: 'Berkeley', lat: 37.8716, lon: -122.2727 },
  { name: 'Daly City', lat: 37.6879, lon: -122.4702 },
  { name: 'Fremont', lat: 37.5485, lon: -121.9886 },
  { name: 'San Rafael', lat: 37.9735, lon: -122.5311 },
  { name: 'Napa', lat: 38.2975, lon: -122.2869 },
  { name: 'Santa Rosa', lat: 38.4404, lon: -122.7141 },
  { name: 'Walnut Creek', lat: 37.9101, lon: -122.0652 },
  { name: 'Vallejo', lat: 38.1041, lon: -122.2566 },
  { name: 'Palo Alto', lat: 37.4419, lon: -122.143 },
];

// Bounding box for full 9-county Bay Area
const BOUNDS = {
  minLat: 36.9,
  maxLat: 38.6,
  minLon: -123.1,
  maxLon: -121.2,
};

function isInBayArea(lat, lon) {
  return (
    lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon
  );
}

async function fetchForLocation(anchor) {
  const url =
    `https://www.refugerestrooms.org/api/v1/restrooms/by_location` +
    `?lat=${anchor.lat}&lng=${anchor.lon}&per_page=100`;

  log(`Fetching near ${anchor.name}...`);

  try {
    const results = await fetch(url);
    log(`  Got ${results.length} results near ${anchor.name}`);
    return results;
  } catch (err) {
    console.error(`  Warning: Failed to fetch near ${anchor.name}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`Fetching restrooms from ${ANCHOR_POINTS.length} anchor points...`);

  // Fetch from all anchor points (sequentially to be polite to the API)
  const allResults = [];
  for (const anchor of ANCHOR_POINTS) {
    const results = await fetchForLocation(anchor);
    allResults.push(...results);
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  log(`Total raw results: ${allResults.length}`);

  // Deduplicate by ID
  const seen = new Map();
  for (const r of allResults) {
    if (!seen.has(r.id)) {
      seen.set(r.id, r);
    }
  }

  log(`After dedup: ${seen.size} unique restrooms`);

  // Filter to Bay Area bounding box and transform
  const restrooms = Array.from(seen.values())
    .filter((r) => {
      const lat = parseFloat(r.latitude);
      const lon = parseFloat(r.longitude);
      return !isNaN(lat) && !isNaN(lon) && isInBayArea(lat, lon);
    })
    .map((r) => ({
      id: r.id,
      name: r.name,
      address: [r.street, r.city, r.state].filter(Boolean).join(', '),
      city: r.city,
      state: r.state,
      lat: parseFloat(r.latitude),
      lon: parseFloat(r.longitude),
      accessible: r.accessible || false,
      unisex: r.unisex || false,
      changingTable: r.changing_table || false,
      directions: r.directions || null,
      comment: r.comment || null,
    }))
    .sort(
      (a, b) =>
        (a.city || '').localeCompare(b.city || '') || (a.name || '').localeCompare(b.name || '')
    );

  log(`After bounding box filter: ${restrooms.length} restrooms`);

  const output = {
    generated: new Date().toISOString(),
    source: 'REFUGE Restrooms',
    sourceUrl: 'https://www.refugerestrooms.org/',
    region: 'San Francisco Bay Area',
    count: restrooms.length,
    restrooms,
  };

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${restrooms.length} restrooms to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error syncing REFUGE restrooms:', err.message);
  process.exit(1);
});
