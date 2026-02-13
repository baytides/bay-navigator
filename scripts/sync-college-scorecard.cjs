#!/usr/bin/env node
/**
 * Sync College Scorecard
 * Fetches Bay Area college/university data from the U.S. Department of Education.
 *
 * Data source: College Scorecard API (collegescorecard.ed.gov)
 * Output: public/data/college-scorecard.json
 *
 * Usage: node scripts/sync-college-scorecard.cjs [--verbose]
 *
 * Uses DEMO_KEY (1000 requests/hour, no registration needed).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const VERBOSE = process.argv.includes('--verbose');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'college-scorecard.json');

function log(...args) {
  if (VERBOSE) console.log('[CS]', ...args);
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'BayNavigator/2.0 (info@baytides.org)' } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          res.resume();
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

// Bay Area ZIP prefixes covering all 9 counties
const ZIP_RANGES = [
  '940', // SF, Marin, parts of San Mateo
  '941', // SF
  '943', // Palo Alto, Sunnyvale, Santa Clara
  '944', // San Mateo
  '945', // Oakland, Berkeley, Alameda
  '946', // Oakland, Hayward
  '947', // Berkeley, Richmond, Walnut Creek
  '948', // Richmond, Hercules, Martinez
  '949', // San Rafael, Novato, Marin
  '950', // San Jose
  '951', // San Jose, Morgan Hill, Gilroy
  '953', // Santa Cruz (border)
  '954', // Santa Rosa, Petaluma, Sonoma
  '955', // Napa, Vallejo, Fairfield
  '956', // Sacramento border (Dixon, Vacaville area)
];

const FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.zip',
  'school.school_url',
  'school.ownership',
  'school.locale',
  'school.institutional_characteristics.level',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.admissions.admission_rate.overall',
  'latest.earnings.10_yrs_after_entry.median',
  'latest.student.size',
  'latest.student.enrollment.grad_12_month',
  'school.carnegie_basic',
  'location.lat',
  'location.lon',
].join(',');

const OWNERSHIP_MAP = {
  1: 'Public',
  2: 'Private Nonprofit',
  3: 'Private For-Profit',
};

async function fetchPage(page) {
  const zipFilter = ZIP_RANGES.map((z) => `school.zip=${z}`).join('&');
  const url =
    `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=DEMO_KEY` +
    `&${zipFilter}` +
    `&school.operating=1` +
    `&fields=${FIELDS}` +
    `&per_page=100&page=${page}`;

  log(`Fetching page ${page}...`);
  return fetch(url);
}

async function main() {
  console.log('Fetching Bay Area colleges from College Scorecard...');

  // The API doesn't support zip prefix ranges, so we fetch all CA and filter
  // Actually it does support multiple school.zip params but they're exact match.
  // Let's use the ZIP range approach instead
  let allSchools = [];
  let page = 0;
  let totalPages = 1;

  // Fetch using state filter + ZIP filtering client-side
  const baseUrl =
    `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=DEMO_KEY` +
    `&school.state=CA` +
    `&school.operating=1` +
    `&fields=${FIELDS}` +
    `&per_page=100`;

  while (page < totalPages) {
    const url = `${baseUrl}&page=${page}`;
    log(`Fetching page ${page}...`);
    const data = await fetch(url);

    if (page === 0) {
      const total = data.metadata?.total || 0;
      totalPages = Math.ceil(total / 100);
      log(`Total CA schools: ${total}, pages: ${totalPages}`);
    }

    if (data.results) {
      allSchools = allSchools.concat(data.results);
    }
    page++;
  }

  log(`Fetched ${allSchools.length} CA schools total`);

  // Filter to Bay Area by ZIP prefix
  const bayAreaSchools = allSchools.filter((s) => {
    const zip = (s['school.zip'] || '').substring(0, 3);
    return ZIP_RANGES.includes(zip);
  });

  log(`Bay Area schools after ZIP filter: ${bayAreaSchools.length}`);

  // Transform to our format
  const schools = bayAreaSchools
    .map((s) => ({
      id: s.id,
      name: s['school.name'],
      city: s['school.city'],
      zip: s['school.zip'],
      url: s['school.school_url']
        ? `https://${s['school.school_url'].replace(/^https?:\/\//, '')}`
        : null,
      ownership: OWNERSHIP_MAP[s['school.ownership']] || 'Unknown',
      lat: s['location.lat'],
      lon: s['location.lon'],
      tuitionInState: s['latest.cost.tuition.in_state'],
      tuitionOutOfState: s['latest.cost.tuition.out_of_state'],
      admissionRate: s['latest.admissions.admission_rate.overall']
        ? Math.round(s['latest.admissions.admission_rate.overall'] * 1000) / 10
        : null,
      medianEarnings: s['latest.earnings.10_yrs_after_entry.median'],
      enrollment: s['latest.student.size'],
      gradEnrollment: s['latest.student.enrollment.grad_12_month'],
    }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const output = {
    generated: new Date().toISOString(),
    source: 'U.S. Department of Education College Scorecard',
    sourceUrl: 'https://collegescorecard.ed.gov/',
    region: 'San Francisco Bay Area',
    count: schools.length,
    schools,
  };

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${schools.length} Bay Area colleges to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error syncing college scorecard:', err.message);
  process.exit(1);
});
