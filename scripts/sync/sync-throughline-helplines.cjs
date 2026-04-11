#!/usr/bin/env node
/**
 * Sync Crisis Helplines from ThroughLine API
 *
 * Fetches verified crisis helplines and mental health support services
 * from the ThroughLine Care API for the United States.
 *
 * Usage: node scripts/sync-throughline-helplines.cjs
 *
 * Requires environment variables:
 *   THROUGHLINE_CLIENT_ID - OAuth2 client ID
 *   THROUGHLINE_CLIENT_SECRET - OAuth2 client secret
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// API configuration
const CLIENT_ID = process.env.THROUGHLINE_CLIENT_ID;
const CLIENT_SECRET = process.env.THROUGHLINE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Error: THROUGHLINE_CLIENT_ID and THROUGHLINE_CLIENT_SECRET environment variables are required'
  );
  process.exit(1);
}

const API_BASE = 'https://api.throughlinecare.com';

// Output paths
// Note: ThroughLine data has restricted redistribution license
// We only output to YAML for website display, NOT to public API
const OUTPUT_YAML = path.join(__dirname, '../../src/data/helplines.yml');

/**
 * Make HTTPS request
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Get OAuth2 access token using client credentials
 */
async function getAccessToken() {
  console.log('Authenticating with ThroughLine API...');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString();

  const response = await httpsRequest(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.access_token) {
    throw new Error('Failed to get access token');
  }

  console.log('  Authentication successful');
  return response.access_token;
}

/**
 * Fetch helplines from ThroughLine API
 */
async function fetchHelplines(accessToken, countryCode = 'US') {
  console.log(`Fetching ${countryCode} helplines...`);

  const response = await httpsRequest(`${API_BASE}/v1/helplines?country_code=${countryCode}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const helplines = response.helplines || [];
  console.log(`  Found ${helplines.length} helplines`);
  return helplines;
}

/**
 * Map ThroughLine topics to our category system
 */
function mapTopicsToCategories(topics) {
  const categoryMap = {
    'Suicidal thoughts': 'crisis',
    'Self-harm': 'crisis',
    'Abuse & domestic violence': 'safety',
    'Sexual abuse': 'safety',
    Anxiety: 'mental-health',
    Depression: 'mental-health',
    Stress: 'mental-health',
    'Trauma & PTSD': 'mental-health',
    Loneliness: 'mental-health',
    'Eating & body image': 'mental-health',
    'Dementia & Alzheimers': 'mental-health',
    'Substance use': 'substance-use',
    Gambling: 'substance-use',
    'Gender & sexual identity': 'lgbtq',
    Family: 'family',
    Parenting: 'family',
    'Supporting others': 'family',
    Relationships: 'relationships',
    'Pregnancy & abortion': 'reproductive-health',
    Bullying: 'youth',
    'School & work': 'education-employment',
    'Grief & loss': 'grief',
    'Physical illness': 'health',
  };

  const categories = new Set();
  for (const topic of topics) {
    const category = categoryMap[topic];
    if (category) {
      categories.add(category);
    }
  }
  return Array.from(categories);
}

/**
 * Transform helpline data to our format
 */
function transformHelpline(helpline) {
  return {
    id: helpline.id,
    name: helpline.name,
    description: helpline.description,
    website: helpline.website,

    // Contact methods
    phone: helpline.phoneNumber || null,
    sms: helpline.smsNumber || null,
    chat: helpline.webChatUrl || null,
    whatsapp: helpline.whatsappUrl || null,

    // Languages and specialties
    languages: helpline.supported_languages || ['en'],
    specialties: helpline.specialties || [],
    topics: helpline.topics || [],
    categories: mapTopicsToCategories(helpline.topics || []),

    // Availability (most helplines are 24/7)
    availability: '24/7',

    // Source attribution
    source: 'ThroughLine',
    sourceUrl: 'https://findahelpline.com',
    verified: true,
  };
}

/**
 * Generate YAML content for helplines
 */
function generateYaml(helplines) {
  const escapeYaml = (str) => {
    if (!str) return '""';
    // Remove newlines and truncate for YAML readability
    const cleaned = str.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    // Truncate long descriptions
    const truncated = cleaned.length > 200 ? cleaned.slice(0, 197) + '...' : cleaned;
    // Escape quotes
    return `"${truncated.replace(/"/g, "'")}"`;
  };

  let yaml = `# Crisis Helplines and Mental Health Support
# Generated from ThroughLine API on ${new Date().toISOString().split('T')[0]}
# Do not edit manually - run scripts/sync-throughline-helplines.cjs to update
# Source: https://findahelpline.com
# Note: These are national helplines available to Bay Area residents

helplines:
`;

  for (const h of helplines) {
    yaml += `  - id: "${h.id}"
    name: ${escapeYaml(h.name)}
    description: ${escapeYaml(h.description)}
    website: "${h.website || ''}"
    phone: "${h.phone || ''}"
    sms: "${h.sms || ''}"
    chat: "${h.chat || ''}"
    languages: [${h.languages.map((l) => `"${l}"`).join(', ')}]
    specialties: [${h.specialties.map((s) => `"${s}"`).join(', ')}]
    categories: [${h.categories.map((c) => `"${c}"`).join(', ')}]
    availability: "${h.availability}"
    verified: true
`;
  }

  return yaml;
}

/**
 * Main sync function
 */
async function syncHelplines() {
  console.log('Syncing crisis helplines from ThroughLine API...\n');

  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Fetch US helplines
    const rawHelplines = await fetchHelplines(accessToken, 'US');

    // Transform to our format
    const helplines = rawHelplines.map(transformHelpline);

    // Write YAML file (for website display only - not public API due to license restrictions)
    const yamlContent = generateYaml(helplines);
    fs.writeFileSync(OUTPUT_YAML, yamlContent);
    console.log(`Wrote helplines to ${OUTPUT_YAML}`);

    // Summary by specialty
    console.log('\n--- Summary by Specialty ---');
    const bySpecialty = {};
    for (const h of helplines) {
      for (const s of h.specialties) {
        bySpecialty[s] = (bySpecialty[s] || 0) + 1;
      }
    }
    Object.entries(bySpecialty)
      .sort((a, b) => b[1] - a[1])
      .forEach(([specialty, count]) => {
        console.log(`  ${specialty}: ${count} helplines`);
      });

    // Summary by contact method
    console.log('\n--- Summary by Contact Method ---');
    const withPhone = helplines.filter((h) => h.phone).length;
    const withSms = helplines.filter((h) => h.sms).length;
    const withChat = helplines.filter((h) => h.chat).length;
    console.log(`  Phone: ${withPhone} helplines`);
    console.log(`  SMS/Text: ${withSms} helplines`);
    console.log(`  Online Chat: ${withChat} helplines`);
  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

// Run the sync
syncHelplines();
