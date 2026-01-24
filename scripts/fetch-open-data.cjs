#!/usr/bin/env node
/**
 * Fetch datasets from Bay Area Open Data portals
 *
 * Confirmed working:
 * - Socrata Discovery API (api.us.socrata.com)
 * - CKAN API (San Jose)
 *
 * Usage:
 *   node scripts/fetch-open-data.cjs --list          # List available portals
 *   node scripts/fetch-open-data.cjs --portal=NAME   # Fetch from specific portal
 *   node scripts/fetch-open-data.cjs --all           # Fetch from all portals
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'open-data');

// Open Data portal configurations - VERIFIED WORKING
const PORTALS = [
  // Socrata portals (use central discovery API)
  { name: 'San Mateo County', type: 'socrata', domain: 'data.smcgov.org' },
  { name: 'Berkeley', type: 'socrata', domain: 'data.cityofberkeley.info' },
  { name: 'San Francisco', type: 'socrata', domain: 'data.sfgov.org' },
  { name: 'Oakland', type: 'socrata', domain: 'data.oaklandca.gov' },
  { name: 'Alameda County', type: 'socrata', domain: 'data.acgov.org' },
  { name: 'Santa Clara County', type: 'socrata', domain: 'data.sccgov.org' },
  { name: 'Palo Alto', type: 'socrata', domain: 'data.cityofpaloalto.org' },
  // CKAN portal
  { name: 'San Jose', type: 'ckan', baseUrl: 'https://data.sanjoseca.gov' },
];

// Keywords for filtering useful datasets
const USEFUL_KEYWORDS = [
  'park', 'library', 'facility', 'service', 'center', 'recreation',
  'police', 'fire', 'station', 'school', 'hospital', 'clinic',
  'transit', 'bus', 'route', 'stop', 'bart', 'bike',
  'permit', 'license', 'business',
  'wifi', 'hotspot',
  '311', 'request',
  'event', 'meeting',
  'street', 'road', 'parking',
];

/**
 * Make HTTPS GET request with timeout
 */
function fetchJson(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BayNavigator/1.0)',
        'Accept': 'application/json',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Fetch datasets from Socrata Discovery API
 */
async function fetchSocrataPortal(portal) {
  const result = {
    name: portal.name,
    type: 'socrata',
    domain: portal.domain,
    fetchedAt: new Date().toISOString(),
    totalDatasets: 0,
    datasets: [],
    error: null,
  };

  console.log(`\n[${portal.name}] Fetching from Socrata...`);

  try {
    // Fetch catalog
    const catalogUrl = `https://api.us.socrata.com/api/catalog/v1?domains=${portal.domain}&limit=200`;
    console.log(`  API: ${catalogUrl}`);

    const catalog = await fetchJson(catalogUrl);
    const allDatasets = catalog.results || [];
    result.totalDatasets = catalog.resultSetSize || allDatasets.length;

    console.log(`  Found ${result.totalDatasets} total datasets`);

    // Filter to useful datasets
    const useful = allDatasets.filter(ds => {
      const name = (ds.resource?.name || '').toLowerCase();
      const desc = (ds.resource?.description || '').toLowerCase();
      const tags = (ds.classification?.domain_tags || []).join(' ').toLowerCase();
      const combined = name + ' ' + desc + ' ' + tags;
      return USEFUL_KEYWORDS.some(kw => combined.includes(kw));
    });

    console.log(`  ${useful.length} match useful keywords`);

    // Extract dataset info
    for (const ds of useful) {
      const dataset = {
        id: ds.resource?.id,
        name: ds.resource?.name,
        description: ds.resource?.description?.substring(0, 500),
        type: ds.resource?.type,
        category: ds.classification?.domain_category,
        tags: ds.classification?.domain_tags,
        updatedAt: ds.resource?.updatedAt,
        columns: ds.resource?.columns_name,
        webUrl: ds.permalink,
        dataUrl: `https://${portal.domain}/resource/${ds.resource?.id}.json`,
      };
      result.datasets.push(dataset);
    }

  } catch (e) {
    result.error = e.message;
    console.log(`  Error: ${e.message}`);
  }

  return result;
}

/**
 * Fetch datasets from CKAN API
 */
async function fetchCkanPortal(portal) {
  const result = {
    name: portal.name,
    type: 'ckan',
    baseUrl: portal.baseUrl,
    fetchedAt: new Date().toISOString(),
    totalDatasets: 0,
    datasets: [],
    error: null,
  };

  console.log(`\n[${portal.name}] Fetching from CKAN...`);

  try {
    // Get package list
    const listUrl = `${portal.baseUrl}/api/3/action/package_list`;
    console.log(`  API: ${listUrl}`);

    const listResponse = await fetchJson(listUrl);
    const packageNames = listResponse.result || [];
    result.totalDatasets = packageNames.length;

    console.log(`  Found ${result.totalDatasets} total datasets`);

    // Filter to useful packages by name
    const usefulNames = packageNames.filter(name => {
      const nameLower = name.toLowerCase();
      return USEFUL_KEYWORDS.some(kw => nameLower.includes(kw));
    });

    console.log(`  ${usefulNames.length} match useful keywords`);

    // Fetch details for useful packages (limit to 50 to avoid rate limiting)
    const toFetch = usefulNames.slice(0, 50);
    console.log(`  Fetching details for ${toFetch.length} datasets...`);

    for (const pkgName of toFetch) {
      try {
        const detailUrl = `${portal.baseUrl}/api/3/action/package_show?id=${pkgName}`;
        const detail = await fetchJson(detailUrl, 10000);

        if (detail.success && detail.result) {
          const pkg = detail.result;
          result.datasets.push({
            id: pkg.id,
            name: pkg.title || pkg.name,
            description: pkg.notes?.substring(0, 500),
            tags: pkg.tags?.map(t => t.name),
            updatedAt: pkg.metadata_modified,
            resources: pkg.resources?.map(r => ({
              name: r.name,
              format: r.format,
              url: r.url,
            })),
            webUrl: `${portal.baseUrl}/dataset/${pkg.name}`,
          });
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 200));

      } catch (e) {
        // Skip failed packages
      }
    }

    console.log(`  Successfully fetched ${result.datasets.length} dataset details`);

  } catch (e) {
    result.error = e.message;
    console.log(`  Error: ${e.message}`);
  }

  return result;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const listMode = args.includes('--list');
  const allMode = args.includes('--all');
  const portalArg = args.find(a => a.startsWith('--portal='));

  if (listMode) {
    console.log('Available Open Data Portals:');
    console.log('============================\n');
    PORTALS.forEach(p => {
      console.log(`  --portal="${p.name}" (${p.type})`);
    });
    console.log('\nUse --all to fetch from all portals');
    return;
  }

  if (!allMode && !portalArg) {
    console.log('Bay Area Open Data Fetcher');
    console.log('==========================\n');
    console.log('Usage:');
    console.log('  node scripts/fetch-open-data.cjs --list');
    console.log('  node scripts/fetch-open-data.cjs --portal="San Jose"');
    console.log('  node scripts/fetch-open-data.cjs --all\n');
    return;
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Determine which portals to process
  let portalsToProcess;
  if (allMode) {
    portalsToProcess = PORTALS;
  } else {
    const portalName = portalArg.split('=')[1].replace(/"/g, '');
    portalsToProcess = PORTALS.filter(p =>
      p.name.toLowerCase() === portalName.toLowerCase()
    );
    if (portalsToProcess.length === 0) {
      console.error(`Portal not found: ${portalName}`);
      console.log('Available:', PORTALS.map(p => p.name).join(', '));
      return;
    }
  }

  console.log('Bay Area Open Data Fetcher');
  console.log('==========================');
  console.log(`Processing ${portalsToProcess.length} portal(s)...\n`);

  const results = [];

  for (const portal of portalsToProcess) {
    let result;
    if (portal.type === 'socrata') {
      result = await fetchSocrataPortal(portal);
    } else if (portal.type === 'ckan') {
      result = await fetchCkanPortal(portal);
    }

    if (result) {
      results.push(result);

      // Save individual portal results
      const filename = portal.name.toLowerCase().replace(/\s+/g, '-') + '.json';
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`  Saved: ${filename}`);
    }
  }

  // Summary
  console.log('\n==========================');
  console.log('Summary:');
  let totalDatasets = 0;
  for (const r of results) {
    totalDatasets += r.datasets?.length || 0;
    console.log(`  ${r.name}: ${r.datasets?.length || 0} useful datasets (${r.totalDatasets} total)`);
  }
  console.log(`\nTotal useful datasets: ${totalDatasets}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);
