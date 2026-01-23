#!/usr/bin/env node
/**
 * Sync Ohana API (SMC-Connect) data into BayNavigator
 *
 * Fetches social services from San Mateo County's Ohana API (HSDS-compliant).
 * Source: https://api.smc-connect.org/
 *
 * The Ohana API follows the Human Services Data Specification (HSDS).
 * Endpoints: /organizations, /locations, /services, /search
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../src/data/ohana-smc.yml');
const DATA_EXPORTS_DIR = path.join(__dirname, '../data-exports');

// Ohana API base URL (SMC-Connect)
const OHANA_BASE_URL = 'https://api.smc-connect.org';

// Map Ohana service categories to our category system
const CATEGORY_MAPPING = {
  // Food
  'Food Pantries': 'food',
  'Meals': 'food',
  'Food': 'food',
  'CalFresh': 'food',
  // Housing
  'Housing': 'housing',
  'Emergency Shelter': 'housing',
  'Rental Assistance': 'housing',
  'Transitional Housing': 'housing',
  // Health
  'Health': 'health',
  'Mental Health': 'health',
  'Medical Care': 'health',
  'Substance Abuse': 'health',
  // Legal
  'Legal': 'legal',
  'Immigration': 'legal',
  // Employment
  'Employment': 'employment',
  'Job Training': 'employment',
  // Education
  'Education': 'education',
  // Finance
  'Financial Assistance': 'finance',
  'Benefits': 'finance',
  // Default
  default: 'community',
};

// Map eligibility terms to our groups
const ELIGIBILITY_TO_GROUPS = {
  'Low Income': 'income-eligible',
  'Homeless': 'unhoused',
  'Veterans': 'veterans',
  'Seniors': 'seniors',
  'Youth': 'youth',
  'Families': 'families',
  'Disabled': 'disability',
  'LGBTQ': 'lgbtq',
  'Immigrants': 'immigrants',
  'Pregnant': 'pregnant',
};

// Track generated IDs to ensure uniqueness
const generatedIds = new Set();

function generateId(name, locationId) {
  const baseId = `ohana-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)}`;

  // Add location ID suffix if provided for uniqueness
  const fullBase = locationId ? `${baseId}-${locationId.slice(-6)}` : baseId;

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
  // Remove HTML tags and clean up whitespace
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determine category from service taxonomy/keywords
 */
function determineCategory(service, organization) {
  // Check service keywords/taxonomy
  const keywords = [
    service.name || '',
    service.description || '',
    organization.name || '',
  ].join(' ').toLowerCase();

  for (const [term, category] of Object.entries(CATEGORY_MAPPING)) {
    if (term !== 'default' && keywords.includes(term.toLowerCase())) {
      return category;
    }
  }

  return CATEGORY_MAPPING.default;
}

/**
 * Extract groups from eligibility field
 */
function extractGroups(eligibility) {
  if (!eligibility) return ['everyone'];

  const groups = new Set();
  const eligLower = eligibility.toLowerCase();

  for (const [term, group] of Object.entries(ELIGIBILITY_TO_GROUPS)) {
    if (eligLower.includes(term.toLowerCase())) {
      groups.add(group);
    }
  }

  return groups.size > 0 ? Array.from(groups) : ['everyone'];
}

/**
 * Fetch from Ohana API with pagination
 */
async function fetchOhanaData(endpoint, params = {}) {
  const allResults = [];
  let page = 1;
  const perPage = 30; // Ohana default

  while (true) {
    const url = new URL(`${OHANA_BASE_URL}${endpoint}`);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('per_page', perPage.toString());

    // Add any additional params
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    console.log(`Fetching page ${page}: ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`  Page ${page} not found, stopping pagination`);
          break;
        }
        throw new Error(`Ohana API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`  No more results at page ${page}`);
        break;
      }

      allResults.push(...data);
      console.log(`  Got ${data.length} results (total: ${allResults.length})`);

      // If we got fewer than perPage, we've reached the end
      if (data.length < perPage) {
        break;
      }

      page++;

      // Safety limit
      if (page > 50) {
        console.log('  Reached page limit (50), stopping');
        break;
      }

      // Small delay to be nice to the API
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`  Error on page ${page}:`, error.message);
      break;
    }
  }

  return allResults;
}

/**
 * Fetch organizations with their locations and services
 */
async function fetchOrganizationsWithServices() {
  console.log('Fetching organizations...');

  // First, fetch all organizations
  const organizations = await fetchOhanaData('/organizations');
  console.log(`Found ${organizations.length} organizations`);

  // Then fetch locations to get service details
  console.log('\nFetching locations with services...');
  const locations = await fetchOhanaData('/locations');
  console.log(`Found ${locations.length} locations`);

  return { organizations, locations };
}

/**
 * Transform Ohana data to our program format
 */
function transformOhanaData(organizations, locations) {
  const programs = [];

  // Create a map of organizations by ID for lookup
  const orgMap = new Map();
  for (const org of organizations) {
    orgMap.set(org.id, org);
  }

  // Process each location and its services
  for (const location of locations) {
    const org = location.organization || orgMap.get(location.organization_id) || {};

    // If location has services, create a program for each
    const services = location.services || [];

    if (services.length > 0) {
      for (const service of services) {
        const program = createProgram(service, location, org);
        if (program) {
          programs.push(program);
        }
      }
    } else {
      // No services listed, create one program for the location
      const program = createLocationProgram(location, org);
      if (program) {
        programs.push(program);
      }
    }
  }

  return programs;
}

function createProgram(service, location, org) {
  const name = service.name || location.name || org.name;
  if (!name) return null;

  // Build address from location
  const address = location.address
    ? [
        location.address.address_1,
        location.address.address_2,
        location.address.city,
        location.address.state_province,
        location.address.postal_code,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  // Get phone from location
  const phone =
    location.phones && location.phones.length > 0
      ? location.phones[0].number
      : null;

  // Determine category and groups
  const category = determineCategory(service, org);
  const groups = extractGroups(service.eligibility);

  const program = {
    id: generateId(name, location.id?.toString()),
    name: org.name && org.name !== name ? `${org.name}: ${name}` : name,
    category: category,
    area: 'San Mateo County',
    city: location.address?.city || null,
    source: 'ohana',
    dataSource: 'ohana',
    externalId: service.id?.toString() || location.id?.toString(),
    sourceUrl: location.urls && location.urls.length > 0 ? location.urls[0] : `https://www.smc-connect.org/locations/${location.id}`,
    verified_by: 'SMC Gov',
    verified_date: new Date().toISOString().split('T')[0],
    groups: groups,
    description: cleanDescription(service.description) || cleanDescription(org.description) || `Service provided by ${org.name || 'organization'} in San Mateo County.`,
  };

  // Add optional fields
  if (service.how_to_apply || service.application_process) {
    program.how_to_get_it = cleanDescription(service.how_to_apply || service.application_process);
  }

  if (address) {
    program.address = address;
  }

  if (phone) {
    program.phone = phone;
  }

  if (org.website || (location.urls && location.urls.length > 0)) {
    program.link = org.website || location.urls[0];
  }

  if (service.fees) {
    program.cost = cleanDescription(service.fees);
  }

  if (service.eligibility) {
    program.requirements = cleanDescription(service.eligibility);
  }

  // Add keywords for search
  program.keywords = ['san mateo county', 'smc gov'];
  if (category) program.keywords.push(category);

  return program;
}

function createLocationProgram(location, org) {
  const name = location.name || org.name;
  if (!name) return null;

  const address = location.address
    ? [
        location.address.address_1,
        location.address.city,
        location.address.state_province,
        location.address.postal_code,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  const phone =
    location.phones && location.phones.length > 0
      ? location.phones[0].number
      : null;

  return {
    id: generateId(name, location.id?.toString()),
    name: name,
    category: 'community',
    area: 'San Mateo County',
    city: location.address?.city || null,
    source: 'ohana',
    dataSource: 'ohana',
    externalId: location.id?.toString(),
    sourceUrl: `https://www.smc-connect.org/locations/${location.id}`,
    verified_by: 'SMC Gov',
    verified_date: new Date().toISOString().split('T')[0],
    groups: ['everyone'],
    description: cleanDescription(location.description || org.description) || `Community resource in San Mateo County.`,
    address: address,
    phone: phone,
    link: org.website || (location.urls && location.urls.length > 0 ? location.urls[0] : null),
    keywords: ['san mateo county', 'smc gov'],
  };
}

/**
 * Generate YAML content from programs
 */
function generateYaml(programs) {
  const lines = [
    '# Ohana API (SMC-Connect) Services - San Mateo County',
    '# Auto-generated from https://api.smc-connect.org/',
    `# Last synced: ${new Date().toISOString()}`,
    '#',
    '# These are San Mateo County services from the SMC-Connect directory.',
    '# Data follows the Human Services Data Specification (HSDS).',
    '#',
    '# DO NOT EDIT MANUALLY - This file is regenerated by sync-ohana-smc.cjs',
    '',
  ];

  for (const p of programs) {
    lines.push(`- id: ${p.id}`);
    lines.push(`  name: ${escapeYamlString(p.name)}`);
    lines.push(`  category: ${p.category}`);
    lines.push(`  area: ${p.area}`);
    if (p.city) lines.push(`  city: ${p.city}`);
    lines.push(`  source: ohana`);
    lines.push(`  data_source: ohana`);
    if (p.externalId) lines.push(`  external_id: "${p.externalId}"`);
    if (p.sourceUrl) lines.push(`  source_url: ${p.sourceUrl}`);
    lines.push(`  verified_by: ${p.verified_by}`);
    lines.push(`  verified_date: '${p.verified_date}'`);

    if (p.groups && p.groups.length > 0) {
      lines.push(`  groups:`);
      p.groups.forEach((g) => lines.push(`    - ${g}`));
    }

    lines.push(`  description: >`);
    lines.push(`    ${p.description.replace(/\n/g, ' ')}`);

    if (p.how_to_get_it) {
      lines.push(`  how_to_get_it: >`);
      lines.push(`    ${p.how_to_get_it.replace(/\n/g, ' ')}`);
    }

    if (p.address) {
      lines.push(`  address: ${escapeYamlString(p.address)}`);
    }

    if (p.phone) {
      lines.push(`  phone: "${p.phone}"`);
    }

    if (p.link) {
      lines.push(`  link: ${p.link}`);
    }

    if (p.cost) {
      lines.push(`  cost: ${escapeYamlString(p.cost)}`);
    }

    if (p.requirements) {
      lines.push(`  requirements: >`);
      lines.push(`    ${p.requirements.replace(/\n/g, ' ')}`);
    }

    if (p.keywords && p.keywords.length > 0) {
      lines.push(`  keywords:`);
      p.keywords.forEach((kw) => lines.push(`    - ${kw}`));
    }

    lines.push('');
  }

  return lines.join('\n');
}

async function syncOhanaServices() {
  console.log('Syncing Ohana API (SMC-Connect) services...\n');

  try {
    // Fetch data
    const { organizations, locations } = await fetchOrganizationsWithServices();

    // Save raw data to data-exports for reference
    if (!fs.existsSync(DATA_EXPORTS_DIR)) {
      fs.mkdirSync(DATA_EXPORTS_DIR, { recursive: true });
    }
    fs.writeFileSync(
      path.join(DATA_EXPORTS_DIR, 'ohana-organizations-raw.json'),
      JSON.stringify(organizations, null, 2)
    );
    fs.writeFileSync(
      path.join(DATA_EXPORTS_DIR, 'ohana-locations-raw.json'),
      JSON.stringify(locations, null, 2)
    );

    // Transform data
    console.log('\nTransforming data...');
    const programs = transformOhanaData(organizations, locations);
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
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

syncOhanaServices();
