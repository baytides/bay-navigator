#!/usr/bin/env node
/**
 * Sync Bay Area Transit Stops from 511.org API
 *
 * Fetches transit stops from major Bay Area transit operators and generates:
 * 1. A GeoJSON file for map display
 * 2. A consolidated transit agencies list for the directory
 *
 * Usage: node scripts/sync-511-transit.cjs
 *
 * Requires API_511_KEY environment variable or uses the provided key
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { execSync } = require('child_process');

// 511 API configuration
const API_KEY = process.env.API_511_KEY;
if (!API_KEY) {
  console.error('Error: API_511_KEY environment variable is required');
  console.error('Set it with: export API_511_KEY=your_key_here');
  process.exit(1);
}
const API_BASE = 'http://api.511.org/transit';

// Major transit operators to include (by operator ID)
// Focusing on rail, major bus, and ferry services
const OPERATORS = [
  { id: 'BA', name: 'BART', type: 'rail', color: '#009bda' },
  { id: 'CT', name: 'Caltrain', type: 'rail', color: '#e31837' },
  { id: 'SF', name: 'SF Muni', type: 'bus', color: '#bc2026' },
  { id: 'AC', name: 'AC Transit', type: 'bus', color: '#00a94f' },
  { id: 'SC', name: 'VTA', type: 'bus', color: '#0065b8' },
  { id: 'SM', name: 'SamTrans', type: 'bus', color: '#e31837' },
  { id: 'GG', name: 'Golden Gate Transit', type: 'bus', color: '#c41230' },
  { id: 'SA', name: 'SMART', type: 'rail', color: '#0072bc' },
  { id: 'GF', name: 'Golden Gate Ferry', type: 'ferry', color: '#c41230' },
  { id: 'SB', name: 'SF Bay Ferry', type: 'ferry', color: '#1e3a5f' },
  { id: 'CC', name: 'County Connection', type: 'bus', color: '#0072bb' },
  { id: 'WH', name: 'Wheels (Livermore)', type: 'bus', color: '#00a859' },
  { id: 'MA', name: 'Marin Transit', type: 'bus', color: '#00529b' },
  { id: '3D', name: 'Tri Delta Transit', type: 'bus', color: '#e21f26' },
  { id: 'WC', name: 'WestCAT', type: 'bus', color: '#ed1c24' },
  { id: 'UC', name: 'Union City Transit', type: 'bus', color: '#0072bc' },
  { id: 'CE', name: 'ACE Rail', type: 'rail', color: '#8b4513' },
  { id: 'AM', name: 'Capitol Corridor', type: 'rail', color: '#00467f' },
];

// Intercity operators (fetched from external GTFS feeds)
const INTERCITY_OPERATORS = [
  {
    id: 'AMTRAK',
    name: 'Amtrak',
    type: 'intercity-rail',
    color: '#004990',
    gtfsUrl: 'https://content.amtrak.com/content/gtfs/GTFS.zip',
  },
  {
    id: 'FLIXBUS',
    name: 'FlixBus',
    type: 'intercity-bus',
    color: '#73d700',
    gtfsUrl: 'https://gtfs.gis.flix.tech/gtfs_generic_us.zip',
  },
];

// Bay Area bounding box for filtering intercity stops
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.5,
  minLon: -123.0,
  maxLon: -121.0,
};

// Output paths
const OUTPUT_GEOJSON = path.join(__dirname, '../../public/api/transit-stops.json');
const OUTPUT_AGENCIES = path.join(__dirname, '../../src/data/transit-agencies.yml');

/**
 * Fetch data from 511 API
 */
async function fetchFromAPI(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('format', 'json');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : require('http');
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'BayNavigator/1.0',
      },
    };

    const req = protocol.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        let buffer = Buffer.concat(chunks);

        // Check if response is gzip compressed
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) {
              reject(err);
              return;
            }
            try {
              // Remove BOM if present
              let str = decoded.toString('utf8');
              if (str.charCodeAt(0) === 0xfeff) {
                str = str.slice(1);
              }
              resolve(JSON.parse(str));
            } catch (e) {
              reject(new Error(`Failed to parse JSON: ${e.message}`));
            }
          });
        } else {
          try {
            // Remove BOM if present
            let str = buffer.toString('utf8');
            if (str.charCodeAt(0) === 0xfeff) {
              str = str.slice(1);
            }
            resolve(JSON.parse(str));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch stops for an operator
 */
async function fetchStops(operatorId) {
  try {
    const data = await fetchFromAPI('stops', { operator_id: operatorId });

    if (!data?.Contents?.dataObjects?.ScheduledStopPoint) {
      console.log(`  No stops found for ${operatorId}`);
      return [];
    }

    const stops = data.Contents.dataObjects.ScheduledStopPoint;
    console.log(`  Found ${stops.length} stops for ${operatorId}`);
    return stops;
  } catch (error) {
    console.error(`  Error fetching stops for ${operatorId}: ${error.message}`);
    return [];
  }
}

/**
 * Clean up station name by removing redundant suffixes
 * @param {string} name - Original station name
 * @param {string} operatorName - Operator name (for context)
 * @returns {string} Cleaned station name
 */
function cleanStationName(name, operatorName) {
  if (!name) return name;

  // Remove direction suffixes that make labels verbose
  let cleaned = name
    // Remove parenthetical platform/transfer info
    .replace(/\s*\([^)]*(?:Platform|Transfer|Boarding)[^)]*\)/gi, '')
    // Remove direction suffixes
    .replace(/\s+(Northbound|Southbound|Eastbound|Westbound|NB|SB|EB|WB)$/i, '')
    .replace(/\s+Station\s+(Northbound|Southbound|Eastbound|Westbound)$/i, '')
    // Remove operator name + Station suffix
    .replace(/\s+Caltrain\s+Station$/i, '') // "Menlo Park Caltrain Station" -> "Menlo Park"
    .replace(/\s+BART\s+Station$/i, '') // "Embarcadero BART Station" -> "Embarcadero"
    .replace(/\s+Station$/i, '') // Generic "Station" suffix
    // Remove trailing "- Gate X" for ferry terminals
    .replace(/\s*-\s*Gate\s+\w+$/i, '')
    .trim();

  // Special handling: if the name is just the operator name, keep it as-is
  if (cleaned.toLowerCase() === operatorName?.toLowerCase()) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Deduplicate stops by parent station
 * Many stops have multiple platforms - we want unique stations
 */
function deduplicateStops(stops, operatorName = '') {
  const stationMap = new Map();

  stops.forEach((stop) => {
    const parentId = stop.Extensions?.ParentStation || stop.id;
    const rawName = stop.Name;
    const name = cleanStationName(rawName, operatorName);

    // Use parent station ID to group platforms
    if (!stationMap.has(parentId)) {
      stationMap.set(parentId, {
        id: parentId,
        name: name,
        lat: parseFloat(stop.Location?.Latitude || 0),
        lng: parseFloat(stop.Location?.Longitude || 0),
      });
    }
  });

  return Array.from(stationMap.values());
}

/**
 * Calculate Haversine distance between two points in meters
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
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
 * Download file from URL using curl (more reliable for HTTPS)
 */
function downloadFile(url, destPath) {
  try {
    execSync(`curl -sL -o "${destPath}" "${url}"`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error(`  Failed to download ${url}: ${error.message}`);
    return false;
  }
}

/**
 * Parse GTFS stops.txt CSV content
 */
function parseGtfsStops(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const stops = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
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

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    stops.push(row);
  }

  return stops;
}

/**
 * Fetch intercity transit stops from GTFS feeds (Amtrak, FlixBus)
 */
async function fetchIntercityStops(operator) {
  const tmpDir = '/tmp/baynavigator-gtfs';
  const zipPath = `${tmpDir}/${operator.id.toLowerCase()}.zip`;
  const extractDir = `${tmpDir}/${operator.id.toLowerCase()}`;

  // Create temp directory
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  console.log(`  Downloading GTFS from ${operator.gtfsUrl}...`);
  if (!downloadFile(operator.gtfsUrl, zipPath)) {
    return [];
  }

  // Extract stops.txt
  try {
    execSync(`unzip -o -q "${zipPath}" stops.txt -d "${extractDir}"`, { stdio: 'pipe' });
  } catch (error) {
    console.error(`  Failed to extract stops.txt: ${error.message}`);
    return [];
  }

  const stopsPath = `${extractDir}/stops.txt`;
  if (!fs.existsSync(stopsPath)) {
    console.error(`  stops.txt not found in GTFS archive`);
    return [];
  }

  const content = fs.readFileSync(stopsPath, 'utf8');
  const allStops = parseGtfsStops(content);

  // Filter to Bay Area stops
  const bayAreaStops = allStops.filter((stop) => {
    const lat = parseFloat(stop.stop_lat);
    const lon = parseFloat(stop.stop_lon);
    return (
      lat >= BAY_AREA_BOUNDS.minLat &&
      lat <= BAY_AREA_BOUNDS.maxLat &&
      lon >= BAY_AREA_BOUNDS.minLon &&
      lon <= BAY_AREA_BOUNDS.maxLon
    );
  });

  console.log(`  Found ${bayAreaStops.length} Bay Area stops (of ${allStops.length} total)`);

  // Clean up
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }

  return bayAreaStops.map((stop) => ({
    id: stop.stop_id,
    name: cleanIntercityStopName(stop.stop_name, operator.name),
    lat: parseFloat(stop.stop_lat),
    lng: parseFloat(stop.stop_lon),
    url: stop.stop_url || '',
  }));
}

/**
 * Clean intercity stop name
 */
function cleanIntercityStopName(name, operatorName) {
  if (!name) return name;

  // Remove "Amtrak" suffix and common patterns
  let cleaned = name
    .replace(/\s+Amtrak$/i, '')
    .replace(/\s+Amtrak Station$/i, '')
    .replace(/\s+Amtrak Bus Stop$/i, '')
    .replace(/\s+Bus Stop$/i, '')
    .replace(/\s+Bus Station$/i, '')
    .trim();

  return cleaned;
}

/**
 * Consolidate nearby rail/ferry stations from different operators
 * Also identifies bus and intercity operators that serve rail/ferry stations
 * Returns consolidated features and a map of consolidated station info
 */
function consolidateStations(
  features,
  railThreshold = 200,
  busThreshold = 100,
  intercityThreshold = 300
) {
  // Separate by type
  const railFerryFeatures = features.filter(
    (f) => f.properties.type === 'rail' || f.properties.type === 'ferry'
  );
  const busFeatures = features.filter((f) => f.properties.type === 'bus');
  const intercityFeatures = features.filter(
    (f) => f.properties.type === 'intercity-rail' || f.properties.type === 'intercity-bus'
  );

  // Group nearby rail/ferry stations
  const consolidated = [];
  const usedRailFerry = new Set();

  for (let i = 0; i < railFerryFeatures.length; i++) {
    if (usedRailFerry.has(i)) continue;

    const feature = railFerryFeatures[i];
    const [lng, lat] = feature.geometry.coordinates;
    const operators = [
      {
        id: feature.properties.operatorId,
        name: feature.properties.operator,
        color: feature.properties.color,
        type: feature.properties.type,
      },
    ];

    // Find nearby rail/ferry stations from other operators
    for (let j = i + 1; j < railFerryFeatures.length; j++) {
      if (usedRailFerry.has(j)) continue;

      const other = railFerryFeatures[j];
      const [otherLng, otherLat] = other.geometry.coordinates;
      const distance = haversineDistance(lat, lng, otherLat, otherLng);

      // Same operator stations should not be consolidated
      if (other.properties.operatorId === feature.properties.operatorId) continue;

      if (distance <= railThreshold) {
        usedRailFerry.add(j);
        operators.push({
          id: other.properties.operatorId,
          name: other.properties.operator,
          color: other.properties.color,
          type: other.properties.type,
        });
      }
    }

    // Find bus operators that serve this rail/ferry station
    // Use a tighter threshold since bus stops are very close to stations
    const busOperatorsAtStation = new Set();
    for (const busStop of busFeatures) {
      const [busLng, busLat] = busStop.geometry.coordinates;
      const distance = haversineDistance(lat, lng, busLat, busLng);

      if (distance <= busThreshold) {
        const busOpId = busStop.properties.operatorId;
        // Only add each bus operator once
        if (!busOperatorsAtStation.has(busOpId)) {
          busOperatorsAtStation.add(busOpId);
          operators.push({
            id: busOpId,
            name: busStop.properties.operator,
            color: busStop.properties.color,
            type: 'bus',
          });
        }
      }
    }

    // Find intercity operators (Amtrak, FlixBus) that serve this station
    // Use a larger threshold since intercity stations may be named differently
    const intercityOperatorsAtStation = new Set();
    for (const intercityStop of intercityFeatures) {
      const [icLng, icLat] = intercityStop.geometry.coordinates;
      const distance = haversineDistance(lat, lng, icLat, icLng);

      if (distance <= intercityThreshold) {
        const icOpId = intercityStop.properties.operatorId;
        if (!intercityOperatorsAtStation.has(icOpId)) {
          intercityOperatorsAtStation.add(icOpId);
          operators.push({
            id: icOpId,
            name: intercityStop.properties.operator,
            color: intercityStop.properties.color,
            type: intercityStop.properties.type,
          });
        }
      }
    }

    usedRailFerry.add(i);

    if (operators.length > 1) {
      // Consolidated station - multiple operators
      const operatorNames = operators.map((o) => o.name).join(', ');
      const operatorIds = operators.map((o) => o.id).join(',');
      // Use the first rail operator's color, or first operator's color
      const primaryOperator = operators.find((o) => o.type === 'rail') || operators[0];

      // Create "Transit Center" name for multi-operator stations
      const baseName = feature.properties.name;
      // Remove any existing "Station" suffix before adding "Transit Center"
      const cleanBaseName = baseName.replace(/\s+Station$/i, '').trim();
      const transitCenterName = `${cleanBaseName} Transit Center`;

      // Create services description (e.g., "BART, Caltrain, SamTrans")
      const services = operators.map((o) => o.name).join(', ');

      consolidated.push({
        type: 'Feature',
        properties: {
          id: `consolidated-${feature.properties.id}`,
          name: transitCenterName,
          services: services, // Human-readable list of transit services
          operator: operatorNames,
          operatorId: operatorIds,
          operators: operators,
          type: primaryOperator.type,
          color: primaryOperator.color,
          isConsolidated: true,
        },
        geometry: feature.geometry,
      });
    } else {
      // Single operator station
      consolidated.push(feature);
    }
  }

  // Track which intercity stops were consolidated into transit centers
  const usedIntercity = new Set();
  for (const feature of consolidated) {
    if (feature.properties.isConsolidated && feature.properties.operators) {
      for (const op of feature.properties.operators) {
        if (op.type === 'intercity-rail' || op.type === 'intercity-bus') {
          // Mark this operator as used for this location
          usedIntercity.add(
            `${op.id}-${Math.round(feature.geometry.coordinates[0] * 100)}-${Math.round(feature.geometry.coordinates[1] * 100)}`
          );
        }
      }
    }
  }

  // Add standalone intercity stops that weren't near any rail/ferry stations
  const standaloneIntercity = intercityFeatures.filter((f) => {
    const key = `${f.properties.operatorId}-${Math.round(f.geometry.coordinates[0] * 100)}-${Math.round(f.geometry.coordinates[1] * 100)}`;
    // Check if this stop is near any consolidated station
    for (const cons of consolidated) {
      const [consLng, consLat] = cons.geometry.coordinates;
      const [icLng, icLat] = f.geometry.coordinates;
      const distance = haversineDistance(consLat, consLng, icLat, icLng);
      if (distance <= intercityThreshold) {
        return false; // Already consolidated
      }
    }
    return true;
  });

  // Return consolidated rail/ferry + all bus stops + standalone intercity stops
  return [...consolidated, ...busFeatures, ...standaloneIntercity];
}

/**
 * Main sync function
 */
async function syncTransitData() {
  console.log('Syncing Bay Area transit data from 511.org API...\n');

  const allFeatures = [];
  const agencyStats = [];

  // Rate limiting: 60 requests per hour
  // We'll add a small delay between operators
  for (const operator of OPERATORS) {
    console.log(`Fetching ${operator.name} (${operator.id})...`);

    const stops = await fetchStops(operator.id);

    if (stops.length === 0) {
      continue;
    }

    // Deduplicate stops and clean names
    const uniqueStations = deduplicateStops(stops, operator.name);
    console.log(`  Deduplicated to ${uniqueStations.length} unique stations`);

    // Convert to GeoJSON features
    uniqueStations.forEach((station) => {
      if (station.lat && station.lng && station.lat !== 0 && station.lng !== 0) {
        allFeatures.push({
          type: 'Feature',
          properties: {
            id: `${operator.id}-${station.id}`,
            name: station.name,
            operator: operator.name,
            operatorId: operator.id,
            type: operator.type,
            color: operator.color,
          },
          geometry: {
            type: 'Point',
            coordinates: [station.lng, station.lat],
          },
        });
      }
    });

    agencyStats.push({
      id: operator.id,
      name: operator.name,
      type: operator.type,
      color: operator.color,
      stationCount: uniqueStations.length,
    });

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Fetch intercity operators (Amtrak, FlixBus)
  console.log('\nFetching intercity transit operators...');
  for (const operator of INTERCITY_OPERATORS) {
    console.log(`Fetching ${operator.name} (${operator.id})...`);

    const stops = await fetchIntercityStops(operator);

    if (stops.length === 0) {
      continue;
    }

    // Convert to GeoJSON features
    stops.forEach((station) => {
      if (station.lat && station.lng && station.lat !== 0 && station.lng !== 0) {
        allFeatures.push({
          type: 'Feature',
          properties: {
            id: `${operator.id}-${station.id}`,
            name: station.name,
            operator: operator.name,
            operatorId: operator.id,
            type: operator.type,
            color: operator.color,
            url: station.url,
          },
          geometry: {
            type: 'Point',
            coordinates: [station.lng, station.lat],
          },
        });
      }
    });

    agencyStats.push({
      id: operator.id,
      name: operator.name,
      type: operator.type,
      color: operator.color,
      stationCount: stops.length,
    });
  }

  // Consolidate overlapping rail/ferry stations (e.g., San Jose Diridon)
  console.log('\nConsolidating overlapping stations...');
  const consolidatedFeatures = consolidateStations(allFeatures);
  const consolidatedCount = consolidatedFeatures.filter((f) => f.properties.isConsolidated).length;
  console.log(
    `  Consolidated ${allFeatures.length - consolidatedFeatures.length + consolidatedCount} overlapping stations into ${consolidatedCount} multi-operator stations`
  );

  // Create GeoJSON output
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: '511.org API',
      operators: agencyStats,
      consolidatedStations: consolidatedCount,
    },
    features: consolidatedFeatures,
  };

  // Write GeoJSON file
  fs.writeFileSync(OUTPUT_GEOJSON, JSON.stringify(geojson, null, 2));
  console.log(`\nWrote ${consolidatedFeatures.length} transit stops to ${OUTPUT_GEOJSON}`);

  // Create YAML file for agencies
  const yamlContent = `# Bay Area Transit Agencies
# Generated from 511.org API on ${new Date().toISOString().split('T')[0]}
# Do not edit manually - run scripts/sync-511-transit.cjs to update

agencies:
${agencyStats
  .map(
    (a) => `  - id: "${a.id}"
    name: "${a.name}"
    type: "${a.type}"
    color: "${a.color}"
    stations: ${a.stationCount}`
  )
  .join('\n')}
`;

  fs.writeFileSync(OUTPUT_AGENCIES, yamlContent);
  console.log(`Wrote agency info to ${OUTPUT_AGENCIES}`);

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total operators: ${agencyStats.length}`);
  console.log(`Total transit stops: ${allFeatures.length}`);
  agencyStats.forEach((a) => {
    console.log(`  ${a.name}: ${a.stationCount} stations (${a.type})`);
  });
}

// Run the sync
syncTransitData().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
