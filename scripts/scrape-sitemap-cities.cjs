#!/usr/bin/env node
/**
 * Bay Area Sitemap-Based Scraper
 *
 * Scrapes cities/counties that have sitemaps available.
 * Run multiple instances in parallel by county.
 *
 * Usage:
 *   node scripts/scrape-sitemap-cities.cjs --county=Alameda
 *   node scripts/scrape-sitemap-cities.cjs --county=Regional
 *   node scripts/scrape-sitemap-cities.cjs --all
 *
 * Counties: Alameda, Contra Costa, Marin, Napa, San Francisco,
 *           San Mateo, Santa Clara, Solano, Sonoma, Regional
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'city-info', 'by-county');
const INVENTORY_FILE = path.join(__dirname, '..', 'data-exports', 'city-info', 'sitemaps-inventory.json');

// Rate limiting - be respectful
const DELAY_BETWEEN_PAGES = 1200; // 1.2 seconds between page scrapes
const DELAY_BETWEEN_ENTITIES = 2000; // 2 seconds between cities
const MAX_PAGES_PER_ENTITY = 60; // Maximum pages to scrape per city

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Keywords to filter sitemap URLs to important pages
 */
const IMPORTANT_KEYWORDS = [
  // Contact & Directory
  'contact', 'directory', 'staff', 'department', 'office', 'division',
  // Services
  'service', 'resident', 'citizen', 'how-do-i', 'online',
  // Calendar & Events
  'calendar', 'event', 'meeting', 'agenda', 'schedule',
  // News
  'news', 'announcement', 'alert', 'press', 'update',
  // Emergency & Safety
  'emergency', 'police', 'fire', 'safety', 'disaster',
  // Housing
  'housing', 'rent', 'affordable', 'homeless',
  // Library & Parks
  'library', 'park', 'recreation', 'facility',
  // Utilities
  'utility', 'water', 'trash', 'garbage', 'sewer', 'billing',
  // Permits & Planning
  'permit', 'license', 'building', 'planning', 'zoning',
  // Jobs
  'job', 'career', 'employment', 'human-resources',
  // Government
  'government', 'council', 'board', 'commission', 'mayor', 'supervisor',
  // Help
  'faq', 'help', 'question',
  // Transit (for regional)
  'transit', 'fare', 'route', 'station', 'schedule', 'clipper', 'ticket',
  // About
  'about', 'history', 'demographic',
];

/**
 * Filter sitemap URLs to only important pages
 */
function filterSitemapUrls(urls, baseUrl) {
  // Always include homepage
  const homepage = urls.find(u => {
    const path = u.replace(baseUrl, '').replace(/\/$/, '');
    return path === '' || path === '/';
  });

  const filtered = urls.filter(url => {
    const urlLower = url.toLowerCase();
    const path = urlLower.replace(baseUrl.toLowerCase(), '');

    // Skip very long URLs (usually deeply nested or parameter-heavy)
    if (path.length > 150) return false;

    // Skip common non-content pages
    if (path.includes('/image') || path.includes('/file') || path.includes('/download')) return false;
    if (path.includes('.pdf') || path.includes('.jpg') || path.includes('.png')) return false;
    if (path.includes('?') || path.includes('&')) return false; // Query params

    // Include if matches important keywords
    return IMPORTANT_KEYWORDS.some(kw => path.includes(kw));
  });

  // Ensure homepage is first
  const result = homepage ? [homepage] : [];

  // Add filtered URLs, avoiding duplicates
  for (const url of filtered) {
    if (!result.includes(url)) {
      result.push(url);
    }
  }

  return result.slice(0, MAX_PAGES_PER_ENTITY);
}

/**
 * Extract useful information from a page
 */
async function extractPageInfo(page, url) {
  return await page.evaluate((pageUrl) => {
    const info = {
      url: pageUrl,
      title: document.title || '',
      description: '',
      mainContent: '',
      phones: [],
      emails: [],
      addresses: [],
      hours: [],
      links: [],
    };

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      info.description = metaDesc.content;
    }

    // Get main content text (for context)
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.main-content'];
    let mainEl = null;
    for (const sel of mainSelectors) {
      mainEl = document.querySelector(sel);
      if (mainEl) break;
    }
    if (mainEl) {
      info.mainContent = mainEl.innerText.substring(0, 3000).trim();
    } else {
      info.mainContent = document.body.innerText.substring(0, 2000).trim();
    }

    // Extract phone numbers
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = [...new Set((info.mainContent.match(phoneRegex) || []))];
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
    info.emails = [...emails].slice(0, 10);

    // Extract addresses
    const addressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln|Court|Ct|Place|Pl)\.?[,\s]+[\w\s]+,\s*CA\s*\d{5}/gi;
    const addresses = [...new Set((info.mainContent.match(addressPattern) || []))];
    info.addresses = addresses.slice(0, 5);

    // Extract hours
    const hoursPatterns = [
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s:-]+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
      /(?:m-f|mon-fri|monday-friday)[\s:]+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
    ];
    const hours = new Set();
    hoursPatterns.forEach(pattern => {
      const matches = info.mainContent.match(pattern) || [];
      matches.forEach(m => hours.add(m.trim()));
    });
    info.hours = [...hours].slice(0, 5);

    // Extract important links from this page
    const importantKeywords = ['police', 'fire', 'library', 'parks', 'recreation', 'housing', 'permit', 'utility', 'emergency', 'council', 'contact', 'service'];
    const links = document.querySelectorAll('a[href]');
    const seenUrls = new Set();
    links.forEach(link => {
      const text = link.innerText.toLowerCase().trim();
      const href = link.href;
      if (href && href.startsWith('http') && !seenUrls.has(href) && text.length > 2 && text.length < 100) {
        if (importantKeywords.some(kw => text.includes(kw) || href.toLowerCase().includes(kw))) {
          seenUrls.add(href);
          info.links.push({
            text: link.innerText.trim().substring(0, 80),
            url: href,
          });
        }
      }
    });
    info.links = info.links.slice(0, 20);

    // Clean up mainContent to save space
    info.mainContent = info.mainContent.substring(0, 1500);

    return info;
  }, url);
}

/**
 * Scrape a single entity using its sitemap
 */
async function scrapeEntity(page, entity) {
  const result = {
    name: entity.name,
    county: entity.county,
    type: entity.type,
    url: entity.url,
    sitemapUrl: entity.sitemapUrl,
    totalSitemapUrls: entity.urlCount,
    scrapedAt: new Date().toISOString(),
    pagesScraped: 0,
    pages: [],
    aggregated: {
      phones: new Set(),
      emails: new Set(),
      addresses: new Set(),
    },
    error: null,
  };

  console.log(`\n[${ entity.name }] Starting scrape...`);
  console.log(`  Sitemap: ${entity.sitemapUrl} (${entity.urlCount} total URLs)`);

  try {
    // Fetch sitemap
    const response = await page.goto(entity.sitemapUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    if (!response || !response.ok()) {
      result.error = `Failed to fetch sitemap: ${response?.status()}`;
      return result;
    }

    const content = await page.content();
    const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
    const allUrls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));

    if (allUrls.length === 0) {
      result.error = 'No URLs found in sitemap';
      return result;
    }

    // Filter to important pages
    const urlsToScrape = filterSitemapUrls(allUrls, entity.url);
    console.log(`  Filtered to ${urlsToScrape.length} important pages`);

    // Scrape each page
    for (let i = 0; i < urlsToScrape.length; i++) {
      const url = urlsToScrape[i];

      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        const title = await page.title();
        if (title && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('not found')) {
          await sleep(500); // Brief wait for JS rendering

          const pageInfo = await extractPageInfo(page, url);
          result.pages.push(pageInfo);
          result.pagesScraped++;

          // Aggregate contact info
          pageInfo.phones.forEach(p => result.aggregated.phones.add(p));
          pageInfo.emails.forEach(e => result.aggregated.emails.add(e));
          pageInfo.addresses.forEach(a => result.aggregated.addresses.add(a));

          // Progress indicator every 10 pages
          if ((i + 1) % 10 === 0) {
            console.log(`  Progress: ${i + 1}/${urlsToScrape.length} pages`);
          }
        }
      } catch (e) {
        // Page load failed, continue to next
      }

      await sleep(DELAY_BETWEEN_PAGES);
    }

    // Convert Sets to Arrays
    result.aggregated.phones = [...result.aggregated.phones];
    result.aggregated.emails = [...result.aggregated.emails];
    result.aggregated.addresses = [...result.aggregated.addresses];

    console.log(`  Complete: ${result.pagesScraped} pages, ${result.aggregated.phones.length} phones, ${result.aggregated.emails.length} emails`);

  } catch (e) {
    result.error = e.message;
    console.log(`  Error: ${e.message}`);
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const countyArg = args.find(a => a.startsWith('--county='));
  const allMode = args.includes('--all');
  const listMode = args.includes('--list');

  // Load sitemap inventory
  if (!fs.existsSync(INVENTORY_FILE)) {
    console.error(`Sitemap inventory not found: ${INVENTORY_FILE}`);
    console.error('Run collect-sitemaps.cjs first');
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
  const withSitemap = inventory.filter(e => e.hasSitemap && e.urlCount > 5);

  // Get unique counties
  const counties = [...new Set(withSitemap.map(e => e.county))];

  if (listMode) {
    console.log('Available counties with sitemaps:');
    for (const county of counties) {
      const count = withSitemap.filter(e => e.county === county).length;
      console.log(`  --county=${county} (${count} entities)`);
    }
    console.log(`\nTotal: ${withSitemap.length} entities with sitemaps`);
    process.exit(0);
  }

  if (!countyArg && !allMode) {
    console.log('Bay Area Sitemap-Based Scraper');
    console.log('==============================');
    console.log('\nUsage:');
    console.log('  node scripts/scrape-sitemap-cities.cjs --county=COUNTY_NAME');
    console.log('  node scripts/scrape-sitemap-cities.cjs --all');
    console.log('  node scripts/scrape-sitemap-cities.cjs --list');
    console.log('\nAvailable counties:');
    for (const county of counties) {
      const count = withSitemap.filter(e => e.county === county).length;
      console.log(`  ${county} (${count} entities)`);
    }
    console.log('\nRun multiple counties in parallel in separate terminals!');
    process.exit(0);
  }

  // Filter entities
  let entities;
  let outputFileName;

  if (allMode) {
    entities = withSitemap;
    outputFileName = 'all-sitemap-cities.json';
    console.log(`Scraping ALL ${entities.length} entities with sitemaps`);
  } else {
    const county = countyArg.split('=')[1];
    entities = withSitemap.filter(e => e.county.toLowerCase() === county.toLowerCase());
    outputFileName = `${county.toLowerCase().replace(/\s+/g, '-')}.json`;

    if (entities.length === 0) {
      console.error(`No entities found with sitemaps for county: ${county}`);
      console.log('Available counties:', counties.join(', '));
      process.exit(1);
    }

    console.log(`Scraping ${entities.length} entities in ${county}`);
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load Playwright
  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('\nPlaywright is not installed. Run:');
    console.error('  npm install playwright');
    console.error('  npx playwright install chromium');
    process.exit(1);
  }

  // Launch browser
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Scrape all entities
  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    console.log(`\n[${i + 1}/${entities.length}] ${entity.name}`);

    const result = await scrapeEntity(page, entity);
    results.push(result);

    // Save progress after each entity
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    await sleep(DELAY_BETWEEN_ENTITIES);
  }

  await browser.close();

  // Final summary
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const totalPages = results.reduce((sum, r) => sum + (r.pagesScraped || 0), 0);
  const totalPhones = results.reduce((sum, r) => sum + (r.aggregated?.phones?.length || 0), 0);
  const totalEmails = results.reduce((sum, r) => sum + (r.aggregated?.emails?.length || 0), 0);

  console.log('\n==============================');
  console.log('SCRAPE COMPLETE');
  console.log('==============================');
  console.log(`Entities: ${results.length}`);
  console.log(`Pages scraped: ${totalPages}`);
  console.log(`Phones found: ${totalPhones}`);
  console.log(`Emails found: ${totalEmails}`);
  console.log(`Time elapsed: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
  console.log(`Output: ${path.join(OUTPUT_DIR, outputFileName)}`);
}

main().catch(console.error);
