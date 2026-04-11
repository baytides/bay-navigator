#!/usr/bin/env node
/**
 * Master script to run all council scrapers
 *
 * Usage: node scripts/scrape-all-councils.cjs [options]
 *
 * Options:
 *   --civicplus     Run only CivicPlus scraper
 *   --granicus      Run only Granicus scraper
 *   --proudcity     Run only ProudCity scraper
 *   --wikipedia     Run only Wikipedia scraper
 *   --blocked       Run only blocked sites scraper (requires Playwright)
 *   --skip-blocked  Skip blocked sites (no Playwright needed)
 *   --skip-wikipedia  Skip Wikipedia scraper
 *
 * Without options, runs all scrapers.
 *
 * Note: All script paths are hardcoded - no user input is used in commands.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'data-exports', 'city-councils');

const args = process.argv.slice(2);

const SPECIFIC_FLAG =
  args.includes('--civicplus') ||
  args.includes('--granicus') ||
  args.includes('--proudcity') ||
  args.includes('--wikipedia') ||
  args.includes('--blocked');
const SKIP_BLOCKED = args.includes('--skip-blocked');
const SKIP_WIKIPEDIA = args.includes('--skip-wikipedia');

// Hardcoded script paths - safe from injection
const SCRAPERS = {
  civicplus: { name: 'CivicPlus', script: 'scripts/scrape-civicplus-councils.cjs' },
  granicus: { name: 'Granicus OpenCities', script: 'scripts/scrape-granicus-councils.cjs' },
  proudcity: { name: 'ProudCity (WordPress)', script: 'scripts/scrape-proudcity-councils.cjs' },
  wikipedia: { name: 'Wikipedia', script: 'scripts/scrape-wikipedia-councils.cjs' },
  blocked: { name: 'Blocked Sites (Playwright)', script: 'scripts/scrape-blocked-councils.cjs' },
};

function runScraper(key) {
  const scraper = SCRAPERS[key];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running ${scraper.name} scraper...`);
  console.log('='.repeat(60));

  try {
    // Uses hardcoded script path from SCRAPERS object
    execSync(`node ${scraper.script}`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    return true;
  } catch (e) {
    console.error(`${scraper.name} scraper failed:`, e.message);
    return false;
  }
}

function checkPlaywright() {
  try {
    require.resolve('playwright');
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('Bay Area City Council Scraper Suite');
  console.log('===================================\n');

  const startTime = Date.now();
  const results = {};

  // Determine which scrapers to run
  const toRun = [];

  if (SPECIFIC_FLAG) {
    if (args.includes('--civicplus')) toRun.push('civicplus');
    if (args.includes('--granicus')) toRun.push('granicus');
    if (args.includes('--proudcity')) toRun.push('proudcity');
    if (args.includes('--wikipedia')) toRun.push('wikipedia');
    if (args.includes('--blocked')) toRun.push('blocked');
  } else {
    // Run all
    toRun.push('civicplus', 'granicus', 'proudcity');
    if (!SKIP_WIKIPEDIA) toRun.push('wikipedia');
    if (!SKIP_BLOCKED) toRun.push('blocked');
  }

  // Run scrapers
  for (const key of toRun) {
    if (key === 'blocked') {
      if (checkPlaywright()) {
        results[key] = runScraper(key);
      } else {
        console.log('\n[Blocked Sites] Skipping - Playwright not installed');
        console.log('  To install: npm install playwright && npx playwright install chromium');
        results[key] = 'skipped';
      }
    } else {
      results[key] = runScraper(key);
    }
  }

  // Merge all results into a combined file
  console.log('\n' + '='.repeat(60));
  console.log('Merging results...');
  console.log('='.repeat(60));

  const combined = {
    metadata: {
      scrapedAt: new Date().toISOString(),
      sources: [],
      totalCities: 0,
      totalOfficials: 0,
    },
    cities: {},
  };

  const dataFiles = [
    { name: 'CivicPlus', file: 'civicplus-data.json' },
    { name: 'Granicus', file: 'granicus-data.json' },
    { name: 'ProudCity', file: 'proudcity-data.json' },
    { name: 'Wikipedia', file: 'wikipedia-data.json' },
    { name: 'Blocked Sites', file: 'blocked-sites-data.json' },
  ];

  for (const source of dataFiles) {
    const filePath = path.join(OUTPUT_DIR, source.file);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        let sourceOfficials = 0;
        let sourceCities = 0;

        for (const [cityName, cityData] of Object.entries(data)) {
          if (cityData.officials && cityData.officials.length > 0) {
            combined.cities[cityName] = {
              ...cityData,
              source: source.name,
            };
            sourceCities++;
            sourceOfficials += cityData.officials.length;
            combined.metadata.totalOfficials += cityData.officials.length;
          }
        }

        if (sourceCities > 0) {
          combined.metadata.sources.push({
            name: source.name,
            cities: sourceCities,
            officials: sourceOfficials,
          });
          combined.metadata.totalCities += sourceCities;
        }

        console.log(`  ${source.name}: ${sourceCities} cities, ${sourceOfficials} officials`);
      } catch (e) {
        console.log(`  ${source.name}: Error reading file - ${e.message}`);
      }
    } else {
      console.log(`  ${source.name}: No data file found`);
    }
  }

  // Save combined results
  const combinedPath = path.join(OUTPUT_DIR, 'all-councils-combined.json');
  fs.writeFileSync(combinedPath, JSON.stringify(combined, null, 2));

  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Total cities with data: ${combined.metadata.totalCities}`);
  console.log(`Total officials: ${combined.metadata.totalOfficials}`);
  console.log(`\nOutput files:`);
  console.log(`  - ${combinedPath}`);

  for (const source of dataFiles) {
    const filePath = path.join(OUTPUT_DIR, source.file);
    if (fs.existsSync(filePath)) {
      console.log(`  - ${filePath}`);
    }
  }

  // Count photos
  const photosDir = path.join(ROOT_DIR, 'apps', 'assets', 'images', 'representatives', 'local');
  let photoCount = 0;
  if (fs.existsSync(photosDir)) {
    const counties = fs.readdirSync(photosDir);
    for (const county of counties) {
      const countyPath = path.join(photosDir, county);
      if (fs.statSync(countyPath).isDirectory()) {
        const cities = fs.readdirSync(countyPath);
        for (const city of cities) {
          const cityPath = path.join(countyPath, city);
          if (fs.statSync(cityPath).isDirectory()) {
            const photos = fs.readdirSync(cityPath).filter((f) => f.endsWith('.jpg'));
            photoCount += photos.length;
          }
        }
      }
    }
  }
  console.log(`\nPhotos in representatives directory: ${photoCount}`);
}

main().catch(console.error);
