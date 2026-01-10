#!/usr/bin/env node
/**
 * Sync Bay Area County and City Boundaries
 *
 * Fetches boundary polygons for the 9 Bay Area counties and major cities,
 * generating simplified GeoJSON files for map display.
 *
 * Sources:
 * - Counties: OpenDataSoft US County Boundaries
 * - Cities: OpenDataSoft US Cities boundaries
 *
 * Usage: node scripts/sync-county-boundaries.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Bay Area counties
const BAY_AREA_COUNTIES = [
  { name: 'Alameda', abbr: 'ALA', fips: '06001' },
  { name: 'Contra Costa', abbr: 'CC', fips: '06013' },
  { name: 'Marin', abbr: 'MRN', fips: '06041' },
  { name: 'Napa', abbr: 'NAP', fips: '06055' },
  { name: 'San Francisco', abbr: 'SF', fips: '06075' },
  { name: 'San Mateo', abbr: 'SM', fips: '06081' },
  { name: 'Santa Clara', abbr: 'SCL', fips: '06085' },
  { name: 'Solano', abbr: 'SOL', fips: '06095' },
  { name: 'Sonoma', abbr: 'SON', fips: '06097' },
];

// OpenDataSoft API endpoints
const ODS_COUNTIES_API = 'https://public.opendatasoft.com/api/records/1.0/search/';
const ODS_CITIES_API = 'https://public.opendatasoft.com/api/records/1.0/search/';

// Output paths
const OUTPUT_DIR = path.join(__dirname, '../public/api');
const OUTPUT_COUNTIES = path.join(OUTPUT_DIR, 'county-boundaries.json');
const OUTPUT_CITIES = path.join(OUTPUT_DIR, 'city-boundaries.json');

/**
 * Fetch JSON from URL
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Simplify polygon coordinates to reduce file size
 */
function simplifyCoordinates(coords, tolerance = 0.001) {
  if (!Array.isArray(coords)) return coords;

  // Handle nested arrays (MultiPolygon)
  if (Array.isArray(coords[0]) && Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0])) {
    return coords.map(poly => simplifyCoordinates(poly, tolerance));
  }

  // Handle polygon (array of rings)
  if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
    return coords.map(ring => simplifyCoordinates(ring, tolerance));
  }

  // Handle ring (array of coordinates)
  if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
    if (coords.length <= 4) return coords;

    const simplified = [coords[0]];
    for (let i = 1; i < coords.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = coords[i];
      const dist = Math.sqrt(
        Math.pow(curr[0] - prev[0], 2) + Math.pow(curr[1] - prev[1], 2)
      );
      if (dist >= tolerance) {
        simplified.push(curr);
      }
    }
    simplified.push(coords[coords.length - 1]);
    return simplified;
  }

  return coords;
}

/**
 * Fetch county boundaries from OpenDataSoft
 */
async function fetchCountyBoundaries() {
  console.log('Fetching Bay Area county boundaries...\n');

  const features = [];

  for (const county of BAY_AREA_COUNTIES) {
    console.log(`  Fetching ${county.name} County...`);

    const params = new URLSearchParams({
      dataset: 'us-county-boundaries',
      rows: 1,
      'refine.statefp': '06',
      'refine.name': county.name,
    });

    const url = `${ODS_COUNTIES_API}?${params}`;

    try {
      const data = await fetchJSON(url);

      if (data.records && data.records.length > 0) {
        const record = data.records[0].fields;
        const geoShape = record.geo_shape;

        if (geoShape && geoShape.coordinates) {
          const simplifiedCoords = simplifyCoordinates(geoShape.coordinates, 0.0008);

          features.push({
            type: 'Feature',
            properties: {
              name: county.name,
              abbr: county.abbr,
              fips: county.fips,
              state: 'California',
            },
            geometry: {
              type: geoShape.type,
              coordinates: simplifiedCoords,
            },
          });

          console.log(`    Got ${geoShape.type} geometry`);
        }
      } else {
        console.log(`    No data found`);
      }
    } catch (error) {
      console.error(`    Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return features;
}

/**
 * Fetch city boundaries from OpenDataSoft
 * Uses geofilter to get cities within Bay Area bounding box
 */
async function fetchCityBoundaries() {
  console.log('\nFetching Bay Area city boundaries...\n');

  const features = [];

  // Bay Area bounding box
  const bbox = '-123.2,36.8,-121.0,39.0';

  // Get cities in California within the Bay Area bounding box
  const params = new URLSearchParams({
    dataset: 'us-cities-demographics',
    rows: 500,
    'refine.state': 'California',
    'geofilter.bbox': bbox,
  });

  // First, let's try to find a better dataset with city boundaries
  // The demographics dataset may not have boundaries
  console.log('  Searching for city boundary data...');

  // Try geonames-all-cities dataset which has city points (we can use for labels at least)
  const cityParams = new URLSearchParams({
    dataset: 'geonames-all-cities-with-a-population-1000',
    rows: 300,
    'refine.country_code': 'US',
    'refine.admin1_code': 'CA',
    'geofilter.bbox': bbox,
  });

  try {
    const url = `${ODS_CITIES_API}?${cityParams}`;
    const data = await fetchJSON(url);

    if (data.records && data.records.length > 0) {
      console.log(`  Found ${data.records.length} cities/places`);

      // Filter to Bay Area counties
      const bayAreaCities = data.records.filter(r => {
        const adminCode = r.fields.admin2_code;
        // Admin2 codes for Bay Area counties
        const bayCountyCodes = ['001', '013', '041', '055', '075', '081', '085', '095', '097'];
        return bayCountyCodes.includes(adminCode);
      });

      console.log(`  ${bayAreaCities.length} in Bay Area counties`);

      for (const record of bayAreaCities) {
        const fields = record.fields;
        const coords = fields.coordinates;

        if (coords) {
          // Map admin2_code to county name
          const countyMap = {
            '001': 'Alameda',
            '013': 'Contra Costa',
            '041': 'Marin',
            '055': 'Napa',
            '075': 'San Francisco',
            '081': 'San Mateo',
            '085': 'Santa Clara',
            '095': 'Solano',
            '097': 'Sonoma',
          };

          features.push({
            type: 'Feature',
            properties: {
              name: fields.name,
              county: countyMap[fields.admin2_code] || 'Unknown',
              population: fields.population || 0,
              geonameId: fields.geoname_id,
            },
            geometry: {
              type: 'Point',
              coordinates: [coords.lon, coords.lat],
            },
          });
        }
      }
    }
  } catch (error) {
    console.error(`  Error: ${error.message}`);
  }

  // Sort by population (largest first)
  features.sort((a, b) => (b.properties.population || 0) - (a.properties.population || 0));

  return features;
}

/**
 * Calculate centroid for label placement
 */
function calculateCentroid(geometry) {
  let coords = [];

  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    let maxLen = 0;
    for (const poly of geometry.coordinates) {
      if (poly[0] && poly[0].length > maxLen) {
        maxLen = poly[0].length;
        coords = poly[0];
      }
    }
  }

  if (coords.length === 0) return null;

  let sumX = 0, sumY = 0;
  for (const [x, y] of coords) {
    sumX += x;
    sumY += y;
  }

  return [sumX / coords.length, sumY / coords.length];
}

/**
 * Main sync function
 */
async function syncBoundaries() {
  console.log('Syncing Bay Area boundaries...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Fetch county boundaries
  const countyFeatures = await fetchCountyBoundaries();

  if (countyFeatures.length > 0) {
    for (const feature of countyFeatures) {
      const centroid = calculateCentroid(feature.geometry);
      if (centroid) {
        feature.properties.labelCoordinates = centroid;
      }
    }

    const countyGeojson = {
      type: 'FeatureCollection',
      metadata: {
        generated: new Date().toISOString(),
        source: 'OpenDataSoft US County Boundaries',
        count: countyFeatures.length,
        region: 'San Francisco Bay Area',
      },
      features: countyFeatures,
    };

    fs.writeFileSync(OUTPUT_COUNTIES, JSON.stringify(countyGeojson, null, 2));
    const stats = fs.statSync(OUTPUT_COUNTIES);
    console.log(`\nWrote ${countyFeatures.length} counties to ${OUTPUT_COUNTIES} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // Fetch city data (points for now, as city polygon boundaries are harder to find freely)
  const cityFeatures = await fetchCityBoundaries();

  if (cityFeatures.length > 0) {
    const cityGeojson = {
      type: 'FeatureCollection',
      metadata: {
        generated: new Date().toISOString(),
        source: 'GeoNames Cities Database',
        count: cityFeatures.length,
        region: 'San Francisco Bay Area',
        note: 'City center points for label placement',
      },
      features: cityFeatures,
    };

    fs.writeFileSync(OUTPUT_CITIES, JSON.stringify(cityGeojson, null, 2));
    const stats = fs.statSync(OUTPUT_CITIES);
    console.log(`Wrote ${cityFeatures.length} city points to ${OUTPUT_CITIES} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  console.log('\n--- Summary ---');
  console.log(`Counties: ${countyFeatures.length}`);
  console.log(`Cities: ${cityFeatures.length}`);
  console.log('\nDone!');
}

syncBoundaries().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
