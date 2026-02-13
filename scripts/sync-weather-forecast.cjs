#!/usr/bin/env node
/**
 * Sync Weather Forecast
 * Fetches current conditions + 7-day forecast from Open-Meteo for all Bay Area cities.
 *
 * Data source: Open-Meteo Forecast API (open-meteo.com)
 * Output: Azure Blob Storage (api-data/weather-forecast.json)
 *
 * Usage: node scripts/sync-weather-forecast.cjs [--verbose]
 *
 * No API key required. Open-Meteo is freely available.
 */

const https = require('https');
const { BAY_AREA_CITIES } = require('./lib/bay-area-cities.cjs');
const { uploadToBlob } = require('./lib/azure-blob-upload.cjs');

const VERBOSE = process.argv.includes('--verbose');

function log(...args) {
  if (VERBOSE) console.log('[FC]', ...args);
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

/** WMO Weather interpretation codes → human descriptions */
const WMO_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function weatherDescription(code) {
  return WMO_CODES[code] || 'Unknown';
}

async function main() {
  console.log(`Fetching weather forecast for ${BAY_AREA_CITIES.length} Bay Area cities...`);

  const lats = BAY_AREA_CITIES.map((c) => c.lat).join(',');
  const lons = BAY_AREA_CITIES.map((c) => c.lon).join(',');

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
    `&timezone=America/Los_Angeles&forecast_days=7`;

  log('Request URL length:', url.length);

  const raw = await fetch(url);
  const results = Array.isArray(raw) ? raw : [raw];

  log(`Got ${results.length} location results`);

  const cities = BAY_AREA_CITIES.map((city, i) => {
    const r = results[i];
    if (!r) {
      log(`No data for ${city.name}`);
      return null;
    }

    const current = r.current
      ? {
          temperature: r.current.temperature_2m,
          weatherCode: r.current.weather_code,
          description: weatherDescription(r.current.weather_code),
          windSpeed: r.current.wind_speed_10m,
          humidity: r.current.relative_humidity_2m,
        }
      : null;

    const daily = r.daily
      ? r.daily.time.map((date, j) => ({
          date,
          weatherCode: r.daily.weather_code[j],
          description: weatherDescription(r.daily.weather_code[j]),
          high: r.daily.temperature_2m_max[j],
          low: r.daily.temperature_2m_min[j],
          precipProbability: r.daily.precipitation_probability_max[j],
        }))
      : [];

    return {
      name: city.name,
      county: city.county,
      lat: city.lat,
      lon: city.lon,
      current,
      daily,
    };
  }).filter(Boolean);

  const output = {
    generated: new Date().toISOString(),
    source: 'Open-Meteo Forecast API',
    sourceUrl: 'https://open-meteo.com/',
    region: 'San Francisco Bay Area',
    count: cities.length,
    cities,
  };

  const jsonString = JSON.stringify(output, null, 2) + '\n';
  await uploadToBlob({ container: 'api-data', blob: 'weather-forecast.json', data: jsonString, label: 'weather-forecast' });
  console.log(`Uploaded weather forecast for ${cities.length} cities to blob storage`);
}

main().catch((err) => {
  console.error('Error syncing weather forecast:', err.message);
  process.exit(1);
});
