#!/usr/bin/env node
/**
 * Bay Navigator API Schema Validation
 *
 * Validates generated API files against JSON schemas.
 *
 * Usage: node scripts/validate-schemas.cjs
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');
const API_DIR = path.join(__dirname, '..', 'public', 'api');

console.log(`${colors.bold}Bay Navigator Schema Validation${colors.reset}\n`);

// Simple schema validator (subset of JSON Schema draft-07)
function validateAgainstSchema(data, schema, path = '') {
  const errors = [];

  // Check type
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;

    if (!types.includes(actualType)) {
      errors.push(`${path}: expected ${types.join(' or ')}, got ${actualType}`);
      return errors; // Can't continue if type is wrong
    }
  }

  // Check required fields
  if (schema.required && typeof data === 'object' && data !== null) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`${path}: missing required field "${field}"`);
      }
    }
  }

  // Check minimum (for integers)
  if (schema.minimum !== undefined && typeof data === 'number') {
    if (data < schema.minimum) {
      errors.push(`${path}: value ${data} is less than minimum ${schema.minimum}`);
    }
  }

  // Check minLength (for strings)
  if (schema.minLength !== undefined && typeof data === 'string') {
    if (data.length < schema.minLength) {
      errors.push(`${path}: string length ${data.length} is less than minLength ${schema.minLength}`);
    }
  }

  // Check pattern (for strings)
  if (schema.pattern && typeof data === 'string') {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(data)) {
      errors.push(`${path}: value "${data}" does not match pattern ${schema.pattern}`);
    }
  }

  // Check enum
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: value "${data}" is not one of [${schema.enum.join(', ')}]`);
  }

  // Check object properties
  if (schema.properties && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        const propErrors = validateAgainstSchema(data[key], propSchema, `${path}.${key}`);
        errors.push(...propErrors);
      }
    }
  }

  // Check array items
  if (schema.items && Array.isArray(data)) {
    // Only validate first few items to avoid huge output
    const itemsToCheck = Math.min(data.length, 5);
    for (let i = 0; i < itemsToCheck; i++) {
      const itemSchema = schema.items.$ref
        ? resolveRef(schema.items.$ref, schema)
        : schema.items;
      const itemErrors = validateAgainstSchema(data[i], itemSchema, `${path}[${i}]`);
      errors.push(...itemErrors);
    }
  }

  return errors;
}

// Resolve $ref in schema (simplified - only handles local definitions)
function resolveRef(ref, rootSchema) {
  if (ref.startsWith('#/definitions/')) {
    const defName = ref.replace('#/definitions/', '');
    return rootSchema.definitions?.[defName] || {};
  }
  return {};
}

// Validate all API files
let totalErrors = 0;
let filesValidated = 0;

const schemaFiles = fs.readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));

for (const schemaFile of schemaFiles) {
  const apiFile = schemaFile.replace('.schema.json', '.json');
  const apiPath = path.join(API_DIR, apiFile);
  const schemaPath = path.join(SCHEMAS_DIR, schemaFile);

  if (!fs.existsSync(apiPath)) {
    console.log(`${colors.yellow}⚠${colors.reset} ${apiFile}: not found (skipped)`);
    continue;
  }

  try {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const data = JSON.parse(fs.readFileSync(apiPath, 'utf-8'));

    const errors = validateAgainstSchema(data, schema, apiFile);

    if (errors.length > 0) {
      console.log(`${colors.red}✗${colors.reset} ${apiFile}: ${errors.length} errors`);
      for (const error of errors.slice(0, 5)) {
        console.log(`  ${colors.red}•${colors.reset} ${error}`);
      }
      if (errors.length > 5) {
        console.log(`  ${colors.dim}... and ${errors.length - 5} more${colors.reset}`);
      }
      totalErrors += errors.length;
    } else {
      console.log(`${colors.green}✓${colors.reset} ${apiFile}: valid`);
    }
    filesValidated++;
  } catch (err) {
    console.log(`${colors.red}✗${colors.reset} ${apiFile}: ${err.message}`);
    totalErrors++;
  }
}

// Summary
console.log(`\n${colors.bold}Summary${colors.reset}`);
console.log(`─────────────────────────────`);
console.log(`Files validated: ${filesValidated}`);
console.log(`Total errors: ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`);

if (totalErrors > 0) {
  console.log(`\n${colors.red}✗ Schema validation failed${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}✓ All schemas valid${colors.reset}`);
  process.exit(0);
}
