#!/usr/bin/env node
/**
 * Sync Recreation.gov Data
 *
 * Fetches recreation areas and facilities from Recreation.gov RIDB API
 * for the Bay Area and adds them to the recreation.yml file.
 *
 * Features:
 * - Cross-references existing entries to avoid duplicates
 * - Adds verified: Recreation.gov badge
 * - Rate limited to respect API limits (50 req/min)
 * - Generates proper YAML format
 *
 * Usage: RECREATION_API_KEY=xxx node scripts/sync-recreation-gov.cjs
 *
 * API Docs: https://ridb.recreation.gov/docs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');

const DATA_DIR = path.join(__dirname, '../src/data');
const RECREATION_FILE = path.join(DATA_DIR, 'recreation.yml');

// API configuration
const API_BASE = 'https://ridb.recreation.gov/api/v1';
const API_KEY = process.env.RECREATION_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: RECREATION_API_KEY environment variable is required');
  console.error('   Usage: RECREATION_API_KEY=xxx node scripts/sync-recreation-gov.cjs');
  process.exit(1);
}

// Bay Area bounding box
const BAY_AREA_BOUNDS = {
  minLat: 36.8,
  maxLat: 38.9,
  minLng: -123.5,
  maxLng: -121.0,
};

// Keywords for Bay Area (for entries without coordinates)
const BAY_AREA_KEYWORDS = [
  'golden gate',
  'point reyes',
  'muir',
  'presidio',
  'alcatraz',
  'marin',
  'san francisco',
  'angel island',
  'pinnacles',
  'tamalpais',
  'don edwards',
  'farallones',
  'cordell',
  'antioch',
  'folsom',
  'lake sonoma',
  'san pablo',
  'berkeley',
  'oakland',
  'lake berryessa',
  'san jose',
  'santa clara',
  'napa',
  'sonoma',
  'solano',
];

// Facility types to EXCLUDE (commercial lodging, etc.)
const EXCLUDED_FACILITY_TYPES = [
  'hotel',
  'inn',
  'lodge',
  'resort',
  'mansion',
  'motel',
  'fairmont',
  'marriott',
  'hilton',
  'hyatt',
];

// Facility types to INCLUDE
const VALID_FACILITY_TYPES = [
  'campground',
  'day use',
  'picnic',
  'trailhead',
  'boat ramp',
  'visitor center',
  'recreation area',
  'wilderness',
  'refuge',
  'sanctuary',
  'preserve',
  'park',
  'tours',
  'permit',
];

// Rate limit: 50 requests per minute = 1.2 seconds between requests
const RATE_LIMIT_MS = 1300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make API request to Recreation.gov
 */
function apiRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;

    const options = {
      headers: {
        apikey: API_KEY,
        Accept: 'application/json',
      },
    };

    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse API response: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Check if coordinates are within Bay Area bounds
 */
function isInBayArea(lat, lng) {
  if (!lat || !lng) return false;
  return (
    lat >= BAY_AREA_BOUNDS.minLat &&
    lat <= BAY_AREA_BOUNDS.maxLat &&
    lng >= BAY_AREA_BOUNDS.minLng &&
    lng <= BAY_AREA_BOUNDS.maxLng
  );
}

/**
 * Check if name contains Bay Area keywords
 */
function hasBayAreaKeyword(name) {
  const lowerName = name.toLowerCase();
  return BAY_AREA_KEYWORDS.some((kw) => lowerName.includes(kw));
}

/**
 * Check if facility should be excluded (hotels, commercial lodging)
 */
function isExcludedFacility(name, type) {
  const lowerName = name.toLowerCase();
  const lowerType = (type || '').toLowerCase();

  // Check excluded keywords in name or type
  for (const excluded of EXCLUDED_FACILITY_TYPES) {
    if (lowerName.includes(excluded) || lowerType.includes(excluded)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if facility is a valid recreation type
 */
function isValidRecreationType(name, type) {
  const lowerName = name.toLowerCase();
  const lowerType = (type || '').toLowerCase();

  // Check if matches valid recreation types
  for (const valid of VALID_FACILITY_TYPES) {
    if (lowerName.includes(valid) || lowerType.includes(valid)) {
      return true;
    }
  }

  // Also allow national wildlife refuges, marine sanctuaries, etc.
  if (
    lowerName.includes('wildlife') ||
    lowerName.includes('sanctuary') ||
    lowerName.includes('national') ||
    lowerName.includes('state')
  ) {
    return true;
  }

  return false;
}

/**
 * Generate a slug ID from name
 */
function generateId(name, prefix = 'recgov') {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  return `${prefix}-${slug}`;
}

/**
 * Clean HTML from description
 * Strips HTML tags and decodes common HTML entities from Recreation.gov API responses.
 * NOTE: Input is from trusted Recreation.gov API. Single-level entity decoding is intentional
 * as the API returns HTML-encoded text. Output is plain text for YAML storage.
 */
function cleanDescription(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * Determine area/county from coordinates or name
 */
function determineArea(lat, lng, name) {
  // Simple area detection based on coordinates
  if (lat && lng) {
    if (lng > -122.0 && lat > 37.9) return 'Solano County';
    if (lng > -122.0 && lat > 37.5) return 'Contra Costa County';
    if (lng < -122.6 && lat > 38.0) return 'Sonoma County';
    if (lng > -122.6 && lng < -122.2 && lat > 38.0) return 'Napa County';
    if (lng < -122.3 && lat > 37.8 && lat < 38.1) return 'Marin County';
    if (lng < -122.3 && lat > 37.7 && lat < 37.85) return 'San Francisco';
    if (lng < -122.0 && lat > 37.4 && lat < 37.7) return 'San Mateo County';
    if (lng > -122.3 && lat > 37.2 && lat < 37.5) return 'Santa Clara County';
    if (lng > -122.3 && lat > 37.5 && lat < 37.9) return 'Alameda County';
  }

  // Fallback based on name
  const lowerName = name.toLowerCase();
  if (lowerName.includes('san francisco')) return 'San Francisco';
  if (lowerName.includes('marin')) return 'Marin County';
  if (lowerName.includes('sonoma') || lowerName.includes('lake sonoma')) return 'Sonoma County';
  if (lowerName.includes('napa') || lowerName.includes('berryessa')) return 'Napa County';
  if (lowerName.includes('solano')) return 'Solano County';
  if (
    lowerName.includes('alameda') ||
    lowerName.includes('oakland') ||
    lowerName.includes('berkeley')
  )
    return 'Alameda County';
  if (lowerName.includes('santa clara') || lowerName.includes('san jose'))
    return 'Santa Clara County';
  if (lowerName.includes('san mateo')) return 'San Mateo County';
  if (lowerName.includes('contra costa')) return 'Contra Costa County';

  return 'Bay Area';
}

/**
 * Convert Recreation.gov area to program entry
 */
function recAreaToProgram(area) {
  const lat = area.RecAreaLatitude;
  const lng = area.RecAreaLongitude;
  const name = area.RecAreaName;

  const description = cleanDescription(area.RecAreaDescription);
  const phone = area.RecAreaPhone || '';
  const url =
    area.RecAreaReservationURL ||
    area.RecAreaMapURL ||
    `https://www.recreation.gov/search?q=${encodeURIComponent(name)}`;

  return {
    id: generateId(name),
    name: name,
    category: 'Recreation',
    area: determineArea(lat, lng, name),
    groups: ['everyone'],
    description:
      description ||
      `${name} is a federal recreation area managed through Recreation.gov. Visit for outdoor activities, nature exploration, and recreation opportunities.`,
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    phone: phone,
    timeframe: 'Varies by location and activity',
    link: url,
    link_text: 'Visit Recreation.gov',
    latitude: lat || null,
    longitude: lng || null,
    verified: 'Recreation.gov',
    verified_date: new Date().toISOString().split('T')[0],
    recgov_id: area.RecAreaID,
  };
}

/**
 * Convert Recreation.gov facility to program entry
 */
function facilityToProgram(facility, parentName = '') {
  const lat = facility.FacilityLatitude;
  const lng = facility.FacilityLongitude;
  const name = facility.FacilityName;
  const type = facility.FacilityTypeDescription || 'Facility';
  const reservable = facility.Reservable;

  const description = cleanDescription(facility.FacilityDescription);
  const phone = facility.FacilityPhone || '';
  const url =
    facility.FacilityReservationURL ||
    `https://www.recreation.gov/camping/campgrounds/${facility.FacilityID}`;

  let whatTheyOffer = `${type} at ${parentName || name}.`;
  if (reservable) {
    whatTheyOffer += ' Reservations available through Recreation.gov.';
  }

  return {
    id: generateId(name, 'recgov-fac'),
    name: name,
    category: 'Recreation',
    area: determineArea(lat, lng, name),
    groups: ['everyone'],
    description:
      description || `${name} is a ${type.toLowerCase()} available through Recreation.gov.`,
    what_they_offer: whatTheyOffer,
    how_to_get_it: reservable
      ? 'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.'
      : 'Visit Recreation.gov for hours, directions, and any applicable fees.',
    phone: phone,
    timeframe: 'Varies by season',
    link: url,
    link_text: reservable ? 'Make Reservation' : 'View Details',
    latitude: lat || null,
    longitude: lng || null,
    verified: 'Recreation.gov',
    verified_date: new Date().toISOString().split('T')[0],
    recgov_facility_id: facility.FacilityID,
  };
}

async function main() {
  console.log('🏕️  Recreation.gov Bay Area Sync\n');

  // Load existing recreation data
  console.log('📂 Loading existing recreation data...');
  const existingContent = fs.readFileSync(RECREATION_FILE, 'utf8');
  const existingPrograms = yaml.load(existingContent) || [];

  // Build set of existing names and IDs for duplicate detection
  const existingIds = new Set(existingPrograms.map((p) => p.id));
  const existingNames = new Set(existingPrograms.map((p) => p.name.toLowerCase()));
  const existingRecgovIds = new Set(
    existingPrograms.filter((p) => p.recgov_id).map((p) => String(p.recgov_id))
  );

  console.log(`   Found ${existingPrograms.length} existing programs`);
  console.log(`   ${existingRecgovIds.size} already from Recreation.gov\n`);

  // Fetch Bay Area recreation areas
  console.log('🌐 Fetching recreation areas from API...');
  let allAreas = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await apiRequest('/recareas', {
      state: 'CA',
      limit,
      offset,
    });
    const areas = response.RECDATA || [];
    if (areas.length === 0) break;

    allAreas = allAreas.concat(areas);
    offset += limit;

    const total = response.METADATA?.RESULTS?.TOTAL_COUNT || 0;
    console.log(`   Fetched ${allAreas.length}/${total} recreation areas`);

    if (allAreas.length >= total) break;
    await sleep(RATE_LIMIT_MS);
  }

  // Filter to Bay Area and exclude commercial lodging
  const bayAreaAreas = allAreas.filter((area) => {
    const lat = area.RecAreaLatitude;
    const lng = area.RecAreaLongitude;
    const name = area.RecAreaName;

    // Must be in Bay Area (by coords or keywords)
    const isBayArea = isInBayArea(lat, lng) || hasBayAreaKeyword(name);
    if (!isBayArea) return false;

    // Exclude hotels and commercial lodging
    if (isExcludedFacility(name, '')) return false;

    return true;
  });

  console.log(`   Found ${bayAreaAreas.length} Bay Area recreation areas\n`);

  // Fetch facilities for each area
  console.log('🏠 Fetching facilities for Bay Area recreation areas...');
  let allFacilities = [];

  for (const area of bayAreaAreas) {
    await sleep(RATE_LIMIT_MS);
    try {
      const response = await apiRequest(`/recareas/${area.RecAreaID}/facilities`);
      const facilities = response.RECDATA || [];

      // Only include reservable facilities that are actual recreation (not hotels)
      const validFacilities = facilities.filter((f) => {
        if (!f.Reservable) return false;
        const name = f.FacilityName || '';
        const type = f.FacilityTypeDescription || '';

        // Exclude hotels and commercial lodging
        if (isExcludedFacility(name, type)) {
          console.log(`   ⏭️ Skipping commercial: ${name}`);
          return false;
        }

        return true;
      });

      if (validFacilities.length > 0) {
        console.log(`   ${area.RecAreaName}: ${validFacilities.length} valid facilities`);
        validFacilities.forEach((f) => {
          f._parentAreaName = area.RecAreaName;
        });
        allFacilities = allFacilities.concat(validFacilities);
      }
    } catch (e) {
      console.log(`   ⚠️ Could not fetch facilities for ${area.RecAreaName}`);
    }
  }

  console.log(`   Total reservable facilities: ${allFacilities.length}\n`);

  // Convert to program entries, checking for duplicates
  console.log('🔄 Converting to program entries...');
  const newPrograms = [];
  let duplicates = 0;

  // Process recreation areas
  for (const area of bayAreaAreas) {
    const recgovId = String(area.RecAreaID);
    const nameLower = area.RecAreaName.toLowerCase();

    // Skip if already exists
    if (existingRecgovIds.has(recgovId)) {
      duplicates++;
      continue;
    }

    // Check for similar names (fuzzy duplicate detection)
    let isDuplicate = false;
    for (const existingName of existingNames) {
      // Check if names are very similar
      if (existingName.includes(nameLower) || nameLower.includes(existingName)) {
        console.log(`   ⚠️ Possible duplicate: "${area.RecAreaName}" similar to existing entry`);
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      const program = recAreaToProgram(area);
      // Ensure unique ID
      if (existingIds.has(program.id)) {
        program.id = `${program.id}-${recgovId}`;
      }
      newPrograms.push(program);
    } else {
      duplicates++;
    }
  }

  // Process facilities
  for (const facility of allFacilities) {
    const facId = String(facility.FacilityID);
    const nameLower = facility.FacilityName.toLowerCase();

    // Skip if similar name exists
    let isDuplicate = false;
    for (const existingName of existingNames) {
      if (existingName.includes(nameLower) || nameLower.includes(existingName)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      const program = facilityToProgram(facility, facility._parentAreaName);
      if (!existingIds.has(program.id)) {
        newPrograms.push(program);
      }
    } else {
      duplicates++;
    }
  }

  console.log(`   New programs to add: ${newPrograms.length}`);
  console.log(`   Duplicates skipped: ${duplicates}\n`);

  if (newPrograms.length === 0) {
    console.log('✅ No new programs to add. Recreation data is up to date!');
    return;
  }

  // Add new programs to existing list
  console.log('💾 Saving updated recreation data...');
  const updatedPrograms = [...existingPrograms, ...newPrograms];

  // Sort by name for consistency
  updatedPrograms.sort((a, b) => a.name.localeCompare(b.name));

  // Write YAML
  const yamlOutput = yaml.dump(updatedPrograms, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });

  fs.writeFileSync(RECREATION_FILE, yamlOutput);

  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 Recreation.gov Sync Summary:');
  console.log(`   Previous programs: ${existingPrograms.length}`);
  console.log(`   New programs added: ${newPrograms.length}`);
  console.log(`   Total programs: ${updatedPrograms.length}`);
  console.log(`   Duplicates skipped: ${duplicates}`);
  console.log('='.repeat(50));

  // List new programs
  if (newPrograms.length > 0) {
    console.log('\n📝 New programs added:');
    newPrograms.forEach((p) => {
      console.log(`   • ${p.name} (${p.area})`);
    });
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
