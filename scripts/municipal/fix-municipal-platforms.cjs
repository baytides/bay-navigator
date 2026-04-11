#!/usr/bin/env node
/**
 * Fix Municipal Code Platforms
 *
 * Cross-references our municipal-codes.json with the actual Municode California list
 * and verified alternative platforms to correct inaccurate platform data.
 */

const fs = require('fs');
const path = require('path');

const MUNICIPAL_CODES_FILE = path.join(
  __dirname,
  '..',
  'data-exports',
  'municipal-codes',
  'municipal-codes.json'
);
const MUNICODE_CITIES_FILE = '/tmp/municode-ca-cities.json';

// Known alternative platforms for Bay Area cities (verified via web search)
const PLATFORM_OVERRIDES = {
  // amlegal
  'San Francisco': {
    platform: 'amlegal',
    codeUrl: 'https://codelibrary.amlegal.com/codes/san_francisco/latest/overview',
  },
  'Palo Alto': {
    platform: 'amlegal',
    codeUrl: 'https://codelibrary.amlegal.com/codes/paloalto/latest/overview',
  },
  Antioch: {
    platform: 'amlegal',
    codeUrl: 'https://codelibrary.amlegal.com/codes/antioch/latest/antioch_ca/0-0-0-1',
  },

  // municipal.codes
  Berkeley: { platform: 'municipal.codes', codeUrl: 'https://berkeley.municipal.codes/' },

  // qcode
  Sunnyvale: { platform: 'qcode', codeUrl: 'https://qcode.us/codes/sunnyvale/' },
  'Santa Rosa': { platform: 'qcode', codeUrl: 'https://qcode.us/codes/santarosa/' },
  Pleasanton: {
    platform: 'qcode',
    codeUrl: 'https://library.qcode.us/lib/pleasanton_ca/pub/municipal_code',
  },
  Livermore: { platform: 'qcode', codeUrl: 'https://qcode.us/codes/livermore/' },
  Dublin: { platform: 'qcode', codeUrl: 'https://qcode.us/codes/dublin/' },

  // codepublishing
  Fremont: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Fremont/' },
  Concord: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Concord/' },
  'Walnut Creek': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/WalnutCreek/',
  },
  Danville: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Danville/' },
  'San Ramon': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SanRamon/',
  },
  'Pleasant Hill': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/PleasantHill/',
  },
  Martinez: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Martinez/' },
  Pittsburg: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Pittsburg/',
  },
  Brentwood: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Brentwood/',
  },
  Oakley: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Oakley/' },
  'San Leandro': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SanLeandro/',
  },
  'Union City': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/UnionCity/',
  },
  Albany: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Albany/' },
  Emeryville: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Emeryville/',
  },
  Piedmont: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Piedmont/' },
  'San Carlos': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SanCarlos/',
  },
  'Foster City': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/FosterCity/',
  },
  'South San Francisco': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SouthSanFrancisco/',
  },
  Burlingame: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Burlingame/',
  },
  'San Bruno': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SanBruno/',
  },
  Millbrae: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Millbrae/' },
  'Half Moon Bay': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/HalfMoonBay/',
  },
  'Menlo Park': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/MenloPark/',
  },
  Atherton: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Atherton/' },
  Colma: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Colma/' },
  Cupertino: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Cupertino/',
  },
  'Santa Clara': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SantaClara/',
  },
  Gilroy: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Gilroy/' },
  'Los Altos Hills': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/LosAltosHills/',
  },
  Napa: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Napa/' },
  'American Canyon': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/AmericanCanyon/',
  },
  Calistoga: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Calistoga/',
  },
  'St. Helena': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/StHelena/',
  },
  Yountville: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Yountville/',
  },
  Petaluma: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Petaluma/' },
  Healdsburg: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Healdsburg/',
  },
  Sebastopol: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Sebastopol/',
  },
  Sonoma: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Sonoma/' },
  Cotati: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Cotati/' },
  Cloverdale: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Cloverdale/',
  },
  Fairfield: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Fairfield/',
  },
  Vacaville: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Vacaville/',
  },
  Benicia: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Benicia/' },
  Dixon: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Dixon/' },
  'Rio Vista': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/RioVista/',
  },
  'Mill Valley': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/MillValley/',
  },
  Larkspur: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Larkspur/' },
  Sausalito: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Sausalito/',
  },
  Fairfax: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Fairfax/' },
  Ross: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Ross/' },
  Belvedere: {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/Belvedere/',
  },
  Hercules: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Hercules/' },
  Pinole: { platform: 'codepublishing', codeUrl: 'https://www.codepublishing.com/CA/Pinole/' },
  'San Pablo': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SanPablo/',
  },

  // cityofsanmateo (self-hosted)
  'San Mateo': {
    platform: 'cityofsanmateo',
    codeUrl: 'https://law.cityofsanmateo.org/us/ca/cities/san-mateo/code',
  },

  // Counties that might not be on Municode
  'Solano County': {
    platform: 'codepublishing',
    codeUrl: 'https://www.codepublishing.com/CA/SolanoCounty/',
  },
};

// Load files
const municipalCodes = JSON.parse(fs.readFileSync(MUNICIPAL_CODES_FILE, 'utf8'));
const municodeCities = JSON.parse(fs.readFileSync(MUNICODE_CITIES_FILE, 'utf8'));

// Create a set of actual Municode slugs
const municodeSlugs = new Set(municodeCities.map((c) => c.slug));

let corrected = 0;
let verified = 0;
let unknown = 0;

for (const city of municipalCodes) {
  // Check if we have a manual override
  if (PLATFORM_OVERRIDES[city.name]) {
    const override = PLATFORM_OVERRIDES[city.name];
    if (city.platform !== override.platform || city.codeUrl !== override.codeUrl) {
      console.log(`📝 ${city.name}: ${city.platform} -> ${override.platform}`);
      city.platform = override.platform;
      city.codeUrl = override.codeUrl;
      delete city.needsVerification;
      corrected++;
    }
    continue;
  }

  // Check if claimed Municode city is actually on Municode
  if (city.platform === 'municode' || city.platform === 'unknown') {
    const slug = city.codeUrl?.replace('https://library.municode.com/ca/', '') || '';
    if (city.platform === 'municode' && !municodeSlugs.has(slug)) {
      console.log(`❌ ${city.name}: Claims municode but NOT on Municode (slug: ${slug})`);
      city.platform = 'unknown';
      city.needsVerification = true;
      unknown++;
    } else if (city.platform === 'municode') {
      verified++;
    } else {
      unknown++;
    }
  }
}

console.log(`\n✅ Verified: ${verified} cities on Municode`);
console.log(`📝 Corrected: ${corrected} cities`);
console.log(`❓ Unknown: ${unknown} cities need research`);

// Write updated file
fs.writeFileSync(MUNICIPAL_CODES_FILE, JSON.stringify(municipalCodes, null, 2));
console.log(`\nSaved to ${MUNICIPAL_CODES_FILE}`);

// List remaining unknowns
const unknowns = municipalCodes.filter((c) => c.platform === 'unknown');
if (unknowns.length > 0) {
  console.log(`\nCities still needing platform verification:`);
  unknowns.forEach((c) => console.log(`  - ${c.name}`));
}
