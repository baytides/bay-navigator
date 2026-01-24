#!/usr/bin/env node
/**
 * Generate a city contacts API file for Carl to use
 *
 * Creates /public/api/city-contacts.json with structured contact info
 * that Carl can search when users ask about specific cities/departments
 */

const fs = require('fs');
const path = require('path');

const CONSOLIDATED_DIR = path.join(__dirname, '..', 'data-exports', 'consolidated');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'city-contacts.json');

// Department category mappings for better search
const DEPARTMENT_KEYWORDS = {
  'City Hall': ['cityhall', 'city hall', 'manager', 'clerk', 'council'],
  Police: ['police', 'pd', 'cop', 'law enforcement', 'safety'],
  Fire: ['fire', 'fd', 'emergency'],
  'Parks & Recreation': ['parks', 'recreation', 'rec', 'community center', 'pool', 'sport'],
  'Public Works': ['public works', 'pw', 'streets', 'roads', 'utilities', 'water', 'sewer'],
  'Planning & Building': ['planning', 'building', 'permit', 'zoning', 'development', 'code'],
  Finance: ['finance', 'tax', 'billing', 'accounts', 'payment'],
  Housing: ['housing', 'rent', 'tenant', 'landlord', 'hac'],
  Library: ['library', 'book'],
  'Human Resources': ['hr', 'human resources', 'jobs', 'employment', 'career'],
  'Community Development': ['community development', 'com-dev', 'economic'],
  Transportation: ['transportation', 'transit', 'parking', 'traffic'],
  'City Attorney': ['attorney', 'legal', 'prosecutor'],
};

function categorizeEmail(email) {
  const emailLower = email.toLowerCase();
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (keywords.some((kw) => emailLower.includes(kw.replace(/\s+/g, '')))) {
      return dept;
    }
  }
  return 'General';
}

function main() {
  console.log('Generating city contacts API...\n');

  // Load consolidated data
  const entitiesPath = path.join(CONSOLIDATED_DIR, 'all-entities.json');
  const servicesPath = path.join(CONSOLIDATED_DIR, 'all-services.json');

  if (!fs.existsSync(entitiesPath)) {
    console.error('Run consolidate-scraped-data.cjs first!');
    process.exit(1);
  }

  const entities = JSON.parse(fs.readFileSync(entitiesPath, 'utf-8'));
  const services = JSON.parse(fs.readFileSync(servicesPath, 'utf-8'));

  // Build structured city contacts
  const cityContacts = [];

  for (const entity of entities) {
    const cityServices = services.filter(
      (s) => s.entity === entity.name && s.county === entity.county
    );

    // Group emails by department
    const departments = new Map();

    // From services
    for (const svc of cityServices) {
      if (svc.emails?.length > 0 || svc.phones?.length > 0) {
        const deptName =
          svc.category === 'departments'
            ? 'Directory'
            : svc.category === 'contact'
              ? 'General Contact'
              : svc.title?.replace(/\s*\|.*$/, '').trim() || svc.category;

        if (!departments.has(deptName)) {
          departments.set(deptName, {
            name: deptName,
            url: svc.url,
            phones: [],
            emails: [],
          });
        }

        const dept = departments.get(deptName);
        svc.phones?.forEach((p) => {
          if (!dept.phones.includes(p)) dept.phones.push(p);
        });
        svc.emails?.forEach((e) => {
          if (!dept.emails.includes(e)) dept.emails.push(e);
        });
      }
    }

    // If no structured departments, categorize raw emails
    if (departments.size === 0 && entity.emails?.length > 0) {
      for (const email of entity.emails) {
        const deptName = categorizeEmail(email);
        if (!departments.has(deptName)) {
          departments.set(deptName, {
            name: deptName,
            phones: [],
            emails: [],
          });
        }
        departments.get(deptName).emails.push(email);
      }

      // Add phones to "General" if no specific mapping
      if (entity.phones?.length > 0) {
        if (!departments.has('General')) {
          departments.set('General', { name: 'General', phones: [], emails: [] });
        }
        departments.get('General').phones = entity.phones.slice(0, 5); // Limit to 5
      }
    }

    if (departments.size > 0) {
      cityContacts.push({
        name: entity.name,
        county: entity.county,
        type: entity.type,
        website: entity.url,
        departments: [...departments.values()].filter(
          (d) => d.phones.length > 0 || d.emails.length > 0
        ),
      });
    }
  }

  // Sort by name
  cityContacts.sort((a, b) => a.name.localeCompare(b.name));

  // Create output
  const output = {
    generated: new Date().toISOString(),
    total: cityContacts.length,
    contacts: cityContacts,
  };

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`Generated ${cityContacts.length} city contact entries`);
  console.log(`Output: ${OUTPUT_PATH}`);

  // Summary
  let totalDepts = 0;
  let totalPhones = 0;
  let totalEmails = 0;
  for (const city of cityContacts) {
    totalDepts += city.departments.length;
    for (const dept of city.departments) {
      totalPhones += dept.phones.length;
      totalEmails += dept.emails.length;
    }
  }
  console.log(`\nTotal departments: ${totalDepts}`);
  console.log(`Total phones: ${totalPhones}`);
  console.log(`Total emails: ${totalEmails}`);
}

main();
