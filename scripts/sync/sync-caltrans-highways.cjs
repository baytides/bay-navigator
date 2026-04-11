#!/usr/bin/env node
/**
 * Sync California State Highway data from Caltrans
 *
 * Fetches official highway geometry from Caltrans ArcGIS REST API
 * to provide authoritative road coordinates for the Bay Area.
 *
 * Data source: California Department of Transportation (Caltrans)
 * API: https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/SHN_Lines/FeatureServer/0
 *
 * Usage: node scripts/sync-caltrans-highways.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Caltrans ArcGIS REST API endpoint
const CALTRANS_API =
  'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/SHN_Lines/FeatureServer/0/query';

// Bay Area counties (Caltrans county codes)
// ALA=Alameda, CC=Contra Costa, MRN=Marin, NAP=Napa, SF=San Francisco
// SM=San Mateo, SCL=Santa Clara, SOL=Solano, SON=Sonoma
const BAY_AREA_COUNTIES = ['ALA', 'CC', 'MRN', 'NAP', 'SF', 'SM', 'SCL', 'SOL', 'SON'];

// Major Bay Area highways to fetch
const BAY_AREA_ROUTES = [
  1, // Pacific Coast Highway
  4, // John Muir Parkway
  12, // Sonoma/Napa
  13, // Ashby Ave/Warren Freeway
  17, // Santa Cruz Mountains
  24, // Caldecott Tunnel
  29, // Napa Valley
  35, // Skyline Blvd
  37, // Vallejo/Novato
  80, // Bay Bridge/I-80
  84, // Dumbarton Bridge
  85, // South Bay
  87, // San Jose
  92, // San Mateo Bridge
  101, // US 101
  121, // Sonoma
  128, // Sonoma/Napa
  131, // Tiburon
  152, // Pacheco Pass
  160, // River Road
  185, // Oakland
  237, // Milpitas
  238, // Castro Valley
  242, // Concord
  260, // Oakland Airport
  262, // Mission Blvd
  280, // I-280 Junipero Serra
  380, // SFO Connector
  480, // Former Embarcadero Freeway segment
  580, // I-580 MacArthur
  680, // I-680
  780, // I-780 Benicia
  880, // I-880 Nimitz
  980, // I-980 Oakland
];

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'api');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'caltrans-highways.json');

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
 * Convert ESRI JSON to GeoJSON
 */
function esriToGeoJSON(esriResponse) {
  const features = [];

  for (const feature of esriResponse.features || []) {
    const { attributes, geometry } = feature;

    if (!geometry || !geometry.paths) continue;

    // Convert ESRI polyline paths to GeoJSON coordinates
    // ESRI uses Web Mercator (102100/3857), need to convert to WGS84
    const coordinates = geometry.paths.map((path) =>
      path.map((point) => {
        // Convert Web Mercator to WGS84
        const x = point[0];
        const y = point[1];
        const lng = (x / 20037508.34) * 180;
        let lat = (y / 20037508.34) * 180;
        lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
        return [Math.round(lng * 1000000) / 1000000, Math.round(lat * 1000000) / 1000000];
      })
    );

    // Flatten if single path
    const geomType = coordinates.length === 1 ? 'LineString' : 'MultiLineString';
    const geomCoords = coordinates.length === 1 ? coordinates[0] : coordinates;

    features.push({
      type: 'Feature',
      properties: {
        route: attributes.Route,
        routeSuffix: attributes.RteSuffix || '',
        routeId: attributes.RouteS,
        county: attributes.County,
        district: attributes.District,
        direction: attributes.Direction,
        routeType: attributes.RouteType,
        beginPostmile: attributes.bPM,
        endPostmile: attributes.ePM,
        alignCode: attributes.AlignCode,
      },
      geometry: {
        type: geomType,
        coordinates: geomCoords,
      },
    });
  }

  return features;
}

/**
 * Fetch highway data for a specific route in Bay Area counties
 */
async function fetchRouteData(route) {
  const countyFilter = BAY_AREA_COUNTIES.map((c) => `County='${c}'`).join(' OR ');
  const where = `Route=${route} AND (${countyFilter})`;

  const params = new URLSearchParams({
    where: where,
    outFields: '*',
    f: 'json',
    returnGeometry: 'true',
    outSR: '102100', // Web Mercator for consistency
  });

  const url = `${CALTRANS_API}?${params}`;

  try {
    const data = await fetchData(url);

    if (data.error) {
      console.error(`  Error fetching route ${route}: ${data.error.message}`);
      return [];
    }

    const features = esriToGeoJSON(data);
    return features;
  } catch (error) {
    console.error(`  Error fetching route ${route}: ${error.message}`);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Syncing Caltrans Highway Data ===\n');
  console.log(`Fetching ${BAY_AREA_ROUTES.length} routes for Bay Area counties...\n`);

  const allFeatures = [];
  let successCount = 0;

  for (const route of BAY_AREA_ROUTES) {
    process.stdout.write(`Route ${route.toString().padStart(3)}... `);

    const features = await fetchRouteData(route);

    if (features.length > 0) {
      allFeatures.push(...features);
      console.log(`${features.length} segments`);
      successCount++;
    } else {
      console.log('no data in Bay Area');
    }

    // Rate limit - be nice to Caltrans servers
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\nFetched ${allFeatures.length} total segments from ${successCount} routes`);

  // Create GeoJSON FeatureCollection
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: 'California Department of Transportation (Caltrans)',
      sourceUrl: 'https://caltrans-gis.dot.ca.gov/',
      description: 'Official California State Highway geometry for Bay Area',
      featureCount: allFeatures.length,
      routeCount: successCount,
      counties: BAY_AREA_COUNTIES,
      license: 'Public Domain - California Government Data',
    },
    features: allFeatures,
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\nWrote ${OUTPUT_FILE} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Summary by route
  const routeCounts = {};
  for (const f of allFeatures) {
    const r = f.properties.route;
    routeCounts[r] = (routeCounts[r] || 0) + 1;
  }

  console.log('\nSegments by route:');
  const sortedRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
  for (const [route, count] of sortedRoutes.slice(0, 10)) {
    console.log(`  Route ${route.toString().padStart(3)}: ${count} segments`);
  }
  if (sortedRoutes.length > 10) {
    console.log(`  ... and ${sortedRoutes.length - 10} more routes`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
