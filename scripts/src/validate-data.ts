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
 * Usage: npx ts-node scripts/src/validate-data.ts [--errors-only] [--verbose]
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type {
  YamlProgram,
  ValidationError,
  ValidationWarning,
  FileValidationResult,
  DuplicateEntry,
  ValidValues,
  SuppressedProgram,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.join(__dirname, '../../src/data');

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
  'library-resources.yml',
  'pet-resources.yml',
  'recreation.yml',
  'technology.yml',
  'transportation.yml',
  'utilities.yml',
];

// Required fields for every program
const REQUIRED_FIELDS: (keyof YamlProgram)[] = ['id', 'name', 'groups', 'link'];

// Optional but recommended fields
const RECOMMENDED_FIELDS: (keyof YamlProgram)[] = ['description', 'area'];

// ============================================================================
// Data Loading
// ============================================================================

interface GroupsYamlData {
  groups: Array<{ id: string }>;
  categories: Array<{ id: string; name: string }>;
  counties: Array<{ name: string }>;
}

function loadSuppressedIds(): Set<string> {
  const suppressedPath = path.join(DATA_DIR, 'suppressed.yml');
  if (!fs.existsSync(suppressedPath)) {
    return new Set();
  }
  const content = fs.readFileSync(suppressedPath, 'utf-8');
  const data = yaml.load(content) as SuppressedProgram[] | null;
  if (!Array.isArray(data)) {
    return new Set();
  }
  return new Set(data.map((s) => s.id));
}

function loadValidValues(): ValidValues {
  const groupsPath = path.join(DATA_DIR, 'groups.yml');
  const content = fs.readFileSync(groupsPath, 'utf-8');
  const data = yaml.load(content) as GroupsYamlData;

  const validGroups = data.groups.map((g) => g.id);
  const validCategories = data.categories.map((c) => c.name);
  const validCategoryIds = data.categories.map((c) => c.id);
  const validCounties = data.counties.map((c) => c.name);

  // Valid area values
  const validAreas = [
    ...validCounties,
    'San Francisco',
    'San Francisco County',
    'Bay Area',
    'Statewide',
    'California',
    'Nationwide',
    'National',
  ];

  return { validGroups, validCategories, validCategoryIds, validAreas };
}

// ============================================================================
// Validation Functions
// ============================================================================

function isValidUrl(urlString: string | undefined): boolean {
  if (!urlString) return true; // Optional field
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

function isValidIdFormat(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id);
}

function isValidLatitude(lat: number | undefined | null): boolean {
  if (lat === undefined || lat === null) return true;
  return typeof lat === 'number' && lat >= 36 && lat <= 39;
}

function isValidLongitude(lng: number | undefined | null): boolean {
  if (lng === undefined || lng === null) return true;
  return typeof lng === 'number' && lng >= -124 && lng <= -121;
}

function validateProgram(
  program: YamlProgram,
  validValues: ValidValues
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  // Validate ID format
  if (program.id && !isValidIdFormat(program.id)) {
    errors.push(`Invalid ID format: "${program.id}" (should be lowercase with hyphens only)`);
  }

  // Validate groups array
  if (program.groups) {
    if (!Array.isArray(program.groups)) {
      errors.push('"groups" should be an array');
    } else {
      for (const group of program.groups) {
        if (!validValues.validGroups.includes(group)) {
          errors.push(`Invalid group: "${group}"`);
        }
      }
    }
  }

  // Validate category
  if (program.category) {
    const categoryLower = program.category.toLowerCase();
    const isValidCategory =
      validValues.validCategories.includes(program.category) ||
      validValues.validCategoryIds.includes(categoryLower) ||
      validValues.validCategoryIds.includes(program.category);

    if (!isValidCategory) {
      const specialCategories = ['National Parks', 'State Parks', 'Museums', 'WiFi Hotspots'];
      if (!specialCategories.includes(program.category)) {
        warnings.push(`Unusual category: "${program.category}"`);
      }
    }
  }

  // Validate area
  if (program.area) {
    const areas = Array.isArray(program.area) ? program.area : [program.area];
    for (const area of areas) {
      if (typeof area !== 'string') {
        warnings.push(`Invalid area type: expected string, got ${typeof area}`);
      }
    }
  }

  // Validate URLs
  if (program.link && !isValidUrl(program.link)) {
    errors.push(`Invalid URL format: "${program.link}"`);
  }

  // Validate coordinates
  if (program.latitude !== undefined && program.latitude !== null) {
    if (!isValidLatitude(program.latitude)) {
      errors.push(`Invalid latitude: "${program.latitude}" (should be 36-39 for Bay Area)`);
    }
  }
  if (program.longitude !== undefined && program.longitude !== null) {
    if (!isValidLongitude(program.longitude)) {
      errors.push(
        `Invalid longitude: "${program.longitude}" (should be -124 to -121 for Bay Area)`
      );
    }
  }

  // Validate phone format
  if (program.phone) {
    const digits = program.phone.replace(/[\s\-\(\)\.]/g, '');
    if (!/^\+?\d{10,15}$/.test(digits)) {
      warnings.push(`Unusual phone format: "${program.phone}"`);
    }
  }

  // Check for empty strings
  for (const [key, value] of Object.entries(program)) {
    if (value === '') {
      warnings.push(`Empty string for "${key}" (should be omitted or null)`);
    }
  }

  return { errors, warnings };
}

function validateFile(
  filePath: string,
  validValues: ValidValues,
  allIds: Map<string, string>,
  suppressedIds: Set<string>
): FileValidationResult {
  const fileName = path.basename(filePath);
  const results: FileValidationResult = {
    file: fileName,
    programs: 0,
    errors: [],
    warnings: [],
    duplicates: [],
    skipped: 0,
  };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content);

    // Handle both array and object formats
    let programs: YamlProgram[];
    if (Array.isArray(data)) {
      programs = data;
    } else if (data && typeof data === 'object' && 'programs' in data) {
      programs = (data as { programs: YamlProgram[] }).programs || [];
    } else {
      programs = [];
    }

    if (!Array.isArray(programs)) {
      results.errors.push({ program: '', message: 'File does not contain a valid program array' });
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

      // Skip suppressed programs
      if (program.id && suppressedIds.has(program.id)) {
        results.skipped++;
        continue;
      }

      // Check for duplicates
      if (program.id) {
        const existingFile = allIds.get(program.id);
        if (existingFile) {
          results.duplicates.push({
            id: program.id,
            files: [existingFile, fileName],
          });
        } else {
          allIds.set(program.id, fileName);
        }
      }

      // Validate program
      const { errors, warnings } = validateProgram(program, validValues);

      for (const error of errors) {
        results.errors.push({ program: programId, message: error });
      }

      for (const warning of warnings) {
        results.warnings.push({ program: programId, message: warning });
      }
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    results.errors.push({ program: '', message: `Failed to parse YAML: ${errorMessage}` });
  }

  return results;
}

// ============================================================================
// Main Entry Point
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const showWarnings = !args.includes('--errors-only');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log(`${colors.bold}Bay Navigator Data Validation${colors.reset}\n`);

  // Load valid values
  let validValues: ValidValues;
  try {
    validValues = loadValidValues();
    console.log(
      `${colors.blue}✓${colors.reset} Loaded ${validValues.validGroups.length} groups, ${validValues.validCategories.length} categories`
    );
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(`${colors.red}✗${colors.reset} Failed to load groups.yml: ${errorMessage}`);
    process.exit(1);
  }

  // Load suppressed IDs
  const suppressedIds = loadSuppressedIds();
  if (suppressedIds.size > 0) {
    console.log(
      `${colors.blue}✓${colors.reset} Loaded ${suppressedIds.size} suppressed program IDs\n`
    );
  } else {
    console.log('');
  }

  const allIds = new Map<string, string>();

  let totalPrograms = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalSkipped = 0;

  const allResults: FileValidationResult[] = [];

  // Validate each file
  for (const fileName of PROGRAM_DATA_FILES) {
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`${colors.yellow}⚠${colors.reset} File not found: ${fileName}`);
      continue;
    }

    const results = validateFile(filePath, validValues, allIds, suppressedIds);
    allResults.push(results);

    totalPrograms += results.programs;
    totalErrors += results.errors.length;
    totalWarnings += results.warnings.length;
    totalSkipped += results.skipped;

    // Print file results
    const hasIssues = results.errors.length > 0 || (showWarnings && results.warnings.length > 0);
    const icon =
      results.errors.length > 0
        ? `${colors.red}✗`
        : results.warnings.length > 0
          ? `${colors.yellow}⚠`
          : `${colors.green}✓`;

    console.log(`${icon}${colors.reset} ${fileName}: ${results.programs} programs`);

    if (verbose || hasIssues) {
      for (const error of results.errors) {
        console.log(`  ${colors.red}ERROR${colors.reset} [${error.program}]: ${error.message}`);
      }

      if (showWarnings) {
        for (const warning of results.warnings) {
          console.log(
            `  ${colors.yellow}WARN${colors.reset}  [${warning.program}]: ${warning.message}`
          );
        }
      }
    }
  }

  // Collect cross-file duplicates
  const duplicatesFound: DuplicateEntry[] = [];
  for (const results of allResults) {
    for (const dup of results.duplicates) {
      if (!duplicatesFound.some((d) => d.id === dup.id)) {
        duplicatesFound.push(dup);
      }
    }
  }

  // Print summary
  console.log(`\n${colors.bold}Summary${colors.reset}`);
  console.log('─────────────────────────────');
  console.log(`Total programs: ${totalPrograms}`);
  if (totalSkipped > 0) {
    console.log(`Skipped:        ${colors.blue}${totalSkipped}${colors.reset} (suppressed)`);
  }
  console.log(
    `Errors:         ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`
  );
  console.log(
    `Warnings:       ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}`
  );
  console.log(
    `Duplicates:     ${duplicatesFound.length > 0 ? colors.red : colors.green}${duplicatesFound.length}${colors.reset}`
  );

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
