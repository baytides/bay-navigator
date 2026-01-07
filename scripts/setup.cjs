#!/usr/bin/env node
/**
 * Bay Navigator Development Setup Script
 *
 * One-command bootstrap for new contributors.
 * Checks prerequisites, installs dependencies, and validates setup.
 *
 * Usage: npm run setup
 *        node scripts/setup.cjs
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
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

console.log(`
${colors.cyan}${colors.bold}╔══════════════════════════════════════════════╗
║        Bay Navigator Development Setup       ║
╚══════════════════════════════════════════════╝${colors.reset}
`);

let hasErrors = false;
let hasWarnings = false;

function check(name, fn) {
  process.stdout.write(`${colors.blue}○${colors.reset} ${name}... `);
  try {
    const result = fn();
    if (result.status === 'ok') {
      console.log(`${colors.green}✓${colors.reset}${result.version ? ` ${colors.dim}(${result.version})${colors.reset}` : ''}`);
    } else if (result.status === 'warning') {
      console.log(`${colors.yellow}⚠${colors.reset} ${result.message}`);
      hasWarnings = true;
    } else {
      console.log(`${colors.red}✗${colors.reset} ${result.message}`);
      hasErrors = true;
    }
    return result;
  } catch (err) {
    console.log(`${colors.red}✗${colors.reset} ${err.message}`);
    hasErrors = true;
    return { status: 'error', message: err.message };
  }
}

function run(name, command, args = []) {
  console.log(`\n${colors.blue}▶${colors.reset} ${name}`);
  const result = spawnSync(command, args, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.log(`${colors.red}  Failed with exit code ${result.status}${colors.reset}`);
    hasErrors = true;
    return false;
  }
  return true;
}

// Step 1: Check prerequisites
console.log(`${colors.bold}Step 1: Checking prerequisites${colors.reset}\n`);

check('Node.js', () => {
  const result = spawnSync('node', ['--version'], { encoding: 'utf-8' });
  if (result.status !== 0) {
    return { status: 'error', message: 'Node.js not found - install from https://nodejs.org' };
  }
  const version = result.stdout.trim();
  const major = parseInt(version.replace('v', '').split('.')[0], 10);
  if (major < 18) {
    return { status: 'error', message: `Node.js ${version} too old - need v18+ (recommended: v22)` };
  }
  if (major < 22) {
    return { status: 'warning', message: `${version} works but v22 recommended` };
  }
  return { status: 'ok', version };
});

check('npm', () => {
  const result = spawnSync('npm', ['--version'], { encoding: 'utf-8' });
  if (result.status !== 0) {
    return { status: 'error', message: 'npm not found' };
  }
  return { status: 'ok', version: `v${result.stdout.trim()}` };
});

check('Git', () => {
  const result = spawnSync('git', ['--version'], { encoding: 'utf-8' });
  if (result.status !== 0) {
    return { status: 'error', message: 'Git not found - install from https://git-scm.com' };
  }
  return { status: 'ok', version: result.stdout.trim().replace('git version ', '') };
});

// Step 2: Check project structure
console.log(`\n${colors.bold}Step 2: Verifying project structure${colors.reset}\n`);

check('package.json', () => {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { status: 'error', message: 'package.json not found - are you in the project root?' };
  }
  return { status: 'ok' };
});

check('Source data (src/data)', () => {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    return { status: 'error', message: 'src/data directory not found' };
  }
  const yamlFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.yml'));
  if (yamlFiles.length < 5) {
    return { status: 'warning', message: `Only ${yamlFiles.length} YAML files found` };
  }
  return { status: 'ok', version: `${yamlFiles.length} YAML files` };
});

check('Astro config', () => {
  const configPath = path.join(__dirname, '..', 'astro.config.mjs');
  if (!fs.existsSync(configPath)) {
    return { status: 'error', message: 'astro.config.mjs not found' };
  }
  return { status: 'ok' };
});

// Step 3: Install dependencies
console.log(`\n${colors.bold}Step 3: Installing dependencies${colors.reset}`);

if (!run('npm install', 'npm', ['ci', '--silent'])) {
  if (!run('npm install (clean)', 'npm', ['install'])) {
    console.log(`${colors.red}Failed to install dependencies${colors.reset}`);
  }
}

// Step 4: Generate API files
console.log(`\n${colors.bold}Step 4: Generating API files${colors.reset}`);

run('Generate API', 'node', ['scripts/generate-api.cjs']);
run('Generate GeoJSON', 'node', ['scripts/generate-geojson.cjs']);

// Step 5: Validate data
console.log(`\n${colors.bold}Step 5: Validating data${colors.reset}`);

run('Validate YAML data', 'node', ['scripts/validate-data.cjs', '--errors-only']);

// Step 6: Check optional dependencies
console.log(`\n${colors.bold}Step 6: Optional tools${colors.reset}\n`);

check('Playwright (for tests)', () => {
  const result = spawnSync('npx', ['playwright', '--version'], { encoding: 'utf-8' });
  if (result.status !== 0) {
    return { status: 'warning', message: 'Not installed - run: npx playwright install' };
  }
  return { status: 'ok', version: result.stdout.trim() };
});

// Step 7: Environment variables
console.log(`\n${colors.bold}Step 7: Environment variables${colors.reset}\n`);

const optionalEnvVars = [
  { name: 'AZURE_SEARCH_KEY', purpose: 'Azure AI Search sync', required: false },
  { name: 'NPS_API_KEY', purpose: 'NPS parks sync', required: false },
  { name: 'RECREATION_API_KEY', purpose: 'Recreation.gov sync', required: false },
];

for (const envVar of optionalEnvVars) {
  check(envVar.name, () => {
    if (process.env[envVar.name]) {
      return { status: 'ok', version: 'configured' };
    }
    return { status: 'warning', message: `Not set (optional, for ${envVar.purpose})` };
  });
}

// Final summary
console.log(`
${colors.bold}${'═'.repeat(50)}${colors.reset}
`);

if (hasErrors) {
  console.log(`${colors.red}${colors.bold}✗ Setup completed with errors${colors.reset}`);
  console.log(`\nPlease fix the errors above and run ${colors.cyan}npm run setup${colors.reset} again.`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}${colors.bold}⚠ Setup completed with warnings${colors.reset}`);
  console.log(`\nYou can start development, but some features may be limited.`);
} else {
  console.log(`${colors.green}${colors.bold}✓ Setup completed successfully!${colors.reset}`);
}

console.log(`
${colors.bold}Next steps:${colors.reset}

  ${colors.cyan}npm run dev${colors.reset}      Start development server
  ${colors.cyan}npm run build${colors.reset}    Build for production
  ${colors.cyan}npm test${colors.reset}         Run tests (after: npx playwright install)
  ${colors.cyan}npm run verify:gate${colors.reset}  Run CI validation

${colors.dim}Source files:     src/data/*.yml (YAML program data)
Generated files:  public/api/*.json (API output - do not edit)${colors.reset}
`);

process.exit(hasErrors ? 1 : 0);
