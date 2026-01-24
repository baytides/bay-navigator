#!/usr/bin/env node
/**
 * Detect what platform each Open Data portal uses
 * Then we can build appropriate fetchers for each platform type
 */

const https = require('https');
const http = require('http');

// All potential Open Data portals to check
const PORTALS_TO_CHECK = [
  // Counties
  { name: 'Alameda County', url: 'https://data.acgov.org' },
  { name: 'Contra Costa County', url: 'https://data.contracosta.ca.gov' },
  { name: 'Marin County', url: 'https://data.marincounty.org' },
  { name: 'San Mateo County', url: 'https://data.smcgov.org' },
  { name: 'Santa Clara County', url: 'https://data.sccgov.org' },
  { name: 'Solano County', url: 'https://data.solanocounty.com' },
  { name: 'Sonoma County', url: 'https://data.sonomacounty.ca.gov' },

  // Cities
  { name: 'Berkeley', url: 'https://data.cityofberkeley.info' },
  { name: 'Fremont', url: 'https://fremont-city.hub.arcgis.com' },
  { name: 'Hayward', url: 'https://data.hayward-ca.gov' },
  { name: 'Mountain View', url: 'https://data-mountainview.opendata.arcgis.com' },
  { name: 'Oakland', url: 'https://data.oaklandca.gov' },
  { name: 'Palo Alto', url: 'https://data.cityofpaloalto.org' },
  { name: 'Redwood City', url: 'https://data-redwoodcity.opendata.arcgis.com' },
  { name: 'Richmond', url: 'https://data.ci.richmond.ca.us' },
  { name: 'San Francisco', url: 'https://data.sfgov.org' },
  { name: 'San Jose', url: 'https://data.sanjoseca.gov' },
  { name: 'Santa Clara City', url: 'https://data-santaclara.opendata.arcgis.com' },
  { name: 'Sunnyvale', url: 'https://data-sunnyvale.opendata.arcgis.com' },
  { name: 'Walnut Creek', url: 'https://data.walnut-creek.org' },

  // Regional
  { name: 'MTC', url: 'https://opendata.mtc.ca.gov' },
  { name: 'BART', url: 'https://www.bart.gov/schedules/developers/api' },
];

/**
 * Fetch URL and return response info
 */
function fetchUrl(url, options = {}) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = options.timeout || 10000;

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BayNavigator/1.0)',
        'Accept': 'text/html,application/json,*/*',
      },
      timeout,
    }, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        // Only need first 5KB to detect platform
        if (data.length > 5000) {
          req.destroy();
        }
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 5000),
          finalUrl: res.headers.location || url,
        });
      });
    });

    req.on('error', (e) => {
      resolve({ error: e.message, status: 0 });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout', status: 0 });
    });
  });
}

/**
 * Detect platform type based on response
 */
async function detectPlatform(portal) {
  const result = {
    name: portal.name,
    url: portal.url,
    platform: 'unknown',
    apiEndpoint: null,
    catalogEndpoint: null,
    notes: [],
  };

  console.log(`\nChecking ${portal.name} (${portal.url})...`);

  // Check homepage
  const homepage = await fetchUrl(portal.url);
  if (homepage.error) {
    result.notes.push(`Homepage error: ${homepage.error}`);
  }

  // Check for Socrata
  const socrataApi = await fetchUrl(`${portal.url}/api/catalog/v1?limit=1`);
  if (socrataApi.status === 200 && socrataApi.body.includes('"results"')) {
    result.platform = 'socrata';
    result.apiEndpoint = `${portal.url}/api/catalog/v1`;
    result.catalogEndpoint = `${portal.url}/api/catalog/v1?limit=100`;
    console.log(`  ✓ Socrata detected`);
    return result;
  }

  // Check Socrata discovery API (central)
  const domain = portal.url.replace('https://', '').replace('http://', '').split('/')[0];
  const socrataDiscovery = await fetchUrl(`https://api.us.socrata.com/api/catalog/v1?domains=${domain}&limit=1`);
  if (socrataDiscovery.status === 200 && socrataDiscovery.body.includes('"results"')) {
    const parsed = JSON.parse(socrataDiscovery.body);
    if (parsed.results && parsed.results.length > 0) {
      result.platform = 'socrata-discovery';
      result.apiEndpoint = `https://api.us.socrata.com/api/catalog/v1?domains=${domain}`;
      result.catalogEndpoint = `https://api.us.socrata.com/api/catalog/v1?domains=${domain}&limit=100`;
      console.log(`  ✓ Socrata (via discovery API) detected`);
      return result;
    }
  }

  // Check for CKAN
  const ckanApi = await fetchUrl(`${portal.url}/api/3/action/package_list`);
  if (ckanApi.status === 200 && (ckanApi.body.includes('"success"') || ckanApi.body.includes('"result"'))) {
    result.platform = 'ckan';
    result.apiEndpoint = `${portal.url}/api/3/action`;
    result.catalogEndpoint = `${portal.url}/api/3/action/package_list`;
    console.log(`  ✓ CKAN detected`);
    return result;
  }

  // Check for ArcGIS Hub
  const arcgisApi = await fetchUrl(`${portal.url}/api/v3/datasets?page[size]=1`);
  if (arcgisApi.status === 200 && arcgisApi.body.includes('"data"')) {
    result.platform = 'arcgis-hub';
    result.apiEndpoint = `${portal.url}/api/v3/datasets`;
    result.catalogEndpoint = `${portal.url}/api/v3/datasets?page[size]=100`;
    console.log(`  ✓ ArcGIS Hub detected`);
    return result;
  }

  // Check for ArcGIS Open Data
  const arcgisSearch = await fetchUrl(`${portal.url}/api/feed/dcat-us/1.1.json`);
  if (arcgisSearch.status === 200 && arcgisSearch.body.includes('"dataset"')) {
    result.platform = 'arcgis-opendata';
    result.apiEndpoint = `${portal.url}/api/feed/dcat-us/1.1.json`;
    result.catalogEndpoint = `${portal.url}/api/feed/dcat-us/1.1.json`;
    console.log(`  ✓ ArcGIS Open Data (DCAT) detected`);
    return result;
  }

  // Check for DKAN
  const dkanApi = await fetchUrl(`${portal.url}/api/dataset`);
  if (dkanApi.status === 200) {
    result.platform = 'dkan';
    result.apiEndpoint = `${portal.url}/api/dataset`;
    console.log(`  ✓ DKAN detected`);
    return result;
  }

  // Check homepage content for clues
  if (homepage.body) {
    if (homepage.body.includes('socrata') || homepage.body.includes('Socrata')) {
      result.platform = 'socrata-like';
      result.notes.push('Socrata branding found but API not accessible');
    } else if (homepage.body.includes('arcgis') || homepage.body.includes('ArcGIS') || homepage.body.includes('esri')) {
      result.platform = 'arcgis-like';
      result.notes.push('ArcGIS branding found but standard API not accessible');
    } else if (homepage.body.includes('ckan') || homepage.body.includes('CKAN')) {
      result.platform = 'ckan-like';
      result.notes.push('CKAN branding found but API not accessible');
    } else if (homepage.body.includes('opengov') || homepage.body.includes('OpenGov')) {
      result.platform = 'opengov';
      result.notes.push('OpenGov platform detected');
    }
  }

  console.log(`  ? Platform: ${result.platform}`);
  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('Open Data Portal Platform Detection');
  console.log('====================================');

  const results = [];

  for (const portal of PORTALS_TO_CHECK) {
    const result = await detectPlatform(portal);
    results.push(result);
  }

  // Group by platform
  const byPlatform = {};
  for (const r of results) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = [];
    byPlatform[r.platform].push(r);
  }

  console.log('\n====================================');
  console.log('RESULTS BY PLATFORM');
  console.log('====================================\n');

  for (const [platform, portals] of Object.entries(byPlatform)) {
    console.log(`\n${platform.toUpperCase()} (${portals.length}):`);
    console.log('─'.repeat(40));
    for (const p of portals) {
      console.log(`  ${p.name}`);
      console.log(`    URL: ${p.url}`);
      if (p.catalogEndpoint) console.log(`    Catalog: ${p.catalogEndpoint}`);
      if (p.notes.length) console.log(`    Notes: ${p.notes.join(', ')}`);
    }
  }

  // Save results
  const fs = require('fs');
  const path = require('path');
  const outputDir = path.join(__dirname, '..', 'data-exports', 'open-data');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'portal-platforms.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved results to: ${outputPath}`);
}

main().catch(console.error);
