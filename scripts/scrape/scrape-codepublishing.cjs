#!/usr/bin/env node
/**
 * Deep-scrape CodePublishing (codepublishing.com) municipal codes.
 *
 * CodePublishing sites are Cloudflare-protected JS apps, so the Playwright
 * scraper (deep-scrape-municipal-codes.cjs) can't read them. This scraper uses
 * the Firecrawl CLI (bypasses Cloudflare + renders JS) and the site's
 * underlying static content URLs:
 *
 *   landing:  https://www.codepublishing.com/CA/<City>/
 *   title:    .../html/<Code><TT>/<Code><TT>.html         (lists chapters)
 *   chapter:  .../html/<Code><TT>/<Code><TTCC>.html        (actual section text)
 *
 * Output matches the Playwright scraper: per-city JSON + _index.json so the same
 * knowledge-pack builder / blob upload consume it identically.
 *
 * Usage:
 *   node scripts/scrape/scrape-codepublishing.cjs --city="Fremont" --output-dir=/tmp/cp
 *   node scripts/scrape/scrape-codepublishing.cjs --city="Fremont" --topic="pets"
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const childProc = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const API = path.join(ROOT, 'public', 'api', 'municipal-codes.json');

const cityArg = process.argv.find((a) => a.startsWith('--city='));
const topicArg = process.argv.find((a) => a.startsWith('--topic='));
const outArg = process.argv.find((a) => a.startsWith('--output-dir='));
const maxChaptersArg = process.argv.find((a) => a.startsWith('--max-chapters='));
const CITY = cityArg ? cityArg.split('=')[1].replace(/"/g, '') : null;
const ONLY_TOPIC = topicArg ? topicArg.split('=')[1].replace(/"/g, '') : null;
const OUTPUT_DIR = outArg ? outArg.split('=')[1] : '/tmp/codepublishing-deep';
const MAX_CHAPTERS_PER_TOPIC = maxChaptersArg ? parseInt(maxChaptersArg.split('=')[1], 10) : 6;
const MAX_TEXT_PER_SECTION = 1500;

// Topic keywords (mirrors deep-scrape-municipal-codes.cjs SECTION_CATEGORIES).
const SECTION_CATEGORIES = {
  noise: ['noise', 'loud', 'quiet', 'disturbing the peace'],
  parking: ['parking', 'vehicle', 'traffic'],
  pets: ['animal', 'dog', 'pet', 'livestock', 'fowl', 'poultry'],
  building: ['building', 'construction'],
  zoning: ['zoning', 'land use', 'planning'],
  rental: ['rent', 'tenant', 'landlord', 'housing'],
  cannabis: ['cannabis', 'marijuana'],
  trees: ['tree', 'urban forest'],
  business: ['business', 'license', 'peddler', 'vendor'],
  fences: ['fence', 'wall'],
  utilities: ['water', 'sewer', 'garbage', 'utilities', 'solid waste', 'sanitation'],
  shortterm: ['short-term', 'vacation rental', 'transient occupancy'],
  fire: ['fire', 'public safety'],
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function categorize(name) {
  const lower = name.toLowerCase();
  const topics = [];
  for (const [topic, kws] of Object.entries(SECTION_CATEGORIES)) {
    if (kws.some((k) => lower.includes(k))) topics.push(topic);
  }
  return topics;
}

/** Fetch a URL via the Firecrawl CLI, returning its main-content markdown. */
function firecrawlMarkdown(url) {
  const tmp = path.join(os.tmpdir(), `fc-${process.pid}-${Math.floor(Math.random() * 1e9)}.md`);
  try {
    childProc.execFileSync('firecrawl', ['scrape', url, '--only-main-content', '-o', tmp], {
      stdio: 'ignore',
      timeout: 120000,
    });
    return fs.readFileSync(tmp, 'utf-8');
  } catch (err) {
    console.log(`      firecrawl failed for ${url}: ${String(err.message).split('\n')[0]}`);
    return '';
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

function origin(url) {
  const m = url.match(/^(https?:\/\/[^/]+)/);
  return m ? m[1] : 'https://www.codepublishing.com';
}

/** Extract { name, code, htmlUrl } title entries from the landing page markdown. */
function parseTitles(md, base) {
  const titles = [];
  const re = /\[(?:[+–-]\s*)?(Title [^\]]+)\]\((https?:\/\/[^)]*?#!\/([A-Za-z0-9]+)\/[A-Za-z0-9]+\.html)\)/g;
  let m;
  const seen = new Set();
  while ((m = re.exec(md))) {
    const name = m[1].trim();
    const code = m[3];
    if (seen.has(code) || /reserved/i.test(name)) continue;
    seen.add(code);
    titles.push({ name, code, htmlUrl: `${base}/html/${code}/${code}.html` });
  }
  return titles;
}

/** Extract chapter content-URLs from a title page markdown. */
function parseChapterUrls(md, base, code) {
  const re = new RegExp(`/html/${code}/${code}\\d+\\.html`, 'g');
  return [...new Set((md.match(re) || []).map((p) => base + p))];
}

/** Parse a chapter page markdown into sections [{title, text}]. */
function parseSections(md) {
  const sections = [];
  const parts = md.split(/\n### /).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    let body = (nl === -1 ? '' : part.slice(nl + 1)).trim();
    body = body.split(/\n\[Home\]/)[0].trim();
    if (body.length < 40) continue;
    sections.push({
      title: heading.replace(/\s+/g, ' '),
      text: body.replace(/\s+/g, ' ').slice(0, MAX_TEXT_PER_SECTION),
    });
  }
  return sections;
}

function main() {
  const api = JSON.parse(fs.readFileSync(API, 'utf-8'));
  const city = (api.codes || []).find((c) => c.name.toLowerCase() === (CITY || '').toLowerCase());
  if (!city) {
    console.error(`City "${CITY}" not found in API data.`);
    process.exit(1);
  }

  const base = city.municipalCodeUrl.replace(/\/$/, '');
  const baseOrigin = origin(base);
  const cityPath = base.replace(baseOrigin, '');
  const contentBase = `${baseOrigin}${cityPath}`;

  console.log(`\n  Scraping ${city.name} (codepublishing)...`);
  const landing = firecrawlMarkdown(`${contentBase}/`);
  const titles = parseTitles(landing, contentBase);
  console.log(`    Found ${titles.length} titles`);

  const topics = {};
  let totalSections = 0;

  for (const title of titles) {
    const cats = categorize(title.name);
    if (!cats.length) continue;
    if (ONLY_TOPIC && !cats.includes(ONLY_TOPIC)) continue;

    console.log(`    Title: ${title.name} -> [${cats.join(', ')}]`);
    const titleMd = firecrawlMarkdown(title.htmlUrl);
    const chapterUrls = parseChapterUrls(titleMd, contentBase, title.code).slice(0, MAX_CHAPTERS_PER_TOPIC);

    for (const chUrl of chapterUrls) {
      const chMd = firecrawlMarkdown(chUrl);
      const sections = parseSections(chMd);
      if (!sections.length) continue;
      for (const cat of cats) {
        if (ONLY_TOPIC && cat !== ONLY_TOPIC) continue;
        topics[cat] = topics[cat] || { sections: [] };
        for (const s of sections) topics[cat].sections.push({ ...s, url: chUrl });
      }
      totalSections += sections.length;
      console.log(`      ${chUrl.split('/').pop()}: ${sections.length} sections`);
    }
  }

  const slug = slugify(city.name);
  const result = { slug, city: city.name, county: city.county, platform: 'codepublishing', scraped: new Date().toISOString(), topics };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.json`), JSON.stringify(result, null, 2));

  const indexPath = path.join(OUTPUT_DIR, '_index.json');
  const index = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
    : { generated: new Date().toISOString(), blobBaseUrl: 'https://baytidesstorage.blob.core.windows.net/municipal-codes', cities: {} };
  index.cities[slug] = { city: city.name, county: city.county, topics: Object.keys(topics), sections: totalSections, scraped: result.scraped };
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`\n  OK ${city.name}: ${Object.keys(topics).length} topics, ${totalSections} sections -> ${OUTPUT_DIR}/${slug}.json`);
}

main();
