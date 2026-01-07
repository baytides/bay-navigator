#!/usr/bin/env node
/**
 * Bay Navigator Changed Links Validation
 *
 * Fast link validation for PRs - only checks links in changed files.
 * Uses HEAD requests with GET fallback and retries.
 *
 * Usage:
 *   node scripts/validate-changed-links.cjs          # Check changes vs main branch
 *   node scripts/validate-changed-links.cjs --all    # Check all links (full validation)
 *   node scripts/validate-changed-links.cjs --staged # Check staged files only
 *
 * Exit codes:
 *   0 - All links valid
 *   1 - Invalid links found
 */

const { execSync } = require('child_process');
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
  dim: '\x1b[2m',
};

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml', 'county-supervisors.yml', 'site-config.yml'];

// Link severity levels
const SEVERITY = {
  federal: 'high',      // .gov, .mil - critical
  partner: 'medium',    // .org, .edu - important
  other: 'low'          // .com, etc. - informational
};

function getSeverity(url) {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.endsWith('.gov') || domain.endsWith('.mil')) return 'federal';
    if (domain.endsWith('.org') || domain.endsWith('.edu')) return 'partner';
    return 'other';
  } catch {
    return 'other';
  }
}

// Get list of changed YAML files compared to base branch
function getChangedFiles(mode = 'branch') {
  try {
    let diff;
    if (mode === 'staged') {
      diff = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    } else if (mode === 'all') {
      return fs.readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f))
        .map(f => path.join('src/data', f));
    } else {
      // Compare with origin/main or main
      try {
        diff = execSync('git diff origin/main --name-only', { encoding: 'utf-8' });
      } catch {
        diff = execSync('git diff main --name-only', { encoding: 'utf-8' });
      }
    }
    return diff.trim().split('\n').filter(f =>
      f.startsWith('src/data/') &&
      f.endsWith('.yml') &&
      !NON_PROGRAM_FILES.includes(path.basename(f))
    );
  } catch (err) {
    console.log(`${colors.yellow}⚠${colors.reset} Could not get git diff: ${err.message}`);
    return [];
  }
}

// Extract links from YAML file
function extractLinks(filePath) {
  const links = [];
  const absolutePath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(absolutePath)) {
    return links;
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf8');
    const programs = yaml.load(content) || [];

    for (const program of programs) {
      const url = program.link || program.website;
      if (url && url.startsWith('http')) {
        links.push({
          url,
          program: program.name || program.id,
          file: path.basename(filePath),
          severity: getSeverity(url)
        });
      }
    }
  } catch (err) {
    console.log(`${colors.yellow}⚠${colors.reset} Error parsing ${filePath}: ${err.message}`);
  }

  return links;
}

// Check a single link with HEAD then GET fallback
async function checkLink(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      // Try HEAD first (faster)
      let response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BayNavigator-LinkValidator/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        redirect: 'follow'
      });

      clearTimeout(timeout);

      // Some servers don't support HEAD, fallback to GET
      if (response.status === 405 || response.status === 501) {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 15000);

        response = await fetch(url, {
          method: 'GET',
          signal: controller2.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; BayNavigator-LinkValidator/1.0)',
            'Accept': 'text/html,application/xhtml+xml'
          },
          redirect: 'follow'
        });

        clearTimeout(timeout2);
      }

      return {
        url,
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        finalUrl: response.url !== url ? response.url : null
      };
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return {
        url,
        status: 0,
        ok: false,
        error: err.name === 'AbortError' ? 'Timeout' : err.message
      };
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkAll = args.includes('--all');
  const checkStaged = args.includes('--staged');
  const severityFilter = args.find(a => a.startsWith('--severity='))?.split('=')[1];

  console.log(`\n${colors.bold}Bay Navigator Link Validation${colors.reset}`);
  console.log('═'.repeat(50) + '\n');

  // Get files to check
  const mode = checkAll ? 'all' : (checkStaged ? 'staged' : 'branch');
  const changedFiles = getChangedFiles(mode);

  if (changedFiles.length === 0) {
    console.log(`${colors.green}✓${colors.reset} No changed data files to validate`);
    process.exit(0);
  }

  console.log(`${colors.blue}ℹ${colors.reset} Checking ${changedFiles.length} file(s): ${changedFiles.map(f => path.basename(f)).join(', ')}\n`);

  // Extract all links
  const allLinks = [];
  for (const file of changedFiles) {
    const links = extractLinks(file);
    allLinks.push(...links);
  }

  // Filter by severity if specified
  const linksToCheck = severityFilter
    ? allLinks.filter(l => l.severity === severityFilter)
    : allLinks;

  console.log(`${colors.blue}ℹ${colors.reset} Found ${linksToCheck.length} link(s) to validate\n`);

  if (linksToCheck.length === 0) {
    console.log(`${colors.green}✓${colors.reset} No links to validate`);
    process.exit(0);
  }

  // Group by severity
  const bySeverity = {
    federal: linksToCheck.filter(l => l.severity === 'federal'),
    partner: linksToCheck.filter(l => l.severity === 'partner'),
    other: linksToCheck.filter(l => l.severity === 'other')
  };

  console.log(`   Federal (.gov/.mil): ${bySeverity.federal.length}`);
  console.log(`   Partner (.org/.edu): ${bySeverity.partner.length}`);
  console.log(`   Other: ${bySeverity.other.length}\n`);

  // Check links with progress
  const results = { valid: [], invalid: [], warnings: [] };
  let checked = 0;

  for (const link of linksToCheck) {
    checked++;
    const progress = `[${checked}/${linksToCheck.length}]`;
    process.stdout.write(`${colors.dim}${progress}${colors.reset} Checking ${link.url.slice(0, 50)}...`);

    const result = await checkLink(link.url);

    process.stdout.clearLine?.(0);
    process.stdout.cursorTo?.(0);

    if (result.ok) {
      results.valid.push({ ...link, ...result });
      if (result.redirected && result.finalUrl) {
        console.log(`${colors.yellow}↪${colors.reset} ${progress} ${link.program}: redirected to ${result.finalUrl.slice(0, 50)}`);
        results.warnings.push({ ...link, ...result, warning: 'Redirected' });
      }
    } else {
      const icon = link.severity === 'federal' ? colors.red + '✗' : colors.yellow + '⚠';
      console.log(`${icon}${colors.reset} ${progress} ${link.program}: ${result.status || result.error} (${link.url.slice(0, 50)})`);

      if (link.severity === 'federal') {
        results.invalid.push({ ...link, ...result });
      } else {
        results.warnings.push({ ...link, ...result, warning: `HTTP ${result.status || result.error}` });
      }
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`${colors.bold}Summary${colors.reset}\n`);
  console.log(`   Valid: ${colors.green}${results.valid.length}${colors.reset}`);
  console.log(`   Warnings: ${colors.yellow}${results.warnings.length}${colors.reset}`);
  console.log(`   Invalid: ${results.invalid.length > 0 ? colors.red : colors.green}${results.invalid.length}${colors.reset}`);

  if (results.invalid.length > 0) {
    console.log(`\n${colors.red}${colors.bold}✗ Link validation failed${colors.reset}`);
    console.log('\nInvalid federal links (must fix):');
    for (const link of results.invalid) {
      console.log(`  ${colors.red}•${colors.reset} ${link.program} (${link.file})`);
      console.log(`    ${link.url}`);
      console.log(`    Error: ${link.status || link.error}`);
    }
    process.exit(1);
  }

  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠ ${results.warnings.length} warning(s) - review recommended${colors.reset}`);
  }

  console.log(`\n${colors.green}${colors.bold}✓ Link validation passed${colors.reset}`);
  process.exit(0);
}

main().catch(err => {
  console.error(`${colors.red}Error:${colors.reset}`, err);
  process.exit(1);
});
