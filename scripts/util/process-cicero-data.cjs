#!/usr/bin/env node
/**
 * Process Cicero data to extract city council members
 * Separates city officials from county supervisors
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(
  __dirname,
  '..',
  '..',
  'data-exports',
  'city-councils',
  'cicero-data.json'
);
const outputPath = path.join(
  __dirname,
  '..',
  'data-exports',
  'city-councils',
  'city-councils-processed.json'
);

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const processed = {
  metadata: {
    description: 'Bay Area City Council Members - Processed from Cicero API',
    lastUpdated: new Date().toISOString().split('T')[0],
    source: 'Cicero Data (cicerodata.com)',
    totalCities: 0,
    totalOfficials: 0,
  },
  cities: {},
};

// County Supervisor patterns to exclude
const supervisorPatterns = [/supervisor/i, /board of supervisors/i, /county.*supervisor/i];

function isCityOfficial(official) {
  const title = official.title || '';
  const districtName = official.districtName || '';

  // Exclude county supervisors
  for (const pattern of supervisorPatterns) {
    if (pattern.test(title) || pattern.test(districtName)) {
      return false;
    }
  }

  // Include mayors, council members, etc.
  return true;
}

function normalizeTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('mayor')) return 'Mayor';
  if (t.includes('council')) return 'Council Member';
  if (t.includes('vice mayor')) return 'Vice Mayor';
  return title;
}

for (const [cityName, cityData] of Object.entries(data)) {
  if (cityData.error) continue;

  const cityOfficials = (cityData.officials || []).filter(isCityOfficial);

  if (cityOfficials.length === 0) {
    // Still include cities with no officials found
    processed.cities[cityName] = {
      name: cityName,
      county: cityData.county,
      coordinates: cityData.coordinates,
      type: 'unknown',
      members: [],
      website: null,
      note: 'No city council data available from Cicero',
    };
  } else {
    // Determine if district-based or at-large
    const hasMayor = cityOfficials.some((o) => /mayor/i.test(o.title));
    const hasDistricts = cityOfficials.some((o) => /district\s*\d/i.test(o.districtName || ''));

    const members = cityOfficials.map((o) => ({
      name: o.name,
      title: normalizeTitle(o.title),
      district: hasDistricts ? o.districtName?.match(/district\s*(\d+)/i)?.[1] || null : null,
      party: o.party,
      email: o.email,
      phone: o.phone,
      website: o.website,
      photoUrl: o.photoUrl,
    }));

    processed.cities[cityName] = {
      name: cityName,
      county: cityData.county,
      coordinates: cityData.coordinates,
      type: hasDistricts ? 'district' : 'at-large',
      totalSeats: members.length,
      members,
      website: null, // Would need to look up city websites
    };

    processed.metadata.totalOfficials += members.length;
  }

  processed.metadata.totalCities++;
}

// Save processed data
fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2));
console.log(`Processed data saved to ${outputPath}`);
console.log(`\nSummary:`);
console.log(`  Cities: ${processed.metadata.totalCities}`);
console.log(`  Officials: ${processed.metadata.totalOfficials}`);

// Show sample
console.log('\nSample cities with officials:');
let count = 0;
for (const [name, city] of Object.entries(processed.cities)) {
  if (city.members.length > 0 && count < 5) {
    console.log(`\n${name} (${city.type}):`);
    for (const m of city.members) {
      console.log(`  - ${m.name}: ${m.title}${m.district ? ` (District ${m.district})` : ''}`);
    }
    count++;
  }
}
