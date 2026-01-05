/**
 * Sync National Park Service Bay Area Parks
 *
 * Fetches park data from the NPS API and updates recreation.yml
 *
 * Usage: NPS_API_KEY=your_key node scripts/sync-nps-parks.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const NPS_API_KEY = process.env.NPS_API_KEY;
const NPS_API_BASE = 'https://developer.nps.gov/api/v1';

// Bay Area counties and their approximate bounding box
const BAY_AREA_COUNTIES = [
  'Alameda', 'Contra Costa', 'Marin', 'Napa',
  'San Francisco', 'San Mateo', 'Santa Clara', 'Solano', 'Sonoma'
];

// Bay Area bounding box (approximate)
const BAY_AREA_BOUNDS = {
  minLat: 36.9,
  maxLat: 38.9,
  minLng: -123.6,
  maxLng: -121.2
};

if (!NPS_API_KEY) {
  console.error('Error: NPS_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Make an API request to NPS
 */
function fetchFromNPS(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${NPS_API_BASE}${endpoint}?${queryParams}`;

    const options = {
      headers: {
        'X-Api-Key': NPS_API_KEY,
        'Accept': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Check if coordinates are within Bay Area bounds
 */
function isInBayArea(lat, lng) {
  return lat >= BAY_AREA_BOUNDS.minLat &&
         lat <= BAY_AREA_BOUNDS.maxLat &&
         lng >= BAY_AREA_BOUNDS.minLng &&
         lng <= BAY_AREA_BOUNDS.maxLng;
}

/**
 * Known park code to county mappings for accuracy
 */
const PARK_COUNTY_MAP = {
  'alca': 'San Francisco County',  // Alcatraz is in SF Bay
  'euon': 'Contra Costa County',   // Eugene O'Neill is in Danville
  'fopo': 'San Francisco County',  // Fort Point is in SF
  'goga': 'San Francisco County',  // Golden Gate spans multiple, HQ in SF
  'jomu': 'Contra Costa County',   // John Muir is in Martinez
  'muwo': 'Marin County',          // Muir Woods is in Marin
  'pore': 'Marin County',          // Point Reyes is in Marin
  'poch': 'Contra Costa County',   // Port Chicago is in Concord area
  'prsf': 'San Francisco County',  // Presidio is in SF
  'rori': 'Contra Costa County',   // Rosie the Riveter is in Richmond
  'safr': 'San Francisco County',  // SF Maritime is in SF
};

/**
 * Determine county from park code or coordinates
 */
function getCountyFromCoords(lat, lng, parkCode) {
  // Use known mapping first
  if (parkCode && PARK_COUNTY_MAP[parkCode.toLowerCase()]) {
    return PARK_COUNTY_MAP[parkCode.toLowerCase()];
  }

  // Fallback to coordinate-based detection
  if (lat >= 38.3 && lng <= -122.4) return 'Sonoma County';
  if (lat >= 38.0 && lat < 38.3 && lng <= -122.3) return 'Napa County';
  if (lat >= 38.0 && lng >= -122.3 && lng <= -121.6) return 'Solano County';
  if (lat >= 37.8 && lat < 38.1 && lng <= -122.35) return 'Marin County';
  if (lat >= 37.7 && lat < 37.85 && lng <= -122.35 && lng >= -122.52) return 'San Francisco County';
  if (lat >= 37.4 && lat < 37.7 && lng <= -122.0) return 'San Mateo County';
  if (lat >= 37.1 && lat < 37.5 && lng >= -122.2) return 'Santa Clara County';
  if (lat >= 37.7 && lat < 38.1 && lng >= -122.35) return 'Alameda County';
  if (lat >= 37.7 && lat < 38.1 && lng >= -122.0 && lng < -121.5) return 'Contra Costa County';

  return 'Bay Area';
}

/**
 * Generate a URL-friendly ID from park name
 */
function generateId(name, parkCode) {
  return 'nps-' + parkCode.toLowerCase();
}

/**
 * Format park data for YAML output
 */
function formatParkForYaml(park, feeInfo = null) {
  const lat = parseFloat(park.latitude);
  const lng = parseFloat(park.longitude);

  // Build address from available components
  const addressParts = [];
  if (park.addresses && park.addresses.length > 0) {
    const addr = park.addresses.find(a => a.type === 'Physical') || park.addresses[0];
    if (addr.line1) addressParts.push(addr.line1);
    if (addr.city) addressParts.push(addr.city);
    if (addr.stateCode) addressParts.push(addr.stateCode);
    if (addr.postalCode) addressParts.push(addr.postalCode);
  }

  const address = addressParts.join(', ') || null;
  const city = park.addresses?.[0]?.city || null;
  const county = getCountyFromCoords(lat, lng, park.parkCode);

  // Note: map_link is now generated dynamically from address at build time
  // using DuckDuckGo Maps for privacy. Store lat/lng for the map page instead.

  return {
    id: generateId(park.fullName, park.parkCode),
    name: park.fullName,
    parkCode: park.parkCode,
    category: 'National Parks',
    area: county,
    city: city,
    groups: ['everyone'],
    address: address,
    link: park.url,
    link_text: 'Visit Website',
    latitude: lat || null,
    longitude: lng || null,
    description: park.description,
    designation: park.designation,
    fee_info: feeInfo,
    verified_by: 'National Park Service',
    verified_date: new Date().toISOString().split('T')[0]
  };
}

/**
 * Convert park object to YAML string
 */
function parkToYaml(park) {
  let yaml = `- id: ${park.id}\n`;
  yaml += `  name: ${park.name}\n`;
  yaml += `  category: National Parks\n`;
  yaml += `  area: ${park.area}\n`;
  if (park.city) yaml += `  city: ${park.city}\n`;
  yaml += `  groups:\n  - everyone\n`;
  if (park.address) yaml += `  address: ${park.address}\n`;
  yaml += `  link: ${park.link}\n`;
  yaml += `  link_text: Visit Website\n`;
  // Note: map_link is generated dynamically from address at build time
  if (park.latitude) yaml += `  latitude: ${park.latitude}\n`;
  if (park.longitude) yaml += `  longitude: ${park.longitude}\n`;
  if (park.fee_info) yaml += `  fee_info: ${park.fee_info}\n`;
  yaml += `  verified_by: National Park Service\n`;
  yaml += `  verified_date: '${park.verified_date}'\n`;
  return yaml;
}

/**
 * Fetch fee information for a park
 */
async function fetchFeeInfo(parkCode) {
  try {
    const response = await fetchFromNPS('/feespasses', {
      parkCode: parkCode,
      limit: 10
    });

    if (response.data && response.data.length > 0) {
      const feeData = response.data[0];

      // Check if it's a fee-free park
      if (feeData.isFeeFreePark === true || feeData.isFeeFreePark === 'true') {
        return 'Free admission';
      }

      // Check the fees array for entrance fees
      if (feeData.fees && feeData.fees.length > 0) {
        const entranceFee = feeData.fees.find(f =>
          f.entranceFeeType && f.entranceFeeType.toLowerCase().includes('entrance')
        ) || feeData.fees[0];

        if (entranceFee && entranceFee.cost) {
          const cost = parseFloat(entranceFee.cost);
          if (cost === 0) return 'Free admission';
          return `$${cost.toFixed(0)} per person`;
        }
      }

      // Fallback to entrance fee description
      if (feeData.entranceFeeDescription) {
        // Extract just the price if present
        const priceMatch = feeData.entranceFeeDescription.match(/\$(\d+\.?\d*)/);
        if (priceMatch) {
          const cost = parseFloat(priceMatch[1]);
          if (cost === 0) return 'Free admission';
          return `$${cost.toFixed(0)} per person`;
        }
        // Check if it mentions free
        if (feeData.entranceFeeDescription.toLowerCase().includes('free')) {
          return 'Free admission';
        }
      }
    }
    return 'Free admission'; // Default if no fee info found
  } catch (e) {
    console.log(`  Could not fetch fees for ${parkCode}: ${e.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching California parks from NPS API...');

  try {
    // Fetch all California parks
    const response = await fetchFromNPS('/parks', {
      stateCode: 'CA',
      limit: 100
    });

    if (!response.data) {
      throw new Error('No data returned from API');
    }

    console.log(`Found ${response.data.length} California parks`);

    // Filter to Bay Area parks
    const bayAreaParks = response.data.filter(park => {
      const lat = parseFloat(park.latitude);
      const lng = parseFloat(park.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.log(`  Skipping ${park.fullName} - no coordinates`);
        return false;
      }

      const inBayArea = isInBayArea(lat, lng);
      if (!inBayArea) {
        console.log(`  Skipping ${park.fullName} - outside Bay Area (${lat}, ${lng})`);
      }
      return inBayArea;
    });

    console.log(`\nFound ${bayAreaParks.length} Bay Area parks:`);

    // Format parks for output (with fee info)
    console.log('\nFetching fee information for each park...');
    const formattedParks = [];
    for (const park of bayAreaParks) {
      const feeInfo = await fetchFeeInfo(park.parkCode);
      const formatted = formatParkForYaml(park, feeInfo);
      console.log(`  - ${formatted.name} (${formatted.area})${feeInfo ? ` - ${feeInfo}` : ''}`);
      formattedParks.push(formatted);
    }

    // Sort by name
    formattedParks.sort((a, b) => a.name.localeCompare(b.name));

    // Generate YAML output
    let yamlOutput = '\n# National Park Service - Bay Area\n';
    yamlOutput += '# Source: National Park Service API\n';
    yamlOutput += `# Updated: ${new Date().toISOString().split('T')[0]}\n\n`;

    formattedParks.forEach(park => {
      yamlOutput += parkToYaml(park) + '\n';
    });

    // Save to exports folder
    const exportPath = path.join(__dirname, '..', 'data-exports', 'gov-datasets', 'bay-area-nps-parks.yml');
    fs.writeFileSync(exportPath, yamlOutput);
    console.log(`\nSaved YAML to: ${exportPath}`);

    // Also save as JSON for reference
    const jsonPath = path.join(__dirname, '..', 'data-exports', 'gov-datasets', 'bay-area-nps-parks.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      source: 'National Park Service API',
      updated: new Date().toISOString(),
      parks: formattedParks
    }, null, 2));
    console.log(`Saved JSON to: ${jsonPath}`);

    // Update recreation.yml
    const recreationPath = path.join(__dirname, '..', 'src', 'data', 'recreation.yml');
    let recreationContent = fs.readFileSync(recreationPath, 'utf-8');

    // Check if NPS section already exists
    const npsMarker = '# National Park Service - Bay Area';
    if (recreationContent.includes(npsMarker)) {
      // Remove existing NPS section and replace
      const npsStart = recreationContent.indexOf(npsMarker);
      // Find the next section or end of file
      const nextSectionMatch = recreationContent.slice(npsStart + 1).match(/\n# [A-Z]/);
      const npsEnd = nextSectionMatch
        ? npsStart + 1 + nextSectionMatch.index
        : recreationContent.length;

      recreationContent = recreationContent.slice(0, npsStart) +
                          yamlOutput.trim() + '\n' +
                          recreationContent.slice(npsEnd);
    } else {
      // Append NPS section
      recreationContent += yamlOutput;
    }

    fs.writeFileSync(recreationPath, recreationContent);
    console.log(`Updated: ${recreationPath}`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
