#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../src/data');
const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml', 'county-supervisors.yml'];

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

let total = 0;
let withDate = 0;
let withoutDate = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const programs = yaml.load(content) || [];
  for (const p of programs) {
    total++;
    if (p.verified_date) {
      withDate++;
    } else if (p.link || p.website) {
      withoutDate.push({ name: p.name, file, url: p.link || p.website });
    }
  }
}

console.log('Total programs:', total);
console.log('With verified_date:', withDate);
console.log('Without verified_date (and has URL):', withoutDate.length);
console.log('');
if (withoutDate.length > 0) {
  console.log('Programs missing verification:');
  withoutDate.forEach(p => console.log('  ' + p.file + ': ' + p.name));
}
