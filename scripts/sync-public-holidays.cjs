#!/usr/bin/env node
/**
 * Sync Public Holidays
 * Fetches U.S. public holidays for current and next year from Nager.Date API.
 *
 * Data source: Nager.Date (date.nager.at)
 * Output: public/data/public-holidays.json
 *
 * Usage: node scripts/sync-public-holidays.cjs [--verbose]
 *
 * No API key required. Nager.Date is freely available.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const VERBOSE = process.argv.includes('--verbose');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'public-holidays.json');

function log(...args) {
  if (VERBOSE) console.log('[PH]', ...args);
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

/** Holidays that close government offices */
const GOVT_CLOSED_HOLIDAYS = new Set([
  "New Year's Day",
  'Martin Luther King, Jr. Day',
  'Birthday of George Washington',
  'Memorial Day',
  'Juneteenth',
  'Independence Day',
  'Labour Day',
  'Columbus Day',
  "Veterans' Day",
  'Thanksgiving Day',
  'Christmas Day',
]);

/** Holidays likely to affect transit schedules */
const TRANSIT_IMPACT_HOLIDAYS = new Set([
  "New Year's Day",
  'Memorial Day',
  'Independence Day',
  'Labour Day',
  'Thanksgiving Day',
  'Christmas Day',
]);

async function main() {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  console.log(`Fetching U.S. public holidays for ${currentYear} and ${nextYear}...`);

  const [thisYear, followingYear] = await Promise.all([
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/US`),
    fetch(`https://date.nager.at/api/v3/PublicHolidays/${nextYear}/US`),
  ]);

  log(`Got ${thisYear.length} holidays for ${currentYear}`);
  log(`Got ${followingYear.length} holidays for ${nextYear}`);

  const allHolidays = [...thisYear, ...followingYear];

  const today = new Date().toISOString().split('T')[0];

  const holidays = allHolidays.map((h) => {
    const daysUntil = Math.ceil((new Date(h.date) - new Date(today)) / (1000 * 60 * 60 * 24));

    return {
      date: h.date,
      name: h.name,
      localName: h.localName,
      types: h.types || [],
      fixed: h.fixed,
      governmentClosed: GOVT_CLOSED_HOLIDAYS.has(h.name),
      transitImpact: TRANSIT_IMPACT_HOLIDAYS.has(h.name),
      daysUntil,
      upcoming: daysUntil >= 0,
    };
  });

  const output = {
    generated: new Date().toISOString(),
    source: 'Nager.Date Public Holiday API',
    sourceUrl: 'https://date.nager.at/',
    country: 'US',
    years: [currentYear, nextYear],
    count: holidays.length,
    holidays,
  };

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${holidays.length} holidays to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Error syncing public holidays:', err.message);
  process.exit(1);
});
