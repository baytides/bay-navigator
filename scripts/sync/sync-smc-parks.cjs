/**
 * Sync San Mateo County Parks, Beaches, and Open Spaces
 *
 * Fetches park data from San Mateo County Open Data Portal
 * and updates recreation.yml
 *
 * Usage: node scripts/sync-smc-parks.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SMC_DATA_URL = 'https://data.smcgov.org/resource/bp4f-54r8.json';

/**
 * Fetch data from SMC Open Data Portal
 */
function fetchParksData() {
  return new Promise((resolve, reject) => {
    https.get(SMC_DATA_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Generate a URL-friendly ID from name and city
 */
function generateId(name, city) {
  const citySlug = (city || 'smc').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40);
  return `${citySlug}-${nameSlug}`;
}

/**
 * Map SMC category to our category
 * Uses canonical categories from groups.yml
 */
function mapCategory(smcCategory) {
  // All parks, beaches, open spaces go under "Parks & Open Space"
  return 'Parks & Open Space';
}

/**
 * Get centroid from MultiPolygon geometry
 */
function getCentroid(geom) {
  if (!geom || !geom.coordinates) return null;

  try {
    // Flatten all coordinates
    const coords = [];
    const extractCoords = (arr) => {
      if (Array.isArray(arr[0]) && typeof arr[0][0] === 'number') {
        coords.push(...arr);
      } else if (Array.isArray(arr)) {
        arr.forEach(extractCoords);
      }
    };
    extractCoords(geom.coordinates);

    if (coords.length === 0) return null;

    // Calculate centroid
    let sumLng = 0, sumLat = 0;
    coords.forEach(([lng, lat]) => {
      sumLng += lng;
      sumLat += lat;
    });

    return {
      latitude: (sumLat / coords.length).toFixed(6),
      longitude: (sumLng / coords.length).toFixed(6)
    };
  } catch (e) {
    return null;
  }
}

/**
 * Format park for YAML output
 */
function formatParkForYaml(park) {
  const centroid = getCentroid(park.the_geom);
  const city = park.city || '';

  const entry = {
    id: generateId(park.name, city),
    name: park.name.split(' ').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' '),
    sync_source: 'smc-parks',
    category: mapCategory(park.category),
    area: 'San Mateo County',
    city: city.split(' ').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join(' '),
    groups: ['everyone'],
    verified_by: 'San Mateo County',
    verified_date: new Date().toISOString().split('T')[0]
  };

  // Add address if available
  if (park.address && park.address.trim()) {
    entry.address = park.address;
  }

  // Add map link if we have coordinates
  if (centroid) {
    entry.map_link = `https://maps.google.com/?q=${centroid.latitude},${centroid.longitude}`;
  }

  return entry;
}

/**
 * Convert entry to YAML string
 */
function entryToYaml(entry) {
  let yaml = `- id: ${entry.id}\n`;
  yaml += `  name: "${entry.name}"\n`;
  yaml += `  sync_source: ${entry.sync_source}\n`;
  yaml += `  category: ${entry.category}\n`;
  yaml += `  area: ${entry.area}\n`;
  if (entry.city) {
    yaml += `  city: ${entry.city}\n`;
  }
  yaml += `  groups:\n  - everyone\n`;
  if (entry.address) {
    yaml += `  address: "${entry.address}"\n`;
  }
  if (entry.map_link) {
    yaml += `  map_link: ${entry.map_link}\n`;
  }
  yaml += `  verified_by: ${entry.verified_by}\n`;
  yaml += `  verified_date: '${entry.verified_date}'\n`;
  return yaml;
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching San Mateo County parks data...');

  try {
    const data = await fetchParksData();
    console.log(`Found ${data.length} total parks/spaces`);

    // Filter out entries without names
    const validParks = data.filter(p => p.name && p.name.trim());
    console.log(`Valid entries with names: ${validParks.length}`);

    // Skip state parks (we already have those from CDE)
    const nonStateParks = validParks.filter(p => {
      const cat = (p.category || '').toUpperCase();
      return !cat.includes('STATE PARK') &&
             !cat.includes('STATE BEACH') &&
             !cat.includes('STATE RECREATION') &&
             !cat.includes('STATE HISTORIC');
    });
    console.log(`Non-state parks (to avoid duplicates): ${nonStateParks.length}`);

    // Format for output
    const formattedParks = nonStateParks.map(formatParkForYaml);

    // Remove duplicates by ID
    const seen = new Set();
    const uniqueParks = formattedParks.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    console.log(`Unique parks: ${uniqueParks.length}`);

    // Sort by city then name
    uniqueParks.sort((a, b) => {
      if (a.city !== b.city) return (a.city || '').localeCompare(b.city || '');
      return a.name.localeCompare(b.name);
    });

    // Count by category
    console.log('\nBy category:');
    const byCat = {};
    uniqueParks.forEach(p => {
      byCat[p.category] = (byCat[p.category] || 0) + 1;
    });
    Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    // Generate YAML output
    let yamlOutput = '\n# San Mateo County Parks, Beaches & Open Spaces\n';
    yamlOutput += '# Source: San Mateo County Open Data Portal\n';
    yamlOutput += `# Updated: ${new Date().toISOString().split('T')[0]}\n\n`;

    uniqueParks.forEach(entry => {
      yamlOutput += entryToYaml(entry) + '\n';
    });

    // Save to exports folder
    const exportDir = path.join(__dirname, '..', '..', 'data-exports', 'gov-datasets');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportPath = path.join(exportDir, 'smc-parks.yml');
    fs.writeFileSync(exportPath, yamlOutput);
    console.log(`\nSaved YAML to: ${exportPath}`);

    // Also save as JSON for reference
    const jsonPath = path.join(exportDir, 'smc-parks.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      source: 'San Mateo County Open Data Portal',
      url: 'https://data.smcgov.org/Environment/Parks-Beaches-and-Open-Spaces/mrrx-thc2',
      updated: new Date().toISOString(),
      parks: uniqueParks
    }, null, 2));
    console.log(`Saved JSON to: ${jsonPath}`);

    // Update recreation.yml
    const recreationPath = path.join(__dirname, '..', '..', 'src', 'data', 'recreation.yml');
    let recreationContent = fs.readFileSync(recreationPath, 'utf-8');

    // Remove all existing entries with sync_source: smc-parks
    const lines = recreationContent.split('\n');
    const filteredLines = [];
    let skipUntilNextEntry = false;
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('- id:')) {
        skipUntilNextEntry = false;

        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (lines[j].trim().startsWith('sync_source: smc-parks')) {
            skipUntilNextEntry = true;
            removedCount++;
            break;
          }
          if (lines[j].startsWith('- id:')) break;
        }
      }

      if (!skipUntilNextEntry) {
        filteredLines.push(line);
      }
    }

    recreationContent = filteredLines.join('\n');
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} existing smc-parks entries`);
    }

    // Remove the old section header if it exists
    const smcMarker = '# San Mateo County Parks, Beaches & Open Spaces';
    if (recreationContent.includes(smcMarker)) {
      const markerIndex = recreationContent.indexOf(smcMarker);
      let endIndex = markerIndex;
      const afterMarker = recreationContent.slice(markerIndex);
      const nextEntryMatch = afterMarker.match(/\n- id:/);
      if (nextEntryMatch) {
        endIndex = markerIndex + nextEntryMatch.index;
      }
      recreationContent = recreationContent.slice(0, markerIndex) + recreationContent.slice(endIndex);
    }

    // Clean up and add new section
    recreationContent = recreationContent.trimEnd() + '\n' + yamlOutput;

    fs.writeFileSync(recreationPath, recreationContent);
    console.log(`Updated: ${recreationPath}`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
