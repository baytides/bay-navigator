#!/usr/bin/env node
/**
 * Reorganize community.yml - move misplaced entries to correct categories
 *
 * This script reads community.yml and:
 * 1. Moves retail discounts to retail.yml
 * 2. Moves veteran services to federal-benefits.yml
 * 3. Creates new lgbtq.yml for LGBTQ+ services
 * 4. Creates new safety.yml for DV/safety services
 * 5. Moves reentry services to legal.yml
 * 6. Moves childcare to education.yml
 * 7. Moves employment services to employment.yml
 * 8. Keeps appropriate items in community.yml
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../src/data');

// Read existing YAML files
function readYaml(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return [];
  }
  const content = fs.readFileSync(filepath, 'utf8');
  return yaml.load(content) || [];
}

// Write YAML file
function writeYaml(filename, data, header = '') {
  const filepath = path.join(DATA_DIR, filename);
  let content = header ? header + '\n\n' : '';
  content += yaml.dump(data, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.writeFileSync(filepath, content);
  console.log(`  Wrote ${data.length} entries to ${filename}`);
}

// Classification rules
function classifyProgram(p) {
  const name = (p.name || '').toLowerCase();
  const kw = Array.isArray(p.keywords)
    ? p.keywords.join(' ').toLowerCase()
    : (p.keywords || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const allText = name + ' ' + kw + ' ' + desc;
  const id = (p.id || '').toLowerCase();

  // Retail discounts
  if (
    allText.includes('discount') ||
    allText.includes('% off') ||
    allText.includes('verizon') ||
    allText.includes('t-mobile') ||
    allText.includes('firstnet') ||
    allText.includes('home depot') ||
    allText.includes('lowes') ||
    allText.includes('nfl shop') ||
    allText.includes('mlb shop') ||
    allText.includes('nba store') ||
    allText.includes('nhl shop') ||
    allText.includes('under armour') ||
    allText.includes('govx') ||
    allText.includes('outback steakhouse') ||
    (allText.includes('nike') && allText.includes('10%')) ||
    (allText.includes('student') &&
      (allText.includes('spotify') ||
        allText.includes('apple music') ||
        allText.includes('amazon prime') ||
        allText.includes('hulu') ||
        allText.includes('adobe') ||
        allText.includes('youtube')))
  ) {
    return 'retail';
  }

  // Veterans (excluding LGBTQ+ veteran services)
  if (
    (allText.includes('calvet') || (allText.includes('veteran') && !allText.includes('lgbtq'))) &&
    !allText.includes('lgbtq')
  ) {
    // But not LifeMoves which serves everyone
    if (!allText.includes('lifemoves')) {
      return 'federal-benefits';
    }
  }

  // VA Vet Centers specifically
  if (id === 'va-vet-centers') {
    return 'federal-benefits';
  }

  // LGBTQ services
  if (
    allText.includes('lgbtq') ||
    allText.includes('lgbt center') ||
    allText.includes('gay history') ||
    allText.includes('lesbian') ||
    (allText.includes('trans') &&
      !allText.includes('transition') &&
      !allText.includes('transportation') &&
      !allText.includes('transit')) ||
    allText.includes('queer') ||
    allText.includes('pflag') ||
    id.includes('lgbtq') ||
    id.includes('lgbt') ||
    (id.includes('trans') && !id.includes('transit'))
  ) {
    return 'lgbtq';
  }

  // Domestic violence / Safety services
  if (
    allText.includes('domestic violence') ||
    allText.includes('abuse') ||
    allText.includes('relationship abuse') ||
    allText.includes('love is respect') ||
    (allText.includes('shelter') && allText.includes('women')) ||
    name.includes('safe place') ||
    name.includes('safe haven') ||
    id.includes('cora') ||
    id.includes('stand') ||
    id.includes('w-o-m-a-n') ||
    id.includes('woman-inc') ||
    id.includes('la-casa') ||
    id.includes('building-futures') ||
    id.includes('next-door') ||
    id.includes('narika') ||
    id.includes('maitri') ||
    id.includes('asian-women') ||
    id.includes('family-justice')
  ) {
    return 'safety';
  }

  // Reentry services
  if (
    allText.includes('reentry') ||
    allText.includes('incarcerat') ||
    allText.includes('expunge') ||
    allText.includes('recidiv') ||
    allText.includes('formerly incarcerated')
  ) {
    return 'legal';
  }

  // Childcare / Early education
  if (
    allText.includes('childcare') ||
    allText.includes('child care') ||
    allText.includes('preschool') ||
    allText.includes('head start') ||
    (allText.includes('crisis nursery') && allText.includes('emergency childcare'))
  ) {
    return 'education';
  }

  // Employment services
  if (
    (allText.includes('job training') ||
      allText.includes('workforce') ||
      allText.includes('employment') ||
      allText.includes('career')) &&
    !allText.includes('veteran')
  ) {
    if (
      id.includes('jobsnow') ||
      id.includes('job-forum') ||
      id.includes('citybuild') ||
      id.includes('techsf') ||
      id.includes('meda-workforce')
    ) {
      return 'employment';
    }
  }

  // Immigration services (should be in legal)
  if (
    allText.includes('immigration') ||
    allText.includes('immigrant') ||
    allText.includes('citizenship') ||
    allText.includes('daca')
  ) {
    return 'legal';
  }

  // Housing services (should be in housing)
  if (
    id.includes('housing') ||
    id.includes('homeless') ||
    (allText.includes('housing') && allText.includes('program'))
  ) {
    // Only move if it's clearly a housing program, not just mentions housing
    if (
      id === 'hip-housing-home-sharing' ||
      id === 'echo-housing' ||
      id === 'cid-housing-modifications' ||
      id === 'sf-homelessness-supportive-housing' ||
      id === 'project-homeless-connect'
    ) {
      return 'housing';
    }
  }

  // Keep in community
  return 'community';
}

// Main reorganization
function reorganize() {
  console.log('='.repeat(60));
  console.log('Reorganizing community.yml');
  console.log('='.repeat(60));

  // Read community.yml
  const community = readYaml('community.yml');
  console.log(`\nRead ${community.length} entries from community.yml`);

  // Classify each program
  const buckets = {
    community: [],
    retail: [],
    'federal-benefits': [],
    lgbtq: [],
    safety: [],
    legal: [],
    education: [],
    employment: [],
    housing: [],
  };

  for (const p of community) {
    const category = classifyProgram(p);
    buckets[category].push(p);
  }

  // Print classification summary
  console.log('\nClassification summary:');
  for (const [cat, items] of Object.entries(buckets)) {
    if (items.length > 0) {
      console.log(`  ${cat}: ${items.length}`);
    }
  }

  // Read existing files to append
  const existingRetail = readYaml('retail.yml');
  const existingFederal = readYaml('federal-benefits.yml');
  const existingLegal = readYaml('legal.yml');
  const existingEducation = readYaml('education.yml');
  const existingEmployment = readYaml('employment.yml');
  const existingHousing = readYaml('housing.yml');

  // Get existing IDs to avoid duplicates
  const existingIds = new Set([
    ...existingRetail.map((p) => p.id),
    ...existingFederal.map((p) => p.id),
    ...existingLegal.map((p) => p.id),
    ...existingEducation.map((p) => p.id),
    ...existingEmployment.map((p) => p.id),
    ...existingHousing.map((p) => p.id),
  ]);

  // Filter out duplicates
  const filterNew = (items) => items.filter((p) => !existingIds.has(p.id));

  console.log('\nWriting files...');

  // Write new community.yml (keep thrift stores and actual community services)
  const newCommunity = buckets['community'];
  writeYaml(
    'community.yml',
    newCommunity,
    '# Bay Navigator - Community Services\n# Thrift stores, donation centers, community centers, and local services'
  );

  // Append to existing files
  if (buckets['retail'].length > 0) {
    const newRetail = filterNew(buckets['retail']);
    const allRetail = [...existingRetail, ...newRetail];
    writeYaml(
      'retail.yml',
      allRetail,
      '# Bay Navigator - Retail Discounts\n# Store and retail discounts for seniors, military, first responders, teachers, and more'
    );
  }

  if (buckets['federal-benefits'].length > 0) {
    const newFederal = filterNew(buckets['federal-benefits']);
    const allFederal = [...existingFederal, ...newFederal];
    writeYaml(
      'federal-benefits.yml',
      allFederal,
      '# Bay Navigator - Federal and State Benefits\n# Government benefits programs including veteran services'
    );
  }

  if (buckets['legal'].length > 0) {
    const newLegal = filterNew(buckets['legal']);
    const allLegal = [...existingLegal, ...newLegal];
    writeYaml(
      'legal.yml',
      allLegal,
      '# Bay Navigator - Legal Services\n# Legal aid, immigration assistance, and reentry services'
    );
  }

  if (buckets['education'].length > 0) {
    const newEducation = filterNew(buckets['education']);
    const allEducation = [...existingEducation, ...newEducation];
    writeYaml(
      'education.yml',
      allEducation,
      '# Bay Navigator - Education & Training\n# Schools, childcare, job training, and educational programs'
    );
  }

  if (buckets['employment'].length > 0) {
    const newEmployment = filterNew(buckets['employment']);
    const allEmployment = [...existingEmployment, ...newEmployment];
    writeYaml(
      'employment.yml',
      allEmployment,
      '# Bay Navigator - Employment Services\n# Job training, workforce development, and career services'
    );
  }

  if (buckets['housing'].length > 0) {
    const newHousing = filterNew(buckets['housing']);
    const allHousing = [...existingHousing, ...newHousing];
    writeYaml(
      'housing.yml',
      allHousing,
      '# Bay Navigator - Housing Resources\n# Housing assistance, shelters, and homeless services'
    );
  }

  // Create new category files
  if (buckets['lgbtq'].length > 0) {
    writeYaml(
      'lgbtq.yml',
      buckets['lgbtq'],
      '# Bay Navigator - LGBTQ+ Services\n# LGBTQ+ community centers, health services, and support organizations'
    );
  }

  if (buckets['safety'].length > 0) {
    writeYaml(
      'safety.yml',
      buckets['safety'],
      '# Bay Navigator - Safety & Crisis Services\n# Domestic violence services, emergency shelters, and crisis support'
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('Reorganization complete!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Review the changes in src/data/');
  console.log('2. Update the category mapping in transform-211bayarea.cjs');
  console.log('3. Run npm run build to regenerate JSON');
  console.log('4. Verify the directory page shows correct categories');
}

// Run
reorganize();
