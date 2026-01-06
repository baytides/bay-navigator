const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../src/data');
const NON_PROGRAM_FILES = ['cities.yml', 'groups.yml', 'zipcodes.yml', 'suppressed.yml', 'search-config.yml', 'county-supervisors.yml'];

const categoryFiles = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.yml') && !NON_PROGRAM_FILES.includes(f));

let totalWithCoords = 0;
let validCoords = 0;
let totalPrograms = 0;

categoryFiles.forEach(file => {
  const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const programs = yaml.load(content) || [];
  const withCoords = programs.filter(p => p.latitude && p.longitude);

  totalPrograms += programs.length;

  withCoords.forEach(p => {
    const lat = parseFloat(p.latitude);
    const lng = parseFloat(p.longitude);
    // Validate Bay Area bounds
    if (lat >= 36 && lat <= 39 && lng >= -124 && lng <= -121) {
      validCoords++;
    } else {
      console.log('OUT OF BOUNDS:', p.name, lat, lng);
    }
  });

  if (withCoords.length > 0) {
    console.log(file + ': ' + withCoords.length + ' with coordinates');
  }
  totalWithCoords += withCoords.length;
});

console.log('');
console.log('Total programs: ' + totalPrograms);
console.log('Programs with coordinates: ' + totalWithCoords);
console.log('Valid Bay Area coordinates: ' + validCoords);
