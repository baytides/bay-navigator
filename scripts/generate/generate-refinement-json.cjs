#!/usr/bin/env node
/**
 * Generate Refinement Config JSON from search-config.yml
 *
 * This script creates refinement-config.json for mobile apps (Flutter/Swift)
 * that contains the search refinement tree, location data, and synonyms.
 *
 * Run at build time: npm run generate:refinement
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Paths
const CONFIG_PATH = path.join(__dirname, '../../src/data/search-config.yml');
const ZIPCODES_PATH = path.join(__dirname, '../../src/data/zipcodes.yml');
const CITIES_PATH = path.join(__dirname, '../../src/data/cities.yml');
const OUTPUT_DIR = path.join(__dirname, '../../public/api');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'refinement-config.json');

console.log('📦 Generating refinement config JSON...');

// Load search config
let config;
try {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
  config = yaml.load(configContent);
  console.log('  ✓ Loaded search-config.yml');
} catch (err) {
  console.error('  ✗ Failed to load search-config.yml:', err.message);
  process.exit(1);
}

// Load zipcodes
let zipcodes = {};
try {
  const zipContent = fs.readFileSync(ZIPCODES_PATH, 'utf-8');
  const zipData = yaml.load(zipContent);
  // Convert array to lookup object if needed
  if (Array.isArray(zipData)) {
    zipData.forEach((item) => {
      if (item.zip && item.city) {
        zipcodes[item.zip] = item.city;
      }
    });
  } else if (typeof zipData === 'object') {
    zipcodes = zipData;
  }
  console.log(`  ✓ Loaded ${Object.keys(zipcodes).length} ZIP codes`);
} catch (err) {
  console.warn('  ⚠ Could not load zipcodes.yml:', err.message);
}

// Load cities and build city-to-county lookup
let cityToCounty = {};
try {
  const citiesContent = fs.readFileSync(CITIES_PATH, 'utf-8');
  const citiesData = yaml.load(citiesContent);

  if (Array.isArray(citiesData)) {
    citiesData.forEach((city) => {
      if (city.name && city.county) {
        cityToCounty[city.name.toLowerCase()] = city.county;
      }
    });
  }
  console.log(`  ✓ Loaded ${Object.keys(cityToCounty).length} cities`);
} catch (err) {
  console.warn('  ⚠ Could not load cities.yml:', err.message);
}

// Bay Area counties with coordinates (for GPS lookup)
const bayAreaCounties = [
  'Alameda County',
  'Contra Costa County',
  'Marin County',
  'Napa County',
  'San Francisco',
  'San Mateo County',
  'Santa Clara County',
  'Solano County',
  'Sonoma County',
];

const countyCoordinates = {
  'Alameda County': { lat: 37.6017, lng: -121.7195 },
  'Contra Costa County': { lat: 37.9193, lng: -121.9277 },
  'Marin County': { lat: 38.0834, lng: -122.7633 },
  'Napa County': { lat: 38.5025, lng: -122.2654 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'San Mateo County': { lat: 37.4969, lng: -122.3331 },
  'Santa Clara County': { lat: 37.3541, lng: -121.9552 },
  'Solano County': { lat: 38.2721, lng: -121.9399 },
  'Sonoma County': { lat: 38.578, lng: -122.9888 },
};

// Build the output JSON structure
const refinementConfig = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),

  // Refinement settings (categories, triggers, etc.)
  refinement: config.refinement || null,

  // Search enhancements
  synonyms: config.synonyms || {},
  best_bets: config.best_bets || {},
  suggestions: config.suggestions || [],
  query_rewrites: config.query_rewrites || {},

  // Location data for mobile apps
  location: {
    zipcodes,
    cityToCounty,
    bayAreaCounties,
    countyCoordinates,
  },
};

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write the JSON file
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(refinementConfig, null, 2));

const fileSize = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
console.log(`\n✅ Generated: ${OUTPUT_PATH}`);
console.log(`   Size: ${fileSize} KB`);

// Summary
if (config.refinement?.categories) {
  console.log(`   Categories: ${config.refinement.categories.length}`);
  const totalSubOptions = config.refinement.categories.reduce(
    (sum, cat) => sum + (cat.sub_options?.length || 0),
    0
  );
  console.log(`   Sub-options: ${totalSubOptions}`);
}
console.log(`   Synonyms: ${Object.keys(config.synonyms || {}).length}`);
console.log(`   Best bets: ${Object.keys(config.best_bets || {}).length}`);
console.log(`   Suggestions: ${(config.suggestions || []).length}`);
