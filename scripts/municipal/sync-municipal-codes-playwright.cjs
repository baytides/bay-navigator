#!/usr/bin/env node
/**
 * Sync Municipal Codes using Playwright
 *
 * Uses browser automation to bypass Cloudflare and JavaScript-rendered content.
 * Downloads COMPLETE table of contents from Bay Area municipal codes.
 *
 * Output: public/data/municipal-codes-content.json
 *
 * Usage:
 *   node scripts/sync-municipal-codes-playwright.cjs
 *   node scripts/sync-municipal-codes-playwright.cjs --city="Oakland"
 *   node scripts/sync-municipal-codes-playwright.cjs --verbose
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(
  __dirname,
  '..',
  '..',
  'public',
  'data',
  'municipal-codes-content.json'
);
const MUNICIPAL_CODES_JSON = path.join(
  __dirname,
  '..',
  '..',
  'public',
  'api',
  'municipal-codes.json'
);
const VERBOSE = process.argv.includes('--verbose');

// Parse --city argument
const cityArg = process.argv.find((arg) => arg.startsWith('--city='));
const SINGLE_CITY = cityArg ? cityArg.split('=')[1] : null;

// Common section keywords for categorization (used for quick lookups, not for limiting scraping)
const SECTION_CATEGORIES = {
  noise: ['noise', 'loud', 'sound', 'quiet hours', 'decibel', 'peace', 'morals'],
  parking: ['parking', 'vehicle', 'traffic', 'street parking', 'overnight', 'motor vehicle'],
  pets: ['animal', 'dog', 'cat', 'pet', 'license', 'barking'],
  building: [
    'building',
    'construction',
    'permit',
    'inspection',
    'structural',
    'electrical',
    'plumbing',
  ],
  adu: ['accessory dwelling', 'ADU', 'granny', 'secondary unit', 'in-law'],
  zoning: ['zoning', 'land use', 'setback', 'density', 'lot coverage', 'height limit'],
  rental: ['rent', 'tenant', 'landlord', 'eviction', 'just cause', 'relocation'],
  cannabis: ['cannabis', 'marijuana', 'dispensary', 'cultivation'],
  trees: ['tree', 'heritage tree', 'protected tree', 'removal', 'urban forest'],
  health: ['health', 'safety', 'sanitation', 'nuisance', 'abatement'],
  business: ['business license', 'home occupation', 'commercial', 'vendor', 'food truck'],
  signs: ['sign', 'signage', 'banner', 'advertising', 'billboard'],
  fences: ['fence', 'wall', 'property line', 'hedge'],
  fire: ['fire', 'fire code', 'sprinkler', 'alarm', 'emergency'],
  utilities: ['water', 'sewer', 'garbage', 'trash', 'recycling', 'utility'],
  subdivision: ['subdivision', 'parcel', 'lot split', 'map'],
  environmental: ['environmental', 'stormwater', 'erosion', 'grading', 'CEQA'],
  historic: ['historic', 'preservation', 'landmark', 'heritage'],
  alcohol: ['alcohol', 'liquor', 'ABC', 'bar', 'nightclub'],
  shortterm: ['short-term', 'airbnb', 'vacation rental', 'VRBO', 'transient'],
};

// Priority cities - largest and most frequently queried
const PRIORITY_CITIES = [
  'San Francisco',
  'Oakland',
  'San Jose',
  'Fremont',
  'Berkeley',
  'Santa Rosa',
  'Hayward',
  'Sunnyvale',
  'Concord',
  'Santa Clara',
  'Vallejo',
  'Richmond',
  'Antioch',
  'Daly City',
  'San Mateo',
  'Mountain View',
  'Palo Alto',
  'Redwood City',
];

/**
 * Get full hierarchical TOC from Municode city
 */
async function getMunicodeTOC(page, city, baseUrl) {
  // Municode URLs need /codes/code_of_ordinances appended if not already present.
  // Use URL parsing rather than substring match so an attacker can't smuggle a
  // path like https://evil.com/library.municode.com/.
  let fullUrl = baseUrl;
  let host;
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    host = '';
  }
  const isMunicode = host === 'library.municode.com' || host.endsWith('.library.municode.com');
  if (isMunicode && !baseUrl.includes('/codes/')) {
    fullUrl = baseUrl.replace(/\/?$/, '/codes/code_of_ordinances');
  }

  if (VERBOSE) console.log(`    Loading TOC from ${fullUrl}`);

  await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // First, get all titles (top-level sections)
  const titles = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('a[href*="nodeId"]').forEach((a) => {
      const text = a.textContent?.trim().replace(/\s+/g, ' ');
      const href = a.href;
      if (
        text &&
        text.length > 3 &&
        href.includes('nodeId=') &&
        !results.find((r) => r.href === href)
      ) {
        // Determine depth by checking parent elements or text patterns
        const isTitle =
          /^(TITLE|DIVISION|PART|APPENDIX)\s/i.test(text) ||
          /^[A-Z\s]+$/.test(text.substring(0, 30));
        results.push({
          text: text.substring(0, 250),
          href,
          level: isTitle ? 'title' : 'chapter',
        });
      }
    });
    return results;
  });

  return titles;
}

/**
 * Get chapter content from a Municode page
 */
async function getMunicodeChapterContent(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  const content = await page.evaluate(() => {
    // Get subchapters/sections from TOC
    const chapters = [];
    document.querySelectorAll('a[href*="nodeId"]').forEach((a) => {
      const text = a.textContent?.trim().replace(/\s+/g, ' ');
      if (text && text.length > 5 && text.length < 200) {
        chapters.push(text);
      }
    });

    // Get any actual code text visible
    const codeText = document.querySelector(
      '.chunk-content, .CodeSection, article, .content-chunk'
    );
    const summary = codeText?.textContent?.trim().substring(0, 3000) || '';

    return {
      chapters: chapters.slice(0, 20),
      summary,
    };
  });

  return content;
}

/**
 * Scrape a Municode city - get COMPLETE table of contents
 */
async function scrapeMunicode(page, city, baseUrl) {
  const results = {
    city: city.name,
    county: city.county,
    platform: 'municode',
    baseUrl: baseUrl,
    titles: [], // Full hierarchical structure
    scraped: new Date().toISOString(),
  };

  try {
    // Get the initial TOC
    const initialToc = await getMunicodeTOC(page, city, baseUrl);
    if (VERBOSE) console.log(`    Found ${initialToc.length} initial TOC entries`);

    // Filter to get titles (top-level sections)
    const titleEntries = initialToc.filter((t) => {
      const textLower = t.text.toLowerCase();
      return (
        textLower.startsWith('title') ||
        textLower.startsWith('division') ||
        textLower.startsWith('part') ||
        textLower.startsWith('appendix') ||
        /^[A-Z][A-Z\s]+$/.test(t.text.substring(0, 20))
      );
    });

    if (VERBOSE) console.log(`    Found ${titleEntries.length} titles to process`);

    // Process each title to get its chapters
    for (const title of titleEntries.slice(0, 30)) {
      // Limit to 30 titles
      try {
        if (VERBOSE) console.log(`      Processing: ${title.text.substring(0, 60)}...`);

        const titleData = {
          name: title.text.substring(0, 200),
          url: title.href,
          chapters: [],
          categories: categorizeSection(title.text),
        };

        // Navigate to title page to get chapters
        await page.goto(title.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);

        const chapters = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('a[href*="nodeId"]').forEach((a) => {
            const text = a.textContent?.trim().replace(/\s+/g, ' ');
            const href = a.href;
            if (
              text &&
              text.length > 3 &&
              text.length < 250 &&
              href.includes('nodeId=') &&
              !results.find((r) => r.href === href)
            ) {
              results.push({ name: text, url: href });
            }
          });
          return results.slice(0, 50); // Limit chapters per title
        });

        titleData.chapters = chapters.map((ch) => ({
          name: ch.name,
          url: ch.url,
          categories: categorizeSection(ch.name),
        }));

        results.titles.push(titleData);

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        if (VERBOSE) console.log(`      Error processing title: ${err.message}`);
        // Still add the title even if we couldn't get chapters
        results.titles.push({
          name: title.text.substring(0, 200),
          url: title.href,
          chapters: [],
          categories: categorizeSection(title.text),
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ ${city.name} TOC: ${err.message}`);
  }

  return results;
}

/**
 * Categorize a section based on its name
 */
function categorizeSection(text) {
  const textLower = text.toLowerCase();
  const categories = [];

  for (const [category, keywords] of Object.entries(SECTION_CATEGORIES)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        if (!categories.includes(category)) {
          categories.push(category);
        }
        break;
      }
    }
  }

  return categories;
}

/**
 * Scrape Berkeley using municipal.codes - get COMPLETE table of contents
 */
async function scrapeBerkeley(page) {
  const results = {
    city: 'Berkeley',
    county: 'Alameda',
    platform: 'municipal.codes',
    baseUrl: 'https://berkeley.municipal.codes',
    titles: [],
    scraped: new Date().toISOString(),
  };

  try {
    await page.goto('https://berkeley.municipal.codes/BMC', {
      waitUntil: 'networkidle',
      timeout: 45000,
    });
    await page.waitForTimeout(3000);

    // Extract all titles
    const titlesList = await page.evaluate(() => {
      const titles = [];
      document.querySelectorAll('a[href^="/BMC/"]').forEach((a) => {
        const match = a.href.match(/\/BMC\/(\d+)$/);
        if (match) {
          const nameSpan = a.querySelector('.name');
          const numSpan = a.querySelector('.num');
          if (nameSpan) {
            titles.push({
              num: numSpan?.textContent?.trim() || match[1],
              name: nameSpan.textContent.trim(),
              url: a.href,
            });
          }
        }
      });
      return titles;
    });

    if (VERBOSE) console.log(`    Found ${titlesList.length} titles`);

    // Process ALL titles to get their chapters
    for (const title of titlesList) {
      try {
        if (VERBOSE) console.log(`    Processing Title ${title.num}: ${title.name}`);

        const titleData = {
          name: `Title ${title.num} - ${title.name}`,
          url: title.url,
          chapters: [],
          categories: categorizeSection(title.name),
        };

        await page.goto(title.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);

        const chapters = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('a[href*="/BMC/"]').forEach((a) => {
            const text = a.textContent?.trim();
            const href = a.href;
            if (
              text &&
              text.length > 5 &&
              text.length < 200 &&
              !results.find((r) => r.name === text)
            ) {
              results.push({ name: text, url: href });
            }
          });
          return results.slice(0, 30);
        });

        titleData.chapters = chapters.map((ch) => ({
          name: ch.name,
          url: ch.url,
          categories: categorizeSection(ch.name),
        }));

        results.titles.push(titleData);

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        if (VERBOSE) console.log(`    Error scraping Title ${title.num}: ${err.message}`);
        // Still add the title
        results.titles.push({
          name: `Title ${title.num} - ${title.name}`,
          url: title.url,
          chapters: [],
          categories: categorizeSection(title.name),
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ Berkeley: ${err.message}`);
  }

  return results;
}

/**
 * Scrape San Francisco using amlegal - get ALL codes
 */
async function scrapeSanFrancisco(page) {
  const results = {
    city: 'San Francisco',
    county: 'San Francisco',
    platform: 'amlegal',
    baseUrl: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/overview',
    titles: [],
    scraped: new Date().toISOString(),
  };

  // San Francisco has multiple code books
  const sfCodes = [
    {
      name: 'Administrative Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_admin/0-0-0-1',
    },
    {
      name: 'Building Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_building/0-0-0-1',
    },
    {
      name: 'Business and Tax Regulations Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_business/0-0-0-1',
    },
    {
      name: 'Campaign and Governmental Conduct Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_campaign/0-0-0-1',
    },
    {
      name: 'Charter',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_charter/0-0-0-1',
    },
    {
      name: 'Electrical Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_electrical/0-0-0-1',
    },
    {
      name: 'Environment Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_environment/0-0-0-1',
    },
    {
      name: 'Fire Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_fire/0-0-0-1',
    },
    {
      name: 'Green Building Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_green/0-0-0-1',
    },
    {
      name: 'Health Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_health/0-0-0-1',
    },
    {
      name: 'Housing Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_housing/0-0-0-1',
    },
    {
      name: 'Mechanical Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_mechanical/0-0-0-1',
    },
    {
      name: 'Park Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_park/0-0-0-1',
    },
    {
      name: 'Planning Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_planning/0-0-0-1',
    },
    {
      name: 'Plumbing Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_plumbing/0-0-0-1',
    },
    {
      name: 'Police Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_police/0-0-0-1',
    },
    {
      name: 'Public Works Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_publicworks/0-0-0-1',
    },
    {
      name: 'Subdivision Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_subdivision/0-0-0-1',
    },
    {
      name: 'Transportation Code',
      url: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/sf_transportation/0-0-0-1',
    },
  ];

  for (const codeBook of sfCodes) {
    try {
      if (VERBOSE) console.log(`    Loading ${codeBook.name}...`);

      await page.goto(codeBook.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2000);

      // Wait for Cloudflare to pass
      await page
        .waitForSelector('body:not(:has(.cf-browser-verification))', { timeout: 10000 })
        .catch(() => {});

      const chapters = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('a[href*="/sf_"]').forEach((a) => {
          const text = a.textContent?.trim();
          const href = a.href;
          if (
            text &&
            text.length > 5 &&
            text.length < 200 &&
            !results.find((r) => r.name === text)
          ) {
            results.push({ name: text, url: href });
          }
        });
        return results.slice(0, 50);
      });

      results.titles.push({
        name: codeBook.name,
        url: codeBook.url,
        isCodeType: true,
        chapters: chapters.map((ch) => ({
          name: ch.name,
          url: ch.url,
          categories: categorizeSection(ch.name),
        })),
        categories: categorizeSection(codeBook.name),
      });

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      if (VERBOSE) console.log(`    Error scraping ${codeBook.name}: ${err.message}`);
      // Still add the code book entry
      results.titles.push({
        name: codeBook.name,
        url: codeBook.url,
        isCodeType: true,
        chapters: [],
        categories: categorizeSection(codeBook.name),
      });
    }
  }

  return results;
}

/**
 * Scrape Palo Alto using amlegal - get COMPLETE table of contents
 */
async function scrapePaloAlto(page) {
  const results = {
    city: 'Palo Alto',
    county: 'Santa Clara',
    platform: 'amlegal',
    baseUrl: 'https://codelibrary.amlegal.com/codes/paloalto/latest/overview',
    titles: [],
    scraped: new Date().toISOString(),
  };

  try {
    await page.goto('https://codelibrary.amlegal.com/codes/paloalto/latest/paloalto_ca/0-0-0-1', {
      waitUntil: 'networkidle',
      timeout: 45000,
    });
    await page.waitForTimeout(3000);

    const toc = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a[href*="/paloalto"]').forEach((a) => {
        const text = a.textContent?.trim();
        const href = a.href;
        if (text && text.length > 3 && text.length < 250 && !items.find((i) => i.text === text)) {
          const isTitle = /^title/i.test(text) || /^division/i.test(text);
          items.push({ text, href, isTitle });
        }
      });
      return items;
    });

    if (VERBOSE) console.log(`    Found ${toc.length} TOC entries`);

    // Build hierarchical structure
    let currentTitle = null;

    for (const item of toc) {
      if (item.isTitle) {
        if (currentTitle) {
          results.titles.push(currentTitle);
        }
        currentTitle = {
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        };
      } else if (currentTitle) {
        currentTitle.chapters.push({
          name: item.text,
          url: item.href,
          categories: categorizeSection(item.text),
        });
      } else {
        results.titles.push({
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        });
      }
    }

    if (currentTitle) {
      results.titles.push(currentTitle);
    }
  } catch (err) {
    console.log(`  ❌ Palo Alto: ${err.message}`);
  }

  return results;
}

/**
 * Scrape Sunnyvale using qcode - get COMPLETE table of contents
 */
async function scrapeSunnyvale(page) {
  const results = {
    city: 'Sunnyvale',
    county: 'Santa Clara',
    platform: 'qcode',
    baseUrl: 'https://qcode.us/codes/sunnyvale/',
    titles: [],
    scraped: new Date().toISOString(),
  };

  try {
    await page.goto('https://qcode.us/codes/sunnyvale/', {
      waitUntil: 'networkidle',
      timeout: 45000,
    });
    await page.waitForTimeout(3000);

    const toc = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a[href*="sunnyvale"]').forEach((a) => {
        const text = a.textContent?.trim();
        const href = a.href;
        if (text && text.length > 3 && text.length < 250 && !items.find((i) => i.text === text)) {
          const isTitle = /^title/i.test(text) || /^division/i.test(text);
          items.push({ text, href, isTitle });
        }
      });
      return items;
    });

    if (VERBOSE) console.log(`    Found ${toc.length} TOC entries`);

    // Build hierarchical structure
    let currentTitle = null;

    for (const item of toc) {
      if (item.isTitle) {
        if (currentTitle) {
          results.titles.push(currentTitle);
        }
        currentTitle = {
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        };
      } else if (currentTitle) {
        currentTitle.chapters.push({
          name: item.text,
          url: item.href,
          categories: categorizeSection(item.text),
        });
      } else {
        results.titles.push({
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        });
      }
    }

    if (currentTitle) {
      results.titles.push(currentTitle);
    }
  } catch (err) {
    console.log(`  ❌ Sunnyvale: ${err.message}`);
  }

  return results;
}

/**
 * Scrape a Code Publishing city - get COMPLETE table of contents
 */
async function scrapeCodePublishing(page, city) {
  const results = {
    city: city.name,
    county: city.county,
    platform: 'codepublishing',
    baseUrl: city.municipalCodeUrl,
    titles: [],
    scraped: new Date().toISOString(),
  };

  try {
    await page.goto(city.municipalCodeUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    // Get initial TOC - Code Publishing lists titles on main page
    const titleLinks = await page.evaluate(() => {
      const items = [];
      // Code Publishing typically has title links in the main nav
      document.querySelectorAll('a').forEach((a) => {
        const text = a.textContent?.trim();
        const href = a.href;
        // Match title links (e.g., "Title 1 GENERAL PROVISIONS")
        if (text && /^Title\s+\d+/i.test(text) && href.includes('.html')) {
          items.push({ text, href });
        }
      });
      return items;
    });

    if (VERBOSE) console.log(`    Found ${titleLinks.length} title links`);

    // Navigate to each title to get its chapters
    for (const title of titleLinks.slice(0, 30)) {
      try {
        if (VERBOSE) console.log(`      Processing: ${title.text.substring(0, 50)}...`);

        const titleData = {
          name: title.text,
          url: title.href,
          chapters: [],
          categories: categorizeSection(title.text),
        };

        await page.goto(title.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);

        // Get chapters within this title
        const chapters = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('a').forEach((a) => {
            const text = a.textContent?.trim();
            const href = a.href;
            // Match chapter links
            if (
              text &&
              text.length > 5 &&
              text.length < 250 &&
              (text.includes('Chapter') ||
                text.includes('CHAPTER') ||
                /^\d+\.\d+/.test(text) ||
                /^Article/i.test(text)) &&
              href.includes('.html') &&
              !results.find((r) => r.name === text)
            ) {
              results.push({ name: text, url: href });
            }
          });
          return results.slice(0, 50);
        });

        titleData.chapters = chapters.map((ch) => ({
          name: ch.name,
          url: ch.url,
          categories: categorizeSection(ch.name),
        }));

        results.titles.push(titleData);

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        if (VERBOSE) console.log(`      Error processing title: ${err.message}`);
        results.titles.push({
          name: title.text,
          url: title.href,
          chapters: [],
          categories: categorizeSection(title.text),
        });
      }
    }

    // If no titles found with the Title pattern, fall back to any navigation structure
    if (results.titles.length === 0) {
      await page.goto(city.municipalCodeUrl, { waitUntil: 'networkidle', timeout: 45000 });
      const fallbackToc = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('a[href*=".html"]').forEach((a) => {
          const text = a.textContent?.trim();
          const href = a.href;
          if (text && text.length > 5 && text.length < 250 && !items.find((i) => i.text === text)) {
            items.push({ text, href });
          }
        });
        return items.slice(0, 50);
      });

      results.titles = fallbackToc.map((item) => ({
        name: item.text,
        url: item.href,
        chapters: [],
        categories: categorizeSection(item.text),
      }));
    }
  } catch (err) {
    if (VERBOSE) console.log(`    Error: ${err.message}`);
  }

  return results;
}

/**
 * Scrape a QCode city - get COMPLETE table of contents
 */
async function scrapeQCode(page, city) {
  const results = {
    city: city.name,
    county: city.county,
    platform: 'qcode',
    baseUrl: city.municipalCodeUrl,
    titles: [],
    scraped: new Date().toISOString(),
  };

  try {
    await page.goto(city.municipalCodeUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    // Get full TOC
    const toc = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a').forEach((a) => {
        const text = a.textContent?.trim();
        const href = a.href;
        if (
          text &&
          text.length > 3 &&
          text.length < 250 &&
          href.includes('qcode') &&
          !items.find((i) => i.text === text)
        ) {
          const isTitle = /^title/i.test(text) || /^division/i.test(text);
          items.push({ text, href, isTitle });
        }
      });
      return items;
    });

    if (VERBOSE) console.log(`    Found ${toc.length} TOC entries`);

    // Process into hierarchical structure
    let currentTitle = null;

    for (const item of toc) {
      if (item.isTitle) {
        if (currentTitle) {
          results.titles.push(currentTitle);
        }
        currentTitle = {
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        };
      } else if (currentTitle) {
        currentTitle.chapters.push({
          name: item.text,
          url: item.href,
          categories: categorizeSection(item.text),
        });
      } else {
        results.titles.push({
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        });
      }
    }

    if (currentTitle) {
      results.titles.push(currentTitle);
    }
  } catch (err) {
    if (VERBOSE) console.log(`    Error: ${err.message}`);
  }

  return results;
}

/**
 * Scrape an American Legal (amlegal) city - get COMPLETE table of contents
 */
async function scrapeAmlegal(page, city) {
  const results = {
    city: city.name,
    county: city.county,
    platform: 'amlegal',
    baseUrl: city.municipalCodeUrl,
    titles: [],
    scraped: new Date().toISOString(),
  };

  try {
    await page.goto(city.municipalCodeUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Get full TOC - amlegal structures vary by city
    const toc = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('a').forEach((a) => {
        const text = a.textContent?.trim();
        const href = a.href;
        if (
          text &&
          text.length > 3 &&
          text.length < 250 &&
          href.includes('amlegal') &&
          !items.find((i) => i.text === text)
        ) {
          // Check for code types (Administrative Code, Planning Code, etc.)
          const isCodeType =
            text.toLowerCase().includes('code') && !text.toLowerCase().includes('chapter');
          const isTitle = /^title/i.test(text) || isCodeType;
          items.push({ text, href, isTitle, isCodeType });
        }
      });
      return items;
    });

    if (VERBOSE) console.log(`    Found ${toc.length} TOC entries`);

    // Process into hierarchical structure
    // For amlegal, top-level might be different "Codes" (Administrative, Planning, etc.)
    let currentTitle = null;

    for (const item of toc) {
      if (item.isCodeType) {
        // This is a major code section
        if (currentTitle) {
          results.titles.push(currentTitle);
        }
        currentTitle = {
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
          isCodeType: true,
        };
      } else if (item.isTitle && currentTitle) {
        // This is a title within a code
        currentTitle.chapters.push({
          name: item.text,
          url: item.href,
          categories: categorizeSection(item.text),
        });
      } else if (item.isTitle) {
        results.titles.push({
          name: item.text,
          url: item.href,
          chapters: [],
          categories: categorizeSection(item.text),
        });
      } else if (currentTitle) {
        currentTitle.chapters.push({
          name: item.text,
          url: item.href,
          categories: categorizeSection(item.text),
        });
      }
    }

    if (currentTitle) {
      results.titles.push(currentTitle);
    }

    // If structure didn't work well, fall back to flat list
    if (results.titles.length === 0 && toc.length > 0) {
      results.titles = toc.slice(0, 50).map((item) => ({
        name: item.text,
        url: item.href,
        chapters: [],
        categories: categorizeSection(item.text),
      }));
    }
  } catch (err) {
    if (VERBOSE) console.log(`    Error: ${err.message}`);
  }

  return results;
}

/**
 * Main sync function
 */
async function syncMunicipalCodes() {
  console.log('🔄 Syncing municipal codes using Playwright...\n');

  // Try to import playwright
  let playwright;
  try {
    playwright = require('playwright');
  } catch (err) {
    console.error('Playwright not installed. Run: npm install playwright');
    console.error('Then run: npx playwright install chromium');
    process.exit(1);
  }

  // Load the municipal codes list
  let municipalCodes;
  try {
    municipalCodes = JSON.parse(fs.readFileSync(MUNICIPAL_CODES_JSON, 'utf8'));
  } catch (err) {
    console.error('Error loading municipal-codes.json:', err.message);
    console.error('Run npm run build first to generate the file.');
    process.exit(1);
  }

  // Load existing cache if available
  let cache = {
    generated: new Date().toISOString(),
    description:
      'Complete municipal code table of contents for Bay Area cities (scraped with Playwright)',
    categories: SECTION_CATEGORIES,
    cities: {},
  };

  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      if (existing.cities) {
        cache.cities = existing.cities;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Launch browser
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Filter cities
  let citiesToProcess;
  if (SINGLE_CITY) {
    citiesToProcess = municipalCodes.codes.filter(
      (c) => c.name.toLowerCase() === SINGLE_CITY.toLowerCase()
    );
    if (citiesToProcess.length === 0) {
      console.error(`City "${SINGLE_CITY}" not found.`);
      await browser.close();
      process.exit(1);
    }
  } else {
    // Process priority cities first
    citiesToProcess = municipalCodes.codes.filter((c) => PRIORITY_CITIES.includes(c.name));
    console.log(`Processing ${citiesToProcess.length} priority cities...\n`);
  }

  let successCount = 0;

  for (const city of citiesToProcess) {
    console.log(`Processing ${city.name}...`);

    try {
      let results;

      if (city.name === 'Berkeley') {
        results = await scrapeBerkeley(page);
      } else if (city.name === 'San Francisco') {
        results = await scrapeSanFrancisco(page);
      } else if (city.platform === 'municode') {
        results = await scrapeMunicode(page, city, city.municipalCodeUrl);
      } else if (city.platform === 'codepublishing') {
        results = await scrapeCodePublishing(page, city);
      } else if (city.platform === 'qcode') {
        results = await scrapeQCode(page, city);
      } else if (city.platform === 'amlegal') {
        results = await scrapeAmlegal(page, city);
      } else {
        // For other platforms, create a stub with the URL
        results = {
          city: city.name,
          county: city.county,
          platform: city.platform,
          baseUrl: city.municipalCodeUrl,
          sections: {},
          scraped: new Date().toISOString(),
        };
      }

      cache.cities[city.name] = results;

      const titleCount = (results.titles || []).length;
      const chapterCount = (results.titles || []).reduce(
        (sum, t) => sum + (t.chapters?.length || 0),
        0
      );
      if (titleCount > 0) {
        console.log(`  ✅ ${city.name}: ${titleCount} titles, ${chapterCount} chapters`);
        successCount++;
      } else {
        console.log(`  ⚠️  ${city.name}: No content found`);
      }
    } catch (err) {
      console.log(`  ❌ ${city.name}: ${err.message}`);
    }

    // Rate limit between cities
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();

  // Update stats
  cache.stats = {
    citiesWithContent: Object.values(cache.cities).filter((c) => (c.titles || []).length > 0)
      .length,
    totalCities: Object.keys(cache.cities).length,
    totalTitles: Object.values(cache.cities).reduce((sum, c) => sum + (c.titles || []).length, 0),
    totalChapters: Object.values(cache.cities).reduce(
      (sum, c) => sum + (c.titles || []).reduce((s, t) => s + (t.chapters?.length || 0), 0),
      0
    ),
    lastUpdated: new Date().toISOString(),
  };

  // Write cache (mkdirSync with recursive:true is a no-op if it already exists)
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2));

  const fileSizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);

  console.log(`
📊 Sync Complete
   Cities processed: ${citiesToProcess.length}
   Cities with content: ${successCount}
   File size: ${fileSizeKB} KB
   Output: ${OUTPUT_FILE}
`);

  return cache;
}

// Run
if (require.main === module) {
  syncMunicipalCodes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncMunicipalCodes };
