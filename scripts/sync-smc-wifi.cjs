/**
 * Sync San Mateo County Public WiFi Hotspots
 *
 * Fetches public WiFi location data from San Mateo County Open Data Portal
 * and updates recreation.yml
 *
 * Usage: node scripts/sync-smc-wifi.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SMC_DATA_URL = 'https://datahub.smcgov.org/resource/3tvp-4cju.json';

/**
 * Fetch data from SMC Open Data Portal
 */
function fetchWifiData() {
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
 * Generate a URL-friendly ID from location name and city
 */
function generateId(location, city) {
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const nameSlug = location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40);
  return `${citySlug}-${nameSlug}`;
}

/**
 * Filter to only include public-facing locations
 * Excludes internal government offices that aren't really public WiFi spots
 */
function isPublicLocation(location) {
  const name = location.location.toLowerCase();

  // Include community centers, parks, libraries, clinics
  const publicKeywords = [
    'community center', 'park', 'library', 'pool', 'marina',
    'senior center', 'youth center', 'shelter', 'clinic',
    'airport', 'recreation', 'reserve'
  ];

  // Exclude internal government buildings
  const excludeKeywords = [
    'motor pool', 'data center', 'human resources', 'sheriff',
    'probation', 'county center', 'mtu', 'admin wing',
    'nursing wing', 'd & t'
  ];

  // Check exclusions first
  for (const keyword of excludeKeywords) {
    if (name.includes(keyword)) {
      return false;
    }
  }

  // If it's a health clinic or WIC, include it (public services)
  if (name.includes('clinic') || name.includes('wic')) {
    return true;
  }

  // Include if it has public keywords
  for (const keyword of publicKeywords) {
    if (name.includes(keyword)) {
      return true;
    }
  }

  // Include community-serving locations
  if (name.includes('center') || name.includes('hope') || name.includes('puente')) {
    return true;
  }

  return false;
}

/**
 * Determine category based on location type
 */
function getCategoryForLocation(name) {
  const lowerName = name.toLowerCase();

  // Recreation facilities
  if (lowerName.includes('community center') ||
      lowerName.includes('senior center') ||
      lowerName.includes('youth center') ||
      lowerName.includes('recreation') ||
      lowerName.includes('park') ||
      lowerName.includes('pool') ||
      lowerName.includes('marina')) {
    return 'Recreation';
  }

  // Libraries
  if (lowerName.includes('library')) {
    return 'Education';
  }

  // Health facilities
  if (lowerName.includes('clinic') || lowerName.includes('health') || lowerName.includes('wic')) {
    return 'Healthcare';
  }

  // Default to Technology for pure WiFi spots
  return 'Technology';
}

/**
 * Format WiFi location for YAML output
 */
function formatWifiForYaml(location) {
  const address = `${location.address}, ${location.city}, ${location.state} ${location.zip_code}`;
  const category = getCategoryForLocation(location.location);

  return {
    id: generateId(location.location, location.city),
    name: location.location,
    sync_source: 'smc-wifi',
    category: category,
    area: 'San Mateo County',
    city: location.city,
    groups: ['everyone'],
    address: address,
    amenities: [{
      name: '🛜 Free WiFi',
      link: 'https://www.smcgov.org/smc-public-wifi-project'
    }],
    verified_by: 'San Mateo County',
    verified_date: new Date().toISOString().split('T')[0]
  };
}

/**
 * Convert location object to YAML string
 */
function locationToYaml(loc) {
  let yaml = `- id: ${loc.id}\n`;
  yaml += `  name: "${loc.name}"\n`;
  yaml += `  sync_source: ${loc.sync_source}\n`;
  yaml += `  category: ${loc.category}\n`;
  yaml += `  area: ${loc.area}\n`;
  yaml += `  city: ${loc.city}\n`;
  yaml += `  groups:\n  - everyone\n`;
  yaml += `  address: "${loc.address}"\n`;
  yaml += `  amenities:\n`;
  yaml += `  - name: "${loc.amenities[0].name}"\n`;
  yaml += `    link: ${loc.amenities[0].link}\n`;
  yaml += `  verified_by: ${loc.verified_by}\n`;
  yaml += `  verified_date: '${loc.verified_date}'\n`;
  return yaml;
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching San Mateo County public WiFi data...');

  try {
    const data = await fetchWifiData();
    console.log(`Found ${data.length} total WiFi locations`);

    // Filter to public-facing locations only
    const publicLocations = data.filter(isPublicLocation);
    console.log(`Filtered to ${publicLocations.length} public-facing locations`);

    // Format for output
    const formattedLocations = publicLocations.map(loc => {
      const formatted = formatWifiForYaml(loc);
      console.log(`  - ${loc.location} (${loc.city})`);
      return formatted;
    });

    // Sort by city then name
    formattedLocations.sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      return a.name.localeCompare(b.name);
    });

    // Generate YAML output
    let yamlOutput = '\n# San Mateo County Public WiFi\n';
    yamlOutput += '# Source: San Mateo County Open Data Portal\n';
    yamlOutput += `# Updated: ${new Date().toISOString().split('T')[0]}\n\n`;

    formattedLocations.forEach(loc => {
      yamlOutput += locationToYaml(loc) + '\n';
    });

    // Save to exports folder
    const exportDir = path.join(__dirname, '..', 'data-exports', 'gov-datasets');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportPath = path.join(exportDir, 'smc-public-wifi.yml');
    fs.writeFileSync(exportPath, yamlOutput);
    console.log(`\nSaved YAML to: ${exportPath}`);

    // Also save as JSON for reference
    const jsonPath = path.join(exportDir, 'smc-public-wifi.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      source: 'San Mateo County Open Data Portal',
      url: 'https://datahub.smcgov.org/Government/Public-Wifi-Locations-and-Status-Filter/3tvp-4cju',
      updated: new Date().toISOString(),
      locations: formattedLocations
    }, null, 2));
    console.log(`Saved JSON to: ${jsonPath}`);

    // Update recreation.yml
    const recreationPath = path.join(__dirname, '..', 'src', 'data', 'recreation.yml');
    let recreationContent = fs.readFileSync(recreationPath, 'utf-8');

    // Remove all existing entries with sync_source: smc-wifi
    // Match entries starting with "- id:" and containing "sync_source: smc-wifi"
    const lines = recreationContent.split('\n');
    const filteredLines = [];
    let skipUntilNextEntry = false;
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a new entry
      if (line.startsWith('- id:')) {
        skipUntilNextEntry = false;

        // Look ahead to see if this entry has sync_source: smc-wifi
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (lines[j].trim().startsWith('sync_source: smc-wifi')) {
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
      console.log(`Removed ${removedCount} existing smc-wifi entries`);
    }

    // Remove the old section header if it exists (we'll add fresh one)
    const smcMarker = '# San Mateo County Public WiFi';
    if (recreationContent.includes(smcMarker)) {
      const markerIndex = recreationContent.indexOf(smcMarker);
      // Find end of comment block
      let endIndex = markerIndex;
      const afterMarker = recreationContent.slice(markerIndex);
      const nextEntryMatch = afterMarker.match(/\n- id:/);
      if (nextEntryMatch) {
        endIndex = markerIndex + nextEntryMatch.index;
      }
      recreationContent = recreationContent.slice(0, markerIndex) + recreationContent.slice(endIndex);
    }

    // Clean up any trailing whitespace and add new section
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
