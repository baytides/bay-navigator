#!/usr/bin/env node
/**
 * Migrate map_link to latitude/longitude
 *
 * This one-time migration script:
 * 1. Extracts coordinates from map_link URLs
 * 2. Stores them in latitude/longitude fields
 * 3. Removes the map_link field
 *
 * Map links are now generated dynamically at build time from addresses
 * using DuckDuckGo Maps for privacy.
 *
 * Usage: node scripts/migrate-map-links.cjs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../src/data');
const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml'];

// Extract coordinates from map_link URL
function extractCoordinates(mapLink) {
  if (!mapLink) return null;

  // Match coordinates in ?q=lat,lng format
  const match = mapLink.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    // Validate coordinates are in reasonable range for Bay Area
    if (lat >= 36 && lat <= 39 && lng >= -124 && lng <= -121) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

async function main() {
  console.log('🔄 Migrating map_link to latitude/longitude...\n');

  const categoryFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

  let totalPrograms = 0;
  let withMapLink = 0;
  let migrated = 0;
  let alreadyHasCoords = 0;
  let invalidMapLink = 0;
  let mapLinkRemoved = 0;

  for (const file of categoryFiles) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let programs = yaml.load(content) || [];
    let fileModified = false;

    console.log(`\n📁 Processing ${file}...`);

    for (const program of programs) {
      totalPrograms++;

      if (program.map_link) {
        withMapLink++;

        // Already has coords?
        if (program.latitude && program.longitude) {
          alreadyHasCoords++;
          // Remove the redundant map_link
          delete program.map_link;
          mapLinkRemoved++;
          fileModified = true;
          continue;
        }

        // Try to extract coords from map_link
        const coords = extractCoordinates(program.map_link);

        if (coords) {
          program.latitude = coords.latitude;
          program.longitude = coords.longitude;
          migrated++;
          console.log(`   ✅ ${program.name}: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        } else {
          invalidMapLink++;
          console.log(`   ⚠️  ${program.name}: Could not extract coords from "${program.map_link}"`);
        }

        // Remove map_link either way
        delete program.map_link;
        mapLinkRemoved++;
        fileModified = true;
      }
    }

    // Save modified file
    if (fileModified) {
      const yamlOutput = yaml.dump(programs, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
        noRefs: true
      });
      fs.writeFileSync(filePath, yamlOutput);
      console.log(`   💾 Saved ${file}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   Total programs: ${totalPrograms}`);
  console.log(`   Had map_link: ${withMapLink}`);
  console.log(`   Already had lat/lng: ${alreadyHasCoords}`);
  console.log(`   Successfully migrated: ${migrated}`);
  console.log(`   Invalid/no coords: ${invalidMapLink}`);
  console.log(`   map_link fields removed: ${mapLinkRemoved}`);
  console.log('='.repeat(50));
  console.log('\n✨ Migration complete! Map links are now generated dynamically from addresses.');
}

main().catch(console.error);
