#!/usr/bin/env node
/**
 * Sync Missing Persons Alerts
 * Fetches missing children data from NCMEC (National Center for Missing & Exploited Children),
 * filters to Bay Area counties, enriches via Ollama (Carl), and outputs JSON.
 *
 * Data source: NCMEC RSS feed (California) + NCMEC webservice for full details
 * Output: public/api/missing-persons.json
 *
 * Usage: node scripts/sync-missing-persons.cjs [--verbose]
 *
 * Environment variables:
 *   PUSH_FUNCTION_KEY - Azure Function key for push-send endpoint (optional)
 *   CARL_API_URL - Ollama API endpoint (default: https://ai.baytides.org)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { uploadToBlob } = require('./lib/azure-blob-upload.cjs');

const VERBOSE = process.argv.includes('--verbose');

// Paths
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'api', 'missing-persons.json');
const PREVIOUS_PATH = path.join(__dirname, '..', 'public', 'api', 'missing-persons-previous.json');
const CITIES_PATH = path.join(__dirname, '..', 'src', 'data', 'cities.yml');

// NCMEC config
const NCMEC_RSS_URL =
  'https://www.missingkids.org/missingkids/servlet/XmlServlet?act=rss&LanguageCountry=en_US&orgPrefix=NCMC&state=CA';
const NCMEC_POSTER_BASE = 'https://www.missingkids.org/poster';

// Ollama / Carl config
const CARL_API_URL = process.env.CARL_API_URL || 'https://ai.baytides.org';
const CARL_MODEL = 'qwen2.5:3b';

// Push notification config
const PUSH_SEND_URL = 'https://baynavigator-push.azurewebsites.net/api/push-send';
const PUSH_FUNCTION_KEY = process.env.PUSH_FUNCTION_KEY || '';

// Azure Blob Storage config
const AZURE_STORAGE_CONTAINER = 'missing-persons';
const AZURE_STORAGE_BLOB = 'missing-persons.json';

// Bay Area counties
const BAY_AREA_COUNTIES = [
  'Alameda County',
  'Contra Costa County',
  'Marin County',
  'Napa County',
  'San Francisco',
  'San Mateo County',
  'Santa Clara County',
  'Solano County',
  'Sonoma County',
];

// Fallback city → police department mapping for when NCMEC poster doesn't provide agency info
const CITY_PD_MAP = {
  antioch: { agency: 'Antioch Police Department', phone: '(925) 778-2441' },
  berkeley: { agency: 'Berkeley Police Department', phone: '(510) 981-5900' },
  concord: { agency: 'Concord Police Department', phone: '(925) 671-3333' },
  'daly city': { agency: 'Daly City Police Department', phone: '(650) 991-8119' },
  dublin: { agency: 'Dublin Police Department', phone: '(925) 833-6670' },
  fairfield: { agency: 'Fairfield Police Department', phone: '(707) 428-7300' },
  fremont: { agency: 'Fremont Police Department', phone: '(510) 790-6800' },
  'half moon bay': {
    agency: 'Half Moon Bay Police (San Mateo Co. Sheriff)',
    phone: '(650) 726-8286',
  },
  hayward: { agency: 'Hayward Police Department', phone: '(510) 293-7000' },
  'menlo park': { agency: 'Menlo Park Police Department', phone: '(650) 330-6300' },
  milpitas: { agency: 'Milpitas Police Department', phone: '(408) 586-2400' },
  'morgan hill': { agency: 'Morgan Hill Police Department', phone: '(408) 779-2101' },
  napa: { agency: 'Napa Police Department', phone: '(707) 253-4451' },
  novato: { agency: 'Novato Police Department', phone: '(415) 897-1122' },
  oakland: { agency: 'Oakland Police Department', phone: '(510) 238-3455' },
  'palo alto': { agency: 'Palo Alto Police Department', phone: '(650) 329-2413' },
  petaluma: { agency: 'Petaluma Police Department', phone: '(707) 778-4372' },
  pinole: { agency: 'Pinole Police Department', phone: '(510) 724-8950' },
  pittsburg: { agency: 'Pittsburg Police Department', phone: '(925) 646-2441' },
  'redwood city': { agency: 'Redwood City Police Department', phone: '(650) 780-7100' },
  richmond: { agency: 'Richmond Police Department', phone: '(510) 233-1214' },
  'rohnert park': { agency: 'Rohnert Park Police Department', phone: '(707) 584-2600' },
  'san francisco': { agency: 'San Francisco Police Department', phone: '(415) 553-0123' },
  'san jose': { agency: 'San Jose Police Department', phone: '(408) 277-8900' },
  'san mateo': { agency: 'San Mateo Police Department', phone: '(650) 522-7700' },
  'san rafael': { agency: 'San Rafael Police Department', phone: '(415) 485-3000' },
  'santa clara': { agency: 'Santa Clara Police Department', phone: '(408) 615-5580' },
  'santa rosa': { agency: 'Santa Rosa Police Department', phone: '(707) 543-3600' },
  sunnyvale: { agency: 'Sunnyvale Police Department', phone: '(408) 730-7100' },
  'union city': { agency: 'Union City Police Department', phone: '(510) 471-1365' },
  vacaville: { agency: 'Vacaville Police Department', phone: '(707) 449-5200' },
  vallejo: { agency: 'Vallejo Police Department', phone: '(707) 648-4321' },
  'walnut creek': { agency: 'Walnut Creek Police Department', phone: '(925) 943-5844' },
};

/**
 * Sanitize a value for safe logging (prevent log injection via ANSI codes, newlines, etc.)
 */
function sanitizeLogArg(arg) {
  const str = typeof arg === 'string' ? arg : String(arg);
  return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/[\r\n]+/g, ' ');
}

function log(...args) {
  if (VERBOSE) console.log('[missing-persons]', ...args.map(sanitizeLogArg));
}

function warn(...args) {
  console.warn('[missing-persons]', ...args.map(sanitizeLogArg));
}

// ─── City to County Mapping ──────────────────────────────────────────────────

/**
 * Parse cities.yml to build a city name → county lookup.
 * Simple YAML parser for the flat structure used in cities.yml.
 */
function loadCityCountyMap() {
  const content = fs.readFileSync(CITIES_PATH, 'utf-8');
  const map = new Map();

  let currentName = null;
  let currentCounty = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- name:')) {
      currentName = trimmed.replace('- name:', '').trim();
    } else if (trimmed.startsWith('county:')) {
      currentCounty = trimmed.replace('county:', '').trim();
      if (currentName && currentCounty) {
        map.set(currentName.toLowerCase(), currentCounty);
      }
    }
  }

  log(`Loaded ${map.size} city-to-county mappings`);
  return map;
}

/**
 * Check if a city is in the Bay Area
 */
function isBayAreaCity(cityName, cityCountyMap) {
  if (!cityName) return false;
  const county = cityCountyMap.get(cityName.toLowerCase());
  if (county && BAY_AREA_COUNTIES.includes(county)) {
    return county;
  }
  return false;
}

// ─── ID Generation ───────────────────────────────────────────────────────────

/**
 * Generate a BN case ID: "BN" + 6 random alphanumeric characters
 */
function generateCaseId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'BN';
  // Use rejection sampling to avoid bias from modulo operation
  const maxValid = Math.floor(256 / chars.length) * chars.length;

  for (let i = 0; i < 6; i++) {
    let byte;
    do {
      byte = crypto.randomBytes(1)[0];
    } while (byte >= maxValid);
    id += chars[byte % chars.length];
  }
  return id;
}

/**
 * Strip HTML tags using iterative replacement to handle nested/malformed tags
 * Prevents incomplete sanitization vulnerabilities
 */
function stripHtmlTags(str) {
  let prev;
  do {
    prev = str;
    str = str.replace(/<[^>]*>/g, '');
  } while (str !== prev);
  return str.trim();
}

// ─── RSS Parsing ─────────────────────────────────────────────────────────────

/**
 * Fetch and parse the NCMEC RSS feed for California
 */
async function fetchRSSFeed() {
  log('Fetching NCMEC RSS feed...');
  try {
    const resp = await fetch(NCMEC_RSS_URL, {
      headers: { 'User-Agent': 'BayNavigator/1.0 (missing-persons-sync)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      warn(`RSS feed HTTP ${resp.status}`);
      return [];
    }

    const xml = await resp.text();
    return parseRSSItems(xml);
  } catch (e) {
    warn(`RSS feed error: ${e.message}`);
    return [];
  }
}

/**
 * Parse RSS XML into items. Simple parser for RSS 2.0 structure.
 */
function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const item = {
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      guid: extractTag(itemXml, 'guid'),
    };

    // Extract enclosure (photo)
    const enclosureMatch = itemXml.match(/<enclosure\s+([^>]+)\/>/);
    if (enclosureMatch) {
      const attrs = enclosureMatch[1];
      item.photoUrl = extractAttr(attrs, 'url');
    }

    // Parse NCMEC case ID from guid (e.g., "NCMC/2059400/1")
    item.ncmecId = item.guid || '';

    // Parse details from description
    // Format: "Name, Age Now: 17, Missing: 08/19/2025. Missing From City, ST."
    const desc = item.description || '';
    const ageMatch = desc.match(/Age Now:\s*(\d+)/);
    const missingDateMatch = desc.match(/Missing:\s*([\d/]+)/);
    const missingFromMatch = desc.match(/Missing From\s+([^,]+),\s*(\w+)/);

    item.age = ageMatch ? parseInt(ageMatch[1]) : null;
    item.missingDate = missingDateMatch ? missingDateMatch[1] : null;
    item.missingCity = missingFromMatch ? missingFromMatch[1].trim() : null;
    item.missingState = missingFromMatch ? missingFromMatch[2].trim() : null;

    // Extract name from title (format: "Name (ST)" or "Missing: Name (ST)")
    const nameMatch = (item.title || '').match(/^(.+?)\s*\(/);
    let rawName = nameMatch ? nameMatch[1].trim() : (item.title || '').trim();
    // Strip common prefixes: "Missing:", "Endangered Missing:", or bare ":"
    rawName = rawName
      .replace(/^(?:Endangered\s+)?Missing\s*:\s*/i, '')
      .replace(/^:\s*/, '')
      .trim();
    item.name = rawName;

    items.push(item);
  }

  log(`Parsed ${items.length} items from RSS feed`);
  return items;
}

function extractTag(xml, tag) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`)
  );
  return match ? match[1].trim() : '';
}

function extractAttr(str, attr) {
  const match = str.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? match[1] : '';
}

// ─── NCMEC Webservice ────────────────────────────────────────────────────────

/**
 * Fetch detailed case info from NCMEC poster page.
 * Scrapes the poster page for additional details beyond the RSS feed.
 */
async function fetchCaseDetails(ncmecId) {
  const url = `${NCMEC_POSTER_BASE}/${ncmecId}`;
  log(`Fetching case details: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'BayNavigator/1.0 (missing-persons-sync)' },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      log(`Case details HTTP ${resp.status} for ${ncmecId}`);
      return null;
    }

    const html = await resp.text();
    return parsePosterPage(html);
  } catch (e) {
    log(`Case details error for ${ncmecId}: ${e.message}`);
    return null;
  }
}

/**
 * Parse the NCMEC poster page HTML for structured data
 */
function parsePosterPage(html) {
  const details = {};

  // Physical details
  details.sex = extractFieldFromHtml(html, 'Sex') || '';
  details.race = extractFieldFromHtml(html, 'Race') || '';
  details.hairColor = extractFieldFromHtml(html, 'Hair Color') || '';
  details.eyeColor = extractFieldFromHtml(html, 'Eye Color') || '';
  details.height = extractFieldFromHtml(html, 'Height') || '';
  details.weight = extractFieldFromHtml(html, 'Weight') || '';
  details.dateOfBirth = extractFieldFromHtml(html, 'Date of Birth') || '';

  // Circumstances
  const circumstancesMatch = html.match(
    /(?:Circumstances|circumstances)[^>]*>[\s\S]*?<[^>]*>([\s\S]*?)<\//
  );
  if (circumstancesMatch) {
    details.circumstances = stripHtmlTags(circumstancesMatch[1]).replace(/\s+/g, ' ').trim();
  }

  // Contact info — NCMEC poster format: <p class="sheriff-info">Agency (ST) <a href="tel:..."></a><a href="tel:...">phone</a></p>
  const agencyPhoneMatch = html.match(
    /<p\s+class="sheriff-info">\s*([^<]+?\(\w{2}\))\s*(?:<a[^>]*><\/a>)*\s*<a\s+href="tel:[^"]*">([^<]+)<\/a>/i
  );
  if (agencyPhoneMatch) {
    details.contactAgency = agencyPhoneMatch[1].trim();
    details.contactPhone = agencyPhoneMatch[2].trim();
  }

  return details;
}

function extractFieldFromHtml(html, fieldName) {
  const regex = new RegExp(`${fieldName}[^>]*>[^<]*</[^>]+>\\s*<[^>]+>([^<]+)`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

// ─── Ollama / Carl Enrichment ────────────────────────────────────────────────

/**
 * Call Ollama (Carl) to normalize and enrich a case record
 */
async function enrichWithCarl(caseData) {
  log(`Enriching case ${caseData.name} via Carl...`);

  const prompt = `You are a data processor. Given this missing person case data, output ONLY a valid JSON object with these fields:
- "summary": A 1-2 sentence plain-language summary suitable for a public alert
- "caseType": One of: "Missing", "Endangered Runaway", "Family Abduction", "Non-Family Abduction", "Lost/Injured/Missing", "Unknown"
- "lastSeenWearing": Extract clothing description if available, or ""
- "normalizedName": The person's full name in "First Last" format

Raw case data:
Name: ${caseData.name}
Age: ${caseData.age}
Missing Date: ${caseData.missingDate}
Missing From: ${caseData.missingCity}, ${caseData.missingState}
Circumstances: ${caseData.circumstances || 'Not available'}
Sex: ${caseData.sex || 'Unknown'}

Output ONLY the JSON object, no markdown, no explanation.`;

  try {
    const resp = await fetch(`${CARL_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CARL_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) {
      log(`Carl API HTTP ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) return null;

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    log(`Carl enrichment error: ${e.message}`);
    return null;
  }
}

// ─── Push Notifications ──────────────────────────────────────────────────────

/**
 * Send push notification for new missing person cases
 */
async function sendPushNotification(newCase) {
  if (!PUSH_FUNCTION_KEY) {
    log('No PUSH_FUNCTION_KEY set, skipping push notification');
    return;
  }

  log(`Sending push notification for ${newCase.name}...`);

  try {
    const resp = await fetch(`${PUSH_SEND_URL}?code=${encodeURIComponent(PUSH_FUNCTION_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification: {
          title: `Missing Person Alert: ${newCase.name}`,
          body: `${newCase.name}, age ${newCase.age}, missing from ${newCase.missingFrom.city}. Tap for details.`,
          data: {
            type: 'missing-persons',
            tag: `missing-${newCase.id}`,
            url: `/alerts/${newCase.id}`,
            requireInteraction: true,
            threadId: 'missing-persons',
            channelId: 'missing-persons',
          },
        },
        tags: ['missing-persons:enabled'],
      }),
    });

    if (resp.ok) {
      log(`Push notification sent for ${newCase.name}`);
    } else {
      warn(`Push notification failed: HTTP ${resp.status}`);
    }
  } catch (e) {
    warn(`Push notification error: ${e.message}`);
  }
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

async function main() {
  console.log('[missing-persons] Starting sync...');

  // Load city-county mapping
  const cityCountyMap = loadCityCountyMap();

  // Load existing data for deduplication and ID preservation
  let existingData = { cases: [], idMap: {}, lastSync: null };
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existingData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    } catch {
      warn('Could not parse existing data, starting fresh');
    }
  }

  const idMap = existingData.idMap || {};

  // Save previous state for diffing
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.copyFileSync(OUTPUT_PATH, PREVIOUS_PATH);
  }

  // 1. Fetch RSS feed
  const rssItems = await fetchRSSFeed();
  if (rssItems.length === 0) {
    warn('No items from RSS feed, keeping existing data');
    return;
  }

  // 2. Filter to Bay Area
  const bayAreaItems = [];
  for (const item of rssItems) {
    const county = isBayAreaCity(item.missingCity, cityCountyMap);
    if (county) {
      item.county = county;
      bayAreaItems.push(item);
      log(`Bay Area match: ${item.name} from ${item.missingCity} (${county})`);
    }
  }

  log(`${bayAreaItems.length} of ${rssItems.length} cases are in the Bay Area`);

  // 3. Process each case
  const cases = [];
  const newCases = [];

  for (const item of bayAreaItems) {
    const isNew = !idMap[item.ncmecId];

    // Assign or reuse BN case ID
    if (!idMap[item.ncmecId]) {
      idMap[item.ncmecId] = generateCaseId();
    }
    const bnId = idMap[item.ncmecId];

    // Build case object
    const caseObj = {
      id: bnId,
      sourceId: item.ncmecId,
      source: 'ncmec',
      name: item.name,
      age: item.age,
      missingDate: item.missingDate,
      missingFrom: {
        city: item.missingCity,
        county: item.county,
        state: item.missingState || 'CA',
      },
      photoUrl: item.photoUrl || '',
      posterUrl: item.link || `${NCMEC_POSTER_BASE}/${item.ncmecId}`,
      contact: {
        agency: '',
        phone: '1-800-THE-LOST (1-800-843-5678)',
      },
      syncedAt: new Date().toISOString(),
    };

    // Fetch detailed info from NCMEC poster page (only for new cases)
    if (isNew) {
      const details = await fetchCaseDetails(item.ncmecId);
      if (details) {
        caseObj.physical = {
          sex: details.sex,
          race: details.race,
          height: details.height,
          weight: details.weight,
          hairColor: details.hairColor,
          eyeColor: details.eyeColor,
        };
        caseObj.dateOfBirth = details.dateOfBirth;
        caseObj.circumstances = details.circumstances || '';
        if (details.contactAgency) {
          caseObj.contact.agency = details.contactAgency;
        }
        if (details.contactPhone) {
          caseObj.contact.phone = details.contactPhone;
        }
      }

      // Fallback: if no agency from NCMEC poster, use city-to-PD mapping
      if (!caseObj.contact.agency && item.missingCity) {
        const pd = CITY_PD_MAP[item.missingCity.toLowerCase()];
        if (pd) {
          caseObj.contact.agency = pd.agency;
          caseObj.contact.phone = pd.phone;
          log(`Using city PD fallback for ${item.name}: ${pd.agency}`);
        }
      }

      // Enrich with Carl (Ollama)
      const enrichment = await enrichWithCarl({
        ...caseObj,
        missingCity: item.missingCity,
        missingState: item.missingState,
        sex: caseObj.physical?.sex,
      });

      if (enrichment) {
        caseObj.summary = enrichment.summary || '';
        caseObj.caseType = enrichment.caseType || 'Missing';
        caseObj.lastSeenWearing = enrichment.lastSeenWearing || '';
        caseObj.enrichedByLlm = true;
        if (enrichment.normalizedName) {
          caseObj.name = enrichment.normalizedName;
        }
      } else {
        caseObj.summary = '';
        caseObj.caseType = 'Missing';
        caseObj.lastSeenWearing = '';
        caseObj.enrichedByLlm = false;
      }

      newCases.push(caseObj);

      // Be polite to NCMEC servers
      await new Promise((r) => setTimeout(r, 1000));
    } else {
      // Reuse existing enriched data for known cases
      const existing = existingData.cases?.find((c) => c.sourceId === item.ncmecId);
      if (existing) {
        caseObj.physical = existing.physical;
        caseObj.dateOfBirth = existing.dateOfBirth;
        caseObj.circumstances = existing.circumstances;
        caseObj.summary = existing.summary;
        caseObj.caseType = existing.caseType;
        caseObj.lastSeenWearing = existing.lastSeenWearing;
        caseObj.enrichedByLlm = existing.enrichedByLlm;
        if (existing.contact?.agency) {
          caseObj.contact.agency = existing.contact.agency;
        }
        if (existing.contact?.phone) {
          caseObj.contact.phone = existing.contact.phone;
        }
      }
    }

    cases.push(caseObj);
  }

  // Sort by missing date, most recent first
  cases.sort((a, b) => {
    const dateA = a.missingDate ? new Date(a.missingDate) : new Date(0);
    const dateB = b.missingDate ? new Date(b.missingDate) : new Date(0);
    return dateB - dateA;
  });

  // 4. Check if case data actually changed before writing/uploading
  const caseFingerprint = JSON.stringify(cases);
  let existingFingerprint = '';
  try {
    const existingData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    existingFingerprint = JSON.stringify(existingData.cases);
  } catch (_) {
    // No existing file or parse error — treat as changed
  }

  if (caseFingerprint === existingFingerprint && newCases.length === 0) {
    console.log(
      `[missing-persons] No changes detected — skipping write and upload (${cases.length} cases unchanged)`
    );
    console.log('[missing-persons] Sync complete');
    return;
  }

  const output = {
    cases,
    idMap,
    lastSync: new Date().toISOString(),
    totalCalifornia: rssItems.length,
    totalBayArea: cases.length,
    newCasesThisSync: newCases.length,
  };

  // Write output file using atomic write to temp file + rename (avoids TOCTOU race)
  const outputDir = path.dirname(OUTPUT_PATH);
  const jsonString = JSON.stringify(output, null, 2);
  const tmpPath = OUTPUT_PATH + '.tmp.' + process.pid;

  fs.mkdirSync(outputDir, { recursive: true });
  try {
    fs.writeFileSync(tmpPath, jsonString);
    fs.renameSync(tmpPath, OUTPUT_PATH);
  } catch (err) {
    // Clean up temp file on failure
    try {
      fs.unlinkSync(tmpPath);
    } catch (_) {
      /* ignore */
    }
    console.error(`[missing-persons] Failed to write file: ${sanitizeLogArg(err.message)}`);
    throw err;
  }
  console.log(
    `[missing-persons] Wrote ${cases.length} Bay Area cases (${newCases.length} new) to ${OUTPUT_PATH}`
  );

  // 5. Upload to Azure Blob Storage
  await uploadToBlob({
    container: AZURE_STORAGE_CONTAINER,
    blob: AZURE_STORAGE_BLOB,
    data: jsonString,
    label: 'missing-persons',
  });

  // 6. Send push notifications for new cases
  if (newCases.length > 0) {
    console.log(`[missing-persons] ${newCases.length} new case(s) detected`);
    for (const newCase of newCases) {
      await sendPushNotification(newCase);
    }
  }

  console.log('[missing-persons] Sync complete');
}

main().catch((e) => {
  console.error('[missing-persons] Fatal error:', sanitizeLogArg(e.message || e));
  process.exit(1);
});
