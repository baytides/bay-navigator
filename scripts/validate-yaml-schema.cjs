#!/usr/bin/env node
/**
 * YAML Schema Validation Script
 * Validates program data files against a defined schema
 * Run: node scripts/validate-yaml-schema.cjs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Schema definition for programs
const programSchema = {
  required: ['name', 'category', 'area'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    category: { type: 'string', minLength: 1 },
    area: { type: ['string', 'array'], minLength: 1 },
    eligibility: { type: 'string' },
    what_they_offer: { type: 'string' },
    how_to_get_it: { type: 'string' },
    link: { type: 'string', pattern: '^https?://' },
    link_text: { type: 'string' },
    phone: { type: 'string' },
    address: { type: 'string' },
    city: { type: 'string' },
    groups: { type: 'array', items: { type: 'string' } },
    verified_by: { type: 'string' },
    verified_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    latitude: { type: 'number' },
    longitude: { type: 'number' },
    amenities: { type: 'array' },
    fee_info: { type: 'string' },
  },
};

// Files that are not program data
const NON_PROGRAM_FILES = [
  'search-config.yml',
  'site-config.yml',
  'county-supervisors.yml',
  'cities.yml',
  'groups.yml',
  'zipcodes.yml',
  'suppressed.yml',
];

// Validation functions
function validateType(value, expectedType) {
  // Handle array of allowed types
  if (Array.isArray(expectedType)) {
    return expectedType.some(t => validateType(value, t));
  }
  if (expectedType === 'string') return typeof value === 'string';
  if (expectedType === 'number') return typeof value === 'number';
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'boolean') return typeof value === 'boolean';
  return true;
}

function validateProgram(program, index, filename) {
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const field of programSchema.required) {
    if (!program[field] || (typeof program[field] === 'string' && !program[field].trim())) {
      errors.push(`Program #${index + 1}: Missing required field '${field}'`);
    }
  }

  // Validate field types and patterns
  for (const [field, rules] of Object.entries(programSchema.properties)) {
    const value = program[field];
    if (value === undefined || value === null) continue;

    // Type check
    if (rules.type && !validateType(value, rules.type)) {
      errors.push(`Program #${index + 1} (${program.name || 'unnamed'}): Field '${field}' should be ${rules.type}, got ${typeof value}`);
    }

    // Min length check
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push(`Program #${index + 1} (${program.name || 'unnamed'}): Field '${field}' is too short`);
    }

    // Pattern check
    if (rules.pattern && typeof value === 'string') {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        if (field === 'link') {
          errors.push(`Program #${index + 1} (${program.name || 'unnamed'}): Invalid URL in '${field}': ${value}`);
        } else if (field === 'verified_date') {
          warnings.push(`Program #${index + 1} (${program.name || 'unnamed'}): Invalid date format in '${field}': ${value} (expected YYYY-MM-DD)`);
        }
      }
    }
  }

  // Additional validation rules
  if (program.link && !program.link.startsWith('http')) {
    errors.push(`Program #${index + 1} (${program.name || 'unnamed'}): Link must start with http:// or https://`);
  }

  // Check for data completeness (warnings only)
  if (!program.description && !program.what_they_offer) {
    warnings.push(`Program #${index + 1} (${program.name || 'unnamed'}): Missing description or what_they_offer`);
  }

  if (!program.link) {
    warnings.push(`Program #${index + 1} (${program.name || 'unnamed'}): Missing link`);
  }

  return { errors, warnings };
}

function validateFile(filePath) {
  const filename = path.basename(filePath);

  // Skip non-program files
  if (NON_PROGRAM_FILES.includes(filename)) {
    return { errors: [], warnings: [], skipped: true };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let data;

  try {
    data = yaml.load(content);
  } catch (e) {
    return { errors: [`Failed to parse YAML: ${e.message}`], warnings: [], skipped: false };
  }

  if (!Array.isArray(data)) {
    return { errors: [], warnings: [], skipped: true }; // Not a program file
  }

  const allErrors = [];
  const allWarnings = [];

  data.forEach((program, index) => {
    const { errors, warnings } = validateProgram(program, index, filename);
    allErrors.push(...errors.map(e => `${filename}: ${e}`));
    allWarnings.push(...warnings.map(w => `${filename}: ${w}`));
  });

  return { errors: allErrors, warnings: allWarnings, skipped: false, count: data.length };
}

// Main execution
function main() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  console.log('🔍 Validating YAML program data...\n');

  let totalErrors = [];
  let totalWarnings = [];
  let totalPrograms = 0;
  let validatedFiles = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const { errors, warnings, skipped, count } = validateFile(filePath);

    if (skipped) {
      console.log(`⏭️  Skipped: ${file}`);
      continue;
    }

    validatedFiles++;
    if (count) totalPrograms += count;
    totalErrors.push(...errors);
    totalWarnings.push(...warnings);

    if (errors.length === 0) {
      console.log(`✅ ${file} (${count || 0} programs)`);
    } else {
      console.log(`❌ ${file} (${errors.length} errors)`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary: ${validatedFiles} files, ${totalPrograms} programs\n`);

  if (totalErrors.length > 0) {
    console.log(`❌ ${totalErrors.length} Error(s):`);
    totalErrors.forEach(e => console.log(`   - ${e}`));
    console.log('');
  }

  if (totalWarnings.length > 0) {
    console.log(`⚠️  ${totalWarnings.length} Warning(s):`);
    totalWarnings.slice(0, 10).forEach(w => console.log(`   - ${w}`));
    if (totalWarnings.length > 10) {
      console.log(`   ... and ${totalWarnings.length - 10} more warnings`);
    }
    console.log('');
  }

  if (totalErrors.length === 0) {
    console.log('✅ All program data is valid!\n');
    process.exit(0);
  } else {
    console.log('❌ Validation failed. Please fix the errors above.\n');
    process.exit(1);
  }
}

main();
