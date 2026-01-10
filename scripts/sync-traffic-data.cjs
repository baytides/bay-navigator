#!/usr/bin/env node
/**
 * Sync Bay Area Traffic Data from Caltrans CWWP2 and 511.org APIs
 *
 * Fetches real-time traffic data and generates GeoJSON files:
 * 1. Traffic incidents and events (511.org)
 * 2. CCTV camera locations (Caltrans)
 * 3. Lane closures (Caltrans)
 * 4. Changeable Message Signs with travel times (Caltrans)
 * 5. Vista Points / scenic overlooks (Caltrans)
 *
 * Usage: node scripts/sync-traffic-data.cjs
 *
 * Requires API_511_KEY environment variable for 511.org data
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

// 511 API configuration
const API_511_KEY = process.env.API_511_KEY;

// Caltrans CWWP2 endpoints (no auth required)
const CALTRANS_BASE = 'https://cwwp2.dot.ca.gov/data/d4';
const CALTRANS_ENDPOINTS = {
  cctv: `${CALTRANS_BASE}/cctv/cctvStatusD04.json`,
  cms: `${CALTRANS_BASE}/cms/cmsStatusD04.json`,
  lcs: `${CALTRANS_BASE}/lcs/lcsStatusD04.json`,
};

// Caltrans GIS API for vista points
const CALTRANS_GIS_VISTAS =
  'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/Vistas/FeatureServer/0/query?where=DISTRICT=%274%27&outFields=*&f=json';

// Output paths
const OUTPUT_DIR = path.join(__dirname, '../public/api');
const OUTPUT_TRAFFIC_EVENTS = path.join(OUTPUT_DIR, 'traffic-events.json');
const OUTPUT_CCTV = path.join(OUTPUT_DIR, 'traffic-cameras.json');
const OUTPUT_CMS = path.join(OUTPUT_DIR, 'traffic-signs.json');
const OUTPUT_LCS = path.join(OUTPUT_DIR, 'lane-closures.json');
const OUTPUT_VISTAS = path.join(OUTPUT_DIR, 'vista-points.json');

/**
 * Fetch JSON from URL (handles gzip compression)
 */
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const options = {
      headers: {
        'User-Agent': 'BayNavigator/1.0 (contact@baynavigator.org)',
        'Accept-Encoding': 'gzip, deflate',
      },
    };

    protocol
      .get(url, options, (res) => {
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
                let str = decoded.toString('utf8');
                // Remove BOM if present
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
      })
      .on('error', reject);
  });
}

/**
 * Fetch 511.org traffic events
 */
async function fetch511Events() {
  if (!API_511_KEY) {
    console.log('  Skipping 511 events (API_511_KEY not set)');
    return [];
  }

  const url = `https://api.511.org/traffic/events?api_key=${API_511_KEY}&format=json`;
  console.log('Fetching 511.org traffic events...');

  try {
    const data = await fetchJSON(url);
    const events = data.events || [];
    console.log(`  Found ${events.length} traffic events`);
    return events;
  } catch (error) {
    console.error(`  Error fetching 511 events: ${error.message}`);
    return [];
  }
}

/**
 * Fetch Caltrans CCTV camera data
 */
async function fetchCCTV() {
  console.log('Fetching Caltrans CCTV cameras...');
  try {
    const data = await fetchJSON(CALTRANS_ENDPOINTS.cctv);
    const cameras = data.data || [];
    console.log(`  Found ${cameras.length} cameras`);
    return cameras;
  } catch (error) {
    console.error(`  Error fetching CCTV: ${error.message}`);
    return [];
  }
}

/**
 * Fetch Caltrans CMS (Changeable Message Signs) data
 */
async function fetchCMS() {
  console.log('Fetching Caltrans message signs...');
  try {
    const data = await fetchJSON(CALTRANS_ENDPOINTS.cms);
    const signs = data.data || [];
    console.log(`  Found ${signs.length} message signs`);
    return signs;
  } catch (error) {
    console.error(`  Error fetching CMS: ${error.message}`);
    return [];
  }
}

/**
 * Fetch Caltrans Lane Closure System data
 */
async function fetchLCS() {
  console.log('Fetching Caltrans lane closures...');
  try {
    const data = await fetchJSON(CALTRANS_ENDPOINTS.lcs);
    const closures = data.data || [];
    console.log(`  Found ${closures.length} lane closures`);
    return closures;
  } catch (error) {
    console.error(`  Error fetching LCS: ${error.message}`);
    return [];
  }
}

/**
 * Fetch Caltrans Vista Points
 */
async function fetchVistas() {
  console.log('Fetching Caltrans vista points...');
  try {
    const data = await fetchJSON(CALTRANS_GIS_VISTAS);
    const vistas = data.features || [];
    console.log(`  Found ${vistas.length} vista points`);
    return vistas;
  } catch (error) {
    console.error(`  Error fetching vistas: ${error.message}`);
    return [];
  }
}

/**
 * Convert 511 events to GeoJSON
 */
function eventsToGeoJSON(events) {
  const features = events
    .filter((e) => e.geography && e.geography.coordinates)
    .map((event) => ({
      type: 'Feature',
      properties: {
        id: event.id,
        headline: event.headline,
        type: event.event_type,
        subtypes: event.event_subtypes || [],
        severity: event.severity,
        status: event.status,
        created: event.created,
        updated: event.updated,
        roads: event.roads || [],
        source: event['+source_type'] || '511.org',
      },
      geometry: event.geography,
    }));

  return {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: '511.org Traffic Events API',
      count: features.length,
    },
    features,
  };
}

/**
 * Convert CCTV cameras to GeoJSON
 */
function cctvToGeoJSON(cameras) {
  const features = cameras
    .filter((c) => c.cctv && c.cctv.location)
    .map((camera) => {
      const loc = camera.cctv.location;
      const img = camera.cctv.imageData || {};

      return {
        type: 'Feature',
        properties: {
          id: camera.cctv.index,
          name: loc.locationName,
          nearbyPlace: loc.nearbyPlace,
          county: loc.county,
          route: loc.route,
          direction: loc.direction,
          inService: camera.cctv.inService === 'true',
          imageUrl: img.static?.currentImageURL || null,
          streamUrl: img.streamingVideoURL || null,
          updated: camera.cctv.recordTimestamp?.recordDate,
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(loc.longitude), parseFloat(loc.latitude)],
        },
      };
    })
    .filter((f) => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1]));

  return {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: 'Caltrans CWWP2 - District 4 CCTV',
      count: features.length,
    },
    features,
  };
}

/**
 * Convert CMS signs to GeoJSON
 */
function cmsToGeoJSON(signs) {
  const features = signs
    .filter((s) => s.cms && s.cms.location)
    .map((sign) => {
      const loc = sign.cms.location;
      const msg = sign.cms.message || {};

      // Extract message text
      const lines = [];
      if (msg.phase1?.phase1Line1) lines.push(msg.phase1.phase1Line1);
      if (msg.phase1?.phase1Line2) lines.push(msg.phase1.phase1Line2);
      if (msg.phase1?.phase1Line3) lines.push(msg.phase1.phase1Line3);

      return {
        type: 'Feature',
        properties: {
          id: sign.cms.index,
          name: loc.locationName,
          nearbyPlace: loc.nearbyPlace,
          county: loc.county,
          route: loc.route,
          direction: loc.direction,
          inService: sign.cms.inService === 'true',
          display: msg.display || 'Blank',
          message: lines.join(' | ') || null,
          updated: sign.cms.recordTimestamp?.recordDate,
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(loc.longitude), parseFloat(loc.latitude)],
        },
      };
    })
    .filter((f) => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1]));

  return {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: 'Caltrans CWWP2 - District 4 CMS',
      count: features.length,
    },
    features,
  };
}

/**
 * Convert Lane Closures to GeoJSON
 * Only include active/upcoming closures
 */
function lcsToGeoJSON(closures) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const features = closures
    .filter((c) => c.lcs && c.lcs.location)
    .map((closure) => {
      const loc = closure.lcs.location;
      const begin = loc.begin || {};
      const end = loc.end || {};
      const closureInfo = closure.lcs.closure || {};

      // Parse closure times
      const startDate = closureInfo.closureTimestamp?.closureStartDate;
      const endDate = closureInfo.closureTimestamp?.closureEndDate;
      const startTime = closureInfo.closureTimestamp?.closureStartTime;
      const endTime = closureInfo.closureTimestamp?.closureEndTime;

      // Skip if closure is in the past
      if (endDate) {
        const closureEnd = new Date(`${endDate}T${endTime || '23:59:59'}`);
        if (closureEnd < now) return null;
      }

      // Calculate midpoint for display
      const beginLat = parseFloat(begin.beginLatitude);
      const beginLng = parseFloat(begin.beginLongitude);
      const endLat = parseFloat(end.endLatitude);
      const endLng = parseFloat(end.endLongitude);

      let coordinates;
      if (!isNaN(beginLat) && !isNaN(beginLng) && !isNaN(endLat) && !isNaN(endLng)) {
        // Use midpoint
        coordinates = [(beginLng + endLng) / 2, (beginLat + endLat) / 2];
      } else if (!isNaN(beginLat) && !isNaN(beginLng)) {
        coordinates = [beginLng, beginLat];
      } else {
        return null;
      }

      return {
        type: 'Feature',
        properties: {
          id: closure.lcs.index,
          closureId: closureInfo.closureID,
          route: begin.beginRoute,
          direction: loc.travelFlowDirection,
          county: begin.beginCounty,
          beginLocation: begin.beginLocationName,
          endLocation: end.endLocationName,
          typeOfClosure: closureInfo.typeOfClosure,
          typeOfWork: closureInfo.typeOfWork,
          lanesClosed: parseInt(closureInfo.lanesClosed) || 0,
          totalLanes: parseInt(closureInfo.totalExistingLanes) || 0,
          startDate,
          startTime,
          endDate,
          endTime,
          estimatedDelay: closureInfo.estimatedDelay,
        },
        geometry: {
          type: 'Point',
          coordinates,
        },
      };
    })
    .filter((f) => f !== null);

  return {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: 'Caltrans CWWP2 - District 4 LCS',
      count: features.length,
      note: 'Includes closures for next 7 days',
    },
    features,
  };
}

/**
 * Convert Vista Points to GeoJSON
 */
function vistasToGeoJSON(vistas) {
  const features = vistas
    .filter((v) => v.attributes)
    .map((vista) => {
      const attr = vista.attributes;

      return {
        type: 'Feature',
        properties: {
          id: attr.CT_NO,
          name: attr.NAME,
          county: attr.COUNTY,
          route: attr.ROUTE,
          address: attr.ADDRESS || null,
          city: attr.CITY || null,
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(attr.LONGITUDE), parseFloat(attr.LATITUDE)],
        },
      };
    })
    .filter((f) => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1]));

  return {
    type: 'FeatureCollection',
    metadata: {
      generated: new Date().toISOString(),
      source: 'Caltrans GIS - Vista Points District 4',
      count: features.length,
    },
    features,
  };
}

/**
 * Main sync function
 */
async function syncTrafficData() {
  console.log('Syncing Bay Area traffic data...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Fetch all data in parallel
  const [events, cameras, signs, closures, vistas] = await Promise.all([
    fetch511Events(),
    fetchCCTV(),
    fetchCMS(),
    fetchLCS(),
    fetchVistas(),
  ]);

  // Convert to GeoJSON and write files
  console.log('\nConverting to GeoJSON...');

  // Traffic events
  if (events.length > 0) {
    const eventsGeoJSON = eventsToGeoJSON(events);
    fs.writeFileSync(OUTPUT_TRAFFIC_EVENTS, JSON.stringify(eventsGeoJSON, null, 2));
    console.log(
      `  Wrote ${eventsGeoJSON.features.length} traffic events to ${OUTPUT_TRAFFIC_EVENTS}`
    );
  }

  // CCTV cameras
  if (cameras.length > 0) {
    const cctvGeoJSON = cctvToGeoJSON(cameras);
    fs.writeFileSync(OUTPUT_CCTV, JSON.stringify(cctvGeoJSON, null, 2));
    console.log(`  Wrote ${cctvGeoJSON.features.length} cameras to ${OUTPUT_CCTV}`);
  }

  // Message signs
  if (signs.length > 0) {
    const cmsGeoJSON = cmsToGeoJSON(signs);
    fs.writeFileSync(OUTPUT_CMS, JSON.stringify(cmsGeoJSON, null, 2));
    console.log(`  Wrote ${cmsGeoJSON.features.length} message signs to ${OUTPUT_CMS}`);
  }

  // Lane closures
  if (closures.length > 0) {
    const lcsGeoJSON = lcsToGeoJSON(closures);
    fs.writeFileSync(OUTPUT_LCS, JSON.stringify(lcsGeoJSON, null, 2));
    console.log(`  Wrote ${lcsGeoJSON.features.length} lane closures to ${OUTPUT_LCS}`);
  }

  // Vista points
  if (vistas.length > 0) {
    const vistasGeoJSON = vistasToGeoJSON(vistas);
    fs.writeFileSync(OUTPUT_VISTAS, JSON.stringify(vistasGeoJSON, null, 2));
    console.log(`  Wrote ${vistasGeoJSON.features.length} vista points to ${OUTPUT_VISTAS}`);
  }

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Traffic Events: ${events.length}`);
  console.log(`CCTV Cameras: ${cameras.length}`);
  console.log(`Message Signs: ${signs.length}`);
  console.log(`Lane Closures: ${closures.length}`);
  console.log(`Vista Points: ${vistas.length}`);
  console.log('\nDone!');
}

// Run the sync
syncTrafficData().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
