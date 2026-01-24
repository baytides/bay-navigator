#!/usr/bin/env node
/**
 * Scrape cities without sitemaps using homepage crawling
 *
 * These 41 entities don't have standard sitemaps, so we:
 * 1. Load the homepage
 * 2. Extract navigation links
 * 3. Scrape important pages discovered
 *
 * Usage:
 *   node scripts/scrape-no-sitemap-cities.cjs --list
 *   node scripts/scrape-no-sitemap-cities.cjs --county=Alameda
 *   node scripts/scrape-no-sitemap-cities.cjs --all
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'city-info', 'no-sitemap');

// Entities without sitemaps (from our inventory)
const ENTITIES = [
  // Alameda County (8)
  { name: 'Albany', county: 'Alameda', url: 'https://www.albanyca.gov' },
  { name: 'Fremont', county: 'Alameda', url: 'https://www.fremont.gov' },
  { name: 'Hayward', county: 'Alameda', url: 'https://www.hayward-ca.gov' },
  { name: 'Livermore', county: 'Alameda', url: 'https://www.livermoreca.gov' },
  { name: 'Newark', county: 'Alameda', url: 'https://www.newark.org' },
  { name: 'Pleasanton', county: 'Alameda', url: 'https://www.cityofpleasantonca.gov' },

  // Contra Costa (8)
  { name: 'Brentwood', county: 'Contra Costa', url: 'https://www.brentwoodca.gov' },
  { name: 'Clayton', county: 'Contra Costa', url: 'https://www.ci.clayton.ca.us' },
  { name: 'Hercules', county: 'Contra Costa', url: 'https://www.ci.hercules.ca.us' },
  { name: 'Lafayette', county: 'Contra Costa', url: 'https://www.lovelafayette.org' },
  { name: 'Martinez', county: 'Contra Costa', url: 'https://www.cityofmartinez.org' },
  { name: 'Pinole', county: 'Contra Costa', url: 'https://www.ci.pinole.ca.us' },
  { name: 'Pittsburg', county: 'Contra Costa', url: 'https://www.pittsburgca.gov' },
  { name: 'Walnut Creek', county: 'Contra Costa', url: 'https://www.walnut-creek.org' },

  // Marin (7)
  { name: 'Marin County', county: 'Marin', url: 'https://www.marincounty.org', type: 'County' },
  { name: 'Belvedere', county: 'Marin', url: 'https://www.cityofbelvedere.org' },
  { name: 'Fairfax', county: 'Marin', url: 'https://www.townoffairfax.org' },
  { name: 'Novato', county: 'Marin', url: 'https://www.novato.org' },
  { name: 'Ross', county: 'Marin', url: 'https://www.townofross.org' },
  { name: 'San Rafael', county: 'Marin', url: 'https://www.cityofsanrafael.org' },
  { name: 'Sausalito', county: 'Marin', url: 'https://www.sausalito.gov' },

  // Napa (1)
  { name: 'Calistoga', county: 'Napa', url: 'https://www.ci.calistoga.ca.us' },

  // San Mateo (11)
  { name: 'San Mateo County', county: 'San Mateo', url: 'https://www.smcgov.org', type: 'County' },
  { name: 'Belmont', county: 'San Mateo', url: 'https://www.belmont.gov' },
  { name: 'Brisbane', county: 'San Mateo', url: 'https://www.brisbaneca.org' },
  { name: 'Colma', county: 'San Mateo', url: 'https://www.colma.ca.gov' },
  { name: 'East Palo Alto', county: 'San Mateo', url: 'https://www.cityofepa.org' },
  { name: 'Foster City', county: 'San Mateo', url: 'https://www.fostercity.org' },
  { name: 'Menlo Park', county: 'San Mateo', url: 'https://www.menlopark.gov' },
  { name: 'Pacifica', county: 'San Mateo', url: 'https://www.cityofpacifica.org' },
  { name: 'Portola Valley', county: 'San Mateo', url: 'https://www.portolavalley.net' },
  { name: 'Redwood City', county: 'San Mateo', url: 'https://www.redwoodcity.org' },
  { name: 'San Carlos', county: 'San Mateo', url: 'https://www.cityofsancarlos.org' },

  // Santa Clara (7)
  { name: 'Santa Clara County', county: 'Santa Clara', url: 'https://www.sccgov.org', type: 'County' },
  { name: 'Monte Sereno', county: 'Santa Clara', url: 'https://www.cityofmontesereno.org' },
  { name: 'Morgan Hill', county: 'Santa Clara', url: 'https://www.morganhill.ca.gov' },
  { name: 'Mountain View', county: 'Santa Clara', url: 'https://www.mountainview.gov' },
  { name: 'San Jose', county: 'Santa Clara', url: 'https://www.sanjoseca.gov' },
  { name: 'Santa Clara', county: 'Santa Clara', url: 'https://www.santaclaraca.gov' },
  { name: 'Sunnyvale', county: 'Santa Clara', url: 'https://www.sunnyvale.ca.gov' },

  // Solano (3)
  { name: 'Fairfield', county: 'Solano', url: 'https://www.fairfield.ca.gov' },
  { name: 'Rio Vista', county: 'Solano', url: 'https://www.riovistacity.com' },
  { name: 'Vacaville', county: 'Solano', url: 'https://www.cityofvacaville.com' },

  // Sonoma (3)
  { name: 'Petaluma', county: 'Sonoma', url: 'https://www.cityofpetaluma.org' },
  { name: 'Sebastopol', county: 'Sonoma', url: 'https://www.ci.sebastopol.ca.us' },
  { name: 'Sonoma', county: 'Sonoma', url: 'https://www.sonomacity.org' },

  // Regional (6 - excluding ones with Open Data portals)
  { name: 'ABAG', county: 'Regional', url: 'https://abag.ca.gov', type: 'Regional' },
  { name: 'BCDC', county: 'Regional', url: 'https://www.bcdc.ca.gov', type: 'Regional' },
  { name: 'AC Transit', county: 'Regional', url: 'https://www.actransit.org', type: 'Regional' },
  { name: 'BART', county: 'Regional', url: 'https://www.bart.gov', type: 'Regional' },
  { name: 'SFMTA', county: 'Regional', url: 'https://www.sfmta.com', type: 'Regional' },
  { name: 'VTA', county: 'Regional', url: 'https://www.vta.org', type: 'Regional' },
];

const DELAY_BETWEEN_PAGES = 1500;
const DELAY_BETWEEN_ENTITIES = 2500;
const MAX_PAGES_PER_ENTITY = 40;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Keywords for identifying important navigation links
const NAV_KEYWORDS = {
  contact: ['contact', 'reach', 'call', 'email'],
  departments: ['department', 'office', 'division', 'agency', 'staff'],
  services: ['service', 'resident', 'citizen', 'how do i', 'online', 'request'],
  calendar: ['calendar', 'event', 'meeting', 'agenda', 'schedule'],
  news: ['news', 'announcement', 'alert', 'press', 'update', 'notify'],
  emergency: ['emergency', 'police', 'fire', 'safety', '911'],
  housing: ['housing', 'rent', 'affordable', 'homeless'],
  library: ['library'],
  parks: ['park', 'recreation', 'facility', 'pool', 'community center'],
  utilities: ['utility', 'water', 'trash', 'garbage', 'sewer', 'bill', 'pay'],
  permits: ['permit', 'license', 'building', 'planning', 'zoning'],
  jobs: ['job', 'career', 'employment', 'work for us'],
  government: ['government', 'council', 'board', 'mayor', 'supervisor', 'commission'],
  transit: ['transit', 'schedule', 'route', 'fare', 'bus', 'train', 'station'],
  faq: ['faq', 'help', 'question', 'how to'],
};

/**
 * Extract navigation links from homepage
 */
async function discoverPages(page, baseUrl) {
  const discovered = new Map();

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1500);

    const links = await page.evaluate(({ base, keywords }) => {
      const results = [];
      const seen = new Set();
      const allLinks = document.querySelectorAll('a[href]');

      allLinks.forEach(link => {
        const href = link.href;
        const text = (link.innerText || link.textContent || '').trim().toLowerCase();

        // Skip external, empty, or duplicate links
        if (!href || !href.startsWith(base) || seen.has(href) || text.length < 2 || text.length > 100) return;
        seen.add(href);

        // Check if in navigation area
        const isNav = !!(link.closest('nav') || link.closest('header') || link.closest('[role="navigation"]') || link.closest('.nav') || link.closest('.menu'));

        // Find matching category
        let category = null;
        for (const [cat, words] of Object.entries(keywords)) {
          if (words.some(w => text.includes(w) || href.toLowerCase().includes(w))) {
            category = cat;
            break;
          }
        }

        if (category) {
          results.push({ url: href, text: text.substring(0, 60), category, isNav });
        }
      });

      return results;
    }, { base: baseUrl, keywords: NAV_KEYWORDS });

    // Prioritize nav links, dedupe by category
    for (const link of links) {
      const existing = discovered.get(link.category);
      if (!existing || (link.isNav && !existing.isNav)) {
        discovered.set(link.category, link);
      }
    }

    // Also add homepage
    discovered.set('homepage', { url: baseUrl, text: 'Homepage', category: 'homepage' });

  } catch (e) {
    console.log(`    Error discovering pages: ${e.message.substring(0, 50)}`);
  }

  return discovered;
}

/**
 * Extract info from a page
 */
async function extractPageInfo(page, url) {
  return await page.evaluate((pageUrl) => {
    const info = {
      url: pageUrl,
      title: document.title || '',
      description: '',
      content: '',
      phones: [],
      emails: [],
      addresses: [],
    };

    // Meta description
    const meta = document.querySelector('meta[name="description"]');
    if (meta) info.description = meta.content;

    // Main content
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
    let main = null;
    for (const sel of mainSelectors) {
      main = document.querySelector(sel);
      if (main) break;
    }
    info.content = (main || document.body).innerText.substring(0, 2000).trim();

    // Phones
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    info.phones = [...new Set((info.content.match(phoneRegex) || []))].slice(0, 10);

    // Emails
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const email = a.href.replace('mailto:', '').split('?')[0].toLowerCase();
      if (email.includes('@') && !info.emails.includes(email)) {
        info.emails.push(email);
      }
    });
    info.emails = info.emails.slice(0, 10);

    // Addresses
    const addrRegex = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln)\.?[,\s]+[\w\s]+,\s*CA\s*\d{5}/gi;
    info.addresses = [...new Set((info.content.match(addrRegex) || []))].slice(0, 5);

    return info;
  }, url);
}

/**
 * Scrape a single entity
 */
async function scrapeEntity(page, entity) {
  const result = {
    name: entity.name,
    county: entity.county,
    type: entity.type || 'City',
    url: entity.url,
    scrapedAt: new Date().toISOString(),
    pagesScraped: 0,
    pages: [],
    aggregated: { phones: new Set(), emails: new Set(), addresses: new Set() },
    error: null,
  };

  console.log(`\n[${entity.name}] Scraping ${entity.url}...`);

  try {
    // Discover pages from homepage
    const discovered = await discoverPages(page, entity.url);
    console.log(`  Discovered ${discovered.size} important pages`);

    // Scrape each discovered page
    for (const [category, link] of discovered) {
      try {
        await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const title = await page.title();

        if (title && !title.toLowerCase().includes('404')) {
          await sleep(500);
          const info = await extractPageInfo(page, link.url);
          info.category = category;
          result.pages.push(info);
          result.pagesScraped++;

          info.phones.forEach(p => result.aggregated.phones.add(p));
          info.emails.forEach(e => result.aggregated.emails.add(e));
          info.addresses.forEach(a => result.aggregated.addresses.add(a));
        }
      } catch (e) {
        // Page failed, continue
      }
      await sleep(DELAY_BETWEEN_PAGES);
    }

    result.aggregated.phones = [...result.aggregated.phones];
    result.aggregated.emails = [...result.aggregated.emails];
    result.aggregated.addresses = [...result.aggregated.addresses];

    console.log(`  Done: ${result.pagesScraped} pages, ${result.aggregated.phones.length} phones, ${result.aggregated.emails.length} emails`);

  } catch (e) {
    result.error = e.message;
    console.log(`  Error: ${e.message}`);
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const listMode = args.includes('--list');
  const allMode = args.includes('--all');
  const countyArg = args.find(a => a.startsWith('--county='));

  if (listMode) {
    const counties = [...new Set(ENTITIES.map(e => e.county))];
    console.log('Entities without sitemaps by county:\n');
    for (const county of counties) {
      const entities = ENTITIES.filter(e => e.county === county);
      console.log(`${county} (${entities.length}):`);
      entities.forEach(e => console.log(`  - ${e.name}: ${e.url}`));
      console.log();
    }
    console.log(`Total: ${ENTITIES.length} entities`);
    return;
  }

  if (!allMode && !countyArg) {
    console.log('No-Sitemap Cities Scraper');
    console.log('=========================\n');
    console.log('Usage:');
    console.log('  node scripts/scrape-no-sitemap-cities.cjs --list');
    console.log('  node scripts/scrape-no-sitemap-cities.cjs --county=Alameda');
    console.log('  node scripts/scrape-no-sitemap-cities.cjs --all\n');
    const counties = [...new Set(ENTITIES.map(e => e.county))];
    console.log('Counties:', counties.join(', '));
    return;
  }

  let entities;
  let outputFile;

  if (allMode) {
    entities = ENTITIES;
    outputFile = 'all-no-sitemap.json';
  } else {
    const county = countyArg.split('=')[1].replace(/"/g, '');
    entities = ENTITIES.filter(e => e.county.toLowerCase() === county.toLowerCase());
    outputFile = `${county.toLowerCase().replace(/\s+/g, '-')}.json`;

    if (entities.length === 0) {
      console.error(`No entities found for county: ${county}`);
      return;
    }
  }

  console.log(`Scraping ${entities.length} entities...`);

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const results = [];

  for (let i = 0; i < entities.length; i++) {
    console.log(`\n[${i + 1}/${entities.length}]`);
    const result = await scrapeEntity(page, entities[i]);
    results.push(result);

    // Save progress
    fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), JSON.stringify(results, null, 2));
    await sleep(DELAY_BETWEEN_ENTITIES);
  }

  await browser.close();

  // Summary
  const totalPages = results.reduce((sum, r) => sum + (r.pagesScraped || 0), 0);
  const totalPhones = results.reduce((sum, r) => sum + (r.aggregated?.phones?.length || 0), 0);
  const totalEmails = results.reduce((sum, r) => sum + (r.aggregated?.emails?.length || 0), 0);

  console.log('\n=========================');
  console.log('COMPLETE');
  console.log(`Entities: ${results.length}`);
  console.log(`Pages: ${totalPages}`);
  console.log(`Phones: ${totalPhones}`);
  console.log(`Emails: ${totalEmails}`);
  console.log(`Output: ${path.join(OUTPUT_DIR, outputFile)}`);
}

main().catch(console.error);
