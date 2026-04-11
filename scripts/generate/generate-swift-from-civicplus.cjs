#!/usr/bin/env node
/**
 * Generate Swift code for CivicService from CivicPlus scraped data
 * Reads civicplus-data.json and outputs Swift code to paste into CivicService.swift
 *
 * Usage: node scripts/generate-swift-from-civicplus.cjs > civicplus-swift-output.swift
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(
  __dirname,
  '..',
  'data-exports',
  'city-councils',
  'civicplus-data.json'
);
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Helper to escape Swift strings
function escapeSwift(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/&#\d+;/g, '') // Remove HTML entities like &#225;
    .replace(/&[a-z]+;/g, ''); // Remove named entities like &ntilde;
}

// Helper to format optional string
function optStr(val) {
  if (!val) return 'nil';
  const escaped = escapeSwift(val);
  if (!escaped) return 'nil';
  return `"${escaped}"`;
}

// Helper to extract district number from title
function extractDistrict(title) {
  if (!title) return null;
  const match = title.match(/district\s*(\d+)/i);
  return match ? match[1] : null;
}

// Filter out noise entries
function isValidOfficial(name) {
  if (!name) return false;
  const noise = [
    'contact',
    'contact us',
    'current assignments',
    'agenda center',
    'city clerk',
    'city manager',
    'city attorney',
    'staff',
    '&ntilde;',
    '&#',
    'useful links',
    'social media',
    'jan ',
    'feb ',
    'mar ',
    'apr ',
    'may ',
    'jun ',
    'jul ',
    'aug ',
    'sep ',
    'oct ',
    'nov ',
    'dec ',
    'mon,',
    'tue,',
    'wed,',
    'thu,',
    'fri,',
    'sat,',
    'sun,',
    'saratoga',
  ];
  const nameLower = name.toLowerCase();
  // Must have at least a first and last name (space in between)
  if (!name.includes(' ') || name.split(' ').filter((w) => w.length > 1).length < 2) {
    return false;
  }
  return !noise.some((n) => nameLower.includes(n)) && name.length > 4;
}

// Normalize title
function normalizeTitle(title) {
  if (!title) return 'Council Member';
  if (/mayor/i.test(title) && !/vice/i.test(title)) {
    return 'Mayor';
  } else if (/vice.*mayor/i.test(title)) {
    return 'Vice Mayor';
  } else if (/council/i.test(title)) {
    return 'Council Member';
  }
  return title;
}

// Generate Swift code
console.log('// MARK: - Generated Civic Data (CivicPlus)');
console.log('// Generated: ' + new Date().toISOString());
console.log('// Source: CivicPlus websites');
console.log('');

console.log('// MARK: - City Officials from CivicPlus');
console.log('');
console.log('// Add these to localOfficialsByCity dictionary:');
console.log('');

let totalOfficials = 0;
let citiesWithData = 0;

for (const [cityName, cityData] of Object.entries(data)) {
  if (!cityData.officials || cityData.officials.length === 0) continue;

  // Filter valid officials
  const validOfficials = cityData.officials.filter((o) => isValidOfficial(o.name));
  if (validOfficials.length === 0) continue;

  const cityKey = cityName.toLowerCase();
  citiesWithData++;

  console.log(`    "${cityKey}": [`);

  for (let i = 0; i < validOfficials.length; i++) {
    const off = validOfficials[i];
    const comma = i < validOfficials.length - 1 ? ',' : '';
    const title = normalizeTitle(off.title);
    const districtNum = extractDistrict(off.title);

    // Use local photo path if available, otherwise remote URL
    const photoUrl = off.localPhotoPath || off.photoUrl;

    console.log('        Representative(');
    console.log(`            name: "${escapeSwift(off.name)}",`);
    console.log(`            title: "${escapeSwift(title)}",`);
    console.log('            level: .local,');
    console.log('            party: nil,');
    console.log(`            phone: ${optStr(off.phone)},`);
    console.log(`            email: ${optStr(off.email)},`);
    console.log('            website: nil,');
    console.log(`            photoUrl: ${optStr(photoUrl)},`);
    console.log(`            district: ${districtNum ? `"District ${districtNum}"` : 'nil'}`);
    console.log(`        )${comma}`);
    totalOfficials++;
  }

  console.log('    ],');
}

// Summary
console.error('\n// Summary:');
console.error(`// City officials: ${totalOfficials} across ${citiesWithData} cities`);
console.error('// Cities with full data (photos, emails):');

for (const [cityName, cityData] of Object.entries(data)) {
  if (!cityData.officials) continue;
  const withPhotos = cityData.officials.filter((o) => o.localPhotoPath);
  const withEmails = cityData.officials.filter((o) => o.email);
  if (withPhotos.length > 0 || withEmails.length > 0) {
    console.error(`//   ${cityName}: ${withPhotos.length} photos, ${withEmails.length} emails`);
  }
}
