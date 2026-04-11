#!/usr/bin/env node
/**
 * Generate Swift code for CivicService from scraped data
 * Reads Cicero API data and outputs Swift code to paste into CivicService.swift
 *
 * Usage: node scripts/generate-swift-civic-data.cjs > civic-data-output.swift
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', '..', 'data-exports', 'city-councils', 'cicero-data.json');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// County name -> key mapping
const countyKeys = {
  Alameda: 'alameda',
  'Contra Costa': 'contra costa',
  Marin: 'marin',
  Napa: 'napa',
  'San Francisco': 'san francisco',
  'San Mateo': 'san mateo',
  'Santa Clara': 'santa clara',
  Solano: 'solano',
  Sonoma: 'sonoma',
};

// Track county supervisors by county (to avoid duplicates)
const countySupervisors = {};
// Track city officials by city
const cityOfficials = {};

// Process all cities
for (const [cityName, cityData] of Object.entries(data)) {
  if (cityData.error || !cityData.officials) continue;

  const county = cityData.county;
  const countyKey = countyKeys[county];

  for (const official of cityData.officials) {
    const districtName = official.districtName || '';
    const title = official.title || '';

    // Determine if this is a county supervisor or city official
    const isCountySupervisor =
      /board of supervisors/i.test(districtName) || /supervisor/i.test(title);

    if (isCountySupervisor && countyKey) {
      // Add to county supervisors (dedupe by name)
      if (!countySupervisors[countyKey]) {
        countySupervisors[countyKey] = {};
      }
      if (!countySupervisors[countyKey][official.name]) {
        countySupervisors[countyKey][official.name] = {
          ...official,
          county,
        };
      }
    } else {
      // Add to city officials
      const cityKey = cityName.toLowerCase();
      if (!cityOfficials[cityKey]) {
        cityOfficials[cityKey] = [];
      }
      // Avoid duplicate names within same city
      if (!cityOfficials[cityKey].some((o) => o.name === official.name)) {
        cityOfficials[cityKey].push({
          ...official,
          city: cityName,
          county,
        });
      }
    }
  }
}

// Helper to escape Swift strings
function escapeSwift(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// Helper to format optional string
function optStr(val) {
  if (!val) return 'nil';
  return `"${escapeSwift(val)}"`;
}

// Helper to extract district number from district name
function extractDistrict(districtName) {
  if (!districtName) return null;
  const match = districtName.match(/district\s*(\d+)/i);
  return match ? match[1] : null;
}

// Generate Swift code
console.log('// MARK: - Generated Civic Data');
console.log('// Generated: ' + new Date().toISOString());
console.log('// Source: Cicero API (cicerodata.com)');
console.log('');

// Generate county supervisors
console.log('// MARK: - County Supervisors');
console.log('');
console.log('static let countySupervistorsByCounty: [String: [Representative]] = [');

for (const [countyKey, supervisors] of Object.entries(countySupervisors)) {
  const supervisorList = Object.values(supervisors);
  if (supervisorList.length === 0) continue;

  console.log(`    "${countyKey}": [`);

  for (let i = 0; i < supervisorList.length; i++) {
    const sup = supervisorList[i];
    const districtNum = extractDistrict(sup.districtName);
    const comma = i < supervisorList.length - 1 ? ',' : '';

    console.log('        Representative(');
    console.log(`            name: "${escapeSwift(sup.name)}",`);
    console.log('            title: "County Supervisor",');
    console.log('            level: .local,');
    console.log(`            party: ${optStr(sup.party)},`);
    console.log(`            phone: ${optStr(sup.phone)},`);
    console.log(`            email: ${optStr(sup.email)},`);
    console.log(`            website: ${optStr(sup.website)},`);
    console.log(`            photoUrl: ${optStr(sup.photoUrl)},`);
    console.log(`            district: ${districtNum ? `"District ${districtNum}"` : 'nil'}`);
    console.log(`        )${comma}`);
  }

  console.log('    ],');
}

console.log(']');
console.log('');

// Generate city officials (mayors, council members)
console.log('// MARK: - City Officials');
console.log('');
console.log('static let localOfficialsByCity: [String: [Representative]] = [');

for (const [cityKey, officials] of Object.entries(cityOfficials)) {
  if (officials.length === 0) continue;

  // Skip if all are just county supervisors that slipped through
  const cityOnly = officials.filter(
    (o) => !/supervisor/i.test(o.title) && !/board of supervisors/i.test(o.districtName || '')
  );
  if (cityOnly.length === 0) continue;

  console.log(`    "${cityKey}": [`);

  for (let i = 0; i < cityOnly.length; i++) {
    const off = cityOnly[i];
    const comma = i < cityOnly.length - 1 ? ',' : '';

    // Normalize title
    let title = off.title || 'Council Member';
    if (/mayor/i.test(title) && !/vice/i.test(title)) {
      title = 'Mayor';
    } else if (/vice.*mayor/i.test(title)) {
      title = 'Vice Mayor';
    } else if (/council/i.test(title)) {
      title = 'Council Member';
    }

    const districtNum = extractDistrict(off.districtName);

    console.log('        Representative(');
    console.log(`            name: "${escapeSwift(off.name)}",`);
    console.log(`            title: "${escapeSwift(title)}",`);
    console.log('            level: .local,');
    console.log(`            party: ${optStr(off.party)},`);
    console.log(`            phone: ${optStr(off.phone)},`);
    console.log(`            email: ${optStr(off.email)},`);
    console.log(`            website: ${optStr(off.website)},`);
    console.log(`            photoUrl: ${optStr(off.photoUrl)},`);
    console.log(`            district: ${districtNum ? `"District ${districtNum}"` : 'nil'}`);
    console.log(`        )${comma}`);
  }

  console.log('    ],');
}

console.log(']');

// Summary
console.error('\n// Summary:');
console.error(
  `// County supervisors: ${Object.values(countySupervisors).reduce((sum, c) => sum + Object.keys(c).length, 0)} across ${Object.keys(countySupervisors).length} counties`
);
console.error(
  `// City officials: ${Object.values(cityOfficials).reduce((sum, c) => sum + c.length, 0)} across ${Object.keys(cityOfficials).length} cities`
);
