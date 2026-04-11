#!/usr/bin/env node
/**
 * Automated civic data update script
 *
 * This script:
 * 1. Runs the CivicPlus scraper to collect council member data
 * 2. Downloads official photos
 * 3. Generates Swift code
 * 4. Patches CivicService.swift with updated data
 *
 * Usage: node scripts/update-civic-data.cjs [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --skip-scrape  Skip scraping, use existing data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const DATA_FILE = path.join(ROOT_DIR, 'data-exports', 'city-councils', 'civicplus-data.json');
const CIVIC_SERVICE_PATH = path.join(
  ROOT_DIR,
  'apps',
  'apple',
  'BayNavigatorCore',
  'Sources',
  'BayNavigatorCore',
  'Services',
  'CivicService.swift'
);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_SCRAPE = args.includes('--skip-scrape');

// Helper to escape Swift strings
function escapeSwift(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/g, '');
}

function optStr(val) {
  if (!val) return 'nil';
  const escaped = escapeSwift(val);
  if (!escaped) return 'nil';
  return `"${escaped}"`;
}

function extractDistrict(title) {
  if (!title) return null;
  const match = title.match(/district\s*(\d+)/i);
  return match ? match[1] : null;
}

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
  if (!name.includes(' ') || name.split(' ').filter((w) => w.length > 1).length < 2) {
    return false;
  }
  return !noise.some((n) => nameLower.includes(n)) && name.length > 4;
}

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

function generateSwiftForCity(cityKey, officials) {
  const lines = [];
  lines.push(`        "${cityKey}": [`);

  for (let i = 0; i < officials.length; i++) {
    const off = officials[i];
    const comma = i < officials.length - 1 ? ',' : '';
    const title = normalizeTitle(off.title);
    const districtNum = extractDistrict(off.title);
    const photoUrl = off.localPhotoPath || off.photoUrl;

    lines.push('            Representative(');
    lines.push(`                name: "${escapeSwift(off.name)}",`);
    lines.push(`                title: "${escapeSwift(title)}",`);
    lines.push('                level: .local,');
    if (off.phone) lines.push(`                phone: ${optStr(off.phone)},`);
    if (off.email) lines.push(`                email: ${optStr(off.email)},`);
    if (off.website) lines.push(`                website: ${optStr(off.website)},`);
    if (photoUrl) lines.push(`                photoUrl: ${optStr(photoUrl)},`);
    if (districtNum) lines.push(`                district: "District ${districtNum}"`);
    // Remove trailing comma from last property
    const lastLine = lines[lines.length - 1];
    if (lastLine.endsWith(',')) {
      lines[lines.length - 1] = lastLine.slice(0, -1);
    }
    lines.push(`            )${comma}`);
  }

  lines.push('        ],');
  return lines.join('\n');
}

async function main() {
  console.log('=== Civic Data Update Script ===\n');

  if (DRY_RUN) {
    console.log('DRY RUN MODE - No changes will be made\n');
  }

  // Step 1: Run scraper (uses hardcoded script path, safe from injection)
  if (!SKIP_SCRAPE) {
    console.log('Step 1: Running CivicPlus scraper...');
    try {
      execSync('node scripts/scrape-civicplus-councils.cjs', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
    } catch (err) {
      console.error('Scraper failed:', err.message);
      process.exit(1);
    }
    console.log('\n');
  } else {
    console.log('Step 1: Skipping scraper (--skip-scrape)\n');
  }

  // Step 2: Load scraped data
  console.log('Step 2: Loading scraped data...');
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // Count stats
  let totalOfficials = 0;
  let citiesWithData = 0;
  let citiesWithPhotos = 0;

  for (const [cityName, cityData] of Object.entries(data)) {
    if (cityData.officials && cityData.officials.length > 0) {
      const validOfficials = cityData.officials.filter((o) => isValidOfficial(o.name));
      if (validOfficials.length > 0) {
        citiesWithData++;
        totalOfficials += validOfficials.length;
        if (validOfficials.some((o) => o.localPhotoPath)) {
          citiesWithPhotos++;
        }
      }
    }
  }

  console.log(`  Found ${totalOfficials} officials across ${citiesWithData} cities`);
  console.log(`  ${citiesWithPhotos} cities have photos downloaded\n`);

  // Step 3: Read current CivicService.swift
  console.log('Step 3: Reading CivicService.swift...');
  if (!fs.existsSync(CIVIC_SERVICE_PATH)) {
    console.error(`CivicService.swift not found: ${CIVIC_SERVICE_PATH}`);
    process.exit(1);
  }

  let swiftContent = fs.readFileSync(CIVIC_SERVICE_PATH, 'utf8');
  const originalContent = swiftContent;

  // Step 4: Update each city
  console.log('Step 4: Updating city entries...\n');

  let updatedCities = 0;
  let addedCities = 0;

  for (const [cityName, cityData] of Object.entries(data)) {
    if (!cityData.officials || cityData.officials.length === 0) continue;

    const validOfficials = cityData.officials.filter((o) => isValidOfficial(o.name));
    if (validOfficials.length === 0) continue;

    const cityKey = cityName.toLowerCase();

    // Check if city already exists in Swift file
    const cityPattern = new RegExp(`"${cityKey}":\\s*\\[([\\s\\S]*?)\\],`, 'g');
    const match = cityPattern.exec(swiftContent);

    if (match) {
      // City exists - check if we have better data
      const hasPhotos = validOfficials.some((o) => o.localPhotoPath);
      const hasEmails = validOfficials.some((o) => o.email);

      if (hasPhotos || hasEmails) {
        // We have better data - update
        const newSwift = generateSwiftForCity(cityKey, validOfficials);
        swiftContent = swiftContent.replace(match[0], newSwift);
        console.log(
          `  ✓ Updated: ${cityName} (${validOfficials.length} officials, photos: ${hasPhotos}, emails: ${hasEmails})`
        );
        updatedCities++;
      }
    } else {
      // City doesn't exist - would need to add
      console.log(`  + Would add: ${cityName} (${validOfficials.length} officials)`);
      addedCities++;
      // Note: Adding new cities requires more complex logic to find insertion point
    }
  }

  console.log(`\nSummary: ${updatedCities} cities updated, ${addedCities} cities would be added`);

  // Step 5: Write updated file
  if (!DRY_RUN && swiftContent !== originalContent) {
    console.log('\nStep 5: Writing updated CivicService.swift...');
    fs.writeFileSync(CIVIC_SERVICE_PATH, swiftContent);
    console.log('  Done!\n');

    // Step 6: Verify build (uses hardcoded command, safe from injection)
    console.log('Step 6: Verifying Swift build...');
    try {
      execSync(
        'xcodebuild -scheme "Bay Navigator (iOS)" -destination "generic/platform=iOS" build 2>&1 | tail -5',
        {
          cwd: path.join(ROOT_DIR, 'apps', 'apple'),
          stdio: 'inherit',
        }
      );
      console.log('\n✓ Build succeeded!\n');
    } catch (err) {
      console.error('\n✗ Build failed! Rolling back...');
      fs.writeFileSync(CIVIC_SERVICE_PATH, originalContent);
      process.exit(1);
    }
  } else if (DRY_RUN) {
    console.log('\nStep 5: Skipping write (dry run)');
  } else {
    console.log('\nNo changes needed.');
  }

  console.log('=== Update Complete ===');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
