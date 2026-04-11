#!/usr/bin/env node
/**
 * Fetch city council data from Cicero API for all Bay Area cities
 * Uses the trial API key to download and cache data locally
 *
 * Usage: CICERO_API_KEY=xxx node scripts/fetch-cicero-city-councils.cjs
 */

const fs = require('fs');
const path = require('path');

const CICERO_API_KEY = process.env.CICERO_API_KEY;
const CICERO_BASE = 'https://app.cicerodata.com/v3.1';

// Bay Area cities with representative coordinates (city center approx)
// Organized by county
const BAY_AREA_CITIES = {
  // Alameda County
  Alameda: { lat: 37.7652, lon: -122.2416, county: 'Alameda' },
  Albany: { lat: 37.8869, lon: -122.2978, county: 'Alameda' },
  Berkeley: { lat: 37.8716, lon: -122.2727, county: 'Alameda' },
  Dublin: { lat: 37.7022, lon: -121.9358, county: 'Alameda' },
  Emeryville: { lat: 37.8313, lon: -122.2852, county: 'Alameda' },
  Fremont: { lat: 37.5485, lon: -121.9886, county: 'Alameda' },
  Hayward: { lat: 37.6688, lon: -122.0808, county: 'Alameda' },
  Livermore: { lat: 37.6819, lon: -121.768, county: 'Alameda' },
  Newark: { lat: 37.5296, lon: -122.0402, county: 'Alameda' },
  Oakland: { lat: 37.8044, lon: -122.2712, county: 'Alameda' },
  Piedmont: { lat: 37.8244, lon: -122.2317, county: 'Alameda' },
  Pleasanton: { lat: 37.6624, lon: -121.8747, county: 'Alameda' },
  'San Leandro': { lat: 37.7249, lon: -122.1561, county: 'Alameda' },
  'Union City': { lat: 37.5934, lon: -122.0438, county: 'Alameda' },

  // Contra Costa County
  Antioch: { lat: 38.0049, lon: -121.8058, county: 'Contra Costa' },
  Brentwood: { lat: 37.9317, lon: -121.6958, county: 'Contra Costa' },
  Clayton: { lat: 37.941, lon: -121.9356, county: 'Contra Costa' },
  Concord: { lat: 37.978, lon: -122.0311, county: 'Contra Costa' },
  Danville: { lat: 37.8216, lon: -121.9999, county: 'Contra Costa' },
  'El Cerrito': { lat: 37.9161, lon: -122.3108, county: 'Contra Costa' },
  Hercules: { lat: 38.0172, lon: -122.2886, county: 'Contra Costa' },
  Lafayette: { lat: 37.8858, lon: -122.118, county: 'Contra Costa' },
  Martinez: { lat: 38.0194, lon: -122.1341, county: 'Contra Costa' },
  Moraga: { lat: 37.8349, lon: -122.1297, county: 'Contra Costa' },
  Oakley: { lat: 37.9974, lon: -121.7125, county: 'Contra Costa' },
  Orinda: { lat: 37.8771, lon: -122.1797, county: 'Contra Costa' },
  Pinole: { lat: 38.0044, lon: -122.2989, county: 'Contra Costa' },
  Pittsburg: { lat: 38.0279, lon: -121.8847, county: 'Contra Costa' },
  'Pleasant Hill': { lat: 37.948, lon: -122.0608, county: 'Contra Costa' },
  Richmond: { lat: 37.9358, lon: -122.3477, county: 'Contra Costa' },
  'San Pablo': { lat: 37.9621, lon: -122.3458, county: 'Contra Costa' },
  'San Ramon': { lat: 37.7799, lon: -121.978, county: 'Contra Costa' },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652, county: 'Contra Costa' },

  // Marin County
  Belvedere: { lat: 37.8724, lon: -122.4643, county: 'Marin' },
  'Corte Madera': { lat: 37.9255, lon: -122.5275, county: 'Marin' },
  Fairfax: { lat: 37.9871, lon: -122.5889, county: 'Marin' },
  Larkspur: { lat: 37.9341, lon: -122.5353, county: 'Marin' },
  'Mill Valley': { lat: 37.906, lon: -122.545, county: 'Marin' },
  Novato: { lat: 38.1074, lon: -122.5697, county: 'Marin' },
  Ross: { lat: 37.9624, lon: -122.555, county: 'Marin' },
  'San Anselmo': { lat: 37.9746, lon: -122.5614, county: 'Marin' },
  'San Rafael': { lat: 37.9735, lon: -122.5311, county: 'Marin' },
  Sausalito: { lat: 37.8591, lon: -122.4853, county: 'Marin' },
  Tiburon: { lat: 37.8735, lon: -122.4567, county: 'Marin' },

  // Napa County
  'American Canyon': { lat: 38.1749, lon: -122.2608, county: 'Napa' },
  Calistoga: { lat: 38.5788, lon: -122.5797, county: 'Napa' },
  Napa: { lat: 38.2975, lon: -122.2869, county: 'Napa' },
  'St. Helena': { lat: 38.5052, lon: -122.4703, county: 'Napa' },
  Yountville: { lat: 38.4016, lon: -122.3608, county: 'Napa' },

  // San Francisco (city-county - but we'll fetch to verify)
  'San Francisco': { lat: 37.7749, lon: -122.4194, county: 'San Francisco' },

  // San Mateo County
  Atherton: { lat: 37.4613, lon: -122.1975, county: 'San Mateo' },
  Belmont: { lat: 37.5202, lon: -122.2758, county: 'San Mateo' },
  Brisbane: { lat: 37.6808, lon: -122.3999, county: 'San Mateo' },
  Burlingame: { lat: 37.5841, lon: -122.366, county: 'San Mateo' },
  Colma: { lat: 37.6769, lon: -122.4597, county: 'San Mateo' },
  'Daly City': { lat: 37.6879, lon: -122.4702, county: 'San Mateo' },
  'East Palo Alto': { lat: 37.4689, lon: -122.1411, county: 'San Mateo' },
  'Foster City': { lat: 37.5585, lon: -122.2711, county: 'San Mateo' },
  'Half Moon Bay': { lat: 37.4636, lon: -122.4286, county: 'San Mateo' },
  Hillsborough: { lat: 37.5741, lon: -122.3794, county: 'San Mateo' },
  'Menlo Park': { lat: 37.453, lon: -122.1817, county: 'San Mateo' },
  Millbrae: { lat: 37.5985, lon: -122.3872, county: 'San Mateo' },
  Pacifica: { lat: 37.6138, lon: -122.4869, county: 'San Mateo' },
  'Portola Valley': { lat: 37.3841, lon: -122.2347, county: 'San Mateo' },
  'Redwood City': { lat: 37.4852, lon: -122.2364, county: 'San Mateo' },
  'San Bruno': { lat: 37.6305, lon: -122.4111, county: 'San Mateo' },
  'San Carlos': { lat: 37.5072, lon: -122.2608, county: 'San Mateo' },
  'San Mateo': { lat: 37.563, lon: -122.3255, county: 'San Mateo' },
  'South San Francisco': { lat: 37.6547, lon: -122.4077, county: 'San Mateo' },
  Woodside: { lat: 37.4299, lon: -122.2539, county: 'San Mateo' },

  // Santa Clara County
  Campbell: { lat: 37.2872, lon: -121.95, county: 'Santa Clara' },
  Cupertino: { lat: 37.3229, lon: -122.0322, county: 'Santa Clara' },
  Gilroy: { lat: 37.0058, lon: -121.5682, county: 'Santa Clara' },
  'Los Altos': { lat: 37.3852, lon: -122.1141, county: 'Santa Clara' },
  'Los Altos Hills': { lat: 37.3796, lon: -122.1375, county: 'Santa Clara' },
  'Los Gatos': { lat: 37.2358, lon: -121.9624, county: 'Santa Clara' },
  Milpitas: { lat: 37.4323, lon: -121.8996, county: 'Santa Clara' },
  'Monte Sereno': { lat: 37.2363, lon: -121.9928, county: 'Santa Clara' },
  'Morgan Hill': { lat: 37.1305, lon: -121.6544, county: 'Santa Clara' },
  'Mountain View': { lat: 37.3861, lon: -122.0839, county: 'Santa Clara' },
  'Palo Alto': { lat: 37.4419, lon: -122.143, county: 'Santa Clara' },
  'San Jose': { lat: 37.3382, lon: -121.8863, county: 'Santa Clara' },
  'Santa Clara': { lat: 37.3541, lon: -121.9552, county: 'Santa Clara' },
  Saratoga: { lat: 37.2639, lon: -122.023, county: 'Santa Clara' },
  Sunnyvale: { lat: 37.3688, lon: -122.0363, county: 'Santa Clara' },

  // Solano County
  Benicia: { lat: 38.0494, lon: -122.1586, county: 'Solano' },
  Dixon: { lat: 38.4455, lon: -121.8233, county: 'Solano' },
  Fairfield: { lat: 38.2494, lon: -122.04, county: 'Solano' },
  'Rio Vista': { lat: 38.1566, lon: -121.6922, county: 'Solano' },
  'Suisun City': { lat: 38.2388, lon: -122.04, county: 'Solano' },
  Vacaville: { lat: 38.3566, lon: -121.9877, county: 'Solano' },
  Vallejo: { lat: 38.1041, lon: -122.2566, county: 'Solano' },

  // Sonoma County
  Cloverdale: { lat: 38.806, lon: -123.0169, county: 'Sonoma' },
  Cotati: { lat: 38.3294, lon: -122.7075, county: 'Sonoma' },
  Healdsburg: { lat: 38.6105, lon: -122.8692, county: 'Sonoma' },
  Petaluma: { lat: 38.2324, lon: -122.6367, county: 'Sonoma' },
  'Rohnert Park': { lat: 38.3396, lon: -122.7011, county: 'Sonoma' },
  'Santa Rosa': { lat: 38.4405, lon: -122.7141, county: 'Sonoma' },
  Sebastopol: { lat: 38.4021, lon: -122.8239, county: 'Sonoma' },
  Sonoma: { lat: 38.2919, lon: -122.458, county: 'Sonoma' },
  Windsor: { lat: 38.5469, lon: -122.8164, county: 'Sonoma' },
};

async function fetchCiceroOfficials(lat, lon) {
  const url = `${CICERO_BASE}/official?lat=${lat}&lon=${lon}&format=json&key=${CICERO_API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Cicero API error: ${response.status}`);
  }

  const data = await response.json();

  // Check credits remaining
  const credits = response.headers.get('X-Cicero-Credit-Balance');
  console.log(`  Credits remaining: ${credits}`);

  if (data.response?.errors?.length > 0) {
    throw new Error(`Cicero error: ${JSON.stringify(data.response.errors)}`);
  }

  return data.response?.results?.officials || [];
}

function filterLocalOfficials(officials) {
  // Filter for LOCAL district type (city officials)
  return officials.filter((o) => {
    const distType = o.office?.district?.district_type;
    return distType === 'LOCAL';
  });
}

function formatOfficial(official) {
  const office = official.office || {};
  const district = office.district || {};

  return {
    name: `${official.first_name || ''} ${official.last_name || ''}`.trim(),
    title: office.title || 'Unknown',
    districtType: district.district_type,
    districtId: district.id,
    districtName: district.label || district.district_id,
    party: official.party || null,
    email: official.email_1 || null,
    phone: official.phone_1 || null,
    website: official.urls?.length > 0 ? official.urls[0] : null,
    photoUrl: official.photo_origin_url || null,
    notes: official.notes || null,
  };
}

async function main() {
  if (!CICERO_API_KEY) {
    console.error('Error: CICERO_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Fetching city council data from Cicero API...\n');

  const results = {};
  const cities = Object.entries(BAY_AREA_CITIES);

  for (let i = 0; i < cities.length; i++) {
    const [cityName, cityData] = cities[i];
    console.log(`[${i + 1}/${cities.length}] ${cityName}, ${cityData.county} County`);

    try {
      const officials = await fetchCiceroOfficials(cityData.lat, cityData.lon);
      const localOfficials = filterLocalOfficials(officials);

      results[cityName] = {
        city: cityName,
        county: cityData.county,
        coordinates: { lat: cityData.lat, lon: cityData.lon },
        officials: localOfficials.map(formatOfficial),
        fetchedAt: new Date().toISOString(),
      };

      console.log(`  Found ${localOfficials.length} local officials`);

      // Rate limit: 200/min = ~3.3/sec, so wait 350ms between requests
      await new Promise((r) => setTimeout(r, 350));
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      results[cityName] = {
        city: cityName,
        county: cityData.county,
        coordinates: { lat: cityData.lat, lon: cityData.lon },
        error: err.message,
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  // Save results
  const outputPath = path.join(
    __dirname,
    '..',
    'data-exports',
    'city-councils',
    'cicero-data.json'
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\nSaved results to ${outputPath}`);

  // Summary
  const successCount = Object.values(results).filter((r) => !r.error).length;
  const totalOfficials = Object.values(results)
    .filter((r) => !r.error)
    .reduce((sum, r) => sum + r.officials.length, 0);

  console.log(
    `\nSummary: ${successCount}/${cities.length} cities fetched, ${totalOfficials} total local officials`
  );
}

main().catch(console.error);
