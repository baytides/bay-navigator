#!/usr/bin/env node
/**
 * Fix IMLS museum addresses by appending city, CA and ZIP code
 * Many IMLS addresses only have street address without city/state/zip
 */

const fs = require('fs');
const path = require('path');

// City to ZIP mapping for Bay Area cities
const CITY_TO_ZIP = {
  Alameda: '94501',
  Albany: '94706',
  'American Canyon': '94503',
  Antioch: '94509',
  Atherton: '94027',
  Belmont: '94002',
  Benicia: '94510',
  Berkeley: '94702',
  Bolinas: '94924',
  Brisbane: '94005',
  Burlingame: '94010',
  Calistoga: '94515',
  Campbell: '95008',
  'Castro Valley': '94546',
  Cloverdale: '95425',
  Colma: '94014',
  Concord: '94518',
  Cotati: '94931',
  Cupertino: '95014',
  'Daly City': '94014',
  Danville: '94506',
  Dixon: '95620',
  Dublin: '94568',
  'East Palo Alto': '94303',
  'El Cerrito': '94530',
  'El Granada': '94018',
  Emeryville: '94608',
  Fairfax: '94930',
  Fairfield: '94533',
  'Foster City': '94404',
  Fremont: '94536',
  Gilroy: '95020',
  'Glen Ellen': '95442',
  Guerneville: '95446',
  'Half Moon Bay': '94019',
  Hayward: '94541',
  Healdsburg: '95448',
  Hercules: '94547',
  'La Honda': '94020',
  Lafayette: '94549',
  Larkspur: '94939',
  Livermore: '94550',
  'Loma Mar': '94021',
  'Los Altos': '94022',
  'Los Gatos': '95030',
  Martinez: '94553',
  'Menlo Park': '94025',
  'Mill Valley': '94941',
  Millbrae: '94030',
  Milpitas: '95035',
  Montara: '94037',
  'Morgan Hill': '95037',
  'Moss Beach': '94038',
  'Mountain View': '94040',
  Napa: '94558',
  Newark: '94560',
  Novato: '94945',
  Oakland: '94601',
  Oakley: '94561',
  Orinda: '94563',
  Pacifica: '94044',
  'Palo Alto': '94301',
  Pescadero: '94060',
  Petaluma: '94952',
  Pinole: '94564',
  Pittsburg: '94565',
  'Pleasant Hill': '94523',
  Pleasanton: '94566',
  'Portola Valley': '94028',
  'Redwood City': '94061',
  Richmond: '94801',
  'Rio Vista': '94571',
  'Rohnert Park': '94928',
  'San Anselmo': '94960',
  'San Bruno': '94066',
  'San Carlos': '94070',
  'San Francisco': '94102',
  'San Gregorio': '94074',
  'San Jose': '95110',
  'San Leandro': '94577',
  'San Mateo': '94401',
  'San Pablo': '94806',
  'San Rafael': '94901',
  'San Ramon': '94582',
  'Santa Clara': '95050',
  'Santa Rosa': '95401',
  Saratoga: '95070',
  Sausalito: '94965',
  Sebastopol: '95472',
  Sonoma: '95476',
  'South San Francisco': '94080',
  'St. Helena': '94574',
  'Suisun City': '94585',
  Sunnyvale: '94085',
  Tiburon: '94920',
  'Union City': '94587',
  Vacaville: '95687',
  Vallejo: '94589',
  'Walnut Creek': '94595',
  Windsor: '95492',
  Woodside: '94062',
  Yountville: '94599',
  // Add some additional cities that might appear
  Sacramento: '95814',
  Mineola: null, // Out of area, skip
};

const recreationPath = path.join(__dirname, '../../src/data/recreation.yml');
let content = fs.readFileSync(recreationPath, 'utf8');

// Find all IMLS museums with incomplete addresses
// Pattern: address that doesn't end with a ZIP code (5 digits)
const lines = content.split('\n');
let modified = false;
let fixCount = 0;
const fixes = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if this is an address line
  if (line.trim().startsWith('address:')) {
    const addressMatch = line.match(/^(\s*)address:\s*["']?(.+?)["']?\s*$/);
    if (!addressMatch) continue;

    const indent = addressMatch[1];
    const address = addressMatch[2];

    // Check if address already has a ZIP code at the end
    if (/\d{5}(-\d{4})?$/.test(address.trim())) {
      continue; // Already has ZIP, skip
    }

    // Check if address already has "CA" in it (likely complete)
    if (/,\s*CA\s*\d{5}/.test(address)) {
      continue; // Already complete
    }

    // Look backwards to find the city field for this entry
    let city = null;
    for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
      const prevLine = lines[j];
      if (prevLine.trim().startsWith('- id:')) {
        break; // Hit the start of this entry, stop looking
      }
      const cityMatch = prevLine.match(/^\s*city:\s*(.+)$/);
      if (cityMatch) {
        city = cityMatch[1].trim();
        break;
      }
    }

    if (!city) {
      console.log(`Warning: No city found for address at line ${i + 1}: ${address}`);
      continue;
    }

    const zip = CITY_TO_ZIP[city];
    if (!zip) {
      console.log(`Warning: No ZIP for city "${city}" at line ${i + 1}`);
      continue;
    }

    // Build the complete address
    // Handle addresses that might have extra info in parens
    let cleanAddress = address;
    let suffix = '';
    const parenMatch = address.match(/^(.+?)(\s*\(.+\))$/);
    if (parenMatch) {
      cleanAddress = parenMatch[1].trim();
      suffix = parenMatch[2];
    }

    // Don't add city if it's already in the address
    const cityInAddress = cleanAddress.toLowerCase().includes(city.toLowerCase());
    let newAddress;
    if (cityInAddress) {
      // Just add state and ZIP
      if (cleanAddress.includes(' CA ') || cleanAddress.endsWith(' CA')) {
        newAddress = `${cleanAddress} ${zip}${suffix}`;
      } else {
        newAddress = `${cleanAddress}, CA ${zip}${suffix}`;
      }
    } else {
      newAddress = `${cleanAddress}, ${city}, CA ${zip}${suffix}`;
    }

    // Update the line
    const needsQuotes = newAddress.includes(':') || newAddress.includes('#');
    if (needsQuotes) {
      lines[i] = `${indent}address: "${newAddress}"`;
    } else {
      lines[i] = `${indent}address: ${newAddress}`;
    }

    fixes.push({
      line: i + 1,
      city,
      old: address,
      new: newAddress,
    });
    fixCount++;
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync(recreationPath, lines.join('\n'));
  console.log(`\nFixed ${fixCount} addresses:\n`);
  fixes.forEach((f) => {
    console.log(`Line ${f.line} (${f.city}):`);
    console.log(`  OLD: ${f.old}`);
    console.log(`  NEW: ${f.new}`);
    console.log();
  });
} else {
  console.log('No addresses needed fixing.');
}
