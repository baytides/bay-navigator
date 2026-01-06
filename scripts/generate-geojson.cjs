#!/usr/bin/env node
/**
 * Generate GeoJSON from YAML Program Data
 *
 * Extracts coordinates from latitude/longitude fields and generates
 * a GeoJSON file for use with MapLibre GL JS.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../src/data');
const API_DIR = path.join(__dirname, '../public/api');
const OUTPUT_FILE = path.join(API_DIR, 'programs.geojson');

// Files that are not program data
const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml', 'county-supervisors.yml'];

// Category colors for map markers (matches both file names and category field values)
const CATEGORY_COLORS = {
  'community': '#8B5CF6',      // purple
  'Community Services': '#8B5CF6',
  'education': '#3B82F6',      // blue
  'Education': '#3B82F6',
  'equipment': '#6B7280',      // gray
  'Equipment': '#6B7280',
  'finance': '#10B981',        // green
  'Finance': '#10B981',
  'food': '#F59E0B',           // amber
  'Food': '#F59E0B',
  'health': '#EF4444',         // red
  'Health': '#EF4444',
  'legal': '#6366F1',          // indigo
  'Legal': '#6366F1',
  'library_resources': '#8B5CF6', // purple
  'Library Resources': '#8B5CF6',
  'pet_resources': '#EC4899',  // pink
  'Pet Resources': '#EC4899',
  'recreation': '#14B8A6',     // teal
  'Recreation': '#14B8A6',
  'Museums': '#9333EA',        // purple for museums
  'Parks': '#22C55E',          // green for parks
  'Parks & Open Space': '#22C55E', // green for parks
  'technology': '#0EA5E9',     // sky
  'Technology': '#0EA5E9',
  'transportation': '#F97316', // orange
  'Transportation': '#F97316',
  'utilities': '#84CC16',      // lime
  'Utilities': '#84CC16',
  'federal-benefits': '#1D4ED8', // dark blue
  'Federal Benefits': '#1D4ED8'
};

console.log('🗺️  Generating GeoJSON from program data...\n');

// Ensure API directory exists
if (!fs.existsSync(API_DIR)) {
  fs.mkdirSync(API_DIR, { recursive: true });
}

// Load suppressed programs
const SUPPRESSED_FILE = path.join(DATA_DIR, 'suppressed.yml');
let suppressedIds = new Set();
if (fs.existsSync(SUPPRESSED_FILE)) {
  const suppressedData = yaml.load(fs.readFileSync(SUPPRESSED_FILE, 'utf8'));
  if (Array.isArray(suppressedData)) {
    suppressedIds = new Set(suppressedData.map(s => s.id));
  }
}

// Get coordinates from program's latitude/longitude fields
// Returns [lng, lat] array or null
function getCoordinates(program) {
  // Check for latitude/longitude fields
  if (program.latitude && program.longitude) {
    const lat = parseFloat(program.latitude);
    const lng = parseFloat(program.longitude);
    // Validate coordinates are in reasonable range for Bay Area
    if (lat >= 36 && lat <= 39 && lng >= -124 && lng <= -121) {
      return [lng, lat]; // GeoJSON uses [longitude, latitude]
    }
  }
  return null;
}

// Load all programs and extract those with coordinates
const features = [];
let totalPrograms = 0;
let programsWithCoords = 0;
let programsWithAddress = 0;

const categoryFiles = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

categoryFiles.forEach(file => {
  const categoryId = path.basename(file, '.yml');
  const filePath = path.join(DATA_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const programs = yaml.load(content) || [];

  programs.forEach(program => {
    totalPrograms++;

    const id = program.id || program.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Skip suppressed programs
    if (suppressedIds.has(id)) return;

    if (program.address) programsWithAddress++;

    // Get coordinates from latitude/longitude fields
    const coordinates = getCoordinates(program);

    if (coordinates) {
      programsWithCoords++;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        properties: {
          id: id,
          name: program.name,
          category: program.category || categoryId,
          categoryColor: CATEGORY_COLORS[program.category] || CATEGORY_COLORS[categoryId] || '#6B7280',
          area: program.area || '',
          city: program.city || '',
          address: program.address || '',
          description: program.description ?
            (program.description.length > 150 ?
              program.description.substring(0, 150) + '...' :
              program.description) : '',
          groups: program.groups || [],
          phone: program.phone || '',
          link: program.link || '',
          linkText: program.link_text || 'Learn More'
        }
      });
    }
  });
});

// Create GeoJSON FeatureCollection
const geojson = {
  type: 'FeatureCollection',
  features: features
};

// Write GeoJSON file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));

console.log('✅ Generated programs.geojson');
console.log(`\n📊 Summary:`);
console.log(`   - Total programs: ${totalPrograms}`);
console.log(`   - Programs with addresses: ${programsWithAddress}`);
console.log(`   - Programs with coordinates: ${programsWithCoords}`);
console.log(`   - GeoJSON features: ${features.length}`);
console.log(`\n📁 Output: ${OUTPUT_FILE}`);
