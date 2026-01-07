#!/usr/bin/env node
/**
 * Bay Navigator CI Gate Script
 *
 * Single authoritative gate command for CI/CD pipelines.
 * Runs all critical validations that must pass before deploy.
 *
 * Usage: node scripts/verify-gate.cjs
 *
 * Exit codes:
 *   0 - All gates passed
 *   1 - Gate failed
 */

const { execSync, spawnSync } = require('child_process');
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

const gates = [];
let failed = false;

function runGate(name, fn) {
  process.stdout.write(`${colors.blue}⏳${colors.reset} ${name}... `);
  const start = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - start;
    if (result.passed) {
      console.log(`${colors.green}✓${colors.reset} (${duration}ms)`);
      if (result.message) {
        console.log(`   ${colors.blue}ℹ${colors.reset} ${result.message}`);
      }
      gates.push({ name, passed: true, duration });
    } else {
      console.log(`${colors.red}✗${colors.reset} (${duration}ms)`);
      console.log(`   ${colors.red}Error:${colors.reset} ${result.message}`);
      gates.push({ name, passed: false, duration, error: result.message });
      failed = true;
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`${colors.red}✗${colors.reset} (${duration}ms)`);
    console.log(`   ${colors.red}Error:${colors.reset} ${err.message}`);
    gates.push({ name, passed: false, duration, error: err.message });
    failed = true;
  }
}

console.log(`\n${colors.bold}Bay Navigator CI Gate${colors.reset}`);
console.log('═'.repeat(50) + '\n');

// Gate 1: YAML data validation
runGate('Validate YAML data', () => {
  const result = spawnSync('node', ['scripts/validate-data.cjs', '--errors-only'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    return { passed: false, message: 'Data validation failed' };
  }
  return { passed: true };
});

// Gate 2: Generate API and check totalPrograms > 0
runGate('Generate API files', () => {
  const result = spawnSync('node', ['scripts/generate-api.cjs'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    return { passed: false, message: 'API generation failed' };
  }
  return { passed: true };
});

// Gate 3: Validate API metadata
runGate('Validate API metadata', () => {
  const metadataPath = path.join(__dirname, '..', 'public', 'api', 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return { passed: false, message: 'metadata.json not found' };
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  if (!metadata.totalPrograms || metadata.totalPrograms === 0) {
    return { passed: false, message: 'totalPrograms is 0 or missing - catastrophic data loss detected' };
  }

  if (metadata.totalPrograms < 100) {
    return { passed: false, message: `totalPrograms is only ${metadata.totalPrograms} - expected at least 100` };
  }

  return { passed: true, message: `${metadata.totalPrograms} programs` };
});

// Gate 4: Validate API schema
runGate('Validate API schema', () => {
  const schemaDir = path.join(__dirname, '..', 'schemas');
  const apiDir = path.join(__dirname, '..', 'public', 'api');

  // Check if schemas exist
  if (!fs.existsSync(schemaDir)) {
    return { passed: true, message: 'No schemas directory (skipped)' };
  }

  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.schema.json'));
  if (schemaFiles.length === 0) {
    return { passed: true, message: 'No schema files (skipped)' };
  }

  // Validate each API file against its schema
  const errors = [];
  for (const schemaFile of schemaFiles) {
    const apiFile = schemaFile.replace('.schema.json', '.json');
    const apiPath = path.join(apiDir, apiFile);

    if (!fs.existsSync(apiPath)) {
      continue; // API file not required if schema exists
    }

    const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, schemaFile), 'utf-8'));
    const data = JSON.parse(fs.readFileSync(apiPath, 'utf-8'));

    // Basic schema validation (check required fields)
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`${apiFile}: missing required field "${field}"`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { passed: false, message: errors.join(', ') };
  }

  return { passed: true, message: `${schemaFiles.length} schemas validated` };
});

// Gate 5: Build site
runGate('Build Astro site', () => {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    env: { ...process.env, CI: 'true' },
  });
  if (result.status !== 0) {
    const errorOutput = result.stderr || result.stdout || 'Unknown error';
    return { passed: false, message: `Build failed: ${errorOutput.slice(0, 200)}` };
  }
  return { passed: true };
});

// Gate 6: Check for duplicate program IDs
runGate('Check for duplicate IDs', () => {
  const result = spawnSync('node', ['scripts/check-duplicates.cjs'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    return { passed: false, message: 'Duplicate program IDs found' };
  }
  return { passed: true };
});

// Gate 7: Verify GeoJSON generation (if applicable)
runGate('Generate GeoJSON', () => {
  const geojsonScript = path.join(__dirname, 'generate-geojson.cjs');
  if (!fs.existsSync(geojsonScript)) {
    return { passed: true, message: 'Script not found (skipped)' };
  }

  const result = spawnSync('node', ['scripts/generate-geojson.cjs'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    return { passed: false, message: 'GeoJSON generation failed' };
  }

  // Verify output exists and has features
  const geojsonPath = path.join(__dirname, '..', 'public', 'api', 'programs.geojson');
  if (fs.existsSync(geojsonPath)) {
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
    if (!geojson.features || geojson.features.length === 0) {
      return { passed: false, message: 'GeoJSON has no features' };
    }
    return { passed: true, message: `${geojson.features.length} map features` };
  }

  return { passed: true };
});

// Print summary
console.log('\n' + '═'.repeat(50));
console.log(`${colors.bold}Summary${colors.reset}\n`);

const passed = gates.filter(g => g.passed).length;
const total = gates.length;
const totalDuration = gates.reduce((acc, g) => acc + g.duration, 0);

console.log(`Gates: ${passed}/${total} passed`);
console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`);

if (failed) {
  console.log(`\n${colors.red}${colors.bold}✗ CI Gate Failed${colors.reset}`);
  console.log('\nFailed gates:');
  for (const gate of gates.filter(g => !g.passed)) {
    console.log(`  ${colors.red}•${colors.reset} ${gate.name}: ${gate.error}`);
  }
  process.exit(1);
} else {
  console.log(`\n${colors.green}${colors.bold}✓ All CI Gates Passed${colors.reset}`);
  process.exit(0);
}
