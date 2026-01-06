#!/usr/bin/env node
/**
 * Geocode Program Addresses
 *
 * Uses OpenStreetMap Nominatim (free, privacy-respecting) to geocode
 * program addresses and store latitude/longitude coordinates.
 *
 * Map links are generated dynamically at build time from addresses
 * using DuckDuckGo Maps for privacy.
 *
 * Rate limited to 1 request/second per Nominatim usage policy.
 * Results are cached to avoid repeated requests.
 *
 * Usage: node scripts/geocode-programs.cjs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');

const DATA_DIR = path.join(__dirname, '../src/data');
const CACHE_FILE = path.join(__dirname, '../.data/geocode-cache.json');

// Files that are not program data
const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml', 'county-supervisors.yml'];

// Rate limit: 1 request per second (Nominatim policy)
const RATE_LIMIT_MS = 1100;

// Bay Area bounding box for validation
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.9,
  minLng: -123.5,
  maxLng: -121.0
};

// Load or create cache
let geocodeCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    geocodeCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`📂 Loaded ${Object.keys(geocodeCache).length} cached geocode results`);
  } catch (e) {
    console.log('⚠️ Could not load cache, starting fresh');
  }
}

function saveCache() {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(geocodeCache, null, 2));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Geocode an address using Nominatim
 * Returns [longitude, latitude] or null
 */
async function geocodeAddress(address) {
  // Check cache first
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  // Build Nominatim request
  const query = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=us`;

  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'BayNavigator/1.0 (https://baynavigator.org; contact@baynavigator.org)'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);

            // Validate within Bay Area bounds
            if (lat >= BAY_AREA_BOUNDS.minLat && lat <= BAY_AREA_BOUNDS.maxLat &&
                lng >= BAY_AREA_BOUNDS.minLng && lng <= BAY_AREA_BOUNDS.maxLng) {
              const coords = [lng, lat]; // GeoJSON format
              geocodeCache[cacheKey] = coords;
              resolve(coords);
            } else {
              // Outside Bay Area - might be wrong result
              geocodeCache[cacheKey] = null;
              resolve(null);
            }
          } else {
            geocodeCache[cacheKey] = null;
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Check if program already has coordinates (latitude/longitude fields)
 */
function hasCoordinates(program) {
  if (program.latitude && program.longitude) {
    const lat = parseFloat(program.latitude);
    const lng = parseFloat(program.longitude);
    if (lat >= BAY_AREA_BOUNDS.minLat && lat <= BAY_AREA_BOUNDS.maxLat &&
        lng >= BAY_AREA_BOUNDS.minLng && lng <= BAY_AREA_BOUNDS.maxLng) {
      return true;
    }
  }
  return false;
}

async function main() {
  console.log('🌍 Geocoding program addresses...\n');

  const categoryFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  let totalPrograms = 0;
  let withCoords = 0;
  let withAddress = 0;
  let geocoded = 0;
  let failed = 0;
  let updated = 0;

  for (const file of categoryFiles) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let programs = yaml.load(content) || [];
    let fileModified = false;

    console.log(`\n📁 Processing ${file}...`);

    for (const program of programs) {
      totalPrograms++;

      // Already has latitude/longitude?
      if (hasCoordinates(program)) {
        withCoords++;
        continue;
      }

      // Has address but no coords?
      if (program.address && program.address.trim()) {
        withAddress++;

        // Try to geocode
        const coords = await geocodeAddress(program.address);

        if (coords) {
          // Store latitude/longitude directly (map links are generated at build time)
          const [lng, lat] = coords;
          program.latitude = lat;
          program.longitude = lng;
          geocoded++;
          updated++;
          fileModified = true;
          console.log(`   ✅ ${program.name}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } else {
          failed++;
          console.log(`   ❌ ${program.name}: Could not geocode`);
        }

        // Rate limit
        await sleep(RATE_LIMIT_MS);
      }
    }

    // Save modified file
    if (fileModified) {
      const yamlOutput = yaml.dump(programs, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false
      });
      fs.writeFileSync(filePath, yamlOutput);
    }

    // Save cache periodically
    saveCache();
  }

  // Final cache save
  saveCache();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Geocoding Summary:');
  console.log(`   Total programs: ${totalPrograms}`);
  console.log(`   Already had coordinates: ${withCoords}`);
  console.log(`   Had address (no coords): ${withAddress}`);
  console.log(`   Successfully geocoded: ${geocoded}`);
  console.log(`   Failed to geocode: ${failed}`);
  console.log(`   Programs updated: ${updated}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
