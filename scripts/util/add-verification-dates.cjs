#!/usr/bin/env node
/**
 * Add verification dates to programs that were verified
 * Based on verification-results.json
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../../src/data');
const RESULTS_FILE = path.join(__dirname, '../../verification-results.json');

// Load verification results
const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

// Get all verified programs (including those that got 403 but we manually verified)
const verifiedIds = new Set([
  ...results.verified.map((p) => p.id),
  ...results.redirected.map((p) => p.id),
  // Manually verified (got 403 from bot check but work for humans)
  'imls-museo-italo-americano',
  'imls-u-s-army-corps-of-engineers-bay-model-visitor-cent',
]);

// Current date in YYYY-MM format
const verificationDate = '2026-01';

// Group by file
const byFile = {};
for (const program of [...results.verified, ...results.redirected, ...results.failed]) {
  if (!byFile[program.file]) {
    byFile[program.file] = [];
  }
  byFile[program.file].push(program.id);
}

console.log(`📝 Adding verification dates for ${verifiedIds.size} programs\n`);

let totalUpdated = 0;

for (const [file, ids] of Object.entries(byFile)) {
  const filePath = path.join(DATA_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const programs = yaml.load(content) || [];

  let updated = 0;
  for (const program of programs) {
    if (verifiedIds.has(program.id) && !program.verified_date) {
      program.verified_date = verificationDate;
      updated++;
    }
  }

  if (updated > 0) {
    fs.writeFileSync(
      filePath,
      yaml.dump(programs, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
      })
    );
    console.log(`✅ ${file}: Updated ${updated} programs`);
    totalUpdated += updated;
  }
}

console.log(
  `\n📊 Total: ${totalUpdated} programs updated with verification date ${verificationDate}`
);
