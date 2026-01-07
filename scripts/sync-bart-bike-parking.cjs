/**
 * Sync BART Bike Parking Locations
 *
 * Fetches bike parking data from the BART API and updates transportation.yml
 * with accurate station addresses, coordinates, and locker information.
 *
 * Usage: node scripts/sync-bart-bike-parking.cjs
 *
 * BART API Documentation:
 * - Station list: https://api.bart.gov/docs/stn/stns.aspx
 * - Station access: https://api.bart.gov/docs/stn/stnaccess.aspx
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// BART provides a public demo key for testing
const BART_API_KEY = 'MW9S-E7SL-26DU-VV8V';
const BART_API_BASE = 'https://api.bart.gov/api';

// Stations we have BikeLink listings for
const BIKELINK_STATIONS = [
  'CIVC', // Civic Center
  'EMBR', // Embarcadero
  'MCAR', // MacArthur
  'LAKE', // Lake Merritt
  'WOAK', // West Oakland
  'FTVL', // Fruitvale
  'ASHB', // Ashby
  'NBRK', // North Berkeley
  'DBRK', // Downtown Berkeley
];

// Stations we have Bikeep listings for
const BIKEEP_STATIONS = [
  '16TH', // 16th Street Mission
  '24TH', // 24th Street Mission
  '12TH', // 12th Street Oakland
  'MCAR', // MacArthur
  'CONC', // Concord
  'PHIL', // Pleasant Hill
  'UCTY', // Union City
];

/**
 * Make an API request to BART
 */
function fetchFromBART(cmd, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      cmd,
      key: BART_API_KEY,
      json: 'y',
      ...params
    }).toString();

    const url = `${BART_API_BASE}/stn.aspx?${queryParams}`;

    https.get(url, (res) => {
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
 * Get all BART stations
 */
async function getAllStations() {
  const response = await fetchFromBART('stns');
  return response.root.stations.station;
}

/**
 * Get station access info (includes bike parking details)
 */
async function getStationAccess(abbr) {
  const response = await fetchFromBART('stnaccess', { orig: abbr });
  return response.root.stations.station;
}

/**
 * Map BART station to area name for our YAML
 */
function getAreaFromStation(station) {
  const city = station.city || '';
  const county = station.county || '';

  const cityMap = {
    'San Francisco': 'San Francisco',
    'Oakland': 'City of Oakland',
    'Berkeley': 'City of Berkeley',
    'Fremont': 'City of Fremont',
    'Union City': 'Alameda County',
    'Concord': 'Contra Costa County',
    'Walnut Creek': 'Contra Costa County',
    'Pleasant Hill': 'Contra Costa County',
  };

  return cityMap[city] || county || 'Bay Area-wide';
}

/**
 * Format address from BART station data
 */
function formatAddress(station) {
  const parts = [station.address, station.city, 'CA', station.zipcode];
  return parts.filter(Boolean).join(', ').replace(/, CA,/, ', CA');
}

/**
 * Main sync function
 */
async function syncBikeParkingData() {
  console.log('Fetching BART station data...\n');

  const stations = await getAllStations();
  console.log(`Found ${stations.length} BART stations\n`);

  // Collect bike parking info for our stations
  const bikeLinkData = [];
  const bikeepData = [];

  const allStationAbbrs = [...new Set([...BIKELINK_STATIONS, ...BIKEEP_STATIONS])];

  for (const abbr of allStationAbbrs) {
    const station = stations.find(s => s.abbr === abbr);
    if (!station) {
      console.log(`Warning: Station ${abbr} not found in BART API`);
      continue;
    }

    // Get access info for bike parking details
    let accessInfo;
    try {
      accessInfo = await getStationAccess(abbr);
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`Warning: Could not get access info for ${abbr}: ${e.message}`);
      accessInfo = {};
    }

    const stationInfo = {
      abbr,
      name: station.name,
      address: formatAddress(station),
      city: station.city,
      latitude: parseFloat(station.gtfs_latitude),
      longitude: parseFloat(station.gtfs_longitude),
      area: getAreaFromStation(station),
      hasBikeStation: accessInfo.bike_station_flag === '1',
      hasBikeRacks: accessInfo.bike_flag === '1',
      lockerInfo: typeof accessInfo.lockers === 'string' ? accessInfo.lockers : JSON.stringify(accessInfo.lockers || ''),
    };

    if (BIKELINK_STATIONS.includes(abbr)) {
      bikeLinkData.push(stationInfo);
    }
    if (BIKEEP_STATIONS.includes(abbr)) {
      bikeepData.push(stationInfo);
    }

    console.log(`${station.name} (${abbr}):`);
    console.log(`  Address: ${stationInfo.address}`);
    console.log(`  Coords: ${stationInfo.latitude}, ${stationInfo.longitude}`);
    console.log(`  Bike Station: ${stationInfo.hasBikeStation ? 'Yes' : 'No'}`);
    console.log(`  Bike Racks: ${stationInfo.hasBikeRacks ? 'Yes' : 'No'}`);
    if (stationInfo.lockerInfo && stationInfo.lockerInfo !== '""') {
      const lockerText = String(stationInfo.lockerInfo);
      console.log(`  Lockers: ${lockerText.length > 80 ? lockerText.substring(0, 80) + '...' : lockerText}`);
    }
    console.log('');
  }

  // Generate report
  console.log('\n=== SYNC REPORT ===\n');

  console.log('BikeLink Stations:');
  for (const s of bikeLinkData) {
    console.log(`  - ${s.name}: ${s.hasBikeStation ? 'Confirmed bike station' : 'NOT a bike station'}`);
  }

  console.log('\nBikeep Stations:');
  for (const s of bikeepData) {
    console.log(`  - ${s.name}: ${s.hasBikeRacks ? 'Has bike racks' : 'No bike racks listed'}`);
  }

  // Write JSON output for review
  const outputPath = path.join(__dirname, '../.cache/bart-bike-parking.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify({
    lastSync: new Date().toISOString(),
    bikeLink: bikeLinkData,
    bikeep: bikeepData
  }, null, 2));

  console.log(`\nData written to ${outputPath}`);
  console.log('Review the data and manually update transportation.yml if needed.');

  return { bikeLinkData, bikeepData };
}

// Run if executed directly
if (require.main === module) {
  syncBikeParkingData()
    .then(() => {
      console.log('\nSync complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}

module.exports = { syncBikeParkingData };
