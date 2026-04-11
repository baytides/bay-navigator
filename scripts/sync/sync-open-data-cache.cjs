#!/usr/bin/env node
/**
 * Sync Open Data from Bay Area Portals
 *
 * Fetches and caches public facilities, services, and resources from
 * Socrata-based open data portals to eliminate slow API calls at runtime.
 *
 * Output: public/data/open-data-cache.json
 *
 * Usage:
 *   node scripts/sync-open-data-cache.cjs
 *   node scripts/sync-open-data-cache.cjs --verbose
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, '..', '..', 'public', 'data', 'open-data-cache.json');
const VERBOSE = process.argv.includes('--verbose');

// Socrata API endpoints for Bay Area open data
// These are public APIs, no authentication required
// Dataset IDs verified via Socrata Discovery API
const DATA_SOURCES = [
  // =====================
  // SAN FRANCISCO
  // =====================
  {
    name: 'SF City Facilities',
    city: 'San Francisco',
    county: 'San Francisco',
    url: 'https://data.sfgov.org/resource/nc68-ngbr.json?$limit=500',
    type: 'facilities',
    transform: (items) =>
      items.map((f) => ({
        name: f.common_name || f.owned_leased || 'Unknown Facility',
        address: f.address || '',
        city: 'San Francisco',
        county: 'San Francisco',
        type: 'facility',
        department: f.dept || '',
        category: categorizeByDept(f.dept),
      })),
  },
  {
    name: 'SF Food Trucks',
    city: 'San Francisco',
    county: 'San Francisco',
    url: 'https://data.sfgov.org/resource/rqzj-sfat.json?status=APPROVED&$limit=400',
    type: 'food_vendors',
    transform: (items) =>
      items.map((t) => ({
        name: t.applicant || 'Food Vendor',
        address: t.address || '',
        city: 'San Francisco',
        county: 'San Francisco',
        type: 'food_vendor',
        foodItems: t.fooditems || '',
        location: t.locationdescription || '',
        schedule: t.dayshours || '',
      })),
  },
  {
    name: 'SF Parks',
    city: 'San Francisco',
    county: 'San Francisco',
    url: 'https://data.sfgov.org/resource/3nje-yn2u.json?$limit=300',
    type: 'parks',
    transform: (items) =>
      items.map((p) => ({
        name: p.map_park_n || 'Park',
        address: '',
        city: 'San Francisco',
        county: 'San Francisco',
        type: 'park',
        acres: p.acres || '',
      })),
  },

  // =====================
  // SAN MATEO COUNTY
  // =====================
  {
    name: 'San Mateo County Parks',
    city: '',
    county: 'San Mateo',
    // Dataset ID: bp4f-54r8 (smc_parks_beaches_open_spaces)
    url: 'https://data.smcgov.org/resource/bp4f-54r8.json?$limit=200',
    type: 'parks',
    transform: (items) =>
      items.map((p) => ({
        name: p.name || 'Park',
        address: p.address || '',
        city: p.city || '',
        county: 'San Mateo',
        type: 'park',
        category: p.category || 'PARK',
      })),
  },

  // =====================
  // ALAMEDA COUNTY
  // =====================
  {
    name: 'Alameda County Facilities',
    city: '',
    county: 'Alameda',
    // Try the general catalog
    url: 'https://data.acgov.org/resource/k9se-aps6.json?$limit=200',
    type: 'facilities',
    transform: (items) =>
      items.map((f) => ({
        name: f.name || f.facility_name || 'Facility',
        address: f.address || '',
        city: f.city || '',
        county: 'Alameda',
        type: 'facility',
      })),
  },

  // =====================
  // SANTA CLARA COUNTY
  // =====================
  {
    name: 'Santa Clara County Facilities',
    city: '',
    county: 'Santa Clara',
    url: 'https://data.sccgov.org/resource/j2gj-cfjq.json?$limit=200',
    type: 'facilities',
    transform: (items) =>
      items.map((f) => ({
        name: f.name || f.facility_name || 'Facility',
        address: f.address || '',
        city: f.city || '',
        county: 'Santa Clara',
        type: 'facility',
      })),
  },

  // =====================
  // PALO ALTO
  // =====================
  {
    name: 'Palo Alto Trees',
    city: 'Palo Alto',
    county: 'Santa Clara',
    // Palo Alto has limited facilities data, but trees are useful
    url: 'https://data.cityofpaloalto.org/resource/j2dn-ec4n.json?$limit=50',
    type: 'other',
    transform: (items) =>
      items.slice(0, 20).map((t) => ({
        name: t.tree_name || t.species || 'Tree',
        address: t.address || '',
        city: 'Palo Alto',
        county: 'Santa Clara',
        type: 'tree',
      })),
  },

  // =====================
  // BERKELEY
  // =====================
  {
    name: 'Berkeley City Services',
    city: 'Berkeley',
    county: 'Alameda',
    // Berkeley 311 data can show service locations
    url: 'https://data.cityofberkeley.info/resource/k489-uv4i.json?$limit=100',
    type: 'services',
    transform: (items) =>
      items.slice(0, 50).map((s) => ({
        name: s.issue_type || s.category || 'Service Request',
        address: s.street_address || '',
        city: 'Berkeley',
        county: 'Alameda',
        type: 'service',
        category: s.category || '',
      })),
  },
];

// Categorize SF facilities by department
function categorizeByDept(dept) {
  if (!dept) return 'other';
  const d = dept.toLowerCase();
  if (d.includes('rec') || d.includes('park')) return 'recreation';
  if (d.includes('library')) return 'library';
  if (d.includes('fire')) return 'fire_station';
  if (d.includes('police')) return 'police_station';
  if (d.includes('health') || d.includes('hospital')) return 'health';
  if (d.includes('school') || d.includes('education')) return 'education';
  if (d.includes('transit') || d.includes('muni')) return 'transit';
  return 'government';
}

// Make HTTPS GET request
function fetchJson(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'BayNavigator/1.0 (Open Data Sync)',
          Accept: 'application/json',
        },
      },
      (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            fetchJson(res.headers.location, timeout).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Main sync function
async function syncOpenData() {
  console.log('🔄 Syncing open data from Bay Area portals...\n');

  const cache = {
    generated: new Date().toISOString(),
    sources: [],
    facilities: [],
    parks: [],
    libraries: [],
    recreation: [],
    food_vendors: [],
    services: [],
    other: [],
    byCity: {},
    byCounty: {},
  };

  let successCount = 0;
  let failCount = 0;

  for (const source of DATA_SOURCES) {
    try {
      if (VERBOSE) console.log(`  Fetching: ${source.name}...`);

      const rawData = await fetchJson(source.url);

      if (!Array.isArray(rawData)) {
        console.log(`  ⚠️  ${source.name}: Not an array, skipping`);
        failCount++;
        continue;
      }

      if (rawData.length === 0) {
        console.log(`  ⚠️  ${source.name}: Empty dataset, skipping`);
        failCount++;
        continue;
      }

      const transformed = source.transform(rawData);

      // Add to appropriate category
      const category = source.type;
      if (cache[category]) {
        cache[category].push(...transformed);
      } else if (cache.other) {
        cache.other.push(...transformed);
      }

      // Index by city and county
      for (const item of transformed) {
        if (item.city) {
          if (!cache.byCity[item.city]) cache.byCity[item.city] = [];
          cache.byCity[item.city].push(item);
        }
        if (item.county) {
          if (!cache.byCounty[item.county]) cache.byCounty[item.county] = [];
          cache.byCounty[item.county].push(item);
        }
      }

      cache.sources.push({
        name: source.name,
        city: source.city,
        county: source.county,
        count: transformed.length,
        synced: new Date().toISOString(),
      });

      console.log(`  ✅ ${source.name}: ${transformed.length} items`);
      successCount++;
    } catch (error) {
      console.log(`  ❌ ${source.name}: ${error.message}`);
      failCount++;
    }
  }

  // Calculate totals
  cache.totals = {
    facilities: cache.facilities.length,
    parks: cache.parks.length,
    libraries: cache.libraries.length,
    recreation: cache.recreation.length,
    food_vendors: cache.food_vendors.length,
    services: cache.services.length,
    other: cache.other.length,
    total:
      cache.facilities.length +
      cache.parks.length +
      cache.libraries.length +
      cache.recreation.length +
      cache.food_vendors.length +
      cache.services.length +
      cache.other.length,
    cities: Object.keys(cache.byCity).length,
    counties: Object.keys(cache.byCounty).length,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write cache file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2));

  const fileSizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);

  console.log(`
📊 Sync Complete
   Sources: ${successCount} succeeded, ${failCount} failed
   Total items: ${cache.totals.total}
   - Facilities: ${cache.totals.facilities}
   - Parks: ${cache.totals.parks}
   - Libraries: ${cache.totals.libraries}
   - Recreation: ${cache.totals.recreation}
   - Food vendors: ${cache.totals.food_vendors}
   - Services: ${cache.totals.services}
   - Other: ${cache.totals.other}
   Cities: ${cache.totals.cities}
   Counties: ${cache.totals.counties}
   File size: ${fileSizeKB} KB
   Output: ${OUTPUT_FILE}
`);

  return { successCount, failCount, totals: cache.totals };
}

// Run if called directly
if (require.main === module) {
  syncOpenData()
    .then(({ failCount }) => {
      // Exit with error only if more than half failed
      process.exit(failCount > DATA_SOURCES.length / 2 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncOpenData };
