#!/usr/bin/env node
/**
 * Sync Bridge Data from Caltrans
 *
 * Fetches official bridge geometry and metadata from Caltrans Structure
 * Maintenance and Investigations (SM&I) Database.
 *
 * Data source: California Department of Transportation (Caltrans)
 * API: https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/State_Highway_Bridges
 *
 * Usage: node scripts/sync-caltrans-bridges.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Caltrans ArcGIS REST API endpoint for bridges
const BRIDGES_API =
  'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/State_Highway_Bridges/FeatureServer/0/query';

// Bay Area counties (Caltrans county codes)
const BAY_AREA_COUNTIES = ['ALA', 'CC', 'MAR', 'NAP', 'SF', 'SM', 'SCL', 'SOL', 'SON'];

// Major Bay Area toll bridges (for highlighting)
const TOLL_BRIDGES = [
  'GOLDEN GATE BRIDGE',
  'SAN FRANCISCO-OAKLAND BAY BRIDGE',
  'DUMBARTON BRIDGE',
  'SAN MATEO-HAYWARD BRIDGE',
  'RICHMOND-SAN RAFAEL BRIDGE',
  'CARQUINEZ BRIDGE',
  'AL ZAMPA MEMORIAL BRIDGE', // New Carquinez
  'BENICIA-MARTINEZ BRIDGE',
  'ANTIOCH BRIDGE',
];

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'api');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'caltrans-bridges.json');

/**
 * Fetch data from URL
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Convert Web Mercator to WGS84
 */
function webMercatorToWGS84(x, y) {
  const lng = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  return [Math.round(lng * 1000000) / 1000000, Math.round(lat * 1000000) / 1000000];
}

/**
 * Fetch all Bay Area bridges
 */
async function fetchBridges() {
  const countyFilter = BAY_AREA_COUNTIES.map((c) => `CO='${c}'`).join(' OR ');

  const params = new URLSearchParams({
    where: countyFilter,
    outFields: '*',
    f: 'json',
    returnGeometry: 'true',
    outSR: '102100',
  });

  const url = `${BRIDGES_API}?${params}`;

  try {
    const data = await fetchData(url);

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.features || [];
  } catch (error) {
    throw new Error(`Failed to fetch bridges: ${error.message}`);
  }
}

/**
 * Check if bridge is a major toll bridge
 */
function isTollBridge(name) {
  const upperName = (name || '').toUpperCase();
  return TOLL_BRIDGES.some((toll) => upperName.includes(toll.split(' ')[0]));
}

/**
 * Main function
 */
async function main() {
  console.log('=== Syncing Caltrans Bridge Data ===\n');

  const rawFeatures = await fetchBridges();
  console.log(`Fetched ${rawFeatures.length} bridge records from Caltrans\n`);

  const features = [];
  const tollBridges = {};

  for (const raw of rawFeatures) {
    const { attributes, geometry } = raw;

    if (!geometry) continue;

    // Use provided LAT/LON or convert from geometry
    let lat, lng;
    if (attributes.LAT && attributes.LON) {
      lat = attributes.LAT;
      lng = attributes.LON;
    } else if (geometry.x && geometry.y) {
      [lng, lat] = webMercatorToWGS84(geometry.x, geometry.y);
    } else {
      continue;
    }

    const name = attributes.NAME || 'Unknown Bridge';
    const length = parseFloat(attributes.LENG) || 0;
    const isToll = isTollBridge(name);

    // Track toll bridges (keep longest span)
    if (isToll) {
      const baseKey = name.split(' ')[0];
      if (!tollBridges[baseKey] || length > tollBridges[baseKey].length) {
        tollBridges[baseKey] = { name, lat, lng, length };
      }
    }

    features.push({
      type: 'Feature',
      properties: {
        name: name,
        county: attributes.CO,
        district: attributes.DIST,
        route: attributes.BRIDGE ? attributes.BRIDGE.split(' ')[0] : null,
        postmile: attributes.PM,
        city: attributes.CITY,
        yearBuilt: attributes.YRBLT,
        lengthFeet: length,
        mainSpans: parseInt(attributes.MAINSPANS) || null,
        approachSpans: attributes.APPSPANS,
        facility: attributes.FAC,
        location: attributes.LOC,
        isTollBridge: isToll,
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    });
  }

  // Create GeoJSON FeatureCollection
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: 'California Department of Transportation (Caltrans)',
      sourceDb: 'Structure Maintenance and Investigations (SM&I) Database',
      sourceUrl: 'https://caltrans-gis.dot.ca.gov/',
      description: 'Official California State Highway Bridge inventory for Bay Area',
      featureCount: features.length,
      tollBridgeCount: Object.keys(tollBridges).length,
      counties: BAY_AREA_COUNTIES,
      license: 'Public Domain - California Government Data',
    },
    features: features,
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`Wrote ${OUTPUT_FILE} (${(stats.size / 1024).toFixed(1)} KB)`);

  // Summary
  console.log(`\nTotal bridges: ${features.length}`);
  console.log(`Toll bridges identified: ${Object.keys(tollBridges).length}`);

  console.log('\nMajor toll bridge coordinates (official Caltrans data):');
  for (const [key, bridge] of Object.entries(tollBridges).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  )) {
    console.log(`  ${bridge.name}`);
    console.log(`    Coordinates: [${bridge.lng}, ${bridge.lat}]`);
    console.log(`    Length: ${bridge.length.toLocaleString()} ft`);
  }

  // Also output a simple JSON for easy reference
  const tollBridgesSummary = Object.values(tollBridges).map((b) => ({
    name: b.name,
    coordinates: [b.lng, b.lat],
    lengthFeet: b.length,
  }));

  const summaryFile = path.join(OUTPUT_DIR, 'toll-bridges-reference.json');
  fs.writeFileSync(
    summaryFile,
    JSON.stringify(
      {
        description: 'Official Caltrans coordinates for Bay Area toll bridges',
        source: 'Caltrans SM&I Database',
        generated: new Date().toISOString(),
        bridges: tollBridgesSummary,
      },
      null,
      2
    )
  );
  console.log(`\nWrote toll bridge reference: ${summaryFile}`);

  console.log('\nDone!');
}

main().catch(console.error);
