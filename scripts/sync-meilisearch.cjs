#!/usr/bin/env node
/**
 * Sync programs to Meilisearch
 *
 * Creates/configures a 'programs' index in Meilisearch with:
 * - All program documents with keywords, descriptions, categories
 * - Geo-coordinates for location-based search
 * - Filterable facets for category, area, groups, counties
 *
 * Run: node scripts/sync-meilisearch.cjs
 * Or:  MEILI_HOST=... MEILI_ADMIN_KEY=... node scripts/sync-meilisearch.cjs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_ADMIN_KEY = process.env.MEILI_ADMIN_KEY || '';
const INDEX_NAME = 'programs';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'src', 'data');

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

// Approximate coordinates for Bay Area locations
const AREA_COORDINATES = {
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Alameda County': { lat: 37.6017, lng: -122.0261 },
  Oakland: { lat: 37.8044, lng: -122.2712 },
  Berkeley: { lat: 37.8716, lng: -122.2727 },
  'San Mateo County': { lat: 37.5585, lng: -122.2711 },
  'Santa Clara County': { lat: 37.3541, lng: -121.9552 },
  'San Jose': { lat: 37.3382, lng: -121.8863 },
  'Contra Costa County': { lat: 37.9161, lng: -122.056 },
  'Marin County': { lat: 37.9735, lng: -122.5311 },
  'Sonoma County': { lat: 38.2921, lng: -122.4588 },
  'Napa County': { lat: 38.2975, lng: -122.2869 },
  'Solano County': { lat: 38.2494, lng: -122.0398 },
  'Bay Area': { lat: 37.6, lng: -122.1 },
};

function loadSuppressedIds() {
  const suppressedPath = path.join(DATA_DIR, 'suppressed.yml');
  if (!fs.existsSync(suppressedPath)) return new Set();
  const data = yaml.load(fs.readFileSync(suppressedPath, 'utf-8'));
  return Array.isArray(data) ? new Set(data.map((item) => item.id)) : new Set();
}

function loadAllPrograms() {
  const suppressedIds = loadSuppressedIds();
  const programs = [];

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  for (const file of files) {
    try {
      const data = yaml.load(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
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

function buildDocument(program) {
  const descriptionParts = [];
  if (program.description) descriptionParts.push(program.description);
  if (program.what_they_offer) {
    descriptionParts.push(
      program.what_they_offer.replace(/^[-*]\s+/gm, '').replace(/\n+/g, ' ').trim()
    );
  }

  let keywords = program.keywords || '';
  if (Array.isArray(keywords)) keywords = keywords.join(', ');

  let area = program.area || '';
  if (Array.isArray(area)) area = area.join(', ');

  let counties = program.counties || [];
  if (!Array.isArray(counties)) counties = [counties];
  if (counties.length === 0) counties = ['all'];

  const doc = {
    id: program.id,
    name: program.name || '',
    description: descriptionParts.join(' ').substring(0, 1000),
    keywords,
    category: program.category || '',
    area,
    city: program.city || '',
    groups: program.groups || [],
    counties,
    phone: program.phone || '',
    link: program.link || '',
  };

  // Meilisearch geo field must be named _geo with { lat, lng }
  const location = program.city || program.area;
  const coords = AREA_COORDINATES[location] || AREA_COORDINATES[program.area];
  if (coords) doc._geo = coords;

  return doc;
}

async function meiliRequest(endpoint, method = 'GET', body = null) {
  const url = `${MEILI_HOST}${endpoint}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${MEILI_ADMIN_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body !== null) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Meilisearch ${method} ${endpoint}: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function waitForTask(taskUid) {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const task = await meiliRequest(`/tasks/${taskUid}`);
    if (task.status === 'succeeded') return task;
    if (task.status === 'failed') throw new Error(`Task ${taskUid} failed: ${JSON.stringify(task.error)}`);
  }
  throw new Error(`Task ${taskUid} timed out`);
}

async function ensureIndex() {
  try {
    await meiliRequest(`/indexes/${INDEX_NAME}`);
    console.log('Index exists, updating documents...');
  } catch {
    console.log('Creating index...');
    const task = await meiliRequest('/indexes', 'POST', { uid: INDEX_NAME, primaryKey: 'id' });
    await waitForTask(task.taskUid);
  }
}

async function configureSettings() {
  console.log('Configuring index settings...');
  const task = await meiliRequest(`/indexes/${INDEX_NAME}/settings`, 'PATCH', {
    // Field order = ranking priority (name > keywords > description > area > city)
    searchableAttributes: ['name', 'keywords', 'description', 'area', 'city'],
    filterableAttributes: ['category', 'area', 'city', 'groups', 'counties', '_geo'],
    sortableAttributes: ['name', '_geo'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 },
    },
  });
  await waitForTask(task.taskUid);
}

async function importDocuments(documents) {
  console.log(`Importing ${documents.length} documents...`);
  // Meilisearch accepts a JSON array; use updateDocuments (upsert) so reruns are safe
  const task = await meiliRequest(`/indexes/${INDEX_NAME}/documents`, 'PUT', documents);
  await waitForTask(task.taskUid);
  console.log(`Successfully indexed ${documents.length} documents`);
}

async function testSearch(query) {
  console.log(`\nTest search: "${query}"`);
  const result = await meiliRequest(`/indexes/${INDEX_NAME}/search`, 'POST', {
    q: query,
    limit: 3,
  });
  (result.hits || []).forEach((hit, i) => {
    console.log(`  ${i + 1}. ${hit.name} (${hit.category})`);
  });
}

async function main() {
  if (!MEILI_ADMIN_KEY) {
    console.error('Error: MEILI_ADMIN_KEY environment variable is required');
    console.error('Usage: MEILI_ADMIN_KEY=xxx node scripts/sync-meilisearch.cjs');
    process.exit(1);
  }

  console.log('Syncing programs to Meilisearch...\n');
  console.log(`Host: ${MEILI_HOST}`);

  const programs = loadAllPrograms();
  console.log(`Loaded ${programs.length} programs from YAML files`);

  const documents = programs.map(buildDocument);
  const withGeo = documents.filter((d) => d._geo);
  console.log(`Programs with geo-coordinates: ${withGeo.length}/${documents.length}`);

  await ensureIndex();
  await configureSettings();
  await importDocuments(documents);

  await testSearch('food');
  await testSearch('calfresh');
  await testSearch('housing assistance');

  console.log('\nSync complete!');
  console.log(`Search API: ${MEILI_HOST}/indexes/${INDEX_NAME}/search`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
