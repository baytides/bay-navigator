#!/usr/bin/env node
/**
 * Generate a location data JSON file for Carl to use
 *
 * Creates /public/api/location-data.json with ZIP code to city mapping
 * and city to county mapping for location-based responses
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ZIPCODES_PATH = path.join(__dirname, '..', 'src', 'data', 'zipcodes.yml');
const CITIES_PATH = path.join(__dirname, '..', 'src', 'data', 'cities.yml');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'location-data.json');

// Neighborhood aliases that map to their parent city
const neighborhoodAliases = {
  'redwood shores': 'Redwood City',
  'foster city': 'Foster City',
  'silicon valley': 'San Jose',
  soma: 'San Francisco',
  'the mission': 'San Francisco',
  castro: 'San Francisco',
  marina: 'San Francisco',
  'financial district': 'San Francisco',
  'downtown oakland': 'Oakland',
  temescal: 'Oakland',
  rockridge: 'Oakland',
  fruitvale: 'Oakland',
  'north beach': 'San Francisco',
  haight: 'San Francisco',
  'noe valley': 'San Francisco',
  'bernal heights': 'San Francisco',
  'potrero hill': 'San Francisco',
  dogpatch: 'San Francisco',
  'inner sunset': 'San Francisco',
  'outer sunset': 'San Francisco',
  'richmond district': 'San Francisco',
  excelsior: 'San Francisco',
  'visitacion valley': 'San Francisco',
  bayview: 'San Francisco',
  'hunters point': 'San Francisco',
  'diamond heights': 'San Francisco',
  'glen park': 'San Francisco',
  'twin peaks': 'San Francisco',
  'west portal': 'San Francisco',
  parkside: 'San Francisco',
  'sea cliff': 'San Francisco',
};

function main() {
  console.log('Generating location data API...\n');

  // Load zipcodes
  const zipcodesContent = fs.readFileSync(ZIPCODES_PATH, 'utf-8');
  const zipToCity = yaml.load(zipcodesContent);

  // Load cities
  const citiesContent = fs.readFileSync(CITIES_PATH, 'utf-8');
  const cities = yaml.load(citiesContent);

  // Build city to county map
  const cityToCounty = {};
  for (const city of cities) {
    cityToCounty[city.name.toLowerCase()] = city.county;
  }

  // Create output
  const output = {
    generated: new Date().toISOString(),
    zipToCity,
    cityToCounty,
    neighborhoodAliases,
  };

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`Generated location data API`);
  console.log(`  ZIP codes: ${Object.keys(zipToCity).length}`);
  console.log(`  Cities: ${Object.keys(cityToCounty).length}`);
  console.log(`  Neighborhoods: ${Object.keys(neighborhoodAliases).length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main();
