#!/usr/bin/env node
/**
 * Sample City Scraper - Test a few representative sites first
 *
 * This scrapes a small sample of Bay Area sites to see what data we can extract:
 * - San Francisco (large city-county)
 * - Berkeley (medium city)
 * - Sausalito (small city)
 * - Alameda County (county government)
 * - BART (regional transit agency)
 *
 * Run this first to see what kind of data we can get, then use the full
 * scraper (scrape-city-info.cjs) for all 100+ entities.
 *
 * Usage: node scripts/scrape-city-sample.cjs
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 */

const fs = require('fs');
const path = require('path');

// Output
const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'city-info');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sample-scrape.json');

// Sample entities representing different types
const SAMPLE_ENTITIES = [
  { county: 'San Francisco', name: 'San Francisco', type: 'City-County', url: 'https://sf.gov' },
  { county: 'Alameda', name: 'Berkeley', type: 'City', url: 'https://berkeleyca.gov' },
  { county: 'Marin', name: 'Sausalito', type: 'City', url: 'https://www.sausalito.gov' },
  { county: 'Alameda', name: 'Alameda County', type: 'County', url: 'https://www.acgov.org' },
  { county: 'Regional', name: 'Bay Area Rapid Transit (BART)', type: 'Regional Agency', url: 'https://www.bart.gov' },
];

// City/County pages
const CITY_PAGES = [
  { path: '/', name: 'Homepage', priority: 1 },
  { path: '/contact', name: 'Contact', priority: 1 },
  { path: '/departments', name: 'Departments', priority: 1 },
  { path: '/services', name: 'Services', priority: 1 },
  { path: '/calendar', name: 'Calendar', priority: 1 },
  { path: '/news', name: 'News', priority: 1 },
  { path: '/emergency', name: 'Emergency', priority: 1 },
  { path: '/housing', name: 'Housing', priority: 1 },
  { path: '/faq', name: 'FAQ', priority: 1 },
];

// Regional agency pages
const REGIONAL_PAGES = [
  { path: '/', name: 'Homepage', priority: 1 },
  { path: '/contact', name: 'Contact', priority: 1 },
  { path: '/schedules', name: 'Schedules', priority: 1 },
  { path: '/fares', name: 'Fares', priority: 1 },
  { path: '/maps', name: 'Maps', priority: 1 },
  { path: '/alerts', name: 'Alerts', priority: 1 },
  { path: '/stations', name: 'Stations', priority: 1 },
  { path: '/accessibility', name: 'Accessibility', priority: 1 },
];

// Rate limiting
const DELAY_BETWEEN_PAGES = 1500;
const DELAY_BETWEEN_SITES = 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract useful information from a page
 */
async function extractPageInfo(page) {
  return await page.evaluate(() => {
    const info = {
      title: document.title || '',
      description: '',
      phones: [],
      emails: [],
      addresses: [],
      hours: [],
      departments: [],
      services: [],
      events: [],
      links: [],
      mainContent: '',
    };

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      info.description = metaDesc.content;
    }

    const pageText = document.body.innerText;

    // Extract phone numbers
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = [...new Set((pageText.match(phoneRegex) || []))];
    info.phones = phones.slice(0, 10);

    // Extract emails
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    const emails = new Set();
    emailLinks.forEach(a => {
      const email = a.href.replace('mailto:', '').split('?')[0];
      if (email && email.includes('@')) {
        emails.add(email.toLowerCase());
      }
    });
    info.emails = [...emails].slice(0, 15);

    // Extract addresses
    const addressPatterns = [
      /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln|Court|Ct|Place|Pl)\.?[,\s]+[\w\s]+,\s*CA\s*\d{5}/gi,
    ];
    const addresses = new Set();
    addressPatterns.forEach(pattern => {
      const matches = pageText.match(pattern) || [];
      matches.forEach(m => addresses.add(m.trim()));
    });
    info.addresses = [...addresses].slice(0, 5);

    // Extract hours of operation
    const hoursPatterns = [
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:-]+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
      /(?:m-f|mon-fri|monday-friday)[\s:]+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
    ];
    const hours = new Set();
    hoursPatterns.forEach(pattern => {
      const matches = pageText.match(pattern) || [];
      matches.forEach(m => hours.add(m.trim()));
    });
    info.hours = [...hours].slice(0, 5);

    // Extract department names
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    const deptKeywords = ['department', 'office', 'division', 'services', 'bureau', 'agency'];
    headings.forEach(h => {
      const text = h.innerText.toLowerCase();
      if (deptKeywords.some(kw => text.includes(kw))) {
        info.departments.push(h.innerText.trim());
      }
    });
    info.departments = [...new Set(info.departments)].slice(0, 20);

    // Extract service names
    const serviceKeywords = ['apply', 'request', 'report', 'pay', 'register', 'schedule', 'submit', 'file'];
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      const text = link.innerText.toLowerCase();
      if (serviceKeywords.some(kw => text.includes(kw)) && text.length < 100) {
        info.services.push({
          name: link.innerText.trim(),
          url: link.href,
        });
      }
    });
    info.services = info.services.slice(0, 20);

    // Extract events/calendar items
    const eventKeywords = ['event', 'meeting', 'workshop', 'class', 'program'];
    const dateRegex = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/gi;
    links.forEach(link => {
      const text = link.innerText.toLowerCase();
      if (eventKeywords.some(kw => text.includes(kw)) || dateRegex.test(text)) {
        info.events.push({
          name: link.innerText.trim().substring(0, 150),
          url: link.href,
        });
      }
    });
    info.events = info.events.slice(0, 15);

    // Extract important links
    const importantKeywords = ['police', 'fire', 'library', 'parks', 'recreation', 'housing', 'permit', 'utility', 'water', 'trash', 'garbage', 'emergency', 'council', 'meeting', 'schedule', 'fare', 'map', 'station', 'route'];
    links.forEach(link => {
      const text = link.innerText.toLowerCase();
      const href = link.href.toLowerCase();
      if ((importantKeywords.some(kw => text.includes(kw) || href.includes(kw))) && link.href.startsWith('http')) {
        info.links.push({
          name: link.innerText.trim().substring(0, 100),
          url: link.href,
        });
      }
    });
    const seenUrls = new Set();
    info.links = info.links.filter(l => {
      if (seenUrls.has(l.url)) return false;
      seenUrls.add(l.url);
      return true;
    }).slice(0, 30);

    // Extract main content (first 1000 chars of article/main content)
    const main = document.querySelector('main, article, [role="main"], .main-content, #main-content');
    if (main) {
      info.mainContent = main.innerText.substring(0, 1000);
    }

    return info;
  });
}

/**
 * Scrape a single entity
 */
async function scrapeEntity(page, entity) {
  const result = {
    name: entity.name,
    county: entity.county,
    type: entity.type,
    url: entity.url,
    scrapedAt: new Date().toISOString(),
    pages: {},
    allPhones: [],
    allEmails: [],
    allAddresses: [],
    departments: [],
    services: [],
    events: [],
    importantLinks: [],
    summary: '',
  };

  console.log(`\n[${entity.name}] Scraping ${entity.url}...`);

  const pagesToUse = entity.type === 'Regional Agency' ? REGIONAL_PAGES : CITY_PAGES;

  for (const pageConfig of pagesToUse) {
    const fullUrl = `${entity.url}${pageConfig.path}`;

    try {
      console.log(`  Trying ${pageConfig.name} (${pageConfig.path})...`);

      await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      const title = await page.title();
      if (title && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('not found')) {
        await sleep(1000);

        const pageInfo = await extractPageInfo(page);
        result.pages[pageConfig.name] = pageInfo;

        // Aggregate data
        result.allPhones.push(...pageInfo.phones);
        result.allEmails.push(...pageInfo.emails);
        result.allAddresses.push(...pageInfo.addresses);
        result.departments.push(...pageInfo.departments);
        result.services.push(...pageInfo.services);
        result.events.push(...pageInfo.events);
        result.importantLinks.push(...pageInfo.links);

        console.log(`    ✓ Found: ${pageInfo.phones.length} phones, ${pageInfo.emails.length} emails`);
        if (pageInfo.departments.length > 0) {
          console.log(`      Departments: ${pageInfo.departments.slice(0, 3).join(', ')}...`);
        }
        if (pageInfo.services.length > 0) {
          console.log(`      Services: ${pageInfo.services.slice(0, 3).map(s => s.name).join(', ')}...`);
        }
      } else {
        console.log(`    ✗ Page not found`);
      }
    } catch (e) {
      console.log(`    ✗ Error: ${e.message.substring(0, 50)}`);
    }

    await sleep(DELAY_BETWEEN_PAGES);
  }

  // Deduplicate
  result.allPhones = [...new Set(result.allPhones)];
  result.allEmails = [...new Set(result.allEmails)];
  result.allAddresses = [...new Set(result.allAddresses)];
  result.departments = [...new Set(result.departments)];

  // Dedupe services and events by URL
  const seenServiceUrls = new Set();
  result.services = result.services.filter(s => {
    if (seenServiceUrls.has(s.url)) return false;
    seenServiceUrls.add(s.url);
    return true;
  });

  const seenEventUrls = new Set();
  result.events = result.events.filter(e => {
    if (seenEventUrls.has(e.url)) return false;
    seenEventUrls.add(e.url);
    return true;
  });

  const seenLinkUrls = new Set();
  result.importantLinks = result.importantLinks.filter(l => {
    if (seenLinkUrls.has(l.url)) return false;
    seenLinkUrls.add(l.url);
    return true;
  });

  // Generate summary
  result.summary = `${entity.name}: ${result.allPhones.length} phones, ${result.allEmails.length} emails, ${result.departments.length} departments, ${result.services.length} services, ${result.events.length} events`;

  console.log(`  Summary: ${result.summary}`);

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('Bay Area Sample City Scraper');
  console.log('============================');
  console.log('Testing 5 representative sites to see what data we can extract.\n');

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('\nPlaywright is not installed. Install it with:');
    console.error('  npm install playwright');
    console.error('  npx playwright install chromium');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  });

  const results = [];

  for (const entity of SAMPLE_ENTITIES) {
    try {
      const result = await scrapeEntity(page, entity);
      results.push(result);
    } catch (e) {
      console.log(`  Error scraping ${entity.name}: ${e.message}`);
      results.push({
        name: entity.name,
        error: e.message,
        scrapedAt: new Date().toISOString(),
      });
    }

    await sleep(DELAY_BETWEEN_SITES);
  }

  await browser.close();

  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n============================');
  console.log('SAMPLE SCRAPE COMPLETE');
  console.log('============================');
  console.log(`Results saved to: ${OUTPUT_FILE}\n`);

  console.log('SUMMARY OF EXTRACTED DATA:');
  console.log('─'.repeat(50));

  for (const r of results) {
    if (r.error) {
      console.log(`\n${r.name}: ERROR - ${r.error}`);
    } else {
      console.log(`\n${r.name} (${r.type}):`);
      console.log(`  Phones: ${r.allPhones.length}`);
      console.log(`  Emails: ${r.allEmails.length}`);
      console.log(`  Addresses: ${r.allAddresses.length}`);
      console.log(`  Departments: ${r.departments.length}`);
      console.log(`  Services: ${r.services.length}`);
      console.log(`  Events: ${r.events.length}`);
      console.log(`  Important Links: ${r.importantLinks.length}`);
      console.log(`  Pages scraped: ${Object.keys(r.pages || {}).length}`);

      // Show sample data
      if (r.allEmails.length > 0) {
        console.log(`  Sample emails: ${r.allEmails.slice(0, 3).join(', ')}`);
      }
      if (r.departments.length > 0) {
        console.log(`  Sample depts: ${r.departments.slice(0, 3).join(', ')}`);
      }
      if (r.services.length > 0) {
        console.log(`  Sample services: ${r.services.slice(0, 3).map(s => s.name).join(', ')}`);
      }
    }
  }

  console.log('\n─'.repeat(50));
  console.log('Review the JSON output to decide what data Carl should focus on.');
  console.log('Then run the full scraper: node scripts/scrape-city-info.cjs');
}

main().catch(console.error);
