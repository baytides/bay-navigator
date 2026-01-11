#!/usr/bin/env node
/**
 * Sync Bay Area Transit Route Lines from 511.org GTFS feeds
 *
 * Downloads GTFS feeds for rail operators and extracts route geometry (shapes)
 * to create GeoJSON LineString features for display on the map.
 *
 * Usage: API_511_KEY=your_key node scripts/sync-transit-routes.cjs
 *
 * Outputs: public/api/transit-routes.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

// 511 API configuration
const API_KEY = process.env.API_511_KEY;
if (!API_KEY) {
  console.error('Error: API_511_KEY environment variable is required');
  console.error('Set it with: export API_511_KEY=your_key_here');
  process.exit(1);
}

// Rail operators to fetch route geometry for
// Focus on rail/ferry since bus routes are too numerous
const RAIL_OPERATORS = [
  { id: 'BA', name: 'BART', color: '#009bda', type: 'rail' },
  { id: 'CT', name: 'Caltrain', color: '#e31837', type: 'rail' },
  { id: 'SA', name: 'SMART', color: '#0072bc', type: 'rail' },
  { id: 'CE', name: 'ACE Rail', color: '#8b4513', type: 'rail' },
  { id: 'AM', name: 'Capitol Corridor', color: '#00467f', type: 'rail' },
  { id: 'GF', name: 'Golden Gate Ferry', color: '#c41230', type: 'ferry' },
  { id: 'SB', name: 'SF Bay Ferry', color: '#1e3a5f', type: 'ferry' },
];

// Output path
const OUTPUT_FILE = path.join(__dirname, '../public/api/transit-routes.json');

// Temp directory for GTFS downloads
const TEMP_DIR = path.join(__dirname, '../.cache/gtfs');

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Download GTFS feed for an operator
 */
async function downloadGTFS(operatorId) {
  const url = `http://api.511.org/transit/datafeeds?api_key=${API_KEY}&operator_id=${operatorId}`;
  const outputPath = path.join(TEMP_DIR, `${operatorId}-gtfs.zip`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(outputPath);
        });
      })
      .on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
  });
}

/**
 * Parse a CSV file from the GTFS zip
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"/, '').replace(/"$/, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

/**
 * Extract and parse a file from a zip archive
 */
async function extractFileFromZip(zipPath, filename) {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntry(filename);

  if (!entry) {
    return null;
  }

  const content = zip.readAsText(entry);
  // Remove BOM if present
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

/**
 * Process GTFS data for an operator and extract route lines
 */
async function processOperatorGTFS(operator, zipPath) {
  console.log(`  Processing GTFS for ${operator.name}...`);

  // Extract required files
  const shapesContent = await extractFileFromZip(zipPath, 'shapes.txt');
  const routesContent = await extractFileFromZip(zipPath, 'routes.txt');
  const tripsContent = await extractFileFromZip(zipPath, 'trips.txt');

  if (!shapesContent) {
    console.log(`    No shapes.txt found for ${operator.name}`);
    return [];
  }

  // Parse CSV files
  const shapes = parseCSV(shapesContent);
  const routes = routesContent ? parseCSV(routesContent) : [];
  const trips = tripsContent ? parseCSV(tripsContent) : [];

  console.log(
    `    Found ${shapes.length} shape points, ${routes.length} routes, ${trips.length} trips`
  );

  // Build route info map
  const routeInfo = new Map();
  routes.forEach((route) => {
    routeInfo.set(route.route_id, {
      name: route.route_long_name || route.route_short_name || route.route_id,
      shortName: route.route_short_name || route.route_id,
      color: route.route_color ? `#${route.route_color}` : operator.color,
    });
  });

  // Build shape_id to route_id mapping from trips
  const shapeToRoute = new Map();
  trips.forEach((trip) => {
    if (trip.shape_id && trip.route_id) {
      // Normalize shape_id (remove operator prefix if present)
      const shapeId = trip.shape_id.includes(':') ? trip.shape_id.split(':').pop() : trip.shape_id;
      if (!shapeToRoute.has(shapeId)) {
        shapeToRoute.set(shapeId, trip.route_id);
      }
    }
  });

  // Group shape points by shape_id
  const shapePoints = new Map();
  shapes.forEach((point) => {
    const shapeId = point.shape_id;
    if (!shapePoints.has(shapeId)) {
      shapePoints.set(shapeId, []);
    }
    shapePoints.get(shapeId).push({
      lat: parseFloat(point.shape_pt_lat),
      lng: parseFloat(point.shape_pt_lon),
      seq: parseInt(point.shape_pt_sequence, 10),
    });
  });

  // Sort points by sequence within each shape
  shapePoints.forEach((points) => {
    points.sort((a, b) => a.seq - b.seq);
  });

  // Deduplicate routes - keep one representative shape per route
  // We pick the longest shape for each route (most complete)
  const routeShapes = new Map();
  shapePoints.forEach((points, shapeId) => {
    const routeId = shapeToRoute.get(shapeId);
    if (!routeId) return;

    if (!routeShapes.has(routeId) || routeShapes.get(routeId).points.length < points.length) {
      routeShapes.set(routeId, { shapeId, points, routeId });
    }
  });

  // Convert to GeoJSON features
  const features = [];
  routeShapes.forEach(({ shapeId, points, routeId }) => {
    const route = routeInfo.get(routeId) || {
      name: routeId,
      shortName: routeId,
      color: operator.color,
    };

    // Create LineString coordinates
    const coordinates = points.map((p) => [p.lng, p.lat]);

    // Skip if too few points
    if (coordinates.length < 2) return;

    features.push({
      type: 'Feature',
      properties: {
        id: `${operator.id}-${routeId}`,
        routeId: routeId,
        name: route.name,
        shortName: route.shortName,
        operator: operator.name,
        operatorId: operator.id,
        color: route.color,
        type: operator.type,
      },
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
    });
  });

  console.log(`    Generated ${features.length} route lines`);
  return features;
}

/**
 * Simplify a line by removing points that don't significantly change direction
 * Uses Douglas-Peucker-like approach for reducing point count
 */
function simplifyLine(coordinates, tolerance = 0.0001) {
  if (coordinates.length <= 2) return coordinates;

  // Simple point reduction - keep every Nth point plus endpoints
  const result = [coordinates[0]];
  let lastKept = coordinates[0];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const point = coordinates[i];
    const dx = point[0] - lastKept[0];
    const dy = point[1] - lastKept[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > tolerance) {
      result.push(point);
      lastKept = point;
    }
  }

  result.push(coordinates[coordinates.length - 1]);
  return result;
}

/**
 * Main sync function
 */
async function syncTransitRoutes() {
  console.log('Syncing Bay Area transit route lines from 511.org GTFS feeds...\n');

  ensureTempDir();

  // Check for adm-zip dependency
  try {
    require('adm-zip');
  } catch (e) {
    console.error('Error: adm-zip package is required');
    console.error('Install it with: npm install adm-zip');
    process.exit(1);
  }

  const allFeatures = [];
  const operatorStats = [];

  for (const operator of RAIL_OPERATORS) {
    console.log(`Fetching ${operator.name} (${operator.id})...`);

    try {
      // Download GTFS feed
      const zipPath = await downloadGTFS(operator.id);

      // Process and extract route lines
      const features = await processOperatorGTFS(operator, zipPath);

      // Simplify lines to reduce file size
      features.forEach((feature) => {
        const originalCount = feature.geometry.coordinates.length;
        feature.geometry.coordinates = simplifyLine(feature.geometry.coordinates);
        const simplifiedCount = feature.geometry.coordinates.length;
        if (originalCount !== simplifiedCount) {
          console.log(
            `    Simplified ${feature.properties.shortName}: ${originalCount} -> ${simplifiedCount} points`
          );
        }
      });

      allFeatures.push(...features);
      operatorStats.push({
        id: operator.id,
        name: operator.name,
        type: operator.type,
        color: operator.color,
        routeCount: features.length,
      });

      // Clean up temp file
      fs.unlinkSync(zipPath);

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  Error processing ${operator.name}: ${error.message}`);
    }
  }

  // Create output GeoJSON
  const output = {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: '511.org GTFS feeds',
      operators: operatorStats,
      totalRoutes: allFeatures.length,
    },
    features: allFeatures,
  };

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${allFeatures.length} transit routes to ${OUTPUT_FILE}`);

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total operators: ${operatorStats.length}`);
  console.log(`Total route lines: ${allFeatures.length}`);
  operatorStats.forEach((op) => {
    console.log(`  ${op.name}: ${op.routeCount} routes (${op.type})`);
  });

  // File size info
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`\nOutput file size: ${sizeKB} KB`);
}

// Run the sync
syncTransitRoutes().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
