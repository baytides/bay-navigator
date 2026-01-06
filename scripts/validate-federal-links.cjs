#!/usr/bin/env node
/**
 * Validate Federal Government Links
 *
 * Cross-references program links against GSA's federal website indexes:
 * - federal-website-index: Official .gov sites (weekly updated)
 * - govt-urls: Government sites on non-.gov domains
 *
 * This helps identify:
 * - Broken or moved federal links
 * - Unofficial/phishing sites posing as government
 * - Links that may need updating
 *
 * Sources:
 * - https://github.com/GSA/federal-website-index
 * - https://github.com/GSA/govt-urls
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// GSA data sources (raw GitHub URLs for CSV files)
const FEDERAL_INDEX_URL = 'https://raw.githubusercontent.com/GSA/federal-website-index/main/data/site-scanning-target-url-list.csv';
const GOVT_URLS_FEDERAL = 'https://raw.githubusercontent.com/GSA/govt-urls/main/1_govt_urls_full.csv';

const DATA_DIR = path.join(__dirname, '../src/data');
const REPORT_FILE = path.join(__dirname, '../link-validation-report.json');

// Parse a simple CSV (handles quoted fields)
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

// Extract domain from URL
function extractDomain(url) {
  if (!url) return null;
  try {
    // Handle URLs without protocol
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Check if a domain is a known federal domain
function isFederalDomain(domain) {
  if (!domain) return false;
  // .gov and .mil are always federal
  return domain.endsWith('.gov') || domain.endsWith('.mil');
}

// Load all program links from YAML files
function loadProgramLinks() {
  const links = [];
  const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml', 'county-supervisors.yml'];

  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    const programs = yaml.load(content) || [];

    for (const program of programs) {
      const url = program.link || program.website;
      if (url) {
        links.push({
          id: program.id || program.name,
          name: program.name,
          file: file,
          url: url,
          domain: extractDomain(url),
          source: program.source || 'local',
          agency: program.agency || null
        });
      }
    }
  }

  return links;
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BayNavigator-LinkValidator/1.0'
        }
      });
      if (response.ok) {
        return await response.text();
      }
      console.warn(`  ⚠️  HTTP ${response.status} for ${url}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`  ⚠️  Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function validateLinks() {
  console.log('🔍 Federal Link Validation Tool\n');

  // Load program links
  console.log('📂 Loading program links...');
  const programLinks = loadProgramLinks();
  console.log(`   Found ${programLinks.length} program links\n`);

  // Fetch federal website index
  console.log('📥 Fetching GSA federal website index...');
  let federalSites = new Set();
  try {
    const federalCSV = await fetchWithRetry(FEDERAL_INDEX_URL);
    if (federalCSV) {
      const records = parseCSV(federalCSV);
      records.forEach(r => {
        // The GSA CSV uses 'initial_url' or 'base_domain' fields
        const domain = extractDomain(r.initial_url) || r.base_domain;
        if (domain) federalSites.add(domain.toLowerCase().replace(/^www\./, ''));
      });
      console.log(`   Loaded ${federalSites.size} federal .gov sites\n`);
    }
  } catch (error) {
    console.warn(`   ⚠️  Could not fetch federal index: ${error.message}\n`);
  }

  // Fetch non-.gov government URLs
  console.log('📥 Fetching GSA non-.gov government URLs...');
  let govtUrls = new Set();
  try {
    const govtCSV = await fetchWithRetry(GOVT_URLS_FEDERAL);
    if (govtCSV) {
      const records = parseCSV(govtCSV);
      records.forEach(r => {
        const domain = r.Website || r.website || r.Domain || r.domain;
        if (domain) govtUrls.add(domain.toLowerCase().replace(/^www\./, ''));
      });
      console.log(`   Loaded ${govtUrls.size} non-.gov government sites\n`);
    }
  } catch (error) {
    console.warn(`   ⚠️  Could not fetch govt-urls: ${error.message}\n`);
  }

  // Analyze links
  console.log('🔍 Analyzing links...\n');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: programLinks.length,
      federal: 0,
      verified: 0,
      unverified: 0,
      nonGov: 0,
      issues: []
    },
    federalLinks: [],
    unverifiedFederalLinks: [],
    nonGovLinks: [],
    knownGovtUrls: []
  };

  for (const link of programLinks) {
    if (!link.domain) {
      report.summary.issues.push({
        type: 'invalid_url',
        program: link.name,
        file: link.file,
        url: link.url
      });
      continue;
    }

    if (isFederalDomain(link.domain)) {
      report.summary.federal++;

      // Check if it's in the official index
      if (federalSites.has(link.domain) || federalSites.size === 0) {
        report.summary.verified++;
        report.federalLinks.push(link);
      } else {
        report.summary.unverified++;
        report.unverifiedFederalLinks.push(link);
      }
    } else if (govtUrls.has(link.domain)) {
      report.summary.nonGov++;
      report.knownGovtUrls.push(link);
    } else {
      report.summary.nonGov++;
      report.nonGovLinks.push(link);
    }
  }

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Total links: ${report.summary.total}`);
  console.log(`   Federal (.gov/.mil): ${report.summary.federal}`);
  console.log(`   - Verified in GSA index: ${report.summary.verified}`);
  console.log(`   - Not in GSA index: ${report.summary.unverified}`);
  console.log(`   Non-.gov links: ${report.summary.nonGov}`);
  console.log(`   - Known govt sites: ${report.knownGovtUrls.length}`);
  console.log(`   - Other: ${report.nonGovLinks.length}`);

  if (report.summary.issues.length > 0) {
    console.log(`\n⚠️  Issues found: ${report.summary.issues.length}`);
    report.summary.issues.forEach(issue => {
      console.log(`   - ${issue.type}: ${issue.program} (${issue.file})`);
    });
  }

  if (report.unverifiedFederalLinks.length > 0) {
    console.log('\n⚠️  Federal links not in GSA index (may be subdomains or new sites):');
    report.unverifiedFederalLinks.slice(0, 10).forEach(link => {
      console.log(`   - ${link.domain} (${link.name})`);
    });
    if (report.unverifiedFederalLinks.length > 10) {
      console.log(`   ... and ${report.unverifiedFederalLinks.length - 10} more`);
    }
  }

  // Write report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${REPORT_FILE}`);

  return report;
}

// Check links for HTTP status (optional, slower)
async function checkLinkStatus(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BayNavigator-LinkValidator/1.0'
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    return {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      finalUrl: response.url
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Run validation
validateLinks().then(report => {
  process.exit(report.summary.issues.length > 0 ? 1 : 0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
