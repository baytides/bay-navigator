#!/usr/bin/env node
/**
 * Validate Map Coordinates
 *
 * Cross-references map tile coordinates with authoritative sources:
 * 1. Caltrans State Highway Network - Official California highway geometry
 * 2. Azure Maps Snap-to-Roads - Validates points align with road network
 *
 * This script helps identify coordinate errors in map data.
 *
 * Usage: node scripts/validate-map-coordinates.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Azure Maps configuration
const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const AZURE_MAPS_API = 'https://atlas.microsoft.com';

// Caltrans data file
const CALTRANS_FILE = path.join(__dirname, '..', '..', 'public', 'api', 'caltrans-highways.json');

// Test points for major highways (known locations)
// Coordinates taken directly from Caltrans SHN_Lines geometry data
const TEST_POINTS = [
  // US 101 - Golden Gate Bridge (from Caltrans toll bridge data)
  { name: 'US 101 at Golden Gate Bridge', lat: 37.80816667, lng: -122.4764, route: 101 },
  // US 101 - Marin (Alexander Ave area)
  { name: 'US 101 at Alexander Ave (Marin)', lat: 37.8325, lng: -122.478, route: 101 },
  // US 101 - SFO area
  { name: 'US 101 at SFO', lat: 37.6005, lng: -122.3859, route: 101 },
  // US 101 - San Jose
  { name: 'US 101 at San Jose', lat: 37.3697, lng: -121.9228, route: 101 },
  // I-80 - Bay Bridge (from Caltrans toll bridge data)
  { name: 'I-80 at Bay Bridge (SF)', lat: 37.7983, lng: -122.3778, route: 80 },
  // I-80 - Bay Bridge (Oakland side)
  { name: 'I-80 at Bay Bridge (Oakland)', lat: 37.8118, lng: -122.3594, route: 80 },
  // I-280 - San Francisco (from Caltrans SHN geometry)
  { name: 'I-280 in SF', lat: 37.771606, lng: -122.398199, route: 280 },
  // I-580 - Alameda County (from Caltrans SHN geometry)
  { name: 'I-580 Alameda', lat: 37.89528, lng: -122.310267, route: 580 },
  // I-680 - Walnut Creek area (from Caltrans SHN geometry)
  { name: 'I-680 Walnut Creek', lat: 37.900687, lng: -122.070805, route: 680 },
  // I-880 - Oakland (from Caltrans SHN geometry)
  { name: 'I-880 Oakland', lat: 37.802879, lng: -122.300899, route: 880 },
  // SR 92 - San Mateo Bridge (from Caltrans toll bridge data)
  { name: 'SR 92 San Mateo Bridge', lat: 37.57355278, lng: -122.26235, route: 92 },
  // SR 84 - Dumbarton Bridge (from Caltrans toll bridge data)
  { name: 'SR 84 Dumbarton Bridge', lat: 37.49915, lng: -122.12838, route: 84 },
];

/**
 * Fetch JSON from URL
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    protocol
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
 * Calculate distance between two points (Haversine formula)
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find minimum distance from a point to a line segment
 */
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return haversineDistance(py, px, yy, xx);
}

/**
 * Find minimum distance from a point to a route's geometry
 */
function distanceToRoute(lat, lng, routeFeatures) {
  let minDistance = Infinity;

  for (const feature of routeFeatures) {
    const { geometry } = feature;
    let coords;

    if (geometry.type === 'LineString') {
      coords = [geometry.coordinates];
    } else if (geometry.type === 'MultiLineString') {
      coords = geometry.coordinates;
    } else {
      continue;
    }

    for (const line of coords) {
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, y1] = line[i];
        const [x2, y2] = line[i + 1];
        const dist = pointToLineDistance(lng, lat, x1, y1, x2, y2);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }
    }
  }

  return minDistance;
}

/**
 * Validate a point using Azure Maps Snap-to-Roads
 */
async function validateWithAzureMaps(lat, lng) {
  if (!AZURE_MAPS_KEY) {
    return { error: 'AZURE_MAPS_KEY not set' };
  }

  const url = `${AZURE_MAPS_API}/route/directions/json?api-version=1.0&subscription-key=${AZURE_MAPS_KEY}&query=${lat},${lng}:${lat + 0.001},${lng + 0.001}&travelMode=car`;

  try {
    const data = await fetchJSON(url);

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      const startPoint = leg.points[0];

      // Calculate how far the snapped point is from the original
      const snapDistance = haversineDistance(lat, lng, startPoint.latitude, startPoint.longitude);

      return {
        snappedLat: startPoint.latitude,
        snappedLng: startPoint.longitude,
        snapDistance: snapDistance,
        onRoad: snapDistance < 50, // Within 50m of a road
      };
    }

    return { error: 'No route found' };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('=== Map Coordinate Validation ===\n');

  // Load Caltrans data
  let caltransData = null;
  if (fs.existsSync(CALTRANS_FILE)) {
    console.log('Loading Caltrans highway data...');
    caltransData = JSON.parse(fs.readFileSync(CALTRANS_FILE, 'utf8'));
    console.log(`  Loaded ${caltransData.features.length} highway segments\n`);
  } else {
    console.log('Caltrans data not found. Run sync-caltrans-highways.cjs first.\n');
  }

  // Validate test points
  console.log('Validating test points against Caltrans data:\n');
  console.log('Point                                  | Route | Distance to Official Geometry');
  console.log('-'.repeat(80));

  const results = [];

  for (const point of TEST_POINTS) {
    let caltransDistance = null;

    if (caltransData) {
      // Filter features for this route
      const routeFeatures = caltransData.features.filter((f) => f.properties.route === point.route);

      if (routeFeatures.length > 0) {
        caltransDistance = distanceToRoute(point.lat, point.lng, routeFeatures);
      }
    }

    const status =
      caltransDistance !== null
        ? caltransDistance < 100
          ? '✓'
          : caltransDistance < 500
            ? '⚠'
            : '✗'
        : '?';

    const distStr = caltransDistance !== null ? `${Math.round(caltransDistance)}m` : 'N/A';

    console.log(
      `${status} ${point.name.padEnd(38)} | ${point.route.toString().padStart(3)}   | ${distStr}`
    );

    results.push({
      ...point,
      caltransDistance,
      status,
    });
  }

  console.log('\nLegend: ✓ = <100m (good), ⚠ = 100-500m (check), ✗ = >500m (likely error)\n');

  // Azure Maps validation (if key available)
  if (AZURE_MAPS_KEY) {
    console.log('Validating with Azure Maps Snap-to-Roads...\n');

    for (const point of TEST_POINTS.slice(0, 5)) {
      process.stdout.write(`  ${point.name}... `);
      const azureResult = await validateWithAzureMaps(point.lat, point.lng);

      if (azureResult.error) {
        console.log(`Error: ${azureResult.error}`);
      } else {
        const status = azureResult.onRoad ? '✓' : '⚠';
        console.log(`${status} Snap distance: ${Math.round(azureResult.snapDistance)}m`);
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } else {
    console.log('Azure Maps validation skipped (AZURE_MAPS_KEY not set)');
  }

  // Summary
  const good = results.filter((r) => r.status === '✓').length;
  const warning = results.filter((r) => r.status === '⚠').length;
  const error = results.filter((r) => r.status === '✗').length;

  console.log('\n=== Summary ===');
  console.log(`✓ Good (< 100m): ${good}`);
  console.log(`⚠ Check (100-500m): ${warning}`);
  console.log(`✗ Error (> 500m): ${error}`);

  if (error > 0) {
    console.log('\nPoints with potential errors:');
    for (const r of results.filter((r) => r.status === '✗')) {
      console.log(`  - ${r.name}: ${Math.round(r.caltransDistance)}m from official route`);
    }
  }
}

main().catch(console.error);
