#!/usr/bin/env node
/**
 * Data Freshness Check Script
 * Warns if program data files haven't been updated recently
 * Run: node scripts/check-data-freshness.cjs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WARN_DAYS = 90; // Warn if data is older than 90 days
const ERROR_DAYS = 180; // Error if data is older than 180 days

// Files that are not program data
const NON_PROGRAM_FILES = [
  'search-config.yml',
  'site-config.yml',
  'bay-area-jurisdictions.yml',
  'city-profiles.yml',
  'county-supervisors.yml',
];

function checkFreshness() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => (f.endsWith('.yml') || f.endsWith('.yaml')) && !NON_PROGRAM_FILES.includes(f));

  const now = Date.now();
  const warnThreshold = now - WARN_DAYS * 24 * 60 * 60 * 1000;
  const errorThreshold = now - ERROR_DAYS * 24 * 60 * 60 * 1000;

  console.log('📅 Checking data freshness...\n');

  const staleFiles = [];
  const veryStaleFiles = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const stats = fs.statSync(filePath);
    const mtime = stats.mtime.getTime();
    const daysOld = Math.floor((now - mtime) / (24 * 60 * 60 * 1000));

    if (mtime < errorThreshold) {
      veryStaleFiles.push({ file, daysOld });
      console.log(`❌ ${file} - ${daysOld} days old (ERROR: >${ERROR_DAYS} days)`);
    } else if (mtime < warnThreshold) {
      staleFiles.push({ file, daysOld });
      console.log(`⚠️  ${file} - ${daysOld} days old (WARN: >${WARN_DAYS} days)`);
    } else {
      console.log(`✅ ${file} - ${daysOld} days old`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary: ${files.length} data files checked\n`);

  if (veryStaleFiles.length > 0) {
    console.log(`❌ ${veryStaleFiles.length} file(s) are critically stale (>${ERROR_DAYS} days):`);
    veryStaleFiles.forEach(({ file, daysOld }) => {
      console.log(`   - ${file} (${daysOld} days)`);
    });
    console.log('');
  }

  if (staleFiles.length > 0) {
    console.log(`⚠️  ${staleFiles.length} file(s) may need review (>${WARN_DAYS} days):`);
    staleFiles.forEach(({ file, daysOld }) => {
      console.log(`   - ${file} (${daysOld} days)`);
    });
    console.log('');
  }

  // In CI, fail on very stale files
  if (process.env.CI && veryStaleFiles.length > 0) {
    console.log('❌ Data freshness check failed. Please review and update stale data files.\n');
    process.exit(1);
  }

  // Warn but don't fail for moderately stale files
  if (veryStaleFiles.length === 0 && staleFiles.length === 0) {
    console.log('✅ All data files are fresh!\n');
  } else if (veryStaleFiles.length === 0) {
    console.log('⚠️  Some files may need review, but none are critically stale.\n');
  }

  process.exit(0);
}

checkFreshness();
