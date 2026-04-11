#!/usr/bin/env node
/**
 * Sync Municipal Codes from Bay Area Cities
 *
 * Scrapes municipal code content from various platforms:
 * - municipal.codes (Berkeley) - direct HTTP works
 * - municode (105 cities) - requires browser automation
 * - amlegal (SF, Palo Alto) - requires browser automation
 * - qcode (Sunnyvale) - requires browser automation
 *
 * Output: public/data/municipal-codes-content.json
 *
 * Usage:
 *   node scripts/sync-municipal-codes.cjs
 *   node scripts/sync-municipal-codes.cjs --verbose
 *   node scripts/sync-municipal-codes.cjs --city="Oakland"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_FILE = path.join(__dirname, '..', '..', 'public', 'data', 'municipal-codes-content.json');
const MUNICIPAL_CODES_JSON = path.join(__dirname, '..', '..', 'dist', 'api', 'municipal-codes.json');
const VERBOSE = process.argv.includes('--verbose');

// Parse --city argument
const cityArg = process.argv.find((arg) => arg.startsWith('--city='));
const SINGLE_CITY = cityArg ? cityArg.split('=')[1] : null;

// Common municipal code sections we want to scrape
// These are the topics users most commonly ask about
const SECTIONS_TO_SCRAPE = {
  noise: {
    title: 'Noise Ordinance',
    keywords: ['noise', 'loud', 'music', 'party', 'quiet hours', 'sound', 'decibel'],
    searchTerms: ['noise', 'sound', 'quiet hours'],
  },
  parking: {
    title: 'Parking Regulations',
    keywords: ['parking', 'RV', 'vehicle', 'street parking', 'overnight', 'permit'],
    searchTerms: ['parking', 'vehicle storage', 'street parking'],
  },
  pets: {
    title: 'Animal Regulations',
    keywords: ['dog', 'cat', 'pet', 'animal', 'license', 'barking', 'leash'],
    searchTerms: ['animals', 'dogs', 'pets', 'animal license'],
  },
  adu: {
    title: 'ADU/Accessory Dwelling Units',
    keywords: ['ADU', 'granny unit', 'accessory dwelling', 'in-law', 'secondary unit'],
    searchTerms: ['accessory dwelling', 'ADU', 'secondary unit'],
  },
  rental: {
    title: 'Rental/Tenant Protections',
    keywords: ['rent control', 'tenant', 'landlord', 'eviction', 'rental', 'just cause'],
    searchTerms: ['tenant', 'rent', 'landlord', 'eviction'],
  },
  shortterm: {
    title: 'Short-Term Rentals',
    keywords: ['airbnb', 'short-term', 'vacation rental', 'VRBO', 'transient occupancy'],
    searchTerms: ['short-term rental', 'transient occupancy', 'vacation rental'],
  },
  cannabis: {
    title: 'Cannabis Regulations',
    keywords: ['cannabis', 'marijuana', 'dispensary', 'cultivation'],
    searchTerms: ['cannabis', 'marijuana'],
  },
  trees: {
    title: 'Tree Regulations',
    keywords: ['tree', 'removal', 'heritage tree', 'protected tree', 'permit'],
    searchTerms: ['tree removal', 'heritage tree', 'protected tree'],
  },
  fences: {
    title: 'Fence Requirements',
    keywords: ['fence', 'setback', 'property line', 'height', 'wall'],
    searchTerms: ['fence', 'wall', 'setback'],
  },
  business: {
    title: 'Business Licenses',
    keywords: ['business license', 'home business', 'food truck', 'vendor', 'permit'],
    searchTerms: ['business license', 'home occupation'],
  },
};

/**
 * Make HTTPS/HTTP GET request
 */
function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(
      url,
      {
        headers: {
          'User-Agent': 'BayNavigator/1.0 (Municipal Code Sync)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            fetchUrl(res.headers.location, timeout).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Extract text content from HTML, removing tags
 */
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scrape Berkeley municipal.codes (works without browser)
 */
async function scrapeBerkeleyMunicipalCodes() {
  const results = {
    city: 'Berkeley',
    county: 'Alameda',
    platform: 'municipal.codes',
    baseUrl: 'https://berkeley.municipal.codes',
    sections: [],
    scraped: new Date().toISOString(),
  };

  // Berkeley's Table of Contents
  const tocUrl = 'https://berkeley.municipal.codes/BMC';

  try {
    const tocHtml = await fetchUrl(tocUrl);

    // Extract title numbers and names from TOC
    const titleMatches = tocHtml.matchAll(
      /href="\/BMC\/(\d+)"[^>]*>[\s\S]*?<span class="num">Title (\d+)<\/span>\s*<span class="name">([^<]+)<\/span>/gi
    );

    const titles = [];
    for (const match of titleMatches) {
      titles.push({
        num: match[2],
        name: match[3].trim(),
        url: `https://berkeley.municipal.codes/BMC/${match[1]}`,
      });
    }

    if (VERBOSE) console.log(`  Found ${titles.length} titles in Berkeley Municipal Code`);

    // Scrape each relevant title
    for (const title of titles) {
      // Check if this title matches any of our sections of interest
      const titleLower = title.name.toLowerCase();
      let sectionKey = null;

      for (const [key, section] of Object.entries(SECTIONS_TO_SCRAPE)) {
        if (
          section.keywords.some(
            (kw) =>
              titleLower.includes(kw.toLowerCase()) ||
              title.name.toLowerCase().includes(kw.toLowerCase())
          )
        ) {
          sectionKey = key;
          break;
        }
      }

      // Scrape titles that are commonly relevant
      const relevantTitles = [
        '9', // Health and Safety
        '10', // Vehicles and Traffic
        '12', // Animals
        '13', // Public Peace, Morals and Welfare (includes noise)
        '19', // Housing Code
        '23', // Zoning
      ];

      if (relevantTitles.includes(title.num) || sectionKey) {
        try {
          if (VERBOSE) console.log(`    Scraping Title ${title.num}: ${title.name}`);

          const titleHtml = await fetchUrl(title.url);

          // Extract chapter information
          const chapterMatches = titleHtml.matchAll(
            /<article[^>]*class="[^"]*level3[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<span class="num">([^<]+)<\/span>\s*<span class="name">([^<]+)<\/span>/gi
          );

          const chapters = [];
          for (const match of chapterMatches) {
            chapters.push({
              num: match[1].trim(),
              name: match[2].trim(),
            });
          }

          // Extract raw text content (summary)
          const textContent = extractText(titleHtml).substring(0, 5000);

          results.sections.push({
            titleNum: title.num,
            titleName: title.name,
            url: title.url,
            chapters: chapters.slice(0, 20), // Limit chapters
            summary: textContent.substring(0, 2000),
            category: sectionKey || 'general',
          });

          // Rate limit
          await new Promise((r) => setTimeout(r, 500));
        } catch (err) {
          if (VERBOSE) console.log(`    Error scraping Title ${title.num}: ${err.message}`);
        }
      }
    }

    console.log(`  ✅ Berkeley: ${results.sections.length} titles scraped`);
  } catch (err) {
    console.log(`  ❌ Berkeley: ${err.message}`);
  }

  return results;
}

/**
 * For Municode cities, we'll create stub entries with search URLs
 * Full scraping would require Playwright due to JavaScript rendering
 */
function createMunicodeStub(city) {
  const slug = city.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const searchBase = `https://library.municode.com/ca/${slug}/codes/code_of_ordinances`;

  return {
    city: city.name,
    county: city.county,
    platform: 'municode',
    baseUrl: city.municipalCodeUrl,
    note: 'Municode requires browser for full content. Use search URLs below.',
    searchUrls: Object.fromEntries(
      Object.entries(SECTIONS_TO_SCRAPE).map(([key, section]) => [
        key,
        {
          title: section.title,
          searchUrl: `${searchBase}?nodeId=search&searchText=${encodeURIComponent(section.searchTerms[0])}`,
        },
      ])
    ),
    scraped: new Date().toISOString(),
  };
}

/**
 * Main sync function
 */
async function syncMunicipalCodes() {
  console.log('🔄 Syncing municipal codes from Bay Area cities...\n');

  // Load the municipal codes list
  let municipalCodes;
  try {
    municipalCodes = JSON.parse(fs.readFileSync(MUNICIPAL_CODES_JSON, 'utf8'));
  } catch (err) {
    console.error('Error loading municipal-codes.json:', err.message);
    console.error('Run npm run build first to generate the file.');
    process.exit(1);
  }

  const cache = {
    generated: new Date().toISOString(),
    description: 'Municipal code content for Bay Area cities',
    totalCities: municipalCodes.codes.length,
    commonSections: SECTIONS_TO_SCRAPE,
    cities: {},
  };

  let scrapedCount = 0;
  let stubCount = 0;

  // Filter cities if --city argument provided
  const citiesToProcess = SINGLE_CITY
    ? municipalCodes.codes.filter((c) => c.name.toLowerCase() === SINGLE_CITY.toLowerCase())
    : municipalCodes.codes;

  if (SINGLE_CITY && citiesToProcess.length === 0) {
    console.error(`City "${SINGLE_CITY}" not found in municipal codes list.`);
    process.exit(1);
  }

  for (const city of citiesToProcess) {
    if (VERBOSE) console.log(`Processing ${city.name}...`);

    if (city.platform === 'municipal.codes') {
      // Berkeley - can scrape directly
      const results = await scrapeBerkeleyMunicipalCodes();
      cache.cities[city.name] = results;
      scrapedCount++;
    } else if (city.platform === 'municode') {
      // Municode - create stub with search URLs
      cache.cities[city.name] = createMunicodeStub(city);
      stubCount++;
    } else {
      // Other platforms (amlegal, qcode) - create basic stub
      cache.cities[city.name] = {
        city: city.name,
        county: city.county,
        platform: city.platform,
        baseUrl: city.municipalCodeUrl,
        note: `${city.platform} requires browser automation for full content.`,
        scraped: new Date().toISOString(),
      };
      stubCount++;
    }
  }

  // Calculate stats
  cache.stats = {
    fullySscraped: scrapedCount,
    stubsCreated: stubCount,
    total: scrapedCount + stubCount,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write cache file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2));

  const fileSizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);

  console.log(`
📊 Sync Complete
   Cities processed: ${scrapedCount + stubCount}
   - Fully scraped: ${scrapedCount}
   - Stubs created: ${stubCount}
   File size: ${fileSizeKB} KB
   Output: ${OUTPUT_FILE}
`);

  return cache;
}

// Run if called directly
if (require.main === module) {
  syncMunicipalCodes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncMunicipalCodes };
