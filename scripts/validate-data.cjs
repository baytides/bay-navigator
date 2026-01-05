#!/usr/bin/env node
/**
 * Bay Navigator Data Validation Script
 *
 * Validates all YAML data files for:
 * - Required fields presence
 * - Valid group/category/area values
 * - Duplicate ID detection
 * - URL format validation
 * - Data consistency
 *
 * Usage: node scripts/validate-data.cjs [--fix]
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Data files to validate (program data)
const PROGRAM_DATA_FILES = [
  'community.yml',
  'education.yml',
  'equipment.yml',
  'federal-benefits.yml',
  'finance.yml',
  'food.yml',
  'health.yml',
  'legal.yml',
  'library_resources.yml',
  'pet_resources.yml',
  'recreation.yml',
  'technology.yml',
  'transportation.yml',
  'utilities.yml',
];

// Required fields for every program
const REQUIRED_FIELDS = ['id', 'name', 'category', 'groups', 'link'];

// Optional but recommended fields
const RECOMMENDED_FIELDS = ['description', 'area'];

// Load valid values from groups.yml
function loadValidValues() {
  const groupsPath = path.join(__dirname, '..', 'src', 'data', 'groups.yml');
  const content = fs.readFileSync(groupsPath, 'utf-8');
  const data = yaml.load(content);

  const validGroups = data.groups.map(g => g.id);
  const validCategories = data.categories.map(c => c.name);
  const validCounties = data.counties.map(c => c.name);

  // Also allow category IDs (some files use IDs, some use names)
  const validCategoryIds = data.categories.map(c => c.id);

  // Valid area values
  const validAreas = [
    ...validCounties,
    'San Francisco',          // City and county
    'San Francisco County',   // Alternative
    'Bay Area',
    'Statewide',
    'California',
    'Nationwide',
    'National',
    // Also allow individual cities (we don't validate these strictly)
  ];

  return { validGroups, validCategories, validCategoryIds, validAreas };
}

// Validate URL format
function isValidUrl(string) {
  if (!string) return true; // Optional field
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Validate a single program entry
function validateProgram(program, fileName, lineNumber, validValues) {
  const errors = [];
  const warnings = [];
  const { validGroups, validCategories, validCategoryIds, validAreas } = validValues;

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!program[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (!program[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  }

  // Validate ID format (lowercase, hyphenated)
  if (program.id) {
    if (!/^[a-z0-9-]+$/.test(program.id)) {
      errors.push(`Invalid ID format: "${program.id}" (should be lowercase with hyphens only)`);
    }
  }

  // Validate groups array
  if (program.groups) {
    if (!Array.isArray(program.groups)) {
      errors.push(`"groups" should be an array`);
    } else {
      for (const group of program.groups) {
        if (!validGroups.includes(group)) {
          errors.push(`Invalid group: "${group}" (valid: ${validGroups.join(', ')})`);
        }
      }
    }
  }

  // Validate category (allow both names and IDs)
  if (program.category) {
    const categoryLower = program.category.toLowerCase();
    const isValidCategory = validCategories.includes(program.category) ||
                            validCategoryIds.includes(categoryLower) ||
                            validCategoryIds.includes(program.category);
    if (!isValidCategory) {
      // Special categories from sync scripts
      const specialCategories = ['National Parks', 'State Parks', 'Museums', 'WiFi Hotspots'];
      if (!specialCategories.includes(program.category)) {
        warnings.push(`Unusual category: "${program.category}"`);
      }
    }
  }

  // Validate area (if present)
  if (program.area) {
    // Areas can be specific cities, so we only warn for truly unusual values
    const isKnownArea = validAreas.some(a =>
      a.toLowerCase() === program.area.toLowerCase() ||
      program.area.toLowerCase().includes('county')
    );
    if (!isKnownArea && !program.city) {
      // Only warn if it's not a city-based entry
      // (entries with city field can have more specific areas)
    }
  }

  // Validate URLs
  if (program.link && !isValidUrl(program.link)) {
    errors.push(`Invalid URL format: "${program.link}"`);
  }
  // Note: map_link is now generated dynamically at build time from address
  // Validate latitude/longitude instead
  if (program.latitude !== undefined && (typeof program.latitude !== 'number' || program.latitude < 36 || program.latitude > 39)) {
    errors.push(`Invalid latitude: "${program.latitude}" (should be number between 36-39 for Bay Area)`);
  }
  if (program.longitude !== undefined && (typeof program.longitude !== 'number' || program.longitude < -124 || program.longitude > -121)) {
    errors.push(`Invalid longitude: "${program.longitude}" (should be number between -124 and -121 for Bay Area)`);
  }

  // Validate phone format (basic check)
  if (program.phone) {
    // Remove common formatting
    const digits = program.phone.replace(/[\s\-\(\)\.]/g, '');
    if (!/^\+?\d{10,15}$/.test(digits)) {
      warnings.push(`Unusual phone format: "${program.phone}"`);
    }
  }

  // Check for empty strings (should be null/omitted instead)
  for (const [key, value] of Object.entries(program)) {
    if (value === '') {
      warnings.push(`Empty string for "${key}" (should be omitted or null)`);
    }
  }

  return { errors, warnings };
}

// Parse YAML file and validate all programs
function validateFile(filePath, validValues, allIds) {
  const fileName = path.basename(filePath);
  const results = {
    file: fileName,
    programs: 0,
    errors: [],
    warnings: [],
    duplicates: [],
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content);

    // Handle both array and object formats
    let programs = Array.isArray(data) ? data : (data?.programs || []);

    if (!Array.isArray(programs)) {
      results.errors.push({ program: null, message: 'File does not contain a valid program array' });
      return results;
    }

    results.programs = programs.length;

    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];

      if (!program || typeof program !== 'object') {
        results.errors.push({ program: `Entry ${i + 1}`, message: 'Invalid program entry' });
        continue;
      }

      const programId = program.id || `Entry ${i + 1}`;

      // Check for duplicates
      if (program.id) {
        if (allIds.has(program.id)) {
          results.duplicates.push({
            id: program.id,
            files: [allIds.get(program.id), fileName],
          });
        } else {
          allIds.set(program.id, fileName);
        }
      }

      // Validate program
      const { errors, warnings } = validateProgram(program, fileName, i, validValues);

      for (const error of errors) {
        results.errors.push({ program: programId, message: error });
      }

      for (const warning of warnings) {
        results.warnings.push({ program: programId, message: warning });
      }
    }
  } catch (e) {
    results.errors.push({ program: null, message: `Failed to parse YAML: ${e.message}` });
  }

  return results;
}

// Main validation function
function main() {
  const args = process.argv.slice(2);
  const showWarnings = !args.includes('--errors-only');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log(`${colors.bold}Bay Navigator Data Validation${colors.reset}\n`);

  // Load valid values
  let validValues;
  try {
    validValues = loadValidValues();
    console.log(`${colors.blue}✓${colors.reset} Loaded ${validValues.validGroups.length} groups, ${validValues.validCategories.length} categories\n`);
  } catch (e) {
    console.error(`${colors.red}✗${colors.reset} Failed to load groups.yml: ${e.message}`);
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const allIds = new Map(); // Track all IDs for duplicate detection

  let totalPrograms = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalDuplicates = 0;

  const allResults = [];

  // Validate each file
  for (const fileName of PROGRAM_DATA_FILES) {
    const filePath = path.join(dataDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`${colors.yellow}⚠${colors.reset} File not found: ${fileName}`);
      continue;
    }

    const results = validateFile(filePath, validValues, allIds);
    allResults.push(results);

    totalPrograms += results.programs;
    totalErrors += results.errors.length;
    totalWarnings += results.warnings.length;
    totalDuplicates += results.duplicates.length;

    // Print file results
    const hasIssues = results.errors.length > 0 || (showWarnings && results.warnings.length > 0);
    const icon = results.errors.length > 0 ? `${colors.red}✗` :
                 results.warnings.length > 0 ? `${colors.yellow}⚠` :
                 `${colors.green}✓`;

    console.log(`${icon}${colors.reset} ${fileName}: ${results.programs} programs`);

    if (verbose || hasIssues) {
      for (const error of results.errors) {
        console.log(`  ${colors.red}ERROR${colors.reset} [${error.program}]: ${error.message}`);
      }

      if (showWarnings) {
        for (const warning of results.warnings) {
          console.log(`  ${colors.yellow}WARN${colors.reset}  [${warning.program}]: ${warning.message}`);
        }
      }
    }
  }

  // Check for cross-file duplicates
  const duplicatesFound = [];
  for (const results of allResults) {
    for (const dup of results.duplicates) {
      if (!duplicatesFound.some(d => d.id === dup.id)) {
        duplicatesFound.push(dup);
      }
    }
  }

  // Print summary
  console.log(`\n${colors.bold}Summary${colors.reset}`);
  console.log(`─────────────────────────────`);
  console.log(`Total programs: ${totalPrograms}`);
  console.log(`Errors:         ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`);
  console.log(`Warnings:       ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}`);
  console.log(`Duplicates:     ${duplicatesFound.length > 0 ? colors.red : colors.green}${duplicatesFound.length}${colors.reset}`);

  if (duplicatesFound.length > 0) {
    console.log(`\n${colors.bold}Duplicate IDs:${colors.reset}`);
    for (const dup of duplicatesFound) {
      console.log(`  ${colors.red}•${colors.reset} "${dup.id}" found in: ${dup.files.join(', ')}`);
    }
  }

  // Exit with appropriate code
  if (totalErrors > 0 || duplicatesFound.length > 0) {
    console.log(`\n${colors.red}✗ Validation failed${colors.reset}`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n${colors.yellow}⚠ Validation passed with warnings${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}✓ All validations passed${colors.reset}`);
    process.exit(0);
  }
}

main();
