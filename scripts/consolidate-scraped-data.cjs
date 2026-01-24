#!/usr/bin/env node
/**
 * Consolidate all scraped data into formats useful for Carl
 *
 * Combines:
 * - Sitemap scraper results (data-exports/city-info/by-county/)
 * - No-sitemap scraper results (data-exports/city-info/no-sitemap/)
 * - Open Data portal datasets (data-exports/open-data/)
 *
 * Outputs:
 * - consolidated/all-entities.json - All cities/counties with contact info
 * - consolidated/all-services.json - Extracted services and departments
 * - consolidated/all-contacts.json - Phones, emails, addresses by entity
 * - consolidated/summary.json - Overview stats
 */

const fs = require('fs');
const path = require('path');

const SITEMAP_DIR = path.join(__dirname, '..', 'data-exports', 'city-info', 'by-county');
const NO_SITEMAP_DIR = path.join(__dirname, '..', 'data-exports', 'city-info', 'no-sitemap');
const OPEN_DATA_DIR = path.join(__dirname, '..', 'data-exports', 'open-data');
const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'consolidated');

function loadJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const results = [];

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      if (Array.isArray(data)) {
        results.push(...data);
      } else {
        results.push(data);
      }
    } catch (e) {
      console.log(`  Warning: Could not parse ${file}`);
    }
  }

  return results;
}

function aggregateFromPages(entity) {
  const phones = new Set();
  const emails = new Set();
  const addresses = new Set();

  for (const page of (entity.pages || [])) {
    (page.phones || []).forEach(p => phones.add(p));
    (page.emails || []).forEach(e => emails.add(e));
    (page.addresses || []).forEach(a => addresses.add(a));
  }

  return {
    phones: [...phones],
    emails: [...emails],
    addresses: [...addresses],
  };
}

function consolidateEntities(sitemapData, noSitemapData) {
  const entities = new Map();

  // Process sitemap data
  for (const entity of sitemapData) {
    const key = `${entity.name}-${entity.county}`;
    const aggregated = aggregateFromPages(entity);
    entities.set(key, {
      name: entity.name,
      county: entity.county,
      type: entity.type || 'City',
      url: entity.url,
      source: 'sitemap',
      pagesScraped: entity.pagesScraped || 0,
      phones: aggregated.phones,
      emails: aggregated.emails,
      addresses: aggregated.addresses,
      scrapedAt: entity.scrapedAt,
    });
  }

  // Process no-sitemap data (don't overwrite if sitemap data exists)
  for (const entity of noSitemapData) {
    const key = `${entity.name}-${entity.county}`;
    if (!entities.has(key)) {
      const aggregated = aggregateFromPages(entity);
      entities.set(key, {
        name: entity.name,
        county: entity.county,
        type: entity.type || 'City',
        url: entity.url,
        source: 'crawl',
        pagesScraped: entity.pagesScraped || 0,
        phones: aggregated.phones,
        emails: aggregated.emails,
        addresses: aggregated.addresses,
        scrapedAt: entity.scrapedAt,
      });
    }
  }

  return [...entities.values()];
}

function extractServices(sitemapData, noSitemapData) {
  const services = [];

  const allData = [...sitemapData, ...noSitemapData];

  for (const entity of allData) {
    const pages = entity.pages || [];

    for (const page of pages) {
      // Extract department/service names from titles
      if (page.title && page.category) {
        services.push({
          entity: entity.name,
          county: entity.county,
          category: page.category,
          title: page.title,
          url: page.url,
          description: page.description || '',
          phones: page.phones || [],
          emails: page.emails || [],
        });
      }
    }
  }

  return services;
}

function extractContacts(sitemapData, noSitemapData) {
  const contacts = [];
  const seen = new Set();

  const allData = [...sitemapData, ...noSitemapData];

  for (const entity of allData) {
    const key = `${entity.name}-${entity.county}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const aggregated = aggregateFromPages(entity);

    if (aggregated.phones.length > 0 || aggregated.emails.length > 0 || aggregated.addresses.length > 0) {
      contacts.push({
        name: entity.name,
        county: entity.county,
        type: entity.type || 'City',
        url: entity.url,
        phones: aggregated.phones,
        emails: aggregated.emails,
        addresses: aggregated.addresses,
      });
    }
  }

  return contacts;
}

function processOpenData(openDataResults) {
  const datasets = [];

  for (const portal of openDataResults) {
    if (!portal.datasets) continue;

    for (const ds of portal.datasets) {
      datasets.push({
        source: portal.name,
        sourceType: portal.type,
        id: ds.id,
        name: ds.name,
        description: ds.description,
        category: ds.category,
        tags: ds.tags,
        dataUrl: ds.dataUrl,
        webUrl: ds.webUrl,
        updatedAt: ds.updatedAt,
      });
    }
  }

  return datasets;
}

function generateSummary(entities, services, contacts, datasets) {
  const byCounty = {};
  for (const e of entities) {
    if (!byCounty[e.county]) byCounty[e.county] = { entities: 0, pages: 0 };
    byCounty[e.county].entities++;
    byCounty[e.county].pages += e.pagesScraped || 0;
  }

  const bySource = { sitemap: 0, crawl: 0 };
  for (const e of entities) {
    bySource[e.source]++;
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      entities: entities.length,
      pagesScraped: entities.reduce((s, e) => s + (e.pagesScraped || 0), 0),
      services: services.length,
      contacts: contacts.length,
      openDatasets: datasets.length,
      totalPhones: contacts.reduce((s, c) => s + c.phones.length, 0),
      totalEmails: contacts.reduce((s, c) => s + c.emails.length, 0),
    },
    byCounty,
    bySource,
  };
}

async function main() {
  console.log('Consolidating scraped data...\n');

  // Load all data
  console.log('Loading sitemap scraper results...');
  const sitemapData = loadJsonFiles(SITEMAP_DIR);
  console.log(`  Loaded ${sitemapData.length} entities`);

  console.log('Loading no-sitemap scraper results...');
  const noSitemapData = loadJsonFiles(NO_SITEMAP_DIR);
  console.log(`  Loaded ${noSitemapData.length} entities`);

  console.log('Loading open data results...');
  const openDataResults = loadJsonFiles(OPEN_DATA_DIR);
  console.log(`  Loaded ${openDataResults.length} portal results`);

  // Process
  console.log('\nProcessing...');

  const entities = consolidateEntities(sitemapData, noSitemapData);
  console.log(`  Consolidated ${entities.length} unique entities`);

  const services = extractServices(sitemapData, noSitemapData);
  console.log(`  Extracted ${services.length} services/pages`);

  const contacts = extractContacts(sitemapData, noSitemapData);
  console.log(`  Extracted contacts for ${contacts.length} entities`);

  const datasets = processOpenData(openDataResults);
  console.log(`  Processed ${datasets.length} open datasets`);

  const summary = generateSummary(entities, services, contacts, datasets);

  // Save outputs
  console.log('\nSaving outputs...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-entities.json'),
    JSON.stringify(entities, null, 2)
  );
  console.log('  Saved all-entities.json');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-services.json'),
    JSON.stringify(services, null, 2)
  );
  console.log('  Saved all-services.json');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-contacts.json'),
    JSON.stringify(contacts, null, 2)
  );
  console.log('  Saved all-contacts.json');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'open-datasets.json'),
    JSON.stringify(datasets, null, 2)
  );
  console.log('  Saved open-datasets.json');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('  Saved summary.json');

  // Print summary
  console.log('\n========================================');
  console.log('CONSOLIDATION COMPLETE');
  console.log('========================================');
  console.log(`Entities: ${summary.totals.entities}`);
  console.log(`Pages scraped: ${summary.totals.pagesScraped}`);
  console.log(`Services/pages: ${summary.totals.services}`);
  console.log(`Open datasets: ${summary.totals.openDatasets}`);
  console.log(`Total phones: ${summary.totals.totalPhones}`);
  console.log(`Total emails: ${summary.totals.totalEmails}`);
  console.log('\nBy county:');
  for (const [county, data] of Object.entries(summary.byCounty)) {
    console.log(`  ${county}: ${data.entities} entities, ${data.pages} pages`);
  }
  console.log(`\nOutput: ${OUTPUT_DIR}`);
}

main().catch(console.error);
