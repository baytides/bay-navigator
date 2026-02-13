#!/usr/bin/env node
/**
 * Sync Water Levels
 * Fetches current stream gauge data from USGS Water Services for Bay Area waterways.
 *
 * Data source: USGS National Water Information System (waterservices.usgs.gov)
 * Output: public/api/water-levels.json
 *
 * Usage: node scripts/sync-water-levels.cjs [--verbose]
 *
 * No API key required. USGS data is freely available.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const VERBOSE = process.argv.includes('--verbose');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'water-levels.json');

function log(...args) {
  if (VERBOSE) console.log('[WL]', ...args);
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

/**
 * Curated USGS gauge stations across the Bay Area.
 * Parameter codes: 00065 = gauge height (ft), 00060 = discharge (ft³/s)
 */
const GAUGE_STATIONS = [
  // Alameda County
  { siteId: '11179000', waterBody: 'Alameda Creek', location: 'near Niles' },
  { siteId: '11180700', waterBody: 'Alameda Creek Flood Channel', location: 'Union City' },
  { siteId: '11180500', waterBody: 'Dry Creek', location: 'Union City' },
  { siteId: '11181040', waterBody: 'San Lorenzo Creek', location: 'San Lorenzo' },
  { siteId: '11176400', waterBody: 'Arroyo Valle', location: 'near Livermore' },
  // Contra Costa County
  { siteId: '11182500', waterBody: 'San Ramon Creek', location: 'San Ramon' },
  // Santa Clara County
  { siteId: '11169025', waterBody: 'Guadalupe River', location: 'San Jose' },
  { siteId: '11172175', waterBody: 'Coyote Creek', location: 'Milpitas' },
  { siteId: '11169500', waterBody: 'Saratoga Creek', location: 'Saratoga' },
  { siteId: '11169800', waterBody: 'Coyote Creek', location: 'near Gilroy' },
  // San Mateo County
  { siteId: '11162500', waterBody: 'Pescadero Creek', location: 'near Pescadero' },
  { siteId: '11164500', waterBody: 'San Francisquito Creek', location: 'Stanford' },
  // Marin County
  { siteId: '11460000', waterBody: 'Corte Madera Creek', location: 'Ross' },
  { siteId: '11459500', waterBody: 'Novato Creek', location: 'Novato' },
  { siteId: '11460400', waterBody: 'Lagunitas Creek', location: 'Samuel P. Taylor State Park' },
  // Napa County
  { siteId: '11458000', waterBody: 'Napa River', location: 'near Napa' },
  // Sonoma County
  { siteId: '11463000', waterBody: 'Russian River', location: 'near Cloverdale' },
  { siteId: '11465350', waterBody: 'Dry Creek', location: 'near Healdsburg' },
  // Solano County
  { siteId: '11455420', waterBody: 'Sacramento River', location: 'Rio Vista' },
  { siteId: '11337080', waterBody: 'Threemile Slough', location: 'near Rio Vista' },
];

async function main() {
  console.log(`Fetching water levels for ${GAUGE_STATIONS.length} Bay Area gauge stations...`);

  const siteIds = GAUGE_STATIONS.map((s) => s.siteId).join(',');
  const url =
    `https://waterservices.usgs.gov/nwis/iv/?format=json` +
    `&sites=${siteIds}` +
    `&parameterCd=00065,00060` +
    `&siteStatus=active`;

  log('Fetching from USGS...');

  const raw = await fetch(url);
  const timeSeries = raw.value?.timeSeries || [];

  log(`Got ${timeSeries.length} time series`);

  // Group readings by site
  const siteData = new Map();
  for (const ts of timeSeries) {
    const siteCode = ts.sourceInfo?.siteCode?.[0]?.value;
    if (!siteCode) continue;

    if (!siteData.has(siteCode)) {
      const geo = ts.sourceInfo.geoLocation?.geogLocation || {};
      siteData.set(siteCode, {
        siteId: siteCode,
        name: ts.sourceInfo.siteName,
        lat: geo.latitude,
        lon: geo.longitude,
        gaugeHeight: null,
        discharge: null,
        timestamp: null,
      });
    }

    const entry = siteData.get(siteCode);
    const paramCode = ts.variable?.variableCode?.[0]?.value;
    const values = ts.values?.[0]?.value || [];
    const latest = values[values.length - 1];

    if (latest) {
      const val = parseFloat(latest.value);
      if (!isNaN(val) && val >= 0) {
        if (paramCode === '00065') {
          entry.gaugeHeight = Math.round(val * 100) / 100;
          entry.gaugeHeightUnit = 'ft';
        } else if (paramCode === '00060') {
          entry.discharge = Math.round(val * 10) / 10;
          entry.dischargeUnit = 'ft³/s';
        }
        entry.timestamp = latest.dateTime;
      }
    }
  }

  // Merge with our curated station metadata
  const stations = GAUGE_STATIONS.map((meta) => {
    const data = siteData.get(meta.siteId);
    if (!data) {
      log(`No data for site ${meta.siteId} (${meta.waterBody})`);
      return null;
    }
    return {
      ...data,
      waterBody: meta.waterBody,
      location: meta.location,
    };
  }).filter(Boolean);

  const output = {
    generated: new Date().toISOString(),
    source: 'USGS National Water Information System',
    sourceUrl: 'https://waterservices.usgs.gov/',
    region: 'San Francisco Bay Area',
    count: stations.length,
    stations,
  };

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote water levels for ${stations.length} stations to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error syncing water levels:', err.message);
  process.exit(1);
});
