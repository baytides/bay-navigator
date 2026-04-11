#!/usr/bin/env node
/**
 * Build Address Index from OpenAddresses Data
 *
 * Downloads Bay Area county address data from OpenAddresses.io
 * and creates a local lookup index for geocoding program addresses.
 *
 * Usage: node scripts/build-address-index.cjs
 *
 * Output: .data/address-index.json (gitignored)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { createGunzip } = require('zlib');
const readline = require('readline');

const DATA_DIR = path.join(__dirname, '../../.data');
const OUTPUT_FILE = path.join(DATA_DIR, 'address-index.json');
const TEMP_DIR = path.join(DATA_DIR, 'temp');

// Bay Area counties with their OpenAddresses IDs
const BAY_AREA_COUNTIES = {
  alameda: 627,
  contra_costa: 661,
  marin: 640,
  napa: 636,
  san_francisco: 700,
  san_mateo: 660,
  santa_clara: 721,
  solano: 659,
  sonoma: 675,
};

// Also include some city-specific data for better coverage
const CITY_SOURCES = {
  city_of_santa_clara: 609,
};

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          https
            .get(response.headers.location, (redirected) => {
              redirected.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve();
              });
            })
            .on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      })
      .on('error', reject);
  });
}

async function processCSV(csvPath, addressIndex) {
  const fileStream = createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = null;
  let count = 0;

  for await (const line of rl) {
    if (!headers) {
      headers = line.split(',').map((h) => h.trim().toLowerCase());
      continue;
    }

    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ? values[i].trim().replace(/^"|"$/g, '') : '';
    });

    // OpenAddresses CSV format: LON, LAT, NUMBER, STREET, UNIT, CITY, DISTRICT, REGION, POSTCODE
    const lon = parseFloat(row.lon);
    const lat = parseFloat(row.lat);
    const number = row.number || '';
    const street = row.street || '';
    const city = (row.city || '').toUpperCase();
    const postcode = row.postcode || '';

    if (!isNaN(lon) && !isNaN(lat) && number && street) {
      // Create normalized address key
      const normalizedStreet = street
        .toUpperCase()
        .replace(/\./g, '')
        .replace(/\bSTREET\b/g, 'ST')
        .replace(/\bAVENUE\b/g, 'AVE')
        .replace(/\bBOULEVARD\b/g, 'BLVD')
        .replace(/\bDRIVE\b/g, 'DR')
        .replace(/\bROAD\b/g, 'RD')
        .replace(/\bLANE\b/g, 'LN')
        .replace(/\bCOURT\b/g, 'CT')
        .replace(/\bPLACE\b/g, 'PL')
        .replace(/\bCIRCLE\b/g, 'CIR')
        .replace(/\bWAY\b/g, 'WY')
        .replace(/\s+/g, ' ')
        .trim();

      const key = `${number} ${normalizedStreet}`;

      // Store with city as secondary key for disambiguation
      if (!addressIndex[city]) {
        addressIndex[city] = {};
      }

      addressIndex[city][key] = [lon, lat];
      count++;
    }
  }

  return count;
}

async function main() {
  console.log('🏠 Building Bay Area Address Index from OpenAddresses\n');

  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const addressIndex = {};
  let totalAddresses = 0;

  // Download and process each county
  const allSources = { ...BAY_AREA_COUNTIES, ...CITY_SOURCES };

  for (const [name, id] of Object.entries(allSources)) {
    console.log(`📥 Processing ${name}...`);

    const zipPath = path.join(TEMP_DIR, `${name}.zip`);
    const csvPath = path.join(TEMP_DIR, `${name}.csv`);

    try {
      // Download from OpenAddresses
      const downloadUrl = `https://batch.openaddresses.io/api/runs/${id}/output/source.geojson.zip`;
      console.log(`   Downloading from OpenAddresses...`);

      // Actually, OpenAddresses provides CSV, let's try the direct output
      const csvUrl = `https://data.openaddresses.io/runs/${id}/us/ca/${name}.csv`;

      // Try alternative URL format
      await downloadFile(`https://data.openaddresses.io/runs/${id}/output.csv`, csvPath);

      if (fs.existsSync(csvPath)) {
        const count = await processCSV(csvPath, addressIndex);
        console.log(`   ✅ Processed ${count.toLocaleString()} addresses`);
        totalAddresses += count;
        fs.unlinkSync(csvPath);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not process ${name}: ${error.message}`);
    }
  }

  // Write the index
  console.log(`\n📝 Writing address index...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(addressIndex));

  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\n✅ Address index built successfully!`);
  console.log(`   Total addresses: ${totalAddresses.toLocaleString()}`);
  console.log(`   Cities indexed: ${Object.keys(addressIndex).length}`);
  console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Output: ${OUTPUT_FILE}`);

  // Cleanup temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

main().catch(console.error);
