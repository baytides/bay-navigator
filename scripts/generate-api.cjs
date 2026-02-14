#!/usr/bin/env node
/**
 * Generate Static JSON API from YAML Program Data
 *
 * This script converts YAML program files into JSON API endpoints
 * for consumption by the mobile app.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
// Data files are now in src/data (Astro project structure)
// API output goes to public/api so Astro copies it to dist/api
const DATA_DIR = path.join(__dirname, '../src/data');
const CITIES_FILE = path.join(__dirname, '../src/data/cities.yml');
const API_DIR = path.join(__dirname, '../public/api');
const PROGRAMS_DIR = path.join(API_DIR, 'programs');

// Ensure API directories exist
if (!fs.existsSync(API_DIR)) {
  fs.mkdirSync(API_DIR, { recursive: true });
}
if (!fs.existsSync(PROGRAMS_DIR)) {
  fs.mkdirSync(PROGRAMS_DIR, { recursive: true });
} else {
  // Clean up old program files to remove deleted programs
  const oldFiles = fs.readdirSync(PROGRAMS_DIR).filter((f) => f.endsWith('.json'));
  oldFiles.forEach((f) => fs.unlinkSync(path.join(PROGRAMS_DIR, f)));
  console.log(`🧹 Cleaned up ${oldFiles.length} old program files`);
}

// Category metadata with icons
const CATEGORY_METADATA = {
  community: { name: 'Community', icon: '🏘️' },
  education: { name: 'Education', icon: '📚' },
  employment: { name: 'Employment', icon: '💼' },
  equipment: { name: 'Equipment', icon: '🔧' },
  'federal-benefits': { name: 'Federal Benefits', icon: '🏛️' },
  finance: { name: 'Finance', icon: '💰' },
  food: { name: 'Food', icon: '🍎' },
  health: { name: 'Health', icon: '💊' },
  housing: { name: 'Housing', icon: '🏠' },
  legal: { name: 'Legal', icon: '⚖️' },
  lgbtq: { name: 'LGBTQ+', icon: '🏳️‍🌈' },
  library_resources: { name: 'Library Resources', icon: '📖' },
  pet_resources: { name: 'Pet Resources', icon: '🐾' },
  recreation: { name: 'Recreation', icon: '⚽' },
  retail: { name: 'Retail', icon: '🛍️' },
  safety: { name: 'Safety', icon: '🛡️' },
  technology: { name: 'Technology', icon: '💻' },
  transportation: { name: 'Transportation', icon: '🚌' },
  utilities: { name: 'Utilities', icon: '🏠' },
};

// Groups metadata with icons (formerly "eligibility")
const GROUPS_METADATA = {
  'income-eligible': {
    name: 'Income-Eligible',
    description: 'For people who qualify based on income',
    icon: '💳',
  },
  seniors: { name: 'Seniors (65+)', description: 'For adults age 65 and older', icon: '👵' },
  youth: { name: 'Youth', description: 'For children and young adults', icon: '🧒' },
  'college-students': {
    name: 'College Students',
    description: 'For enrolled college students',
    icon: '🎓',
  },
  veterans: {
    name: 'Veterans / Active Duty',
    description: 'For military veterans and active duty',
    icon: '🎖️',
  },
  families: { name: 'Families', description: 'For families with children', icon: '👨‍👩‍👧' },
  disability: {
    name: 'People with Disabilities',
    description: 'For individuals with disabilities',
    icon: '🧑‍🦽',
  },
  lgbtq: { name: 'LGBT+', description: 'For LGBTQ+ community members', icon: '🌈' },
  'first-responders': {
    name: 'First Responders',
    description: 'For police, firefighters, EMTs, nurses',
    icon: '🚒',
  },
  teachers: {
    name: 'Teachers/Educators',
    description: 'For K-12 teachers and school staff',
    icon: '👩‍🏫',
  },
  unemployed: {
    name: 'Unemployed/Job Seekers',
    description: 'For people actively seeking employment',
    icon: '💼',
  },
  immigrants: {
    name: 'Immigrants/Refugees',
    description: 'For new arrivals, undocumented, DACA',
    icon: '🌍',
  },
  unhoused: { name: 'Unhoused', description: 'For people experiencing homelessness', icon: '🏠' },
  pregnant: { name: 'Pregnant Women', description: 'For prenatal and maternal care', icon: '🤰' },
  caregivers: {
    name: 'Caregivers',
    description: 'For people caring for elderly or disabled family',
    icon: '🤲',
  },
  'foster-youth': {
    name: 'Foster Youth',
    description: 'For current and former foster youth',
    icon: '🏡',
  },
  reentry: {
    name: 'Formerly Incarcerated',
    description: 'For reentry support programs',
    icon: '🔓',
  },
  nonprofits: {
    name: 'Nonprofit Organizations',
    description: 'For registered nonprofits',
    icon: '🤝',
  },
  everyone: { name: 'Everyone', description: 'Available to all residents', icon: '🌎' },
};

// Area type mapping
const AREA_TYPES = {
  'San Francisco': 'county',
  'Alameda County': 'county',
  'Contra Costa County': 'county',
  'Marin County': 'county',
  'Napa County': 'county',
  'San Mateo County': 'county',
  'Santa Clara County': 'county',
  'Solano County': 'county',
  'Sonoma County': 'county',
  'Bay Area': 'region',
  Statewide: 'state',
  Nationwide: 'nationwide',
};

console.log('🚀 Generating API files from YAML data...\n');

// Load city-to-county mapping
const CITY_TO_COUNTY = {};
if (fs.existsSync(CITIES_FILE)) {
  const citiesContent = fs.readFileSync(CITIES_FILE, 'utf8');
  const cities = yaml.load(citiesContent) || [];
  cities.forEach((city) => {
    // Store both exact name and lowercase for flexible matching
    CITY_TO_COUNTY[city.name] = city.county;
    CITY_TO_COUNTY[city.name.toLowerCase()] = city.county;
  });
  console.log(`📍 Loaded ${cities.length} city-to-county mappings`);
}

// Load suppressed programs list
const SUPPRESSED_FILE = path.join(DATA_DIR, 'suppressed.yml');
let suppressedIds = new Set();
if (fs.existsSync(SUPPRESSED_FILE)) {
  const suppressedData = yaml.load(fs.readFileSync(SUPPRESSED_FILE, 'utf8'));
  if (Array.isArray(suppressedData)) {
    suppressedIds = new Set(suppressedData.map((s) => s.id));
    console.log(`🚫 Loaded ${suppressedIds.size} suppressed program IDs`);
  }
}

// Data sources with restricted redistribution licenses
// These are excluded from the public API but still displayed on the website
const RESTRICTED_SOURCES = ['ThroughLine'];

// Load all programs from YAML files
const allPrograms = [];
// Filter out non-program files (metadata files that don't contain program arrays)
const NON_PROGRAM_FILES = [
  'airports.yml',
  'bay-area-jurisdictions.yml',
  'chat-messages.yml',
  'cities.yml',
  'city-profiles.yml',
  'county-supervisors.yml',
  'custom-themes.yml',
  'groups.yml',
  'helplines.yml',
  'quick-answers.yml',
  'search-config.yml',
  'site-config.yml',
  'suppressed.yml',
  'transit-agencies.yml',
  'zipcodes.yml',
];
const categoryFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

console.log(`📂 Found ${categoryFiles.length} category files`);

categoryFiles.forEach((file) => {
  const categoryId = path.basename(file, '.yml');
  const filePath = path.join(DATA_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const programs = yaml.load(content) || [];

  console.log(`   - ${file}: ${programs.length} programs`);

  programs.forEach((program) => {
    // Use existing ID from YAML, or generate from name as fallback
    const id =
      program.id ||
      program.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Skip suppressed programs
    if (suppressedIds.has(id)) {
      console.log(`      ⏭️  Skipping suppressed program: ${program.name}`);
      return;
    }

    // Skip programs from restricted data sources (license doesn't allow redistribution)
    if (program.verified_by && RESTRICTED_SOURCES.includes(program.verified_by)) {
      console.log(`      🔒 Excluding from API (restricted license): ${program.name}`);
      return;
    }

    // Transform program data
    // Ensure areas is always an array
    let areas = program.area || [];
    if (typeof areas === 'string') {
      areas = [areas];
    }

    // Handle city field - auto-derive county if city is specified but area isn't
    const city = program.city || null;
    if (city && areas.length === 0) {
      // Look up county from city mapping
      const county = CITY_TO_COUNTY[city] || CITY_TO_COUNTY[city.toLowerCase()];
      if (county) {
        areas = [county];
        console.log(`      ↳ Auto-derived area "${county}" from city "${city}"`);
      } else {
        console.warn(`      ⚠️  Unknown city "${city}" - no county mapping found`);
      }
    }

    const transformed = {
      id,
      name: program.name,
      category: categoryId,
      description: program.benefit || program.description || '',
      fullDescription: program.description || null,
      whatTheyOffer: program.what_they_offer || null,
      howToGetIt: program.how_to_get_it || null,
      groups: program.groups || program.eligibility || [],
      areas: areas,
      counties: program.counties || [],
      impact: program.impact || 'medium',
      city: city,
      website: program.link || program.website || '',
      cost: program.cost || null,
      phone: program.phone || null,
      email: program.email || null,
      address: program.address || null,
      requirements: program.requirements || null,
      howToApply: program.how_to_apply || null,
      // Hidden searchable fields - not displayed but indexed by Fuse.js
      keywords: program.keywords || [],
      lifeEvents: program.life_events || [],
      agency: program.agency || null,
      lastUpdated: new Date().toISOString().split('T')[0],
      // External data source tracking
      dataSource: program.data_source || 'bayNavigator',
      externalId: program.external_id || null,
      sourceUrl: program.source_url || null,
    };

    allPrograms.push(transformed);

    // Write individual program file
    const programFile = path.join(PROGRAMS_DIR, `${id}.json`);
    fs.writeFileSync(programFile, JSON.stringify(transformed, null, 2));
  });
});

console.log(`\n✅ Generated ${allPrograms.length} individual program files`);

// Generate programs.json (all programs)
const programsResponse = {
  total: allPrograms.length,
  count: allPrograms.length,
  offset: 0,
  programs: allPrograms,
};

fs.writeFileSync(path.join(API_DIR, 'programs.json'), JSON.stringify(programsResponse, null, 2));
console.log('✅ Generated programs.json');

// Generate categories.json
const categoryCounts = {};
allPrograms.forEach((p) => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
});

const categories = Object.keys(CATEGORY_METADATA).map((id) => ({
  id,
  name: CATEGORY_METADATA[id].name,
  icon: CATEGORY_METADATA[id].icon,
  programCount: categoryCounts[id] || 0,
}));

fs.writeFileSync(path.join(API_DIR, 'categories.json'), JSON.stringify({ categories }, null, 2));
console.log('✅ Generated categories.json');

// Generate groups.json (formerly eligibility.json)
const groupsCounts = {};
allPrograms.forEach((p) => {
  p.groups.forEach((g) => {
    groupsCounts[g] = (groupsCounts[g] || 0) + 1;
  });
});

const groups = Object.keys(GROUPS_METADATA).map((id) => ({
  id,
  name: GROUPS_METADATA[id].name,
  description: GROUPS_METADATA[id].description,
  icon: GROUPS_METADATA[id].icon,
  programCount: groupsCounts[id] || 0,
}));

fs.writeFileSync(path.join(API_DIR, 'groups.json'), JSON.stringify({ groups }, null, 2));
console.log('✅ Generated groups.json');

// Generate areas.json
const areaCounts = {};
allPrograms.forEach((p) => {
  p.areas.forEach((a) => {
    areaCounts[a] = (areaCounts[a] || 0) + 1;
  });
});

const areas = Object.keys(AREA_TYPES).map((name) => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  type: AREA_TYPES[name],
  programCount: areaCounts[name] || 0,
}));

fs.writeFileSync(path.join(API_DIR, 'areas.json'), JSON.stringify({ areas }, null, 2));
console.log('✅ Generated areas.json');

function generateSearchIndex(programs) {
  let Fuse = null;
  try {
    Fuse = require('fuse.js');
    Fuse = Fuse.default || Fuse;
  } catch (error) {
    console.warn('⚠️  Fuse.js not available, skipping search index generation.', error);
    return;
  }

  const searchKeys = [
    { name: 'name', weight: 0.45 },
    { name: 'description', weight: 0.3 },
    { name: 'category', weight: 0.15 },
    { name: 'area', weight: 0.1 },
    { name: 'keywords', weight: 0.1 },
  ];

  const documents = programs.map((program) => ({
    id: program.id,
    name: program.name,
    description: program.description || '',
    category: program.category || '',
    area: Array.isArray(program.areas) ? program.areas.join(', ') : program.areas || '',
    keywords: program.keywords || '',
  }));

  const index = Fuse.createIndex(searchKeys, documents);
  const payload = {
    generatedAt: new Date().toISOString(),
    keys: searchKeys,
    documents,
    index: index.toJSON(),
  };

  fs.writeFileSync(path.join(API_DIR, 'search-index.json'), JSON.stringify(payload, null, 2));
  console.log('✅ Generated search-index.json');
}

generateSearchIndex(allPrograms);

// Generate API metadata
const metadata = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  totalPrograms: allPrograms.length,
  endpoints: {
    programs: '/api/programs.json',
    categories: '/api/categories.json',
    groups: '/api/groups.json',
    areas: '/api/areas.json',
    searchIndex: '/api/search-index.json',
    singleProgram: '/api/programs/{id}.json',
  },
};

fs.writeFileSync(path.join(API_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
console.log('✅ Generated metadata.json');

// ─── Fetch sports data from Azure Blob Storage ──────────────────────────────
// Sports data is synced by GitHub Actions and stored in Azure Blob.
// We fetch it at build time so Astro pages can read it from public/data/.

async function fetchSportsData() {
  const SPORTS_BLOB_URL = 'https://baytidesstorage.blob.core.windows.net/api-data/sports-data.json';
  const SPORTS_OUTPUT = path.join(__dirname, '../public/data/sports-data.json');

  console.log('\n⚾ Fetching sports data from Azure Blob Storage...');
  try {
    const resp = await fetch(SPORTS_BLOB_URL, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.text();
    const parsed = JSON.parse(data); // validate JSON
    const teamCount = Object.keys(parsed.teams || {}).length;

    const outDir = path.dirname(SPORTS_OUTPUT);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(SPORTS_OUTPUT, data);
    console.log(`✅ Fetched sports data (${teamCount} teams) → ${SPORTS_OUTPUT}`);
  } catch (e) {
    console.warn(`⚠️  Could not fetch sports data: ${e.message}`);
    console.warn('   Sports pages will use stale/empty data if available locally.');
  }
}

fetchSportsData().then(() => {
  console.log('\n🎉 API generation complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Total programs: ${allPrograms.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Groups: ${groups.length}`);
  console.log(`   - Service areas: ${areas.length}`);
  console.log(`\n📁 Files written to: ${API_DIR}`);
});
