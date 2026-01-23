#!/usr/bin/env node
/**
 * Sync SF Service Guide data into BayNavigator
 *
 * Processes the SF Service Guide JSON export to generate YAML program data.
 * The SF Service Guide is San Francisco's comprehensive human services directory.
 *
 * Source: https://www.sfserviceguide.org/
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../data-exports/sfserviceguide-2025-only.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/sfserviceguide.yml');

// Map SF Service Guide categories to our category system
const CATEGORY_MAPPING = {
  // Food
  food: 'food',
  'food resources': 'food',
  'food assistance': 'food',
  'meals': 'food',
  'food pantry': 'food',
  'food pantries': 'food',
  calfresh: 'food',
  // Housing
  housing: 'housing',
  shelter: 'housing',
  'emergency shelter': 'housing',
  'rental assistance': 'housing',
  'transitional housing': 'housing',
  'permanent housing': 'housing',
  // Health
  health: 'health',
  healthcare: 'health',
  'mental health': 'health',
  'substance use': 'health',
  medical: 'health',
  dental: 'health',
  vision: 'health',
  // Legal
  legal: 'legal',
  'legal assistance': 'legal',
  'legal services': 'legal',
  'citizenship & immigration': 'legal',
  'immigration assistance': 'legal',
  'discrimination & civil rights': 'legal',
  // Employment
  employment: 'employment',
  jobs: 'employment',
  'job training': 'employment',
  'job assistance': 'employment',
  'job search': 'employment',
  // Education
  education: 'education',
  learning: 'education',
  literacy: 'education',
  esl: 'education',
  ged: 'education',
  // Finance
  finance: 'finance',
  financial: 'finance',
  'financial assistance': 'finance',
  benefits: 'finance',
  // Technology
  technology: 'technology',
  internet: 'technology',
  computer: 'technology',
  // Transportation
  transportation: 'transportation',
  transit: 'transportation',
  // LGBTQ+
  lgbtq: 'lgbtq',
  'sfsg-lgbtqa': 'lgbtq',
  // Community
  community: 'community',
  'case management': 'community',
  default: 'community',
};

// Map eligibility terms to our groups
const ELIGIBILITY_TO_GROUPS = {
  'low income': 'income-eligible',
  'homeless': 'unhoused',
  'people experiencing homelessness': 'unhoused',
  'veterans': 'veterans',
  'seniors': 'seniors',
  'older adults': 'seniors',
  '60+': 'seniors',
  '65+': 'seniors',
  'youth': 'youth',
  'young adults': 'youth',
  'families': 'families',
  'families with children': 'families',
  'disabled': 'disability',
  'people with disabilities': 'disability',
  'disability': 'disability',
  'lgbtq': 'lgbtq',
  'transgender': 'lgbtq',
  'transgender and gender non-conforming': 'lgbtq',
  'immigrants': 'immigrants',
  'undocumented': 'immigrants',
  'pregnant': 'pregnant',
  'pregnant women': 'pregnant',
  'formerly incarcerated': 'reentry',
  're-entry': 'reentry',
};

// Track generated IDs to ensure uniqueness
const generatedIds = new Set();

function generateId(name, serviceId) {
  const baseId = `sfsg-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)}`;

  const fullBase = serviceId ? `${baseId}-${serviceId}` : baseId;

  let finalId = fullBase;
  let counter = 2;

  while (generatedIds.has(finalId)) {
    finalId = `${fullBase}-${counter}`;
    counter++;
  }

  generatedIds.add(finalId);
  return finalId;
}

function escapeYamlString(str) {
  if (!str) return '';
  str = str.trim();
  if (str.includes(':') || str.includes('#') || str.includes('"') || str.includes("'") || str.includes('\n')) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  }
  return str;
}

function cleanDescription(text) {
  if (!text) return '';
  // Remove markdown formatting and clean up
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#+\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to plain text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeYamlString(text) {
  if (!text) return '';
  // Escape for YAML double-quoted string
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

/**
 * Determine category from SF Service Guide categories
 */
function determineCategory(categories) {
  if (!categories || categories.length === 0) return 'community';

  for (const cat of categories) {
    const catLower = cat.toLowerCase();
    for (const [term, category] of Object.entries(CATEGORY_MAPPING)) {
      if (term !== 'default' && catLower.includes(term)) {
        return category;
      }
    }
  }

  return 'community';
}

/**
 * Extract groups from eligibilities
 */
function extractGroups(eligibilities) {
  if (!eligibilities || eligibilities.length === 0) return ['everyone'];

  const groups = new Set();

  for (const elig of eligibilities) {
    const eligLower = elig.toLowerCase();
    for (const [term, group] of Object.entries(ELIGIBILITY_TO_GROUPS)) {
      if (eligLower.includes(term)) {
        groups.add(group);
      }
    }
  }

  return groups.size > 0 ? Array.from(groups) : ['everyone'];
}

/**
 * Transform SF Service Guide record to our program format
 */
function transformService(service) {
  if (!service.name) return null;
  if (service.status !== 'approved') return null;

  // Build address
  let address = null;
  if (service.addresses && service.addresses.length > 0) {
    const addr = service.addresses[0];
    address = [addr.address_1, addr.city, addr.state_province, addr.postal_code]
      .filter(Boolean)
      .join(', ');
  }

  // Get phone
  let phone = null;
  if (service.phones && service.phones.length > 0) {
    phone = service.phones[0].number;
    // Format phone number
    if (phone && phone.startsWith('+1')) {
      phone = phone.slice(2);
    }
  }

  // Get coordinates
  let latitude = null;
  let longitude = null;
  if (service._geoloc) {
    latitude = service._geoloc.lat;
    longitude = service._geoloc.lng;
  } else if (service.addresses && service.addresses.length > 0) {
    latitude = service.addresses[0].latitude;
    longitude = service.addresses[0].longitude;
  }

  // Determine city from address
  let city = 'San Francisco';
  if (service.addresses && service.addresses.length > 0) {
    city = service.addresses[0].city || 'San Francisco';
  }

  const category = determineCategory(service.categories);
  const groups = extractGroups(service.eligibilities);

  const program = {
    id: generateId(service.name, service.service_id || service.id),
    name: service.name,
    category: category,
    area: 'San Francisco',
    city: city,
    source: 'sfserviceguide',
    data_source: 'dataSF',
    external_id: String(service.service_id || service.id),
    source_url: (service.url && service.url.startsWith('http')) ? service.url : `https://www.sfserviceguide.org/services/${service.id}`,
    verified_by: 'SF Service Guide',
    verified_date: service.updated_at ? service.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
    groups: groups,
    description: cleanDescription(service.short_description || service.long_description) || `Service provided by ${service.service_of || 'organization'} in San Francisco.`,
  };

  // Optional fields
  if (service.service_of) {
    program.agency = service.service_of;
  }

  if (service.long_description && service.long_description !== service.short_description) {
    program.what_they_offer = cleanDescription(service.long_description).slice(0, 500);
  }

  if (service.application_process) {
    program.how_to_get_it = cleanDescription(service.application_process);
  }

  if (service.eligibility) {
    program.requirements = cleanDescription(service.eligibility);
  }

  if (service.fee) {
    program.cost = cleanDescription(service.fee);
  }

  if (address) {
    program.address = address;
  }

  if (phone) {
    program.phone = phone;
  }

  if (service.email) {
    program.email = service.email;
  }

  if (service.url && service.url.trim().startsWith('http')) {
    program.link = service.url.trim();
  }

  if (latitude && longitude) {
    program.latitude = latitude;
    program.longitude = longitude;
  }

  // Keywords for search
  program.keywords = ['san francisco', 'sf service guide'];
  if (service.categories) {
    program.keywords.push(...service.categories.map(c => c.toLowerCase()));
  }

  return program;
}

/**
 * Generate YAML content from programs
 */
function generateYaml(programs) {
  const lines = [
    '# SF Service Guide Services',
    '# Auto-generated from https://www.sfserviceguide.org/',
    `# Last synced: ${new Date().toISOString()}`,
    '#',
    '# These are San Francisco services from the SF Service Guide directory.',
    '#',
    '# DO NOT EDIT MANUALLY - This file is regenerated by sync-datasf-services.cjs',
    '',
  ];

  for (const p of programs) {
    lines.push(`- id: ${p.id}`);
    lines.push(`  name: ${escapeYamlString(p.name)}`);
    lines.push(`  category: ${p.category}`);
    lines.push(`  area: ${p.area}`);
    if (p.city) lines.push(`  city: ${p.city}`);
    lines.push(`  source: sfserviceguide`);
    lines.push(`  data_source: dataSF`);
    if (p.external_id) lines.push(`  external_id: "${p.external_id}"`);
    if (p.source_url) lines.push(`  source_url: ${p.source_url}`);
    lines.push(`  verified_by: ${escapeYamlString(p.verified_by)}`);
    lines.push(`  verified_date: '${p.verified_date}'`);

    if (p.agency) {
      lines.push(`  agency: ${escapeYamlString(p.agency)}`);
    }

    if (p.groups && p.groups.length > 0) {
      lines.push(`  groups:`);
      p.groups.forEach((g) => lines.push(`    - ${g}`));
    }

    // Use quoted strings to avoid YAML special character issues
    lines.push(`  description: "${safeYamlString(p.description).slice(0, 500)}"`);

    if (p.what_they_offer) {
      lines.push(`  what_they_offer: "${safeYamlString(p.what_they_offer)}"`);
    }

    if (p.how_to_get_it) {
      lines.push(`  how_to_get_it: "${safeYamlString(p.how_to_get_it)}"`);
    }

    if (p.requirements) {
      lines.push(`  requirements: "${safeYamlString(p.requirements)}"`);
    }

    if (p.cost) {
      lines.push(`  cost: "${safeYamlString(p.cost)}"`);
    }

    if (p.address) {
      lines.push(`  address: ${escapeYamlString(p.address)}`);
    }

    if (p.phone) {
      lines.push(`  phone: "${p.phone}"`);
    }

    if (p.email) {
      lines.push(`  email: "${p.email}"`);
    }

    if (p.link) {
      lines.push(`  link: ${p.link}`);
    }

    if (p.latitude && p.longitude) {
      lines.push(`  latitude: ${p.latitude}`);
      lines.push(`  longitude: ${p.longitude}`);
    }

    if (p.keywords && p.keywords.length > 0) {
      lines.push(`  keywords:`);
      // Dedupe and limit keywords
      const uniqueKeywords = [...new Set(p.keywords)].slice(0, 10);
      uniqueKeywords.forEach((kw) => lines.push(`    - ${kw}`));
    }

    lines.push('');
  }

  return lines.join('\n');
}

function syncSFServiceGuide() {
  console.log('Syncing SF Service Guide data...\n');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    console.log('Please ensure the SF Service Guide export exists in data-exports/');
    process.exit(1);
  }

  // Load the data
  console.log(`Loading data from ${INPUT_FILE}...`);
  const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`Loaded ${rawData.length} records`);

  // Transform data
  console.log('\nTransforming services...');
  const programs = rawData
    .map(transformService)
    .filter(Boolean);

  console.log(`Transformed ${programs.length} programs`);

  // Generate and write YAML
  const yamlContent = generateYaml(programs);
  fs.writeFileSync(OUTPUT_FILE, yamlContent, 'utf8');
  console.log(`\nWritten to ${OUTPUT_FILE}`);

  // Summary by category
  const categories = {};
  const groupCounts = {};
  programs.forEach((p) => {
    categories[p.category] = (categories[p.category] || 0) + 1;
    p.groups.forEach((g) => {
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
  });

  console.log('\nBy category:');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  console.log('\nBy target group:');
  Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([group, count]) => {
      console.log(`  ${group}: ${count}`);
    });

  return programs.length;
}

syncSFServiceGuide();
