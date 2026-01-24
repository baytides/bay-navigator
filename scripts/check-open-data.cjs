#!/usr/bin/env node
/**
 * Check for Open Data portals among Bay Area entities
 * Many cities publish structured data that's better than scraping
 */

const OPEN_DATA_PORTALS = [
  // Counties
  { name: 'Alameda County', portal: 'https://data.acgov.org', type: 'Socrata' },
  { name: 'Contra Costa County', portal: 'https://data.contracosta.ca.gov', type: 'Socrata' },
  { name: 'Marin County', portal: 'https://data.marincounty.org', type: 'ArcGIS Hub' },
  { name: 'San Mateo County', portal: 'https://data.smcgov.org', type: 'Socrata' },
  { name: 'Santa Clara County', portal: 'https://data.sccgov.org', type: 'Socrata' },
  { name: 'Solano County', portal: 'https://data.solanocounty.com', type: 'ArcGIS Hub' },
  { name: 'Sonoma County', portal: 'https://data.sonomacounty.ca.gov', type: 'ArcGIS Hub' },

  // Major Cities
  { name: 'San Francisco', portal: 'https://datasf.org', altPortal: 'https://data.sfgov.org', type: 'Socrata' },
  { name: 'Oakland', portal: 'https://data.oaklandca.gov', type: 'Socrata' },
  { name: 'San Jose', portal: 'https://data.sanjoseca.gov', type: 'Socrata' },
  { name: 'Berkeley', portal: 'https://data.cityofberkeley.info', type: 'Socrata' },
  { name: 'Fremont', portal: 'https://fremont.gov/opendata', type: 'ArcGIS Hub' },
  { name: 'Hayward', portal: 'https://data.hayward-ca.gov', type: 'ArcGIS Hub' },
  { name: 'Sunnyvale', portal: 'https://data.sunnyvale.ca.gov', type: 'ArcGIS Hub' },
  { name: 'Santa Clara', portal: 'https://data.santaclaraca.gov', type: 'ArcGIS Hub' },
  { name: 'Mountain View', portal: 'https://data.mountainview.gov', type: 'ArcGIS Hub' },
  { name: 'Palo Alto', portal: 'https://data.cityofpaloalto.org', type: 'Socrata' },
  { name: 'Redwood City', portal: 'https://data.redwoodcity.org', type: 'ArcGIS Hub' },
  { name: 'Richmond', portal: 'https://data.ci.richmond.ca.us', type: 'Socrata' },
  { name: 'Walnut Creek', portal: 'https://data.walnut-creek.org', type: 'ArcGIS Hub' },

  // Regional Agencies
  { name: 'MTC', portal: 'https://opendata.mtc.ca.gov', type: 'ArcGIS Hub' },
  { name: 'BART', portal: 'https://www.bart.gov/about/reports', apiEndpoint: 'https://api.bart.gov', type: 'Custom API' },
  { name: 'SFMTA', portal: 'https://www.sfmta.com/reports/data', type: 'GTFS/Custom' },
  { name: 'VTA', portal: 'https://data.vta.org', type: 'GTFS' },
  { name: '511 SF Bay', portal: 'https://511.org/open-data', type: 'Custom API' },
  { name: 'BAAQMD', portal: 'https://www.baaqmd.gov/about-air-quality/air-quality-data', type: 'Custom' },
];

// Entities without sitemaps that we need to handle
const NO_SITEMAP_ENTITIES = [
  // Alameda
  'Alameda County', 'Albany', 'Berkeley', 'Fremont', 'Hayward', 'Livermore', 'Newark', 'Pleasanton',
  // Contra Costa
  'Brentwood', 'Clayton', 'Hercules', 'Lafayette', 'Martinez', 'Pinole', 'Pittsburg', 'Walnut Creek',
  // Marin
  'Marin County', 'Belvedere', 'Fairfax', 'Novato', 'Ross', 'San Rafael', 'Sausalito',
  // Napa
  'Calistoga',
  // San Mateo
  'San Mateo County', 'Belmont', 'Brisbane', 'Colma', 'East Palo Alto', 'Foster City', 'Menlo Park', 'Pacifica', 'Portola Valley', 'Redwood City', 'San Carlos',
  // Santa Clara
  'Santa Clara County', 'Monte Sereno', 'Morgan Hill', 'Mountain View', 'San Jose', 'Santa Clara', 'Sunnyvale',
  // Solano
  'Fairfield', 'Rio Vista', 'Vacaville',
  // Sonoma
  'Petaluma', 'Sebastopol', 'Sonoma',
  // Regional
  'ABAG', 'MTC', 'BCDC', 'BART', 'AC Transit', 'SFMTA', 'VTA', 'Bay Area Toll Authority', '511 SF Bay', 'BAWSCA', 'SFPUC',
];

console.log('Open Data Portals for Entities Without Sitemaps');
console.log('================================================\n');

console.log('ENTITIES WITH KNOWN OPEN DATA PORTALS:');
console.log('--------------------------------------');
const withPortals = [];
const withoutPortals = [];

for (const entity of NO_SITEMAP_ENTITIES) {
  const portal = OPEN_DATA_PORTALS.find(p => p.name === entity);
  if (portal) {
    withPortals.push(portal);
    console.log(`✓ ${entity}`);
    console.log(`  Portal: ${portal.portal}`);
    console.log(`  Type: ${portal.type}`);
    if (portal.altPortal) console.log(`  Alt: ${portal.altPortal}`);
    if (portal.apiEndpoint) console.log(`  API: ${portal.apiEndpoint}`);
    console.log();
  } else {
    withoutPortals.push(entity);
  }
}

console.log('\nENTITIES NEEDING HOMEPAGE CRAWL (no known portal):');
console.log('--------------------------------------------------');
withoutPortals.forEach(e => console.log(`  - ${e}`));

console.log('\n================================================');
console.log(`Summary: ${withPortals.length} with portals, ${withoutPortals.length} need crawling`);
