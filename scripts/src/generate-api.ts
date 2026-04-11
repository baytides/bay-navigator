#!/usr/bin/env node
/**
 * Generate Static JSON API from YAML Program Data
 *
 * This script converts YAML program files into JSON API endpoints
 * for consumption by the web and mobile apps.
 *
 * Features:
 * - Incremental builds (only regenerate changed files)
 * - Type-safe transformations
 * - Automatic ID generation from names
 * - City-to-county mapping
 * - Suppressed program filtering
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as yaml from 'js-yaml';
import type {
  YamlProgram,
  ApiProgram,
  ProgramsResponse,
  Category,
  CategoryMetadata,
  Group,
  GroupMetadata,
  Area,
  ApiMetadata,
  CityMapping,
  SuppressedProgram,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.join(__dirname, '../../src/data');
const CITIES_FILE = path.join(DATA_DIR, 'cities.yml');
const API_DIR = path.join(__dirname, '../../public/api');
const PROGRAMS_DIR = path.join(API_DIR, 'programs');
const CACHE_FILE = path.join(API_DIR, '.build-cache.json');

// Files that are not program data files
const NON_PROGRAM_FILES = [
  'cities.yml',
  'groups.yml',
  'zipcodes.yml',
  'suppressed.yml',
  'search-config.yml',
  'county-supervisors.yml',
  'site-config.yml',
];

// ============================================================================
// Metadata Definitions
// ============================================================================

const CATEGORY_METADATA: Record<string, CategoryMetadata> = {
  community: { id: 'community', name: 'Community', icon: '🏘️' },
  education: { id: 'education', name: 'Education', icon: '📚' },
  equipment: { id: 'equipment', name: 'Equipment', icon: '🔧' },
  finance: { id: 'finance', name: 'Finance', icon: '💰' },
  food: { id: 'food', name: 'Food', icon: '🍎' },
  health: { id: 'health', name: 'Health', icon: '💊' },
  legal: { id: 'legal', name: 'Legal', icon: '⚖️' },
  'library-resources': { id: 'library-resources', name: 'Library Resources', icon: '📖' },
  'pet-resources': { id: 'pet-resources', name: 'Pet Resources', icon: '🐾' },
  recreation: { id: 'recreation', name: 'Recreation', icon: '⚽' },
  technology: { id: 'technology', name: 'Technology', icon: '💻' },
  transportation: { id: 'transportation', name: 'Transportation', icon: '🚌' },
  utilities: { id: 'utilities', name: 'Utilities', icon: '🏠' },
};

const GROUPS_METADATA: Record<string, GroupMetadata> = {
  'income-eligible': {
    id: 'income-eligible',
    name: 'Income-Eligible',
    description: 'For people who qualify based on income',
    icon: '💳',
  },
  seniors: {
    id: 'seniors',
    name: 'Seniors (65+)',
    description: 'For adults age 65 and older',
    icon: '👵',
  },
  youth: { id: 'youth', name: 'Youth', description: 'For children and young adults', icon: '🧒' },
  'college-students': {
    id: 'college-students',
    name: 'College Students',
    description: 'For enrolled college students',
    icon: '🎓',
  },
  veterans: {
    id: 'veterans',
    name: 'Veterans / Active Duty',
    description: 'For military veterans and active duty',
    icon: '🎖️',
  },
  families: {
    id: 'families',
    name: 'Families',
    description: 'For families with children',
    icon: '👨‍👩‍👧',
  },
  disability: {
    id: 'disability',
    name: 'People with Disabilities',
    description: 'For individuals with disabilities',
    icon: '🧑‍🦽',
  },
  lgbtq: { id: 'lgbtq', name: 'LGBT+', description: 'For LGBTQ+ community members', icon: '🌈' },
  'first-responders': {
    id: 'first-responders',
    name: 'First Responders',
    description: 'For police, firefighters, EMTs, nurses',
    icon: '🚒',
  },
  teachers: {
    id: 'teachers',
    name: 'Teachers/Educators',
    description: 'For K-12 teachers and school staff',
    icon: '👩‍🏫',
  },
  unemployed: {
    id: 'unemployed',
    name: 'Unemployed/Job Seekers',
    description: 'For people actively seeking employment',
    icon: '💼',
  },
  immigrants: {
    id: 'immigrants',
    name: 'Immigrants/Refugees',
    description: 'For new arrivals, undocumented, DACA',
    icon: '🌍',
  },
  unhoused: {
    id: 'unhoused',
    name: 'Unhoused',
    description: 'For people experiencing homelessness',
    icon: '🏠',
  },
  pregnant: {
    id: 'pregnant',
    name: 'Pregnant Women',
    description: 'For prenatal and maternal care',
    icon: '🤰',
  },
  caregivers: {
    id: 'caregivers',
    name: 'Caregivers',
    description: 'For people caring for elderly or disabled family',
    icon: '🤲',
  },
  'foster-youth': {
    id: 'foster-youth',
    name: 'Foster Youth',
    description: 'For current and former foster youth',
    icon: '🏡',
  },
  reentry: {
    id: 'reentry',
    name: 'Formerly Incarcerated',
    description: 'For reentry support programs',
    icon: '🔓',
  },
  nonprofits: {
    id: 'nonprofits',
    name: 'Nonprofit Organizations',
    description: 'For registered nonprofits',
    icon: '🤝',
  },
  everyone: {
    id: 'everyone',
    name: 'Everyone',
    description: 'Available to all residents',
    icon: '🌎',
  },
};

const AREA_TYPES: Record<string, 'county' | 'region' | 'state' | 'nationwide'> = {
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

// ============================================================================
// Build Cache for Incremental Builds
// ============================================================================

interface BuildCache {
  fileHashes: Record<string, string>;
  lastBuild: string;
}

function loadBuildCache(): BuildCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {
    // Cache corrupted, start fresh
  }
  return { fileHashes: {}, lastBuild: '' };
}

function saveBuildCache(cache: BuildCache): void {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

// ============================================================================
// Data Loading
// ============================================================================

function loadCityMappings(): Map<string, string> {
  const cityToCounty = new Map<string, string>();

  if (fs.existsSync(CITIES_FILE)) {
    const content = fs.readFileSync(CITIES_FILE, 'utf-8');
    const cities = yaml.load(content) as CityMapping[] | null;

    if (cities) {
      for (const city of cities) {
        cityToCounty.set(city.name, city.county);
        cityToCounty.set(city.name.toLowerCase(), city.county);
      }
      console.log(`📍 Loaded ${cities.length} city-to-county mappings`);
    }
  }

  return cityToCounty;
}

function loadSuppressedIds(): Set<string> {
  const suppressedFile = path.join(DATA_DIR, 'suppressed.yml');
  const suppressedIds = new Set<string>();

  if (fs.existsSync(suppressedFile)) {
    const content = fs.readFileSync(suppressedFile, 'utf-8');
    const data = yaml.load(content) as SuppressedProgram[] | null;

    if (Array.isArray(data)) {
      for (const item of data) {
        suppressedIds.add(item.id);
      }
      console.log(`🚫 Loaded ${suppressedIds.size} suppressed program IDs`);
    }
  }

  return suppressedIds;
}

// ============================================================================
// Program Transformation
// ============================================================================

function generateIdFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function transformProgram(
  program: YamlProgram,
  categoryId: string,
  cityToCounty: Map<string, string>
): ApiProgram {
  const id = program.id || generateIdFromName(program.name);

  // Normalize areas to array
  let areas: string[] = [];
  if (program.area) {
    areas = Array.isArray(program.area) ? program.area : [program.area];
  }

  // Auto-derive county from city if needed
  const city = program.city || null;
  if (city && areas.length === 0) {
    const county = cityToCounty.get(city) || cityToCounty.get(city.toLowerCase());
    if (county) {
      areas = [county];
    }
  }

  return {
    id,
    name: program.name,
    category: categoryId,
    description: program.benefit || program.description || '',
    fullDescription: program.description || null,
    whatTheyOffer: program.what_they_offer || null,
    howToGetIt: program.how_to_get_it || null,
    groups: program.groups || program.eligibility || [],
    areas,
    city,
    website: program.link || program.website || '',
    cost: program.cost || null,
    phone: program.phone || null,
    email: program.email || null,
    address: program.address || null,
    requirements: program.requirements || null,
    howToApply: program.how_to_apply || null,
    keywords: program.keywords || [],
    lifeEvents: program.life_events || [],
    agency: program.agency || null,
    lastUpdated: new Date().toISOString().split('T')[0],
    verifiedBy: program.verified_by,
    verifiedDate: program.verified_date,
    latitude: program.latitude,
    longitude: program.longitude,
  };
}

// ============================================================================
// API File Generation
// ============================================================================

function generateCategoriesJson(programs: ApiProgram[]): Category[] {
  const counts: Record<string, number> = {};
  for (const p of programs) {
    counts[p.category] = (counts[p.category] || 0) + 1;
  }

  return Object.entries(CATEGORY_METADATA).map(([id, meta]) => ({
    ...meta,
    programCount: counts[id] || 0,
  }));
}

function generateGroupsJson(programs: ApiProgram[]): Group[] {
  const counts: Record<string, number> = {};
  for (const p of programs) {
    for (const g of p.groups) {
      counts[g] = (counts[g] || 0) + 1;
    }
  }

  return Object.entries(GROUPS_METADATA).map(([id, meta]) => ({
    ...meta,
    programCount: counts[id] || 0,
  }));
}

function generateAreasJson(programs: ApiProgram[]): Area[] {
  const counts: Record<string, number> = {};
  for (const p of programs) {
    for (const a of p.areas) {
      counts[a] = (counts[a] || 0) + 1;
    }
  }

  return Object.entries(AREA_TYPES).map(([name, type]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    type,
    programCount: counts[name] || 0,
  }));
}

function generateMetadata(totalPrograms: number): ApiMetadata {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalPrograms,
    endpoints: {
      programs: '/api/programs.json',
      categories: '/api/categories.json',
      groups: '/api/groups.json',
      areas: '/api/areas.json',
      singleProgram: '/api/programs/{id}.json',
    },
  };
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();
  const forceRebuild = process.argv.includes('--force');

  console.log('🚀 Generating API files from YAML data...\n');

  // Ensure directories exist
  if (!fs.existsSync(API_DIR)) {
    fs.mkdirSync(API_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROGRAMS_DIR)) {
    fs.mkdirSync(PROGRAMS_DIR, { recursive: true });
  }

  // Load build cache for incremental builds
  const cache = loadBuildCache();
  const newCache: BuildCache = { fileHashes: {}, lastBuild: new Date().toISOString() };

  // Load mappings
  const cityToCounty = loadCityMappings();
  const suppressedIds = loadSuppressedIds();

  // Find category files
  const categoryFiles = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  console.log(`📂 Found ${categoryFiles.length} category files`);

  // Track changes for incremental builds
  let changedFiles = 0;
  let unchangedFiles = 0;

  // Process all programs
  const allPrograms: ApiProgram[] = [];
  const existingProgramIds = new Set<string>();

  // Get existing program files for cleanup
  const oldProgramFiles = new Set(
    fs.existsSync(PROGRAMS_DIR)
      ? fs.readdirSync(PROGRAMS_DIR).filter((f) => f.endsWith('.json'))
      : []
  );

  for (const file of categoryFiles) {
    const categoryId = path.basename(file, '.yml');
    const filePath = path.join(DATA_DIR, file);
    const fileHash = computeFileHash(filePath);

    newCache.fileHashes[file] = fileHash;

    const isChanged = forceRebuild || cache.fileHashes[file] !== fileHash;
    if (isChanged) {
      changedFiles++;
    } else {
      unchangedFiles++;
    }

    // Always process to get program list (needed for aggregates)
    const content = fs.readFileSync(filePath, 'utf-8');
    const programs = yaml.load(content) as YamlProgram[] | null;

    if (!programs || !Array.isArray(programs)) {
      console.log(`   - ${file}: (empty or invalid)`);
      continue;
    }

    console.log(`   - ${file}: ${programs.length} programs${isChanged ? ' (changed)' : ''}`);

    for (const program of programs) {
      const transformed = transformProgram(program, categoryId, cityToCounty);

      // Skip suppressed programs
      if (suppressedIds.has(transformed.id)) {
        console.log(`      ⏭️  Skipping suppressed: ${program.name}`);
        continue;
      }

      allPrograms.push(transformed);
      existingProgramIds.add(transformed.id);

      // Write individual program file (only if changed or new)
      const programFile = `${transformed.id}.json`;
      oldProgramFiles.delete(programFile);

      if (isChanged || !fs.existsSync(path.join(PROGRAMS_DIR, programFile))) {
        fs.writeFileSync(
          path.join(PROGRAMS_DIR, programFile),
          JSON.stringify(transformed, null, 2)
        );
      }
    }
  }

  // Clean up deleted program files
  for (const orphanFile of oldProgramFiles) {
    fs.unlinkSync(path.join(PROGRAMS_DIR, orphanFile));
    console.log(`   🗑️  Removed orphan: ${orphanFile}`);
  }

  console.log(`\n✅ Processed ${allPrograms.length} programs`);
  console.log(`   📊 ${changedFiles} files changed, ${unchangedFiles} unchanged`);

  // Generate aggregate files (always regenerate for consistency)
  const programsResponse: ProgramsResponse = {
    total: allPrograms.length,
    count: allPrograms.length,
    offset: 0,
    programs: allPrograms,
  };

  fs.writeFileSync(path.join(API_DIR, 'programs.json'), JSON.stringify(programsResponse, null, 2));
  console.log('✅ Generated programs.json');

  const categories = generateCategoriesJson(allPrograms);
  fs.writeFileSync(path.join(API_DIR, 'categories.json'), JSON.stringify({ categories }, null, 2));
  console.log('✅ Generated categories.json');

  const groups = generateGroupsJson(allPrograms);
  fs.writeFileSync(path.join(API_DIR, 'groups.json'), JSON.stringify({ groups }, null, 2));
  console.log('✅ Generated groups.json');

  const areas = generateAreasJson(allPrograms);
  fs.writeFileSync(path.join(API_DIR, 'areas.json'), JSON.stringify({ areas }, null, 2));
  console.log('✅ Generated areas.json');

  const metadata = generateMetadata(allPrograms.length);
  fs.writeFileSync(path.join(API_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
  console.log('✅ Generated metadata.json');

  // Save build cache
  saveBuildCache(newCache);

  const duration = Date.now() - startTime;
  console.log('\n🎉 API generation complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Total programs: ${allPrograms.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Groups: ${groups.length}`);
  console.log(`   - Service areas: ${areas.length}`);
  console.log(`   - Duration: ${duration}ms`);
  console.log(`\n📁 Files written to: ${API_DIR}`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
