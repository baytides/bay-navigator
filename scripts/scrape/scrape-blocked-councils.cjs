#!/usr/bin/env node
/**
 * Scrape city council data from sites that block regular HTTP requests
 * Uses Playwright to bypass Cloudflare/Akamai WAF protection
 *
 * Usage: node scripts/scrape-blocked-councils.cjs
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * These cities block curl/fetch with 403 Forbidden:
 * - Alameda, Albany, Fremont, Livermore, Newark, Oakland (Akamai WAF)
 * - Brentwood, Hercules, Martinez, Novato, Pittsburg, Walnut Creek (various WAFs)
 * - Fairfield, Suisun, Vacaville (Cloudflare/Akamai)
 *
 * Photos are downloaded to: public/images/officials/{city-slug}/{name-slug}.jpg
 */

const fs = require('fs');
const path = require('path');

// Directory for storing official photos (matches Flutter asset structure)
const PHOTOS_DIR = path.join(
  __dirname,
  '..',
  'apps',
  'assets',
  'images',
  'representatives',
  'local'
);
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'data-exports', 'city-councils');

// Cities that block regular HTTP requests
const BLOCKED_CITIES = [
  // Alameda County - Akamai protected
  {
    name: 'Oakland',
    url: 'https://www.oaklandca.gov',
    county: 'Alameda',
    councilPath: '/officials/city-council',
  },

  // Contra Costa County - Various WAFs
  {
    name: 'Brentwood',
    url: 'https://www.brentwoodca.gov',
    county: 'Contra Costa',
    councilPath: '/city-government/city-council',
  },
  {
    name: 'Hercules',
    url: 'https://www.ci.hercules.ca.us',
    county: 'Contra Costa',
    councilPath: '/government/city-council',
  },
  {
    name: 'Martinez',
    url: 'https://www.cityofmartinez.org',
    county: 'Contra Costa',
    councilPath: '/government/city_council',
  },
  {
    name: 'Pittsburg',
    url: 'https://www.pittsburgca.gov',
    county: 'Contra Costa',
    councilPath: '/government/city-council',
  },
  {
    name: 'Walnut Creek',
    url: 'https://www.walnut-creek.org',
    county: 'Contra Costa',
    councilPath: '/government/city-council',
  },

  // Marin County
  {
    name: 'Novato',
    url: 'https://www.novato.org',
    county: 'Marin',
    councilPath: '/government/city-council',
  },
  {
    name: 'Sausalito',
    url: 'https://www.sausalito.gov',
    county: 'Marin',
    councilPath: '/government/city-council',
  },

  // Napa County
  {
    name: 'American Canyon',
    url: 'https://www.americancanyon.gov',
    county: 'Napa',
    councilPath: '/government/city-council',
  },
  {
    name: 'Calistoga',
    url: 'https://ci.calistoga.ca.us',
    county: 'Napa',
    councilPath: '/government/city-council',
  },
  {
    name: 'Napa',
    url: 'https://www.cityofnapa.org',
    county: 'Napa',
    councilPath: '/government/city-council',
  },
  {
    name: 'St. Helena',
    url: 'https://www.cityofsthelena.org',
    county: 'Napa',
    councilPath: '/government/city-council',
  },
  {
    name: 'Yountville',
    url: 'https://www.townofyountville.com',
    county: 'Napa',
    councilPath: '/government/town-council',
  },

  // Sonoma County
  {
    name: 'Healdsburg',
    url: 'https://healdsburg.gov',
    county: 'Sonoma',
    councilPath: '/government/city-council',
  },
  {
    name: 'Santa Rosa',
    url: 'https://srcity.org',
    county: 'Sonoma',
    councilPath: '/government/city-council',
  },

  // Solano County
  {
    name: 'Fairfield',
    url: 'https://www.fairfield.ca.gov',
    county: 'Solano',
    councilPath: '/government/city-council',
  },
  {
    name: 'Suisun City',
    url: 'https://www.suisun.com',
    county: 'Solano',
    councilPath: '/government/city-council',
  },
  {
    name: 'Vacaville',
    url: 'https://www.cityofvacaville.com',
    county: 'Solano',
    councilPath: '/government/city-council',
  },
  {
    name: 'Vallejo',
    url: 'https://www.cityofvallejo.net',
    county: 'Solano',
    councilPath: '/government/city-council',
  },
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function downloadPhotoWithBrowser(page, imageUrl, countySlug, citySlug, nameSlug) {
  const cityDir = path.join(PHOTOS_DIR, countySlug, citySlug);
  fs.mkdirSync(cityDir, { recursive: true });

  const localPath = path.join(cityDir, `${nameSlug}.jpg`);
  const relativePath = `assets/images/representatives/local/${countySlug}/${citySlug}/${nameSlug}.jpg`;

  if (fs.existsSync(localPath)) {
    return relativePath;
  }

  try {
    // Use page.evaluate to fetch the image as a blob
    const imageBuffer = await page.evaluate(async (url) => {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    }, imageUrl);

    if (imageBuffer && imageBuffer.length > 1024) {
      fs.writeFileSync(localPath, Buffer.from(imageBuffer));
      return relativePath;
    }
  } catch (e) {
    // Ignore download errors
  }

  return null;
}

async function scrapeCouncilPage(page, city) {
  const officials = [];

  // Try multiple council page paths
  const paths = [
    city.councilPath,
    '/city-council',
    '/government/city-council',
    '/your-government/city-council',
    '/elected-officials',
    '/officials/city-council',
  ];

  let pageLoaded = false;

  for (const pagePath of paths) {
    try {
      const url = `${city.url}${pagePath}`;
      console.log(`  Trying ${url}...`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check if we got a real page (not 404 or error)
      const title = await page.title();
      if (title && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('error')) {
        pageLoaded = true;
        console.log(`  Loaded: ${title}`);
        break;
      }
    } catch (e) {
      // Try next path
    }
  }

  if (!pageLoaded) {
    console.log(`  Could not load any council page`);
    return officials;
  }

  // Wait for any dynamic content
  await page.waitForTimeout(2000);

  // Extract council member data using multiple strategies
  const councilData = await page.evaluate(() => {
    const results = [];

    // Strategy 1: Look for structured council member cards/sections
    const cardSelectors = [
      '.council-member',
      '.elected-official',
      '.staff-member',
      '.team-member',
      '[class*="council"]',
      '[class*="official"]',
      '.views-row',
      'article',
    ];

    for (const selector of cardSelectors) {
      const cards = document.querySelectorAll(selector);
      for (const card of cards) {
        // Look for a name (usually in a heading)
        const nameEl = card.querySelector('h2, h3, h4, h5, .name, .title, [class*="name"]');
        if (!nameEl) continue;

        const name = nameEl.textContent.trim();
        // Must look like a person's name (capitalized words with spaces)
        if (!name || !/^[A-Z][a-z]+ [A-Z]/.test(name)) continue;

        // Look for title/role
        let title = 'Council Member';
        const text = card.textContent;
        if (/mayor/i.test(text) && !/vice/i.test(text)) title = 'Mayor';
        else if (/vice\s*mayor/i.test(text)) title = 'Vice Mayor';
        else if (/president/i.test(text)) title = 'President';
        else if (/supervisor/i.test(text)) title = 'Supervisor';

        // Look for photo
        const img = card.querySelector('img');
        let photoUrl = null;
        if (img && img.src && !img.src.includes('placeholder') && !img.src.includes('default')) {
          photoUrl = img.src;
        }

        // Look for email
        const emailLink = card.querySelector('a[href^="mailto:"]');
        const email = emailLink ? emailLink.href.replace('mailto:', '') : null;

        // Look for phone
        const phoneMatch = card.textContent.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const phone = phoneMatch ? phoneMatch[0] : null;

        results.push({ name, title, email, phone, photoUrl });
      }

      if (results.length >= 3) break; // Found enough council members
    }

    // Strategy 2: If no cards found, look for a list or table
    if (results.length === 0) {
      const headings = document.querySelectorAll('h2, h3, h4');
      for (const h of headings) {
        const name = h.textContent.trim();
        if (/^[A-Z][a-z]+ [A-Z]/.test(name)) {
          const nextEl = h.nextElementSibling;
          let title = 'Council Member';
          if (nextEl && /mayor|council|supervisor/i.test(nextEl.textContent)) {
            if (/mayor/i.test(nextEl.textContent) && !/vice/i.test(nextEl.textContent))
              title = 'Mayor';
            else if (/vice\s*mayor/i.test(nextEl.textContent)) title = 'Vice Mayor';
          }

          // Look for nearby image
          const parent = h.parentElement;
          const img = parent ? parent.querySelector('img') : null;
          const photoUrl = img ? img.src : null;

          results.push({ name, title, photoUrl });
        }
      }
    }

    // Dedupe by name
    const seen = new Set();
    return results.filter((r) => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });
  });

  console.log(`  Found ${councilData.length} officials`);

  // Download photos
  for (const official of councilData) {
    if (official.photoUrl) {
      const countySlug = slugify(city.county);
      const citySlug = slugify(city.name);
      const nameSlug = slugify(official.name).replace(/-+/g, '_');
      const localPhotoPath = await downloadPhotoWithBrowser(
        page,
        official.photoUrl,
        countySlug,
        citySlug,
        nameSlug
      );
      if (localPhotoPath) {
        official.localPhotoPath = localPhotoPath;
        console.log(`    Downloaded photo for ${official.name}`);
      }
    }
    console.log(`    Found: ${official.name} - ${official.title}`);
    officials.push(official);
  }

  return officials;
}

async function main() {
  console.log('Playwright-based Council Scraper (for blocked sites)');
  console.log('====================================================');
  console.log(`Scraping ${BLOCKED_CITIES.length} cities...`);

  // Check if Playwright is available
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
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });

  const results = {};

  for (const city of BLOCKED_CITIES) {
    console.log(`\n[${city.name}] Scraping ${city.url}...`);

    const result = {
      city: city.name,
      county: city.county,
      url: city.url,
      officials: [],
      error: null,
      scrapedAt: new Date().toISOString(),
    };

    try {
      const page = await context.newPage();

      // Set extra headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      });

      result.officials = await scrapeCouncilPage(page, city);

      if (result.officials.length === 0) {
        result.error = 'No officials found';
      }

      await page.close();
    } catch (e) {
      result.error = e.message;
      console.log(`  Error: ${e.message}`);
    }

    results[city.name] = result;

    // Rate limit
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();

  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'blocked-sites-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Summary
  console.log('\n====================================================');
  console.log(`Saved results to ${outputPath}`);

  let totalCities = 0;
  let totalOfficials = 0;
  const byCounty = {};

  for (const [name, data] of Object.entries(results)) {
    if (data.officials && data.officials.length > 0) {
      totalCities++;
      totalOfficials += data.officials.length;

      if (!byCounty[data.county]) {
        byCounty[data.county] = { cities: 0, officials: 0 };
      }
      byCounty[data.county].cities++;
      byCounty[data.county].officials += data.officials.length;
    }
  }

  console.log(`Total cities: ${BLOCKED_CITIES.length}`);
  console.log(`Cities with data: ${totalCities}`);
  console.log(`Total officials: ${totalOfficials}`);
  console.log('\nBy County:');
  for (const [county, stats] of Object.entries(byCounty)) {
    console.log(`  ${county}: ${stats.cities} cities, ${stats.officials} officials`);
  }
}

main().catch(console.error);
