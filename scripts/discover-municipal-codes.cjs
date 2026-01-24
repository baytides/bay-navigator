#!/usr/bin/env node
/**
 * Discover municipal code URLs for all Bay Area cities and counties
 *
 * Common hosting platforms:
 * - Municode (library.municode.com)
 * - American Legal (codelibrary.amlegal.com)
 * - Sterling Codifiers (sterlingcodifiers.com)
 * - Qcode (qcode.us)
 * - Code Publishing (codepublishing.com)
 * - Self-hosted
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// All Bay Area entities from our inventory
const BAY_AREA_ENTITIES = [
  // Counties
  { name: 'Alameda County', type: 'County', county: 'Alameda' },
  { name: 'Contra Costa County', type: 'County', county: 'Contra Costa' },
  { name: 'Marin County', type: 'County', county: 'Marin' },
  { name: 'Napa County', type: 'County', county: 'Napa' },
  { name: 'San Francisco', type: 'City-County', county: 'San Francisco' },
  { name: 'San Mateo County', type: 'County', county: 'San Mateo' },
  { name: 'Santa Clara County', type: 'County', county: 'Santa Clara' },
  { name: 'Solano County', type: 'County', county: 'Solano' },
  { name: 'Sonoma County', type: 'County', county: 'Sonoma' },

  // Alameda County cities
  { name: 'Alameda', type: 'City', county: 'Alameda' },
  { name: 'Albany', type: 'City', county: 'Alameda' },
  { name: 'Berkeley', type: 'City', county: 'Alameda' },
  { name: 'Dublin', type: 'City', county: 'Alameda' },
  { name: 'Emeryville', type: 'City', county: 'Alameda' },
  { name: 'Fremont', type: 'City', county: 'Alameda' },
  { name: 'Hayward', type: 'City', county: 'Alameda' },
  { name: 'Livermore', type: 'City', county: 'Alameda' },
  { name: 'Newark', type: 'City', county: 'Alameda' },
  { name: 'Oakland', type: 'City', county: 'Alameda' },
  { name: 'Piedmont', type: 'City', county: 'Alameda' },
  { name: 'Pleasanton', type: 'City', county: 'Alameda' },
  { name: 'San Leandro', type: 'City', county: 'Alameda' },
  { name: 'Union City', type: 'City', county: 'Alameda' },

  // Contra Costa County cities
  { name: 'Antioch', type: 'City', county: 'Contra Costa' },
  { name: 'Brentwood', type: 'City', county: 'Contra Costa' },
  { name: 'Clayton', type: 'City', county: 'Contra Costa' },
  { name: 'Concord', type: 'City', county: 'Contra Costa' },
  { name: 'Danville', type: 'Town', county: 'Contra Costa' },
  { name: 'El Cerrito', type: 'City', county: 'Contra Costa' },
  { name: 'Hercules', type: 'City', county: 'Contra Costa' },
  { name: 'Lafayette', type: 'City', county: 'Contra Costa' },
  { name: 'Martinez', type: 'City', county: 'Contra Costa' },
  { name: 'Moraga', type: 'Town', county: 'Contra Costa' },
  { name: 'Oakley', type: 'City', county: 'Contra Costa' },
  { name: 'Orinda', type: 'City', county: 'Contra Costa' },
  { name: 'Pinole', type: 'City', county: 'Contra Costa' },
  { name: 'Pittsburg', type: 'City', county: 'Contra Costa' },
  { name: 'Pleasant Hill', type: 'City', county: 'Contra Costa' },
  { name: 'Richmond', type: 'City', county: 'Contra Costa' },
  { name: 'San Pablo', type: 'City', county: 'Contra Costa' },
  { name: 'San Ramon', type: 'City', county: 'Contra Costa' },
  { name: 'Walnut Creek', type: 'City', county: 'Contra Costa' },

  // Marin County cities
  { name: 'Belvedere', type: 'City', county: 'Marin' },
  { name: 'Corte Madera', type: 'Town', county: 'Marin' },
  { name: 'Fairfax', type: 'Town', county: 'Marin' },
  { name: 'Larkspur', type: 'City', county: 'Marin' },
  { name: 'Mill Valley', type: 'City', county: 'Marin' },
  { name: 'Novato', type: 'City', county: 'Marin' },
  { name: 'Ross', type: 'Town', county: 'Marin' },
  { name: 'San Anselmo', type: 'Town', county: 'Marin' },
  { name: 'San Rafael', type: 'City', county: 'Marin' },
  { name: 'Sausalito', type: 'City', county: 'Marin' },
  { name: 'Tiburon', type: 'Town', county: 'Marin' },

  // Napa County cities
  { name: 'American Canyon', type: 'City', county: 'Napa' },
  { name: 'Calistoga', type: 'City', county: 'Napa' },
  { name: 'Napa', type: 'City', county: 'Napa' },
  { name: 'St. Helena', type: 'City', county: 'Napa' },
  { name: 'Yountville', type: 'Town', county: 'Napa' },

  // San Mateo County cities
  { name: 'Atherton', type: 'Town', county: 'San Mateo' },
  { name: 'Belmont', type: 'City', county: 'San Mateo' },
  { name: 'Brisbane', type: 'City', county: 'San Mateo' },
  { name: 'Burlingame', type: 'City', county: 'San Mateo' },
  { name: 'Colma', type: 'Town', county: 'San Mateo' },
  { name: 'Daly City', type: 'City', county: 'San Mateo' },
  { name: 'East Palo Alto', type: 'City', county: 'San Mateo' },
  { name: 'Foster City', type: 'City', county: 'San Mateo' },
  { name: 'Half Moon Bay', type: 'City', county: 'San Mateo' },
  { name: 'Hillsborough', type: 'Town', county: 'San Mateo' },
  { name: 'Menlo Park', type: 'City', county: 'San Mateo' },
  { name: 'Millbrae', type: 'City', county: 'San Mateo' },
  { name: 'Pacifica', type: 'City', county: 'San Mateo' },
  { name: 'Portola Valley', type: 'Town', county: 'San Mateo' },
  { name: 'Redwood City', type: 'City', county: 'San Mateo' },
  { name: 'San Bruno', type: 'City', county: 'San Mateo' },
  { name: 'San Carlos', type: 'City', county: 'San Mateo' },
  { name: 'San Mateo', type: 'City', county: 'San Mateo' },
  { name: 'South San Francisco', type: 'City', county: 'San Mateo' },
  { name: 'Woodside', type: 'Town', county: 'San Mateo' },

  // Santa Clara County cities
  { name: 'Campbell', type: 'City', county: 'Santa Clara' },
  { name: 'Cupertino', type: 'City', county: 'Santa Clara' },
  { name: 'Gilroy', type: 'City', county: 'Santa Clara' },
  { name: 'Los Altos', type: 'City', county: 'Santa Clara' },
  { name: 'Los Altos Hills', type: 'Town', county: 'Santa Clara' },
  { name: 'Los Gatos', type: 'Town', county: 'Santa Clara' },
  { name: 'Milpitas', type: 'City', county: 'Santa Clara' },
  { name: 'Monte Sereno', type: 'City', county: 'Santa Clara' },
  { name: 'Morgan Hill', type: 'City', county: 'Santa Clara' },
  { name: 'Mountain View', type: 'City', county: 'Santa Clara' },
  { name: 'Palo Alto', type: 'City', county: 'Santa Clara' },
  { name: 'San Jose', type: 'City', county: 'Santa Clara' },
  { name: 'Santa Clara', type: 'City', county: 'Santa Clara' },
  { name: 'Saratoga', type: 'City', county: 'Santa Clara' },
  { name: 'Sunnyvale', type: 'City', county: 'Santa Clara' },

  // Solano County cities
  { name: 'Benicia', type: 'City', county: 'Solano' },
  { name: 'Dixon', type: 'City', county: 'Solano' },
  { name: 'Fairfield', type: 'City', county: 'Solano' },
  { name: 'Rio Vista', type: 'City', county: 'Solano' },
  { name: 'Suisun City', type: 'City', county: 'Solano' },
  { name: 'Vacaville', type: 'City', county: 'Solano' },
  { name: 'Vallejo', type: 'City', county: 'Solano' },

  // Sonoma County cities
  { name: 'Cloverdale', type: 'City', county: 'Sonoma' },
  { name: 'Cotati', type: 'City', county: 'Sonoma' },
  { name: 'Healdsburg', type: 'City', county: 'Sonoma' },
  { name: 'Petaluma', type: 'City', county: 'Sonoma' },
  { name: 'Rohnert Park', type: 'City', county: 'Sonoma' },
  { name: 'Santa Rosa', type: 'City', county: 'Sonoma' },
  { name: 'Sebastopol', type: 'City', county: 'Sonoma' },
  { name: 'Sonoma', type: 'City', county: 'Sonoma' },
  { name: 'Windsor', type: 'Town', county: 'Sonoma' },
];

// Known municipal code URLs (pre-populated from research)
const KNOWN_CODES = {
  // Counties
  'Alameda County': 'https://library.municode.com/ca/alameda_county',
  'Contra Costa County': 'https://library.municode.com/ca/contra_costa_county',
  'Marin County': 'https://library.municode.com/ca/marin_county',
  'Napa County': 'https://library.municode.com/ca/napa_county',
  'San Francisco': 'https://codelibrary.amlegal.com/codes/san_francisco',
  'San Mateo County': 'https://library.municode.com/ca/san_mateo_county',
  'Santa Clara County': 'https://library.municode.com/ca/santa_clara_county',
  'Solano County': 'https://library.municode.com/ca/solano_county',
  'Sonoma County': 'https://library.municode.com/ca/sonoma_county',

  // Alameda County cities
  Oakland: 'https://library.municode.com/ca/oakland',
  Berkeley: 'https://berkeley.municipal.codes/',
  Fremont: 'https://library.municode.com/ca/fremont',
  Hayward: 'https://library.municode.com/ca/hayward',
  Alameda: 'https://library.municode.com/ca/alameda',
  'San Leandro': 'https://library.municode.com/ca/san_leandro',
  Livermore: 'https://library.municode.com/ca/livermore',
  Pleasanton: 'https://library.municode.com/ca/pleasanton',
  'Union City': 'https://library.municode.com/ca/union_city',
  Newark: 'https://library.municode.com/ca/newark',
  Dublin: 'https://library.municode.com/ca/dublin',
  Emeryville: 'https://library.municode.com/ca/emeryville',
  Piedmont: 'https://library.municode.com/ca/piedmont',
  Albany: 'https://library.municode.com/ca/albany',

  // Contra Costa County
  Richmond: 'https://library.municode.com/ca/richmond',
  Concord: 'https://library.municode.com/ca/concord',
  Antioch: 'https://library.municode.com/ca/antioch',
  'Walnut Creek': 'https://library.municode.com/ca/walnut_creek',
  'San Ramon': 'https://library.municode.com/ca/san_ramon',
  Pittsburg: 'https://library.municode.com/ca/pittsburg',
  Brentwood: 'https://library.municode.com/ca/brentwood',
  Oakley: 'https://library.municode.com/ca/oakley',
  Martinez: 'https://library.municode.com/ca/martinez',
  'Pleasant Hill': 'https://library.municode.com/ca/pleasant_hill',
  'El Cerrito': 'https://library.municode.com/ca/el_cerrito',
  Hercules: 'https://library.municode.com/ca/hercules',
  Pinole: 'https://library.municode.com/ca/pinole',
  'San Pablo': 'https://library.municode.com/ca/san_pablo',
  Lafayette: 'https://library.municode.com/ca/lafayette',
  Moraga: 'https://library.municode.com/ca/moraga',
  Orinda: 'https://library.municode.com/ca/orinda',
  Clayton: 'https://library.municode.com/ca/clayton',
  Danville: 'https://library.municode.com/ca/danville',

  // Marin County
  'San Rafael': 'https://library.municode.com/ca/san_rafael',
  Novato: 'https://library.municode.com/ca/novato',
  'Mill Valley': 'https://library.municode.com/ca/mill_valley',
  Sausalito: 'https://library.municode.com/ca/sausalito',
  Larkspur: 'https://library.municode.com/ca/larkspur',
  'Corte Madera': 'https://library.municode.com/ca/corte_madera',
  Fairfax: 'https://library.municode.com/ca/fairfax',
  'San Anselmo': 'https://library.municode.com/ca/san_anselmo',
  Tiburon: 'https://library.municode.com/ca/tiburon',
  Belvedere: 'https://library.municode.com/ca/belvedere',
  Ross: 'https://library.municode.com/ca/ross',

  // Napa County
  Napa: 'https://library.municode.com/ca/napa',
  'American Canyon': 'https://library.municode.com/ca/american_canyon',
  'St. Helena': 'https://library.municode.com/ca/st._helena',
  Calistoga: 'https://library.municode.com/ca/calistoga',
  Yountville: 'https://library.municode.com/ca/yountville',

  // San Mateo County
  'San Mateo': 'https://library.municode.com/ca/san_mateo',
  'Daly City': 'https://library.municode.com/ca/daly_city',
  'Redwood City': 'https://library.municode.com/ca/redwood_city',
  'South San Francisco': 'https://library.municode.com/ca/south_san_francisco',
  'San Bruno': 'https://library.municode.com/ca/san_bruno',
  Burlingame: 'https://library.municode.com/ca/burlingame',
  'Menlo Park': 'https://library.municode.com/ca/menlo_park',
  'Foster City': 'https://library.municode.com/ca/foster_city',
  Belmont: 'https://library.municode.com/ca/belmont',
  'San Carlos': 'https://library.municode.com/ca/san_carlos',
  Pacifica: 'https://library.municode.com/ca/pacifica',
  Millbrae: 'https://library.municode.com/ca/millbrae',
  'Half Moon Bay': 'https://library.municode.com/ca/half_moon_bay',
  'East Palo Alto': 'https://library.municode.com/ca/east_palo_alto',
  Brisbane: 'https://library.municode.com/ca/brisbane',
  Colma: 'https://library.municode.com/ca/colma',
  Atherton: 'https://library.municode.com/ca/atherton',
  Hillsborough: 'https://library.municode.com/ca/hillsborough',
  'Portola Valley': 'https://library.municode.com/ca/portola_valley',
  Woodside: 'https://library.municode.com/ca/woodside',

  // Santa Clara County
  'San Jose': 'https://library.municode.com/ca/san_jose',
  Sunnyvale: 'https://qcode.us/codes/sunnyvale/',
  'Santa Clara': 'https://library.municode.com/ca/santa_clara',
  'Mountain View': 'https://library.municode.com/ca/mountain_view',
  'Palo Alto': 'https://codelibrary.amlegal.com/codes/paloalto',
  Milpitas: 'https://library.municode.com/ca/milpitas',
  Cupertino: 'https://library.municode.com/ca/cupertino',
  Campbell: 'https://library.municode.com/ca/campbell',
  'Los Gatos': 'https://library.municode.com/ca/los_gatos',
  Gilroy: 'https://library.municode.com/ca/gilroy',
  'Morgan Hill': 'https://library.municode.com/ca/morgan_hill',
  Saratoga: 'https://library.municode.com/ca/saratoga',
  'Los Altos': 'https://library.municode.com/ca/los_altos',
  'Los Altos Hills': 'https://library.municode.com/ca/los_altos_hills',
  'Monte Sereno': 'https://library.municode.com/ca/monte_sereno',

  // Solano County
  Vallejo: 'https://library.municode.com/ca/vallejo',
  Fairfield: 'https://library.municode.com/ca/fairfield',
  Vacaville: 'https://library.municode.com/ca/vacaville',
  Benicia: 'https://library.municode.com/ca/benicia',
  Dixon: 'https://library.municode.com/ca/dixon',
  'Suisun City': 'https://library.municode.com/ca/suisun_city',
  'Rio Vista': 'https://library.municode.com/ca/rio_vista',

  // Sonoma County
  'Santa Rosa': 'https://library.municode.com/ca/santa_rosa',
  Petaluma: 'https://library.municode.com/ca/petaluma',
  'Rohnert Park': 'https://library.municode.com/ca/rohnert_park',
  Windsor: 'https://library.municode.com/ca/windsor',
  Healdsburg: 'https://library.municode.com/ca/healdsburg',
  Sonoma: 'https://library.municode.com/ca/sonoma',
  Cotati: 'https://library.municode.com/ca/cotati',
  Sebastopol: 'https://library.municode.com/ca/sebastopol',
  Cloverdale: 'https://library.municode.com/ca/cloverdale',
};

// Simple HTTP request function
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ status: res.statusCode, ok: true });
      } else {
        resolve({ status: res.statusCode, ok: false });
      }
      res.resume();
    });
    req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false, error: 'timeout' });
    });
  });
}

async function verifyUrl(url) {
  try {
    const result = await fetchUrl(url);
    return result.ok;
  } catch (e) {
    return false;
  }
}

function detectPlatform(url) {
  if (url.includes('municode.com')) return 'municode';
  if (url.includes('amlegal.com')) return 'amlegal';
  if (url.includes('qcode.us')) return 'qcode';
  if (url.includes('codepublishing.com')) return 'codepublishing';
  if (url.includes('sterlingcodifiers.com')) return 'sterlingcodifiers';
  if (url.includes('.municipal.codes')) return 'municipal.codes';
  return 'other';
}

async function main() {
  console.log('Discovering municipal code URLs for Bay Area...\n');

  const results = [];

  for (const entity of BAY_AREA_ENTITIES) {
    const knownUrl = KNOWN_CODES[entity.name];

    if (knownUrl) {
      console.log('Found: ' + entity.name + ' -> ' + knownUrl);
      results.push({
        name: entity.name,
        type: entity.type,
        county: entity.county,
        municipalCodeUrl: knownUrl,
        platform: detectPlatform(knownUrl),
        verified: false,
      });
    } else {
      console.log('NOT FOUND: ' + entity.name + ' - needs manual lookup');
      results.push({
        name: entity.name,
        type: entity.type,
        county: entity.county,
        municipalCodeUrl: null,
        platform: null,
        verified: false,
      });
    }
  }

  // Verify URLs in batches
  console.log('\nVerifying URLs...');
  const toVerify = results.filter((r) => r.municipalCodeUrl);
  let verifiedCount = 0;

  for (let i = 0; i < toVerify.length; i += 5) {
    const batch = toVerify.slice(i, i + 5);
    const verifications = await Promise.all(
      batch.map(async (r) => {
        const isValid = await verifyUrl(r.municipalCodeUrl);
        if (isValid) verifiedCount++;
        return { name: r.name, verified: isValid };
      })
    );

    // Update results
    for (const v of verifications) {
      const idx = results.findIndex((r) => r.name === v.name);
      if (idx >= 0) results[idx].verified = v.verified;
    }

    process.stdout.write(
      '  Verified ' + Math.min(i + 5, toVerify.length) + '/' + toVerify.length + '\r'
    );
  }

  console.log(
    '\n\nVerification complete: ' + verifiedCount + '/' + toVerify.length + ' URLs valid'
  );

  // Output
  const outputPath = path.join(__dirname, '..', 'data-exports', 'municipal-codes.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const output = {
    generated: new Date().toISOString(),
    total: results.length,
    withUrls: results.filter((r) => r.municipalCodeUrl).length,
    verified: results.filter((r) => r.verified).length,
    needsLookup: results.filter((r) => !r.municipalCodeUrl).map((r) => r.name),
    codes: results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('\nOutput: ' + outputPath);

  // Summary by platform
  const byPlatform = {};
  for (const r of results) {
    const p = r.platform || 'unknown';
    byPlatform[p] = (byPlatform[p] || 0) + 1;
  }
  console.log('\nBy platform:');
  for (const [p, count] of Object.entries(byPlatform)) {
    console.log('  ' + p + ': ' + count);
  }
}

main().catch(console.error);
