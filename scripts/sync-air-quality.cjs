#!/usr/bin/env node
/**
 * Sync Air Quality
 * Fetches current air quality data from Open-Meteo for all Bay Area cities.
 *
 * Data source: Open-Meteo Air Quality API (open-meteo.com)
 * Output: Azure Blob Storage (api-data/air-quality.json)
 *
 * Usage: node scripts/sync-air-quality.cjs [--verbose]
 *
 * No API key required. Open-Meteo is freely available.
 */

const https = require('https');
const { BAY_AREA_CITIES } = require('./lib/bay-area-cities.cjs');
const { uploadToBlob } = require('./lib/azure-blob-upload.cjs');

const VERBOSE = process.argv.includes('--verbose');

function log(...args) {
  if (VERBOSE) console.log('[AQ]', ...args);
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

/** Map US EPA AQI value to category, color, and health guidance. */
function aqiCategory(aqi) {
  if (aqi == null)
    return { category: 'Unknown', color: '#999999', healthGuidance: 'Data unavailable' };
  if (aqi <= 50)
    return { category: 'Good', color: '#00e400', healthGuidance: 'Air quality is satisfactory.' };
  if (aqi <= 100)
    return {
      category: 'Moderate',
      color: '#ffff00',
      healthGuidance: 'Acceptable; some pollutants may concern unusually sensitive people.',
    };
  if (aqi <= 150)
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: '#ff7e00',
      healthGuidance: 'Sensitive groups may experience health effects. General public less likely.',
    };
  if (aqi <= 200)
    return {
      category: 'Unhealthy',
      color: '#ff0000',
      healthGuidance: 'Everyone may begin to experience health effects.',
    };
  if (aqi <= 300)
    return {
      category: 'Very Unhealthy',
      color: '#8f3f97',
      healthGuidance: 'Health alert: everyone may experience more serious health effects.',
    };
  return {
    category: 'Hazardous',
    color: '#7e0023',
    healthGuidance: 'Health warning of emergency conditions. Entire population likely affected.',
  };
}

async function main() {
  console.log(`Fetching air quality for ${BAY_AREA_CITIES.length} Bay Area cities...`);

  // Open-Meteo supports comma-separated lat/lon for batch requests
  const lats = BAY_AREA_CITIES.map((c) => c.lat).join(',');
  const lons = BAY_AREA_CITIES.map((c) => c.lon).join(',');

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide` +
    `&timezone=America/Los_Angeles`;

  log('Request URL length:', url.length);

  const raw = await fetch(url);

  // Open-Meteo returns an array when multiple locations are requested
  const results = Array.isArray(raw) ? raw : [raw];

  log(`Got ${results.length} location results`);

  const cities = BAY_AREA_CITIES.map((city, i) => {
    const r = results[i];
    if (!r || !r.current) {
      log(`No data for ${city.name}`);
      return null;
    }

    const aqi = r.current.us_aqi;
    const { category, color, healthGuidance } = aqiCategory(aqi);

    return {
      name: city.name,
      county: city.county,
      lat: city.lat,
      lon: city.lon,
      aqi,
      category,
      color,
      healthGuidance,
      pollutants: {
        pm2_5: r.current.pm2_5,
        pm10: r.current.pm10,
        ozone: r.current.ozone,
        no2: r.current.nitrogen_dioxide,
      },
    };
  }).filter(Boolean);

  const output = {
    generated: new Date().toISOString(),
    source: 'Open-Meteo Air Quality API',
    sourceUrl: 'https://open-meteo.com/',
    region: 'San Francisco Bay Area',
    count: cities.length,
    cities,
  };

  const jsonString = JSON.stringify(output, null, 2) + '\n';
  await uploadToBlob({ container: 'api-data', blob: 'air-quality.json', data: jsonString, label: 'air-quality' });
  console.log(`Uploaded air quality for ${cities.length} cities to blob storage`);
}

main().catch((err) => {
  console.error('Error syncing air quality:', err.message);
  process.exit(1);
});
