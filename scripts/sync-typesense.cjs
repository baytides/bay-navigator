#!/usr/bin/env node
/**
 * Sync programs to Typesense search server
 *
 * Creates/updates a 'programs' collection in Typesense with:
 * - All program documents with keywords, descriptions, categories
 * - Geo-coordinates for location-based search (when available)
 * - Facets for filtering by category, area, groups
 *
 * Run: node scripts/sync-typesense.cjs
 * Or: TYPESENSE_HOST=... TYPESENSE_API_KEY=... node scripts/sync-typesense.cjs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration - can be overridden with environment variables
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'https://search.baytides.org';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || '';
const COLLECTION_NAME = 'programs';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'src', 'data');

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

// Approximate coordinates for Bay Area locations (for geo-search)
const AREA_COORDINATES = {
  'San Francisco': [37.7749, -122.4194],
  'Alameda County': [37.6017, -122.0261],
  Oakland: [37.8044, -122.2712],
  Berkeley: [37.8716, -122.2727],
  'San Mateo County': [37.5585, -122.2711],
  'Santa Clara County': [37.3541, -121.9552],
  'San Jose': [37.3382, -121.8863],
  'Contra Costa County': [37.9161, -122.056],
  'Marin County': [37.9735, -122.5311],
  'Sonoma County': [38.2921, -122.4588],
  'Napa County': [38.2975, -122.2869],
  'Solano County': [38.2494, -122.0398],
  'Bay Area': [37.6, -122.1], // Central point
};

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

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

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

function buildTypesenseDocument(program) {
  // Combine what_they_offer and how_to_get_it into description for better search
  const descriptionParts = [];
  if (program.description) {
    descriptionParts.push(program.description);
  }
  if (program.what_they_offer) {
    const cleanOffer = program.what_they_offer
      .replace(/^[-*]\s+/gm, '')
      .replace(/\n+/g, ' ')
      .trim();
    descriptionParts.push(cleanOffer);
  }

  // Get coordinates for the area/city
  const location = program.city || program.area;
  const coords = AREA_COORDINATES[location] || AREA_COORDINATES[program.area];

  // Handle keywords - can be string or array
  let keywords = program.keywords || '';
  if (Array.isArray(keywords)) {
    keywords = keywords.join(', ');
  }

  // Handle area - can be string or array
  let area = program.area || '';
  if (Array.isArray(area)) {
    area = area.join(', ');
  }

  const doc = {
    id: program.id,
    name: program.name || '',
    description: descriptionParts.join(' ').substring(0, 1000),
    keywords: keywords,
    category: program.category || '',
    area: area,
    city: program.city || '',
    groups: program.groups || [],
    phone: program.phone || '',
    link: program.link || '',
  };

  // Add geo-coordinates if available
  if (coords) {
    doc.location = coords;
  }

  return doc;
}

async function typesenseRequest(endpoint, method = 'GET', body = null) {
  const url = `${TYPESENSE_HOST}${endpoint}`;
  const options = {
    method,
    headers: {
      'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok && response.status !== 404) {
    throw new Error(`Typesense error: ${response.status} ${text}`);
  }

  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function createCollection() {
  const schema = {
    name: COLLECTION_NAME,
    fields: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'keywords', type: 'string' },
      { name: 'category', type: 'string', facet: true },
      { name: 'area', type: 'string', facet: true },
      { name: 'city', type: 'string', facet: true },
      { name: 'groups', type: 'string[]', facet: true },
      { name: 'phone', type: 'string', optional: true },
      { name: 'link', type: 'string', optional: true },
      { name: 'location', type: 'geopoint', optional: true },
    ],
    default_sorting_field: '',
  };

  // Delete existing collection if exists
  console.log('Checking for existing collection...');
  const existing = await typesenseRequest(`/collections/${COLLECTION_NAME}`);
  if (existing.status === 200) {
    console.log('Deleting existing collection...');
    await typesenseRequest(`/collections/${COLLECTION_NAME}`, 'DELETE');
  }

  console.log('Creating collection schema...');
  await typesenseRequest('/collections', 'POST', schema);
}

async function importDocuments(documents) {
  console.log(`Importing ${documents.length} documents...`);

  // Typesense accepts JSONL for bulk import
  const jsonl = documents.map((doc) => JSON.stringify(doc)).join('\n');

  const url = `${TYPESENSE_HOST}/collections/${COLLECTION_NAME}/documents/import?action=create`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      'Content-Type': 'text/plain',
    },
    body: jsonl,
  });

  const text = await response.text();
  const results = text
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  const errors = results.filter((r) => !r.success);

  if (errors.length > 0) {
    console.warn(`${errors.length} documents failed to import:`);
    errors.slice(0, 5).forEach((e) => console.warn(`  - ${e.document}: ${e.error}`));
  }

  const success = results.filter((r) => r.success).length;
  console.log(`Successfully imported ${success}/${documents.length} documents`);
}

async function testSearch(query) {
  console.log(`\nTest search: "${query}"`);
  const result = await typesenseRequest(
    `/collections/${COLLECTION_NAME}/documents/search?q=${encodeURIComponent(query)}&query_by=name,keywords,description&per_page=3`
  );

  if (result.data?.hits) {
    result.data.hits.forEach((hit, i) => {
      console.log(`  ${i + 1}. ${hit.document.name} (${hit.document.category})`);
    });
  }
}

async function main() {
  if (!TYPESENSE_API_KEY) {
    console.error('Error: TYPESENSE_API_KEY environment variable is required');
    console.error('Usage: TYPESENSE_API_KEY=xxx node scripts/sync-typesense.cjs');
    process.exit(1);
  }

  console.log('Syncing programs to Typesense...\n');
  console.log(`Host: ${TYPESENSE_HOST}`);

  // Load programs
  const programs = loadAllPrograms();
  console.log(`Loaded ${programs.length} programs from YAML files`);

  // Build Typesense documents
  const documents = programs.map(buildTypesenseDocument);

  // Count geo-enabled documents
  const withGeo = documents.filter((d) => d.location);
  console.log(`Programs with geo-coordinates: ${withGeo.length}/${documents.length}`);

  // Create collection and import
  await createCollection();
  await importDocuments(documents);

  // Test searches
  await testSearch('food');
  await testSearch('calfresh');
  await testSearch('housing assistance');

  console.log('\nSync complete!');
  console.log(`Search API: ${TYPESENSE_HOST}/collections/${COLLECTION_NAME}/documents/search`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
