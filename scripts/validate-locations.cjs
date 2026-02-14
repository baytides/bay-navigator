#!/usr/bin/env node
/**
 * validate-locations.cjs
 *
 * Validates that all program YAML files have:
 *   - `area` values from the controlled vocabulary
 *   - `counties` arrays with valid county IDs from groups.yml
 *   - `city` values that exist in cities.yml
 *   - `impact` field with valid values (high/medium/low)
 *
 * Usage:
 *   node scripts/validate-locations.cjs
 *
 * Exit code 0 = all valid, 1 = errors found
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Program YAML files to validate
const PROGRAM_FILES = [
  'community.yml',
  'education.yml',
  'employment.yml',
  'equipment.yml',
  'federal-benefits.yml',
  'finance.yml',
  'food.yml',
  'health.yml',
  'housing.yml',
  'legal.yml',
  'lgbtq.yml',
  'library_resources.yml',
  'pet_resources.yml',
  'recreation.yml',
  'retail.yml',
  'safety.yml',
  'technology.yml',
  'transportation.yml',
  'utilities.yml',
];

// ─── Load canonical data ──────────────────────────────────────────────────────

function loadValidCountyIds() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'groups.yml'), 'utf8');
  const data = YAML.parse(raw);
  const ids = new Set(data.counties.map((c) => c.id));
  ids.add('all'); // special value for broad-scope programs
  return ids;
}

function loadValidCountyNames() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'groups.yml'), 'utf8');
  const data = YAML.parse(raw);
  return new Set(data.counties.map((c) => c.name));
}

function loadValidCityNames() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'cities.yml'), 'utf8');
  const cities = YAML.parse(raw);
  return new Set(cities.map((c) => c.name));
}

const validCountyIds = loadValidCountyIds();
const validCountyNames = loadValidCountyNames();
const validCityNames = loadValidCityNames();

// Valid area values
const VALID_AREAS = new Set(['Nationwide', 'Statewide', 'Bay Area', ...validCountyNames]);

const VALID_IMPACTS = new Set(['high', 'medium', 'low']);

// ─── Validate ─────────────────────────────────────────────────────────────────

function validateFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return { file: filename, skipped: true };

  const raw = fs.readFileSync(filepath, 'utf8');
  const programs = YAML.parse(raw);

  if (!Array.isArray(programs)) {
    return { file: filename, skipped: true, reason: 'Not an array' };
  }

  const errors = [];
  const warnings = [];

  for (const program of programs) {
    if (!program || !program.id) continue;
    const pid = program.id;

    // Validate area
    if (program.area && typeof program.area === 'string') {
      if (!VALID_AREAS.has(program.area)) {
        // Allow Monterey County and other out-of-area values as warnings
        warnings.push(`${pid}: area "${program.area}" not in controlled vocabulary`);
      }
    } else if (!program.area) {
      warnings.push(`${pid}: missing area field`);
    }

    // Validate counties
    if (!program.counties) {
      errors.push(`${pid}: missing counties field`);
    } else if (!Array.isArray(program.counties)) {
      errors.push(`${pid}: counties must be an array, got ${typeof program.counties}`);
    } else {
      for (const cid of program.counties) {
        if (!validCountyIds.has(cid)) {
          errors.push(
            `${pid}: invalid county ID "${cid}" — valid: ${[...validCountyIds].join(', ')}`
          );
        }
      }
    }

    // Validate city (if present)
    if (program.city && typeof program.city === 'string') {
      if (!validCityNames.has(program.city)) {
        warnings.push(`${pid}: city "${program.city}" not in cities.yml`);
      }
    }

    // Validate impact
    if (!program.impact) {
      errors.push(`${pid}: missing impact field`);
    } else if (!VALID_IMPACTS.has(program.impact)) {
      errors.push(`${pid}: invalid impact "${program.impact}" — valid: high, medium, low`);
    }
  }

  return { file: filename, count: programs.length, errors, warnings };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\nValidating location fields in program YAML files...\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalPrograms = 0;

  for (const filename of PROGRAM_FILES) {
    const result = validateFile(filename);
    if (result.skipped) {
      console.log(`SKIP ${filename}${result.reason ? ': ' + result.reason : ''}`);
      continue;
    }

    totalPrograms += result.count;
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log(`${filename} (${result.count} programs):`);
      for (const e of result.errors) console.log(`  ERROR: ${e}`);
      for (const w of result.warnings) console.log(`  WARN:  ${w}`);
    } else {
      console.log(`OK ${filename} (${result.count} programs)`);
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Programs: ${totalPrograms}`);
  console.log(`  Errors:   ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log(`\nValidation FAILED with ${totalErrors} error(s).\n`);
    process.exit(1);
  } else {
    console.log(`\nValidation PASSED.\n`);
    process.exit(0);
  }
}

main();
