#!/usr/bin/env node
/**
 * Deep Scrape Municipal Codes - Extract actual ordinance body text
 *
 * Uses Playwright to navigate into municipal code sections and extract
 * the actual ordinance text (not just table of contents).
 *
 * Output: Per-city JSON files + _index.json manifest
 * Destination: Azure Blob Storage (baytidesstorage/municipal-codes/)
 *
 * Usage:
 *   node scripts/deep-scrape-municipal-codes.cjs
 *   node scripts/deep-scrape-municipal-codes.cjs --city="San Jose"
 *   node scripts/deep-scrape-municipal-codes.cjs --topic="noise"
 *   node scripts/deep-scrape-municipal-codes.cjs --verbose --dry-run
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---

const TOC_FILE = path.join(__dirname, '..', 'public', 'data', 'municipal-codes-content.json');
const MUNICIPAL_CODES_API = path.join(__dirname, '..', 'public', 'api', 'municipal-codes.json');
const DEFAULT_OUTPUT_DIR = path.join('/tmp', 'municipal-codes-deep');

// CLI arguments
const VERBOSE = process.argv.includes('--verbose');
const DRY_RUN = process.argv.includes('--dry-run');
const cityArg = process.argv.find((a) => a.startsWith('--city='));
const topicArg = process.argv.find((a) => a.startsWith('--topic='));
const outputArg = process.argv.find((a) => a.startsWith('--output-dir='));

const SINGLE_CITY = cityArg ? cityArg.split('=')[1].replace(/"/g, '') : null;
const SINGLE_TOPIC = topicArg ? topicArg.split('=')[1].replace(/"/g, '') : null;
const OUTPUT_DIR = outputArg ? outputArg.split('=')[1].replace(/"/g, '') : DEFAULT_OUTPUT_DIR;

// Rate limiting (be polite)
const DELAY_BETWEEN_PAGES = 1000; // 1s between page loads
const DELAY_BETWEEN_CITIES = 3000; // 3s between cities

// Content limits
const MAX_TEXT_PER_SECTION = 1500; // chars per section
const MAX_SECTIONS_PER_TOPIC = 8; // sections per topic per city

// Priority cities — scrape these first (and by default)
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

// Topic categories and their keywords (for matching chapters to topics)
const SECTION_CATEGORIES = {
  noise: ['noise', 'loud', 'sound', 'quiet hours', 'decibel', 'sound amplif', 'disturbing the peace'],
  parking: ['parking', 'street parking', 'overnight parking', 'motor vehicle', 'tow'],
  pets: ['animal', 'dog', 'cats', 'pet', 'barking', 'livestock', 'fowl', 'poultry', 'chicken', 'rooster'],
  building: ['building code', 'construction', 'building permit', 'inspection', 'structural', 'electrical code', 'plumbing code'],
  adu: ['accessory dwelling', 'ADU', 'granny', 'secondary unit', 'in-law'],
  zoning: ['zoning', 'land use', 'setback', 'density', 'lot coverage', 'height limit'],
  rental: ['rent', 'tenant', 'landlord', 'eviction', 'just cause', 'relocation', 'mobilehome rent'],
  cannabis: ['cannabis', 'marijuana', 'dispensary', 'cultivation'],
  trees: ['tree', 'heritage tree', 'protected tree', 'tree removal', 'urban forest'],
  business: ['business license', 'home occupation', 'vendor', 'food truck', 'peddler'],
  fences: ['fence', 'wall', 'property line', 'hedge'],
  utilities: ['water system', 'sewer', 'garbage', 'trash', 'recycling', 'storm water', 'stormwater'],
  shortterm: ['short-term', 'airbnb', 'vacation rental', 'VRBO', 'transient occupancy'],
  fire: ['fire code', 'fire safety', 'sprinkler', 'fire alarm', 'fire prevention'],
};

// --- Helpers ---

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function categorizeText(text) {
  const textLower = text.toLowerCase();
  const categories = [];
  for (const [category, keywords] of Object.entries(SECTION_CATEGORIES)) {
    for (const keyword of keywords) {
      // Use word-boundary matching for short keywords to avoid false positives
      // (e.g., "cat" matching "telecommunications")
      const kwLower = keyword.toLowerCase();
      let matches = false;
      if (kwLower.length <= 4) {
        const regex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        matches = regex.test(text);
      } else {
        matches = textLower.includes(kwLower);
      }
      if (matches) {
        if (!categories.includes(category)) {
          categories.push(category);
        }
        break;
      }
    }
  }
  return categories;
}

function cleanText(raw) {
  return raw
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function log(msg) {
  if (VERBOSE) console.log(msg);
}

// --- Platform-specific deep scrapers ---

/**
 * Extract section body text from a Municode chapter page.
 *
 * Municode hierarchy: Title → Chapter → Section (actual text).
 * If we land on a TOC/index page (no body text visible), we look for
 * section links and navigate into the first few to get actual content.
 */
async function deepScrapeMunicodeChapter(page, chapterUrl) {
  try {
    await page.goto(chapterUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Municode DOM structure:
    //   .chunk-heading       → "7.20.010 - Proper and adequate care requirement."
    //   .chunk-content-wrapper
    //     └─ .chunk-content  → actual ordinance text in <p> tags
    //
    // We iterate .chunk-heading elements to find section titles,
    // then grab text from the adjacent .chunk-content-wrapper.
    const sections = await page.evaluate(() => {
      const results = [];
      const headings = document.querySelectorAll('.chunk-heading');

      for (const heading of headings) {
        // Get clean title text, stripping toolbar buttons (Share, Print, Download, etc.)
        let titleRaw = (heading.textContent?.trim().replace(/\s+/g, ' ') || '')
          .replace(/\s*Share\s+Link.*$/i, '')
          .replace(/\s*Print\s+Download.*$/i, '')
          .trim();
        if (!titleRaw) continue;

        // Skip structural headers that don't contain actual ordinance text
        const isPartHeader = /^Part\s+\d/i.test(titleRaw);
        const isArticleHeader = /^Article\s+[IVX\d]/i.test(titleRaw);
        const isChapterHeader = /^Chapter\s+\d/i.test(titleRaw);
        const isDefinitions = /^(?:SEC\.?\s*)?[\d.]+\s*-?\s*Definitions?\b/i.test(titleRaw);
        const isGeneralProvisions = /general\s+provisions/i.test(titleRaw);

        if (isPartHeader || isArticleHeader || isChapterHeader || isGeneralProvisions) continue;
        if (isDefinitions) continue;

        // Match section-level entries:
        //   "7.20.010 - Title"     (three-level: San Jose style)
        //   "SEC. 5.1. - Title"    (two-level with SEC prefix: Mountain View style)
        //   "Sec. 12.56.020"       (with Sec prefix)
        const isSectionLevel = /^(?:SEC\.?\s*)?[\d]+\.[\d.]+\s*\.?\s*-/i.test(titleRaw);
        if (!isSectionLevel) continue;

        // Get the content wrapper (next sibling)
        const wrapper = heading.nextElementSibling;
        if (!wrapper || !wrapper.classList.contains('chunk-content-wrapper')) continue;

        const content = wrapper.querySelector('.chunk-content');
        if (!content) continue;

        // Collect paragraph text
        const textParts = [];
        content.querySelectorAll('p').forEach((p) => {
          const t = p.textContent?.trim().replace(/\s+/g, ' ');
          // Skip very short paragraphs (just "A." or "(Ord. 28079.)")
          if (t && t.length > 10 && !/^\(?Ord\.\s/i.test(t)) {
            textParts.push(t);
          }
        });

        if (textParts.length === 0) continue;

        const text = textParts.join('\n');
        // Skip very short sections (just citations or boilerplate)
        if (text.length < 50) continue;

        // Flag definitions (text starts with a quoted term like '"Abandon" means...')
        const isDefinitionEntry = /^"[A-Z]/.test(text.trim());

        // Extract chapter prefix from section ID
        // "7.20.010" → "7.20", "SEC. 5.1" → "5", "12.56.020" → "12.56"
        let chapterPrefix = '';
        const prefixMatch = titleRaw.match(/^(?:SEC\.?\s*)?(\d+)\.(\d+)\.(\d+)/i);
        if (prefixMatch) {
          chapterPrefix = prefixMatch[1] + '.' + prefixMatch[2]; // e.g., "7.20"
        } else {
          const shortMatch = titleRaw.match(/^(?:SEC\.?\s*)?(\d+)\.\d+/i);
          if (shortMatch) chapterPrefix = shortMatch[1]; // e.g., "5"
        }

        results.push({
          title: titleRaw.substring(0, 200),
          text: text,
          isDefinition: isDefinitionEntry,
          chapterPrefix,
        });
      }

      // Extract the target chapter prefix from the URL
      // "CH7.20ANCAKE" → "7.20", "CH5AN" → "5"
      const urlChapterMatch = window.location.href.match(/CH(\d+(?:\.\d+)?)/i);
      const targetChapter = urlChapterMatch ? urlChapterMatch[1] : '';

      // Prioritize: (1) sections from the target chapter, (2) other regulations, (3) definitions
      results.sort((a, b) => {
        const aScore = a.isDefinition ? 2 : (targetChapter && a.chapterPrefix !== targetChapter ? 1 : 0);
        const bScore = b.isDefinition ? 2 : (targetChapter && b.chapterPrefix !== targetChapter ? 1 : 0);
        return aScore - bScore;
      });

      return results;
    });

    if (sections.length > 0) {
      log(`        Found ${sections.length} inline sections`);
      return sections;
    }

    // Fallback: if no inline sections, try finding section links to drill into
    const sectionLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="nodeId"]').forEach((a) => {
        const text = a.textContent?.trim().replace(/\s+/g, ' ');
        const href = a.href;
        if (
          text &&
          href.includes('nodeId=') &&
          /^(?:SEC\.?\s*)?\d+\.\d+/i.test(text) &&
          !links.find((l) => l.href === href)
        ) {
          links.push({ text: text.substring(0, 200), href });
        }
      });
      return links.slice(0, 5);
    });

    if (sectionLinks.length === 0) {
      log(`        No inline sections or section links found`);
      return [];
    }

    log(`        No inline content, drilling into ${sectionLinks.length} section links...`);
    const results = [];
    for (const link of sectionLinks.slice(0, 3)) {
      try {
        await page.goto(link.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const text = await page.evaluate(() => {
          const parts = [];
          document.querySelectorAll('.chunk-content p').forEach((p) => {
            const t = p.textContent?.trim().replace(/\s+/g, ' ');
            if (t && t.length > 10 && !/^\(?Ord\.\s/i.test(t)) parts.push(t);
          });
          return parts.join('\n');
        });

        if (text.length > 50) {
          results.push({ title: link.text, text, url: link.href });
        }
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        log(`        Error drilling into section: ${err.message}`);
      }
    }

    return results;
  } catch (err) {
    log(`      Error scraping Municode chapter: ${err.message}`);
    return [];
  }
}

/**
 * Extract section body text from an AmLegal page (San Francisco, Palo Alto).
 */
async function deepScrapeAmlegalChapter(page, chapterUrl) {
  try {
    await page.goto(chapterUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const sections = await page.evaluate(() => {
      const results = [];

      // AmLegal uses standard article/content containers
      const sectionEls = document.querySelectorAll(
        '.lawSection, .codeSection, article section, .content-area section'
      );

      if (sectionEls.length > 0) {
        for (const el of sectionEls) {
          const headerEl = el.querySelector('h1, h2, h3, h4, .section-title');
          const title = headerEl?.textContent?.trim() || '';
          const text = el.textContent?.trim() || '';
          if (text.length > 50) {
            results.push({ title, text });
          }
        }
      }

      // Fallback: extract all <p> tags from main content area
      if (results.length === 0) {
        const contentArea = document.querySelector(
          '#codeBank, article, .content-area, main'
        );
        if (contentArea) {
          const paragraphs = [];
          contentArea.querySelectorAll('p').forEach((p) => {
            const text = p.textContent?.trim();
            if (text && text.length > 10) {
              paragraphs.push(text);
            }
          });
          if (paragraphs.length > 0) {
            results.push({ title: '', text: paragraphs.join('\n\n') });
          }
        }
      }

      return results;
    });

    return sections;
  } catch (err) {
    log(`      Error scraping AmLegal chapter: ${err.message}`);
    return [];
  }
}

/**
 * Extract body text from a Berkeley municipal.codes page.
 */
async function deepScrapeBerkeleyChapter(page, chapterUrl) {
  try {
    await page.goto(chapterUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const sections = await page.evaluate(() => {
      const results = [];
      const sectionEls = document.querySelectorAll(
        '.codeSection, article section, .lawSection'
      );

      if (sectionEls.length > 0) {
        for (const el of sectionEls) {
          const headerEl = el.querySelector('h1, h2, h3, h4');
          const title = headerEl?.textContent?.trim() || '';
          const text = el.textContent?.trim() || '';
          if (text.length > 50) {
            results.push({ title, text });
          }
        }
      }

      // Fallback
      if (results.length === 0) {
        const main = document.querySelector('article, main, .content');
        if (main) {
          const text = main.textContent?.trim() || '';
          if (text.length > 50) {
            results.push({ title: '', text });
          }
        }
      }

      return results;
    });

    return sections;
  } catch (err) {
    log(`      Error scraping Berkeley chapter: ${err.message}`);
    return [];
  }
}

/**
 * Extract body text from QCode or CodePublishing pages.
 * These tend to be simpler HTML — just extract <p> content.
 */
async function deepScrapeGenericChapter(page, chapterUrl) {
  try {
    await page.goto(chapterUrl, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    const sections = await page.evaluate(() => {
      const results = [];
      const contentArea = document.querySelector(
        'article, main, .content, #codeBank, .codify_content, #divCodeBody'
      );

      if (contentArea) {
        // Try structured sections first
        const sectionEls = contentArea.querySelectorAll('section, .section, .codeSection');
        if (sectionEls.length > 0) {
          for (const el of sectionEls) {
            const headerEl = el.querySelector('h1, h2, h3, h4');
            const title = headerEl?.textContent?.trim() || '';
            const text = el.textContent?.trim() || '';
            if (text.length > 50) {
              results.push({ title, text });
            }
          }
        }

        // Fallback: paragraph extraction
        if (results.length === 0) {
          const paragraphs = [];
          contentArea.querySelectorAll('p').forEach((p) => {
            const text = p.textContent?.trim();
            if (text && text.length > 10) {
              paragraphs.push(text);
            }
          });
          if (paragraphs.length > 0) {
            results.push({ title: '', text: paragraphs.join('\n\n') });
          }
        }
      }

      return results;
    });

    return sections;
  } catch (err) {
    log(`      Error scraping chapter: ${err.message}`);
    return [];
  }
}

// --- Main scraping logic ---

/**
 * Pick the right deep scraper based on platform
 */
function getDeepScraper(platform, cityName) {
  if (cityName === 'Berkeley') return deepScrapeBerkeleyChapter;
  if (platform === 'municode') return deepScrapeMunicodeChapter;
  if (platform === 'amlegal') return deepScrapeAmlegalChapter;
  // qcode, codepublishing, and others
  return deepScrapeGenericChapter;
}

/**
 * Process a single city: find topic-relevant chapters from TOC, scrape their body text
 */
async function processCity(page, cityName, cityTocData, cityApiData) {
  const slug = slugify(cityName);
  const platform = cityTocData?.platform || cityApiData?.platform || 'unknown';
  const baseUrl = cityTocData?.baseUrl || cityApiData?.municipalCodeUrl || '';

  const result = {
    city: cityName,
    slug,
    county: cityTocData?.county || cityApiData?.county || '',
    platform,
    baseUrl,
    scraped: new Date().toISOString(),
    topics: {},
  };

  const deepScraper = getDeepScraper(platform, cityName);

  // Collect all chapters with their topic categories
  // Prioritize chapter-level pages over title-level pages (chapters have actual content)
  const chapterLevel = [];
  const titleLevel = [];

  // From TOC data: titles → chapters with URLs and category tags
  const titles = cityTocData?.titles || [];
  for (const title of titles) {
    const chapters = title.chapters || [];
    for (const chapter of chapters) {
      // Re-categorize using our improved word-boundary matching
      // Do NOT trust the TOC's existing categories (they used .includes() with false positives)
      const chapterCategories = categorizeText(chapter.name || '');

      if (chapterCategories.length > 0 && chapter.url) {
        // Classify as chapter-level (has "Chapter" or section number) vs title-level (index page)
        const isChapter = /^Chapter\s+\d|^\d+\.\d+/i.test(chapter.name);
        const target = isChapter ? chapterLevel : titleLevel;
        target.push({
          name: chapter.name,
          url: chapter.url,
          categories: chapterCategories,
          titleName: title.name,
          isChapter,
        });
      }
    }

    // If a title matches a topic but has no categorized chapters, use the title URL
    const titleCategories = categorizeText(title.name || '');
    if (titleCategories.length > 0 && title.url) {
      const hasMatchingChapters = chapters.some((ch) => {
        const cats = [...categorizeText(ch.name || ''), ...(ch.categories || [])];
        return cats.some((c) => titleCategories.includes(c));
      });
      if (!hasMatchingChapters) {
        titleLevel.push({
          name: title.name,
          url: title.url,
          categories: titleCategories,
          titleName: title.name,
          isChapter: false,
        });
      }
    }
  }

  // Chapters first (they have actual content), titles as fallback
  const chaptersToScrape = [...chapterLevel, ...titleLevel];

  // From searchUrls data (Municode cities without full TOC)
  const searchUrls = cityTocData?.searchUrls || {};
  for (const [topic, info] of Object.entries(searchUrls)) {
    if (info.searchUrl && !chaptersToScrape.find((c) => c.categories.includes(topic))) {
      chaptersToScrape.push({
        name: info.title || topic,
        url: info.searchUrl,
        categories: [topic],
        titleName: '',
      });
    }
  }

  // Filter to requested topic if specified
  const filteredChapters = SINGLE_TOPIC
    ? chaptersToScrape.filter((c) => c.categories.includes(SINGLE_TOPIC))
    : chaptersToScrape;

  if (filteredChapters.length === 0) {
    log(`    No topic-relevant chapters found for ${cityName}`);
    return null;
  }

  // Deduplicate chapters by URL (TOC often has same title at multiple hierarchy levels)
  const seenUrls = new Set();
  const dedupedChapters = filteredChapters.filter((ch) => {
    if (seenUrls.has(ch.url)) return false;
    seenUrls.add(ch.url);
    return true;
  });

  log(`    Found ${dedupedChapters.length} unique topic-relevant chapters to deep scrape (${filteredChapters.length} before dedup)`);

  // Track sections per topic to enforce MAX_SECTIONS_PER_TOPIC
  const topicSectionCount = {};

  for (const chapter of dedupedChapters) {
    // Check if all topics for this chapter are already full
    const unfilledTopics = chapter.categories.filter(
      (t) => (topicSectionCount[t] || 0) < MAX_SECTIONS_PER_TOPIC
    );
    if (unfilledTopics.length === 0) {
      log(`      Skipping ${chapter.name} — all topics full`);
      continue;
    }

    log(`      Scraping: ${chapter.name.substring(0, 60)}...`);

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would scrape: ${chapter.url}`);
      continue;
    }

    const rawSections = await deepScraper(page, chapter.url);

    if (rawSections.length === 0) {
      log(`        No content extracted`);
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_PAGES));
      continue;
    }

    // Process extracted sections and assign to topics
    for (const raw of rawSections) {
      const text = cleanText(raw.text).substring(0, MAX_TEXT_PER_SECTION);
      if (text.length < 50) continue;

      // Skip sections that are just TOC listings (lots of section numbers, little prose)
      const tocSignals = (text.match(/Chapter \d|Title \d|Part \d/gi) || []).length;
      if (tocSignals > 5 && text.length < 500) continue;

      const title = cleanText(raw.title || chapter.name);

      // Extract a section ID if present (e.g., "Sec. 7.08.040" or "Section 9.36.010")
      const sectionIdMatch = title.match(/(?:Sec(?:tion)?\.?\s*)?([\d]+\.[\d.]+(?:-[\d.]+)?)/i);
      const sectionId = sectionIdMatch ? sectionIdMatch[1] : '';

      // Use the drilled-in URL if the scraper navigated into a subsection
      const sectionUrl = raw.url || chapter.url;

      // Extract keywords from the text for search matching
      const keywords = extractKeywords(text, title);

      // Add to each relevant topic
      for (const topic of unfilledTopics) {
        if ((topicSectionCount[topic] || 0) >= MAX_SECTIONS_PER_TOPIC) continue;

        if (!result.topics[topic]) {
          result.topics[topic] = { sections: [] };
        }

        // Avoid duplicate sections within a topic
        if (result.topics[topic].sections.find((s) => s.url === sectionUrl && s.title === title)) {
          continue;
        }

        result.topics[topic].sections.push({
          title,
          sectionId,
          url: sectionUrl,
          text,
          keywords,
        });

        topicSectionCount[topic] = (topicSectionCount[topic] || 0) + 1;
      }
    }

    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_PAGES));
  }

  // Remove empty topics
  for (const [topic, data] of Object.entries(result.topics)) {
    if (data.sections.length === 0) {
      delete result.topics[topic];
    }
  }

  return Object.keys(result.topics).length > 0 ? result : null;
}

/**
 * Extract useful keywords from section text and title
 */
function extractKeywords(text, title) {
  const combined = `${title} ${text}`.toLowerCase();
  const keywords = new Set();

  // Check against all topic keywords
  for (const [, topicKeywords] of Object.entries(SECTION_CATEGORIES)) {
    for (const kw of topicKeywords) {
      if (combined.includes(kw.toLowerCase())) {
        keywords.add(kw.toLowerCase());
      }
    }
  }

  // Add common regulatory terms found in the text
  const regulatoryTerms = [
    'prohibited', 'permitted', 'allowed', 'unlawful', 'violation', 'penalty',
    'fine', 'exception', 'exempt', 'residential', 'commercial', 'industrial',
    'decibel', 'db', 'quiet hours', 'curfew', 'overnight', 'limit',
    'pig', 'chicken', 'rooster', 'goat', 'hen', 'fowl', 'livestock', 'pot-bellied',
    'permit required', 'no permit', 'setback', 'height', 'feet', 'inches',
  ];

  for (const term of regulatoryTerms) {
    if (combined.includes(term)) {
      keywords.add(term);
    }
  }

  return [...keywords].slice(0, 15);
}

// --- Main ---

async function main() {
  console.log('🔍 Deep Scraping Municipal Codes...\n');

  if (DRY_RUN) console.log('  [DRY RUN MODE — no actual scraping]\n');

  // Load Playwright
  let playwright;
  try {
    playwright = require('playwright');
  } catch (err) {
    console.error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  // Load TOC data (existing scraped table of contents)
  let tocData = { cities: {} };
  try {
    tocData = JSON.parse(fs.readFileSync(TOC_FILE, 'utf8'));
    console.log(`  Loaded TOC data: ${Object.keys(tocData.cities || {}).length} cities`);
  } catch (err) {
    console.warn(`  Warning: Could not load TOC file: ${err.message}`);
    console.warn('  Will use API data only (less accurate chapter matching)');
  }

  // Load API data (city list with URLs)
  let apiData = { codes: [] };
  try {
    apiData = JSON.parse(fs.readFileSync(MUNICIPAL_CODES_API, 'utf8'));
    console.log(`  Loaded API data: ${apiData.codes.length} cities`);
  } catch (err) {
    console.error(`  Error loading API file: ${err.message}`);
    process.exit(1);
  }

  // Determine which cities to process
  let citiesToProcess;
  if (SINGLE_CITY) {
    citiesToProcess = apiData.codes.filter(
      (c) => c.name.toLowerCase() === SINGLE_CITY.toLowerCase()
    );
    if (citiesToProcess.length === 0) {
      console.error(`  City "${SINGLE_CITY}" not found in API data.`);
      process.exit(1);
    }
  } else {
    // Default: priority cities only
    citiesToProcess = apiData.codes.filter((c) => PRIORITY_CITIES.includes(c.name));
  }

  console.log(`  Processing ${citiesToProcess.length} cities${SINGLE_TOPIC ? ` (topic: ${SINGLE_TOPIC})` : ''}\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Launch browser
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Set longer default timeout
  page.setDefaultTimeout(45000);

  // Merge with existing index if running per-city (so we don't lose other cities)
  const indexPath = path.join(OUTPUT_DIR, '_index.json');
  let existingCities = {};
  if (SINGLE_CITY && fs.existsSync(indexPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      existingCities = existing.cities || {};
    } catch {
      // ignore corrupt index
    }
  }

  const index = {
    generated: new Date().toISOString(),
    blobBaseUrl: 'https://baytidesstorage.blob.core.windows.net/municipal-codes',
    cities: { ...existingCities },
  };

  let successCount = 0;
  let totalSections = 0;

  for (const city of citiesToProcess) {
    console.log(`  Processing ${city.name}...`);

    try {
      // Get TOC data for this city (if available)
      const cityTocData = tocData.cities?.[city.name] || null;

      if (!cityTocData && !city.municipalCodeUrl) {
        console.log(`    ⚠️  No TOC data or URL for ${city.name}, skipping`);
        continue;
      }

      const result = await processCity(page, city.name, cityTocData, city);

      if (result && Object.keys(result.topics).length > 0) {
        const slug = result.slug;
        const outputPath = path.join(OUTPUT_DIR, `${slug}.json`);

        if (!DRY_RUN) {
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        }

        const topicNames = Object.keys(result.topics);
        const sectionCount = topicNames.reduce(
          (sum, t) => sum + result.topics[t].sections.length,
          0
        );

        index.cities[slug] = {
          city: city.name,
          topics: topicNames,
          sections: sectionCount,
          scraped: result.scraped,
        };

        totalSections += sectionCount;
        successCount++;
        console.log(`    ✅ ${city.name}: ${topicNames.length} topics, ${sectionCount} sections`);
      } else {
        console.log(`    ⚠️  ${city.name}: No content extracted`);
      }
    } catch (err) {
      console.log(`    ❌ ${city.name}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CITIES));
  }

  await browser.close();

  // Write index file
  if (!DRY_RUN) {
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  // Summary
  const outputSizeKB = DRY_RUN
    ? 0
    : Math.round(
        fs
          .readdirSync(OUTPUT_DIR)
          .reduce((sum, f) => sum + fs.statSync(path.join(OUTPUT_DIR, f)).size, 0) / 1024
      );

  console.log(`
📊 Deep Scrape Complete
   Cities processed: ${citiesToProcess.length}
   Cities with content: ${successCount}
   Total sections: ${totalSections}
   Output size: ${outputSizeKB} KB
   Output dir: ${OUTPUT_DIR}
`);

  return index;
}

// Run
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { main };
