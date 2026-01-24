#!/usr/bin/env node
/**
 * Collect sitemaps from all Bay Area city websites
 *
 * This script checks each city for sitemap.xml and reports which cities have them.
 * Run this first to understand the scraping landscape before doing the full scrape.
 *
 * Usage: node scripts/collect-sitemaps.cjs
 *
 * Prerequisites:
 *   npm install playwright
 *   npx playwright install chromium
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data-exports', 'city-info');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sitemaps-inventory.json');

// All Bay Area entities (same list as main scraper)
const BAY_AREA_ENTITIES = [
  // Alameda County
  { county: 'Alameda', name: 'Alameda County', type: 'County', url: 'https://www.acgov.org' },
  { county: 'Alameda', name: 'Alameda', type: 'City', url: 'https://www.alamedaca.gov' },
  { county: 'Alameda', name: 'Albany', type: 'City', url: 'https://www.albanyca.gov' },
  { county: 'Alameda', name: 'Berkeley', type: 'City', url: 'https://berkeleyca.gov' },
  { county: 'Alameda', name: 'Dublin', type: 'City', url: 'https://dublin.ca.gov' },
  { county: 'Alameda', name: 'Emeryville', type: 'City', url: 'https://www.emeryville.org' },
  { county: 'Alameda', name: 'Fremont', type: 'City', url: 'https://www.fremont.gov' },
  { county: 'Alameda', name: 'Hayward', type: 'City', url: 'https://www.hayward-ca.gov' },
  { county: 'Alameda', name: 'Livermore', type: 'City', url: 'https://www.livermoreca.gov' },
  { county: 'Alameda', name: 'Newark', type: 'City', url: 'https://www.newarkca.gov' },
  { county: 'Alameda', name: 'Oakland', type: 'City', url: 'https://www.oaklandca.gov' },
  { county: 'Alameda', name: 'Piedmont', type: 'City', url: 'https://piedmont.ca.gov' },
  { county: 'Alameda', name: 'Pleasanton', type: 'City', url: 'https://www.cityofpleasantonca.gov' },
  { county: 'Alameda', name: 'San Leandro', type: 'City', url: 'https://www.sanleandro.org' },
  { county: 'Alameda', name: 'Union City', type: 'City', url: 'https://www.unioncityca.gov' },

  // Contra Costa County
  { county: 'Contra Costa', name: 'Contra Costa County', type: 'County', url: 'https://www.contracosta.ca.gov' },
  { county: 'Contra Costa', name: 'Antioch', type: 'City', url: 'https://www.antiochca.gov' },
  { county: 'Contra Costa', name: 'Brentwood', type: 'City', url: 'https://www.brentwoodca.gov' },
  { county: 'Contra Costa', name: 'Clayton', type: 'City', url: 'https://claytonca.gov' },
  { county: 'Contra Costa', name: 'Concord', type: 'City', url: 'https://cityofconcord.org' },
  { county: 'Contra Costa', name: 'Danville', type: 'Town', url: 'https://www.danville.ca.gov' },
  { county: 'Contra Costa', name: 'El Cerrito', type: 'City', url: 'https://www.el-cerrito.org' },
  { county: 'Contra Costa', name: 'Hercules', type: 'City', url: 'https://www.ci.hercules.ca.us' },
  { county: 'Contra Costa', name: 'Lafayette', type: 'City', url: 'https://www.lovelafayette.org' },
  { county: 'Contra Costa', name: 'Martinez', type: 'City', url: 'https://www.cityofmartinez.org' },
  { county: 'Contra Costa', name: 'Moraga', type: 'Town', url: 'https://www.moraga.ca.us' },
  { county: 'Contra Costa', name: 'Oakley', type: 'City', url: 'https://www.ci.oakley.ca.us' },
  { county: 'Contra Costa', name: 'Orinda', type: 'City', url: 'https://cityoforinda.org' },
  { county: 'Contra Costa', name: 'Pinole', type: 'City', url: 'https://www.ci.pinole.ca.us' },
  { county: 'Contra Costa', name: 'Pittsburg', type: 'City', url: 'https://www.pittsburgca.gov' },
  { county: 'Contra Costa', name: 'Pleasant Hill', type: 'City', url: 'https://www.pleasanthillca.org' },
  { county: 'Contra Costa', name: 'Richmond', type: 'City', url: 'https://www.ci.richmond.ca.us' },
  { county: 'Contra Costa', name: 'San Pablo', type: 'City', url: 'https://www.sanpabloca.gov' },
  { county: 'Contra Costa', name: 'San Ramon', type: 'City', url: 'https://www.sanramon.ca.gov' },
  { county: 'Contra Costa', name: 'Walnut Creek', type: 'City', url: 'https://www.walnutcreekca.gov' },

  // Marin County
  { county: 'Marin', name: 'Marin County', type: 'County', url: 'https://www.marincounty.org' },
  { county: 'Marin', name: 'Belvedere', type: 'City', url: 'https://www.cityofbelvedere.org' },
  { county: 'Marin', name: 'Corte Madera', type: 'Town', url: 'https://www.townofcortemadera.org' },
  { county: 'Marin', name: 'Fairfax', type: 'Town', url: 'https://www.townoffairfaxca.gov' },
  { county: 'Marin', name: 'Larkspur', type: 'City', url: 'https://www.cityoflarkspur.org' },
  { county: 'Marin', name: 'Mill Valley', type: 'City', url: 'https://www.cityofmillvalley.gov' },
  { county: 'Marin', name: 'Novato', type: 'City', url: 'https://www.novato.org' },
  { county: 'Marin', name: 'Ross', type: 'Town', url: 'https://www.townofrossca.gov' },
  { county: 'Marin', name: 'San Anselmo', type: 'Town', url: 'https://www.sananselmo.gov' },
  { county: 'Marin', name: 'San Rafael', type: 'City', url: 'https://www.cityofsanrafael.org' },
  { county: 'Marin', name: 'Sausalito', type: 'City', url: 'https://www.sausalito.gov' },
  { county: 'Marin', name: 'Tiburon', type: 'Town', url: 'https://www.townoftiburon.org' },

  // Napa County
  { county: 'Napa', name: 'Napa County', type: 'County', url: 'https://www.napacounty.gov' },
  { county: 'Napa', name: 'American Canyon', type: 'City', url: 'https://www.americancanyon.gov' },
  { county: 'Napa', name: 'Calistoga', type: 'City', url: 'https://ci.calistoga.ca.us' },
  { county: 'Napa', name: 'Napa', type: 'City', url: 'https://www.cityofnapa.org' },
  { county: 'Napa', name: 'St. Helena', type: 'City', url: 'https://www.cityofsthelena.org' },
  { county: 'Napa', name: 'Yountville', type: 'Town', url: 'https://www.townofyountville.com' },

  // San Francisco
  { county: 'San Francisco', name: 'San Francisco', type: 'City-County', url: 'https://sf.gov' },

  // San Mateo County
  { county: 'San Mateo', name: 'San Mateo County', type: 'County', url: 'https://www.smcgov.org' },
  { county: 'San Mateo', name: 'Atherton', type: 'Town', url: 'https://www.athertonca.gov' },
  { county: 'San Mateo', name: 'Belmont', type: 'City', url: 'https://www.belmont.gov' },
  { county: 'San Mateo', name: 'Brisbane', type: 'City', url: 'https://www.brisbaneca.org' },
  { county: 'San Mateo', name: 'Burlingame', type: 'City', url: 'https://www.burlingame.org' },
  { county: 'San Mateo', name: 'Colma', type: 'Town', url: 'https://www.colma.ca.gov' },
  { county: 'San Mateo', name: 'Daly City', type: 'City', url: 'https://www.dalycity.org' },
  { county: 'San Mateo', name: 'East Palo Alto', type: 'City', url: 'https://www.cityofepa.org' },
  { county: 'San Mateo', name: 'Foster City', type: 'City', url: 'https://www.fostercity.org' },
  { county: 'San Mateo', name: 'Half Moon Bay', type: 'City', url: 'https://www.halfmoonbay.gov' },
  { county: 'San Mateo', name: 'Hillsborough', type: 'Town', url: 'https://www.hillsborough.net' },
  { county: 'San Mateo', name: 'Menlo Park', type: 'City', url: 'https://www.menlopark.org' },
  { county: 'San Mateo', name: 'Millbrae', type: 'City', url: 'https://www.ci.millbrae.ca.us' },
  { county: 'San Mateo', name: 'Pacifica', type: 'City', url: 'https://www.cityofpacifica.org' },
  { county: 'San Mateo', name: 'Portola Valley', type: 'Town', url: 'https://www.portolavalley.net' },
  { county: 'San Mateo', name: 'Redwood City', type: 'City', url: 'https://www.redwoodcity.org' },
  { county: 'San Mateo', name: 'San Bruno', type: 'City', url: 'https://www.sanbruno.ca.gov' },
  { county: 'San Mateo', name: 'San Carlos', type: 'City', url: 'https://www.cityofsancarlos.org' },
  { county: 'San Mateo', name: 'San Mateo', type: 'City', url: 'https://www.cityofsanmateo.org' },
  { county: 'San Mateo', name: 'South San Francisco', type: 'City', url: 'https://www.ssf.net' },
  { county: 'San Mateo', name: 'Woodside', type: 'Town', url: 'https://www.woodsideca.gov' },

  // Santa Clara County
  { county: 'Santa Clara', name: 'Santa Clara County', type: 'County', url: 'https://www.sccgov.org' },
  { county: 'Santa Clara', name: 'Campbell', type: 'City', url: 'https://www.campbellca.gov' },
  { county: 'Santa Clara', name: 'Cupertino', type: 'City', url: 'https://www.cupertino.org' },
  { county: 'Santa Clara', name: 'Gilroy', type: 'City', url: 'https://www.cityofgilroy.org' },
  { county: 'Santa Clara', name: 'Los Altos', type: 'City', url: 'https://www.losaltosca.gov' },
  { county: 'Santa Clara', name: 'Los Altos Hills', type: 'Town', url: 'https://www.losaltoshills.ca.gov' },
  { county: 'Santa Clara', name: 'Los Gatos', type: 'Town', url: 'https://www.losgatosca.gov' },
  { county: 'Santa Clara', name: 'Milpitas', type: 'City', url: 'https://www.milpitas.gov' },
  { county: 'Santa Clara', name: 'Monte Sereno', type: 'City', url: 'https://www.cityofmontesereno.org' },
  { county: 'Santa Clara', name: 'Morgan Hill', type: 'City', url: 'https://www.morgan-hill.ca.gov' },
  { county: 'Santa Clara', name: 'Mountain View', type: 'City', url: 'https://www.mountainview.gov' },
  { county: 'Santa Clara', name: 'Palo Alto', type: 'City', url: 'https://www.paloalto.gov' },
  { county: 'Santa Clara', name: 'San Jose', type: 'City', url: 'https://www.sanjoseca.gov' },
  { county: 'Santa Clara', name: 'Santa Clara', type: 'City', url: 'https://www.santaclaraca.gov' },
  { county: 'Santa Clara', name: 'Saratoga', type: 'City', url: 'https://www.saratoga.ca.us' },
  { county: 'Santa Clara', name: 'Sunnyvale', type: 'City', url: 'https://www.sunnyvale.ca.gov' },

  // Solano County
  { county: 'Solano', name: 'Solano County', type: 'County', url: 'https://www.solanocounty.gov' },
  { county: 'Solano', name: 'Benicia', type: 'City', url: 'https://www.ci.benicia.ca.us' },
  { county: 'Solano', name: 'Dixon', type: 'City', url: 'https://www.cityofdixonca.gov' },
  { county: 'Solano', name: 'Fairfield', type: 'City', url: 'https://www.fairfield.ca.gov' },
  { county: 'Solano', name: 'Rio Vista', type: 'City', url: 'https://www.riovistacity.com' },
  { county: 'Solano', name: 'Suisun City', type: 'City', url: 'https://www.suisun.com' },
  { county: 'Solano', name: 'Vacaville', type: 'City', url: 'https://www.cityofvacaville.gov' },
  { county: 'Solano', name: 'Vallejo', type: 'City', url: 'https://www.cityofvallejo.net' },

  // Sonoma County
  { county: 'Sonoma', name: 'Sonoma County', type: 'County', url: 'https://www.sonomacounty.gov' },
  { county: 'Sonoma', name: 'Cloverdale', type: 'City', url: 'https://www.cloverdale.net' },
  { county: 'Sonoma', name: 'Cotati', type: 'City', url: 'https://www.cotaticity.gov' },
  { county: 'Sonoma', name: 'Healdsburg', type: 'City', url: 'https://healdsburg.gov' },
  { county: 'Sonoma', name: 'Petaluma', type: 'City', url: 'https://cityofpetaluma.org' },
  { county: 'Sonoma', name: 'Rohnert Park', type: 'City', url: 'https://www.rpcity.org' },
  { county: 'Sonoma', name: 'Santa Rosa', type: 'City', url: 'https://srcity.org' },
  { county: 'Sonoma', name: 'Sebastopol', type: 'City', url: 'https://www.cityofsebastopol.gov' },
  { county: 'Sonoma', name: 'Sonoma', type: 'City', url: 'https://www.sonomacity.org' },
  { county: 'Sonoma', name: 'Windsor', type: 'Town', url: 'https://www.townofwindsor.com' },

  // Regional Agencies
  { county: 'Regional', name: 'ABAG', type: 'Regional Agency', url: 'https://abag.ca.gov' },
  { county: 'Regional', name: 'MTC', type: 'Regional Agency', url: 'https://mtc.ca.gov' },
  { county: 'Regional', name: 'BAAQMD', type: 'Regional Agency', url: 'https://www.baaqmd.gov' },
  { county: 'Regional', name: 'BCDC', type: 'Regional Agency', url: 'https://www.bcdc.ca.gov' },
  { county: 'Regional', name: 'BART', type: 'Regional Agency', url: 'https://www.bart.gov' },
  { county: 'Regional', name: 'Caltrain', type: 'Regional Agency', url: 'https://www.caltrain.com' },
  { county: 'Regional', name: 'AC Transit', type: 'Regional Agency', url: 'https://www.actransit.org' },
  { county: 'Regional', name: 'Golden Gate Transit', type: 'Regional Agency', url: 'https://www.goldengate.org' },
  { county: 'Regional', name: 'SFMTA', type: 'Regional Agency', url: 'https://www.sfmta.com' },
  { county: 'Regional', name: 'VTA', type: 'Regional Agency', url: 'https://www.vta.org' },
  { county: 'Regional', name: 'SamTrans', type: 'Regional Agency', url: 'https://www.samtrans.com' },
  { county: 'Regional', name: 'Bay Area Toll Authority', type: 'Regional Agency', url: 'https://www.bayareatolls.com' },
  { county: 'Regional', name: '511 SF Bay', type: 'Regional Agency', url: 'https://511.org' },
  { county: 'Regional', name: 'BAWSCA', type: 'Regional Agency', url: 'https://bawsca.org' },
  { county: 'Regional', name: 'EBMUD', type: 'Regional Agency', url: 'https://www.ebmud.com' },
  { county: 'Regional', name: 'SFPUC', type: 'Regional Agency', url: 'https://www.sfpuc.org' },
];

const SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap/sitemap.xml',
  '/sitemaps/sitemap.xml',
  '/wp-sitemap.xml', // WordPress
  '/sitemap-index.xml',
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkSitemap(page, entity) {
  const result = {
    name: entity.name,
    county: entity.county,
    type: entity.type,
    url: entity.url,
    hasSitemap: false,
    sitemapUrl: null,
    urlCount: 0,
    sampleUrls: [],
    error: null,
  };

  for (const sitemapPath of SITEMAP_PATHS) {
    const sitemapUrl = entity.url + sitemapPath;

    try {
      const response = await page.goto(sitemapUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      if (response && response.ok()) {
        const content = await page.content();

        // Check if it's actually XML
        if (content.includes('<urlset') || content.includes('<sitemapindex')) {
          // Extract URLs
          const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
          const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));

          if (urls.length > 0) {
            result.hasSitemap = true;
            result.sitemapUrl = sitemapUrl;
            result.urlCount = urls.length;
            result.sampleUrls = urls.slice(0, 10); // First 10 URLs as sample
            break;
          }
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  return result;
}

async function main() {
  console.log('Bay Area Sitemap Collector');
  console.log('==========================');
  console.log(`Checking ${BAY_AREA_ENTITIES.length} entities for sitemaps...\n`);

  let playwright;
  try {
    playwright = require('playwright');
  } catch (e) {
    console.error('\nPlaywright is not installed. Install it with:');
    console.error('  npm install playwright');
    console.error('  npx playwright install chromium');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; BayNavigator/1.0; +https://baynavigator.org)',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const results = [];
  let withSitemap = 0;
  let withoutSitemap = 0;

  for (let i = 0; i < BAY_AREA_ENTITIES.length; i++) {
    const entity = BAY_AREA_ENTITIES[i];
    process.stdout.write(`[${i + 1}/${BAY_AREA_ENTITIES.length}] ${entity.name}... `);

    try {
      const result = await checkSitemap(page, entity);
      results.push(result);

      if (result.hasSitemap) {
        withSitemap++;
        console.log(`✓ Sitemap found (${result.urlCount} URLs)`);
      } else {
        withoutSitemap++;
        console.log('✗ No sitemap');
      }
    } catch (e) {
      console.log(`✗ Error: ${e.message.substring(0, 30)}`);
      results.push({
        ...entity,
        hasSitemap: false,
        error: e.message,
      });
      withoutSitemap++;
    }

    await sleep(500); // Be polite
  }

  await browser.close();

  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Summary
  console.log('\n==========================');
  console.log('SUMMARY');
  console.log('==========================');
  console.log(`Total entities: ${BAY_AREA_ENTITIES.length}`);
  console.log(`With sitemap: ${withSitemap} (${Math.round(withSitemap / BAY_AREA_ENTITIES.length * 100)}%)`);
  console.log(`Without sitemap: ${withoutSitemap} (${Math.round(withoutSitemap / BAY_AREA_ENTITIES.length * 100)}%)`);

  // Group by county
  console.log('\nBy County:');
  const byCounty = {};
  for (const r of results) {
    if (!byCounty[r.county]) {
      byCounty[r.county] = { total: 0, withSitemap: 0 };
    }
    byCounty[r.county].total++;
    if (r.hasSitemap) byCounty[r.county].withSitemap++;
  }
  for (const [county, stats] of Object.entries(byCounty)) {
    console.log(`  ${county}: ${stats.withSitemap}/${stats.total} have sitemaps`);
  }

  // List those with sitemaps
  console.log('\nEntities WITH sitemaps:');
  for (const r of results.filter(r => r.hasSitemap)) {
    console.log(`  ${r.name}: ${r.urlCount} URLs`);
  }

  console.log(`\nResults saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
