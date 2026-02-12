#!/usr/bin/env node
/**
 * Sync Weather Alerts
 * Fetches active weather alerts from the National Weather Service (NWS)
 * for Bay Area forecast zones.
 *
 * Data source: NWS Weather Alerts API (api.weather.gov)
 * Output: public/api/weather-alerts.json
 *
 * Usage: node scripts/sync-weather-alerts.cjs [--verbose]
 *
 * No API key required. NWS API is freely available (requires User-Agent header).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const VERBOSE = process.argv.includes('--verbose');

// Paths
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'weather-alerts.json');

// NWS API — fetch all active California alerts, then filter to Bay Area zones
const NWS_API_URL = 'https://api.weather.gov/alerts/active?area=CA';

// Bay Area NWS forecast zones
const BAY_AREA_ZONES = new Set([
  'CAZ006', // San Francisco
  'CAZ502', // Marin Coastal Range
  'CAZ503', // Sonoma Coastal Range
  'CAZ504', // North Bay Interior Mountains
  'CAZ505', // Coastal North Bay Including Point Reyes
  'CAZ506', // North Bay Interior Valleys
  'CAZ508', // San Francisco Bay Shoreline
  'CAZ509', // San Francisco Peninsula Coast
  'CAZ510', // East Bay Interior Valleys
  'CAZ512', // Santa Cruz Mountains
  'CAZ513', // Santa Clara Valley Including San Jose
  'CAZ514', // Eastern Santa Clara Hills
  'CAZ515', // East Bay Hills
]);

// Bay Area FIPS county codes (SAME codes)
const BAY_AREA_FIPS = new Set([
  '006001', // Alameda
  '006013', // Contra Costa
  '006041', // Marin
  '006055', // Napa
  '006075', // San Francisco
  '006081', // San Mateo
  '006085', // Santa Clara
  '006095', // Solano
  '006097', // Sonoma
]);

function log(...args) {
  if (VERBOSE) console.log('[WX]', ...args);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'BayNavigator/2.0 (info@baytides.org)',
            Accept: 'application/geo+json',
          },
        },
        (res) => {
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
        }
      )
      .on('error', reject);
  });
}

function isBayAreaAlert(properties) {
  const geocode = properties.geocode || {};
  // Check if any UGC zone matches Bay Area
  const ugcZones = geocode.UGC || [];
  if (ugcZones.some((z) => BAY_AREA_ZONES.has(z))) return true;
  // Check if any SAME/FIPS code matches Bay Area counties
  const sameCodes = geocode.SAME || [];
  if (sameCodes.some((c) => BAY_AREA_FIPS.has(c))) return true;
  return false;
}

function severityRank(severity) {
  const ranks = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
  return ranks[severity] || 0;
}

async function main() {
  console.log('Fetching NWS weather alerts for California...');

  const geojson = await fetch(NWS_API_URL);
  const allAlerts = geojson.features || [];
  log(`Total CA alerts: ${allAlerts.length}`);

  // Filter to Bay Area
  const bayAlerts = allAlerts.filter((f) => isBayAreaAlert(f.properties));
  log(`Bay Area alerts: ${bayAlerts.length}`);

  // Transform and sort by severity (most severe first), then by effective time
  const alerts = bayAlerts
    .sort((a, b) => {
      const sevDiff = severityRank(b.properties.severity) - severityRank(a.properties.severity);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.properties.effective) - new Date(a.properties.effective);
    })
    .map((f) => {
      const p = f.properties;
      // Extract the affected Bay Area zone names from areaDesc
      const areaDesc = p.areaDesc || '';
      return {
        id: p.id,
        event: p.event,
        headline: p.headline,
        description: p.description,
        instruction: p.instruction,
        severity: p.severity,
        certainty: p.certainty,
        urgency: p.urgency,
        areaDesc,
        effective: p.effective,
        onset: p.onset,
        expires: p.expires,
        ends: p.ends,
        senderName: p.senderName,
        response: p.response,
        categories: p.category ? [p.category] : [],
        zones: (p.geocode?.UGC || []).filter((z) => BAY_AREA_ZONES.has(z)),
        web: p.web || null,
      };
    });

  const output = {
    generated: new Date().toISOString(),
    source: 'National Weather Service',
    sourceUrl: 'https://www.weather.gov/',
    api: NWS_API_URL,
    region: 'San Francisco Bay Area',
    count: alerts.length,
    alerts,
  };

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${alerts.length} weather alerts to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error syncing weather alerts:', err.message);
  process.exit(1);
});
