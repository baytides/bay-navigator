#!/usr/bin/env node
/**
 * Link Validation Script
 * Checks all program links for validity (status codes, redirects, SSL)
 * Run: node scripts/validate-links.cjs [--fix] [--report]
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const http = require('http');

// Configuration
const TIMEOUT_MS = 10000;
const CONCURRENT_REQUESTS = 5;
const RETRY_COUNT = 2;

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

// Parse arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const shouldReport = args.includes('--report');

// Results storage
const results = {
  valid: [],
  invalid: [],
  redirects: [],
  timeout: [],
  ssl_error: [],
};

/**
 * Check a single URL
 */
async function checkUrl(url, retries = RETRY_COUNT) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(
      url,
      {
        method: 'HEAD',
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'BayNavigator-LinkChecker/1.0 (+https://baynavigator.org)',
        },
      },
      (res) => {
        const status = res.statusCode;

        if (status >= 200 && status < 300) {
          resolve({ status: 'valid', code: status, url });
        } else if (status >= 300 && status < 400) {
          resolve({
            status: 'redirect',
            code: status,
            url,
            location: res.headers.location,
          });
        } else if (status >= 400) {
          resolve({ status: 'invalid', code: status, url });
        } else {
          resolve({ status: 'unknown', code: status, url });
        }
      }
    );

    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => {
          checkUrl(url, retries - 1).then(resolve);
        }, 1000);
      } else {
        resolve({ status: 'timeout', url });
      }
    });

    req.on('error', (err) => {
      if (err.code === 'CERT_HAS_EXPIRED' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        resolve({ status: 'ssl_error', url, error: err.code });
      } else if (retries > 0) {
        setTimeout(() => {
          checkUrl(url, retries - 1).then(resolve);
        }, 1000);
      } else {
        resolve({ status: 'invalid', url, error: err.message });
      }
    });

    req.end();
  });
}

/**
 * Process URLs in batches
 */
async function processUrls(urls) {
  const results = [];

  for (let i = 0; i < urls.length; i += CONCURRENT_REQUESTS) {
    const batch = urls.slice(i, i + CONCURRENT_REQUESTS);
    const batchResults = await Promise.all(batch.map(({ url, program, file }) =>
      checkUrl(url).then((result) => ({ ...result, program, file }))
    ));
    results.push(...batchResults);

    // Progress indicator
    process.stdout.write(`\rChecking links: ${Math.min(i + CONCURRENT_REQUESTS, urls.length)}/${urls.length}`);
  }

  console.log(''); // New line after progress
  return results;
}

/**
 * Load all program URLs from YAML files
 */
function loadProgramUrls() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const files = fs.readdirSync(dataDir).filter(
    (f) => (f.endsWith('.yml') || f.endsWith('.yaml')) && !NON_PROGRAM_FILES.includes(f)
  );

  const urls = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const data = yaml.load(content);
      if (!Array.isArray(data)) continue;

      for (const program of data) {
        if (program.link && program.link.startsWith('http')) {
          urls.push({
            url: program.link,
            program: program.name || 'Unknown',
            file,
          });
        }
      }
    } catch (e) {
      console.error(`Error parsing ${file}: ${e.message}`);
    }
  }

  return urls;
}

/**
 * Generate report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      valid: results.filter((r) => r.status === 'valid').length,
      invalid: results.filter((r) => r.status === 'invalid').length,
      redirects: results.filter((r) => r.status === 'redirect').length,
      timeout: results.filter((r) => r.status === 'timeout').length,
      ssl_errors: results.filter((r) => r.status === 'ssl_error').length,
    },
    issues: results
      .filter((r) => r.status !== 'valid')
      .map((r) => ({
        url: r.url,
        program: r.program,
        file: r.file,
        status: r.status,
        code: r.code,
        location: r.location,
        error: r.error,
      })),
  };

  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔗 Link Validation Script\n');

  // Load URLs
  const urls = loadProgramUrls();
  console.log(`Found ${urls.length} links to check\n`);

  if (urls.length === 0) {
    console.log('No links to check.');
    return;
  }

  // Check URLs
  const checkResults = await processUrls(urls);

  // Generate report
  const report = generateReport(checkResults);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');
  console.log(`  Total links: ${report.summary.total}`);
  console.log(`  ✅ Valid: ${report.summary.valid}`);
  console.log(`  ❌ Invalid: ${report.summary.invalid}`);
  console.log(`  ↪️  Redirects: ${report.summary.redirects}`);
  console.log(`  ⏱️  Timeout: ${report.summary.timeout}`);
  console.log(`  🔐 SSL Errors: ${report.summary.ssl_errors}`);

  // Print issues
  if (report.issues.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('⚠️  Issues Found\n');

    for (const issue of report.issues.slice(0, 20)) {
      console.log(`  ${issue.file}: ${issue.program}`);
      console.log(`    URL: ${issue.url}`);
      console.log(`    Status: ${issue.status}${issue.code ? ` (${issue.code})` : ''}`);
      if (issue.location) console.log(`    Redirects to: ${issue.location}`);
      if (issue.error) console.log(`    Error: ${issue.error}`);
      console.log('');
    }

    if (report.issues.length > 20) {
      console.log(`  ... and ${report.issues.length - 20} more issues\n`);
    }
  }

  // Save report if requested
  if (shouldReport) {
    const reportPath = path.join(__dirname, '..', 'link-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: link-validation-report.json`);
  }

  // Exit with error if there are invalid links
  if (report.summary.invalid > 0) {
    console.log('\n❌ Link validation failed. Please fix invalid links.\n');
    process.exit(1);
  } else {
    console.log('\n✅ All links are valid!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
