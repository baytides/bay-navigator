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
const DATA_DIR = path.join(__dirname, '../_data/programs');
const API_DIR = path.join(__dirname, '../api');
const PROGRAMS_DIR = path.join(API_DIR, 'programs');

// Ensure API directories exist
if (!fs.existsSync(API_DIR)) {
  fs.mkdirSync(API_DIR, { recursive: true });
}
if (!fs.existsSync(PROGRAMS_DIR)) {
  fs.mkdirSync(PROGRAMS_DIR, { recursive: true });
}

// Category metadata with icons
const CATEGORY_METADATA = {
  'arts-culture': { name: 'Arts & Culture', icon: '🎨' },
  'education': { name: 'Education', icon: '📚' },
  'food': { name: 'Food', icon: '🍎' },
  'health-wellness': { name: 'Health & Wellness', icon: '💊' },
  'housing-utilities': { name: 'Housing & Utilities', icon: '🏠' },
  'recreation': { name: 'Recreation', icon: '⚽' },
  'transportation': { name: 'Transportation', icon: '🚌' },
  'other': { name: 'Other Resources', icon: '📋' }
};

// Eligibility metadata with icons
const ELIGIBILITY_METADATA = {
  'low-income': { name: 'SNAP/EBT/Medi-Cal', description: 'For public benefit recipients', icon: '💳' },
  'seniors': { name: 'Seniors (65+)', description: 'For adults age 65 and older', icon: '👵' },
  'youth': { name: 'Youth', description: 'For children and young adults', icon: '🧒' },
  'college-students': { name: 'College Students', description: 'For enrolled college students', icon: '🎓' },
  'veterans': { name: 'Veterans / Active Duty', description: 'For military veterans and active duty', icon: '🎖️' },
  'families': { name: 'Families', description: 'For families with children', icon: '👨‍👩‍👧' },
  'disability': { name: 'People with Disabilities', description: 'For individuals with disabilities', icon: '🧑‍🦽' },
  'nonprofits': { name: 'Nonprofit Organizations', description: 'For registered nonprofits', icon: '🤝' },
  'everyone': { name: 'Everyone', description: 'Available to all residents', icon: '🌎' }
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
  'Statewide': 'state',
  'Nationwide': 'nationwide'
};

console.log('🚀 Generating API files from YAML data...\n');

// Load all programs from YAML files
const allPrograms = [];
const categoryFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.yml'));

console.log(`📂 Found ${categoryFiles.length} category files`);

categoryFiles.forEach(file => {
  const categoryId = path.basename(file, '.yml');
  const filePath = path.join(DATA_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const programs = yaml.load(content) || [];

  console.log(`   - ${file}: ${programs.length} programs`);

  programs.forEach(program => {
    // Generate unique ID from name
    const id = program.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Transform program data
    // Ensure areas is always an array
    let areas = program.area || [];
    if (typeof areas === 'string') {
      areas = [areas];
    }

    const transformed = {
      id,
      name: program.name,
      category: categoryId,
      description: program.description || '',
      eligibility: program.eligibility || [],
      areas: areas,
      website: program.website || '',
      cost: program.cost || null,
      phone: program.phone || null,
      email: program.email || null,
      requirements: program.requirements || null,
      howToApply: program.how_to_apply || null,
      lastUpdated: new Date().toISOString().split('T')[0]
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
  programs: allPrograms
};

fs.writeFileSync(
  path.join(API_DIR, 'programs.json'),
  JSON.stringify(programsResponse, null, 2)
);
console.log('✅ Generated programs.json');

// Generate categories.json
const categoryCounts = {};
allPrograms.forEach(p => {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
});

const categories = Object.keys(CATEGORY_METADATA).map(id => ({
  id,
  name: CATEGORY_METADATA[id].name,
  icon: CATEGORY_METADATA[id].icon,
  programCount: categoryCounts[id] || 0
}));

fs.writeFileSync(
  path.join(API_DIR, 'categories.json'),
  JSON.stringify({ categories }, null, 2)
);
console.log('✅ Generated categories.json');

// Generate eligibility.json
const eligibilityCounts = {};
allPrograms.forEach(p => {
  p.eligibility.forEach(e => {
    eligibilityCounts[e] = (eligibilityCounts[e] || 0) + 1;
  });
});

const eligibility = Object.keys(ELIGIBILITY_METADATA).map(id => ({
  id,
  name: ELIGIBILITY_METADATA[id].name,
  description: ELIGIBILITY_METADATA[id].description,
  icon: ELIGIBILITY_METADATA[id].icon,
  programCount: eligibilityCounts[id] || 0
}));

fs.writeFileSync(
  path.join(API_DIR, 'eligibility.json'),
  JSON.stringify({ eligibility }, null, 2)
);
console.log('✅ Generated eligibility.json');

// Generate areas.json
const areaCounts = {};
allPrograms.forEach(p => {
  p.areas.forEach(a => {
    areaCounts[a] = (areaCounts[a] || 0) + 1;
  });
});

const areas = Object.keys(AREA_TYPES).map(name => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  type: AREA_TYPES[name],
  programCount: areaCounts[name] || 0
}));

fs.writeFileSync(
  path.join(API_DIR, 'areas.json'),
  JSON.stringify({ areas }, null, 2)
);
console.log('✅ Generated areas.json');

// Generate API metadata
const metadata = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  totalPrograms: allPrograms.length,
  endpoints: {
    programs: '/api/programs.json',
    categories: '/api/categories.json',
    eligibility: '/api/eligibility.json',
    areas: '/api/areas.json',
    singleProgram: '/api/programs/{id}.json'
  }
};

fs.writeFileSync(
  path.join(API_DIR, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
);
console.log('✅ Generated metadata.json');

console.log('\n🎉 API generation complete!');
console.log(`📊 Summary:`);
console.log(`   - Total programs: ${allPrograms.length}`);
console.log(`   - Categories: ${categories.length}`);
console.log(`   - Eligibility types: ${eligibility.length}`);
console.log(`   - Service areas: ${areas.length}`);
console.log(`\n📁 Files written to: ${API_DIR}`);
