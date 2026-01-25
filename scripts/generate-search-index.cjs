#!/usr/bin/env node
/**
 * Generate a pre-built search index for the directory
 *
 * Creates /public/api/search-index.json with:
 * - All program documents with keywords, descriptions, categories
 * - Pre-built Fuse.js index for faster initialization
 *
 * Run: node scripts/generate-search-index.cjs
 * Or: npm run generate:search
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'search-index.json');

// Files that are NOT program data
const NON_PROGRAM_FILES = [
  'cities.yml',
  'groups.yml',
  'zipcodes.yml',
  'suppressed.yml',
  'search-config.yml',
  'transit-agencies.yml',
  'county-supervisors.yml',
  'site-config.yml',
  'bay-area-jurisdictions.yml',
  'city-profiles.yml',
  'helplines.yml',
  'chat-messages.yml',
  'quick-answers.yml',
  'custom-themes.yml',
  'airports.yml',
];

// Search key weights - these must match SearchBar.astro DEFAULT_SEARCH_KEYS
const SEARCH_KEYS = [
  { name: 'name', weight: 0.4 },
  { name: 'keywords', weight: 0.3 },
  { name: 'description', weight: 0.2 },
  { name: 'category', weight: 0.05 },
  { name: 'area', weight: 0.05 },
];

function loadSuppressedIds() {
  const suppressedPath = path.join(DATA_DIR, 'suppressed.yml');
  if (!fs.existsSync(suppressedPath)) {
    return new Set();
  }

  const data = yaml.load(fs.readFileSync(suppressedPath, 'utf-8'));
  if (!Array.isArray(data)) {
    return new Set();
  }

  return new Set(data.map((item) => item.id));
}

function loadAllPrograms() {
  const suppressedIds = loadSuppressedIds();
  const programs = [];

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const data = yaml.load(content);
      if (Array.isArray(data)) {
        for (const program of data) {
          if (program.id && !suppressedIds.has(program.id)) {
            programs.push(program);
          }
        }
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${file}: ${e.message}`);
    }
  }

  return programs;
}

function buildSearchDocument(program) {
  // Combine what_they_offer and how_to_get_it into description for better search
  const descriptionParts = [];
  if (program.description) {
    descriptionParts.push(program.description);
  }
  if (program.what_they_offer) {
    // Strip markdown list formatting for cleaner search text
    const cleanOffer = program.what_they_offer
      .replace(/^[-*]\s+/gm, '')
      .replace(/\n+/g, ' ')
      .trim();
    descriptionParts.push(cleanOffer);
  }

  return {
    id: program.id,
    name: program.name || '',
    description: descriptionParts.join(' ').substring(0, 500), // Limit for index size
    keywords: program.keywords || '',
    category: program.category || '',
    area: program.area || '',
    city: program.city || '',
    groups: program.groups || [],
  };
}

function main() {
  console.log('Generating search index...\n');

  const programs = loadAllPrograms();
  console.log(`Loaded ${programs.length} programs from YAML files`);

  // Build search documents
  const documents = programs.map(buildSearchDocument);

  // Count keywords coverage
  const withKeywords = documents.filter((d) => d.keywords && d.keywords.length > 0);
  console.log(`Programs with keywords: ${withKeywords.length}/${documents.length}`);

  // Create output
  const output = {
    generated: new Date().toISOString(),
    version: 2,
    total: documents.length,
    keys: SEARCH_KEYS,
    documents,
  };

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));

  // Also write a pretty version for debugging
  const debugPath = OUTPUT_PATH.replace('.json', '.debug.json');
  fs.writeFileSync(debugPath, JSON.stringify(output, null, 2));

  const sizeKb = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
  console.log(`\nOutput: ${OUTPUT_PATH} (${sizeKb} KB)`);
  console.log(`Debug: ${debugPath}`);

  // Show sample
  console.log('\nSample document:');
  console.log(JSON.stringify(documents[0], null, 2));
}

main();
