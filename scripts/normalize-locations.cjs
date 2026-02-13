#!/usr/bin/env node
/**
 * normalize-locations.cjs
 *
 * Normalizes the `area` field across all program YAML files and adds:
 *   - `counties` array (list of county IDs the program serves)
 *   - `impact` tier (high / medium / low)
 *
 * Uses the `yaml` package (Eemeli Aro) to preserve comments and formatting.
 * Uses `string-similarity` for fuzzy city/area matching against canonical lists.
 *
 * Usage:
 *   node scripts/normalize-locations.cjs              # dry-run (report only)
 *   node scripts/normalize-locations.cjs --apply      # write changes to YAML files
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { findBestMatch } = require('string-similarity');

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const APPLY = process.argv.includes('--apply');

// Program YAML files to process (exclude config/reference files)
const PROGRAM_FILES = [
  'community.yml', 'education.yml', 'employment.yml', 'equipment.yml',
  'federal-benefits.yml', 'finance.yml', 'food.yml', 'health.yml',
  'housing.yml', 'legal.yml', 'lgbtq.yml', 'library_resources.yml',
  'pet_resources.yml', 'recreation.yml', 'retail.yml', 'safety.yml',
  'technology.yml', 'transportation.yml', 'utilities.yml',
  'datasf-services.yml',
];

// ─── Load canonical data ──────────────────────────────────────────────────────

function loadCities() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'cities.yml'), 'utf8');
  const cities = YAML.parse(raw);
  // Build city name → county mapping
  const map = {};
  for (const c of cities) {
    map[c.name.toLowerCase()] = c.county;
  }
  return map;
}

function loadCounties() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'groups.yml'), 'utf8');
  const data = YAML.parse(raw);
  // Build county name → county ID mapping
  const map = {};
  for (const c of data.counties) {
    map[c.name.toLowerCase()] = c.id;
    // Also map without "county" suffix: "alameda" → "alameda"
    const short = c.name.toLowerCase().replace(' county', '');
    map[short] = c.id;
  }
  return map;
}

const cityToCounty = loadCities();
const countyNameToId = loadCounties();
const allCityNames = Object.keys(cityToCounty);
const allCountyNames = Object.keys(countyNameToId);

// ─── Area normalization mapping ───────────────────────────────────────────────

// Broad scope values that map to all counties
const BROAD_SCOPES = {
  'nationwide': 'all',
  'statewide': 'all',
  'bay area': 'all',
  'california': 'all',
  'northern california': 'all',
};

// Canonical area display values
const CANONICAL_AREA = {
  'nationwide': 'Nationwide',
  'statewide': 'Statewide',
  'bay area': 'Bay Area',
  'california': 'Statewide',
  'northern california': 'Bay Area',
};

// "City of X" pattern
const CITY_OF_PATTERN = /^(?:City of|Town of)\s+(.+)$/i;

// ─── High-impact program IDs (major government benefits) ──────────────────────

const HIGH_IMPACT_IDS = new Set([
  // Food
  'calfresh', 'calfresh-online', 'calfresh-rmp', 'wic', 'wic-farmers-market',
  'school-meals', 'nslp', 'sfbp', 'csfp', 'snap', 'tefap',
  // Healthcare
  'medi-cal', 'medicare', 'medicare-savings', 'covered-california',
  'chip', 'va-health-care', 'tricare', 'medicaid',
  // Housing
  'section-8-hcv', 'public-housing', 'hud-vash', 'ssvf',
  'emergency-rental-assistance', 'ca-emergency-rental-assistance',
  'liheap', 'rapid-rehousing',
  // Cash/Income
  'calworks', 'ssi', 'ssdi', 'social-security', 'general-assistance',
  'ga', 'tanf', 'eitc', 'child-tax-credit', 'unemployment',
  'edd-unemployment-insurance',
  // Other major
  'pell-grant', 'cal-grant', 'fafsa',
]);

// Partial matches for high-impact (program ID contains these)
const HIGH_IMPACT_PATTERNS = [
  'medicare', 'medi-cal', 'medicaid', 'calfresh', 'calworks',
  'section-8', 'hud-vash', 'wic', 'ssi', 'ssdi', 'snap',
  'tricare', 'va-health', 'pell-grant', 'cal-grant',
];

// ─── Resolve area → counties + normalized area ───────────────────────────────

function resolveArea(area, city, programId) {
  const result = { counties: [], normalizedArea: area, warnings: [] };

  if (!area || typeof area !== 'string' || area.trim() === '') {
    result.warnings.push(`Empty area field`);
    result.counties = ['all'];
    result.normalizedArea = 'Bay Area';
    return result;
  }

  const areaLower = area.trim().toLowerCase();

  // 1. Check broad scopes
  if (BROAD_SCOPES[areaLower] !== undefined) {
    result.counties = [BROAD_SCOPES[areaLower]];
    result.normalizedArea = CANONICAL_AREA[areaLower] || area;
    return result;
  }

  // 2. Check exact county match
  if (countyNameToId[areaLower] !== undefined) {
    result.counties = [countyNameToId[areaLower]];
    // Normalize to canonical county name from groups.yml
    result.normalizedArea = getCanonicalCountyName(countyNameToId[areaLower]);
    return result;
  }

  // 3. Check "City of X" / "Town of X" pattern
  const cityOfMatch = area.match(CITY_OF_PATTERN);
  if (cityOfMatch) {
    const cityName = cityOfMatch[1].trim().toLowerCase();
    if (cityToCounty[cityName]) {
      const county = cityToCounty[cityName];
      const countyId = countyNameToId[county.toLowerCase()];
      result.counties = countyId ? [countyId] : ['all'];
      result.normalizedArea = getCanonicalCountyName(countyId) || county;
      return result;
    }
    // Fuzzy match the city name
    return fuzzyMatchCity(cityName, area, result);
  }

  // 4. Check if it matches a city name exactly
  if (cityToCounty[areaLower]) {
    const county = cityToCounty[areaLower];
    const countyId = countyNameToId[county.toLowerCase()];
    result.counties = countyId ? [countyId] : ['all'];
    result.normalizedArea = getCanonicalCountyName(countyId) || county;
    return result;
  }

  // 5. Fuzzy match against counties
  if (allCountyNames.length > 0) {
    const countyMatch = findBestMatch(areaLower, allCountyNames);
    if (countyMatch.bestMatch.rating > 0.7) {
      const matchedId = countyNameToId[countyMatch.bestMatch.target];
      result.counties = [matchedId];
      result.normalizedArea = getCanonicalCountyName(matchedId);
      result.warnings.push(
        `Fuzzy county match: "${area}" → "${countyMatch.bestMatch.target}" (${(countyMatch.bestMatch.rating * 100).toFixed(0)}%)`
      );
      return result;
    }
  }

  // 6. Fuzzy match against cities
  return fuzzyMatchCity(areaLower, area, result);
}

function fuzzyMatchCity(cityName, originalArea, result) {
  if (allCityNames.length === 0) {
    result.warnings.push(`No cities to match against`);
    result.counties = ['all'];
    return result;
  }

  const cityMatch = findBestMatch(cityName, allCityNames);
  if (cityMatch.bestMatch.rating > 0.7) {
    const county = cityToCounty[cityMatch.bestMatch.target];
    const countyId = countyNameToId[county.toLowerCase()];
    result.counties = countyId ? [countyId] : ['all'];
    result.normalizedArea = getCanonicalCountyName(countyId) || county;
    result.warnings.push(
      `Fuzzy city match: "${originalArea}" → city "${cityMatch.bestMatch.target}" in ${county} (${(cityMatch.bestMatch.rating * 100).toFixed(0)}%)`
    );
    return result;
  }

  // No good match
  result.warnings.push(`Could not resolve area: "${originalArea}"`);
  result.counties = ['all'];
  result.normalizedArea = originalArea;
  return result;
}

// Canonical county display names keyed by ID
const CANONICAL_COUNTY_NAMES = {};
function buildCanonicalCountyNames() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'groups.yml'), 'utf8');
  const data = YAML.parse(raw);
  for (const c of data.counties) {
    CANONICAL_COUNTY_NAMES[c.id] = c.name;
  }
}
buildCanonicalCountyNames();

function getCanonicalCountyName(countyId) {
  return CANONICAL_COUNTY_NAMES[countyId] || null;
}

// ─── Determine impact tier ───────────────────────────────────────────────────

function determineImpact(program) {
  const id = (program.id || '').toLowerCase();

  // Check exact ID match
  if (HIGH_IMPACT_IDS.has(id)) return 'high';

  // Check partial patterns
  if (HIGH_IMPACT_PATTERNS.some(p => id.includes(p))) return 'high';

  // Check for government benefit indicators in description/name
  const text = `${program.name || ''} ${program.description || ''} ${program.what_they_offer || ''}`.toLowerCase();
  const govIndicators = [
    'federal program', 'government benefit', 'social security',
    'supplemental security', 'medicaid', 'medicare',
    'housing voucher', 'section 8', 'public housing',
  ];
  if (govIndicators.some(g => text.includes(g))) return 'high';

  // Groups-based heuristic
  const groups = program.groups || [];
  const hasTargetedGroups = groups.some(g =>
    ['income-eligible', 'veterans', 'disability', 'unhoused'].includes(g)
  );
  const hasApplyLink = !!(program.link_text && /apply|enroll|sign up|register/i.test(program.link_text));

  if (hasTargetedGroups && hasApplyLink) return 'medium';
  if (hasTargetedGroups) return 'medium';

  // Everyone-only programs without apply links are typically informational
  if (groups.length === 1 && groups[0] === 'everyone' && !hasApplyLink) return 'low';

  return 'medium'; // default
}

// ─── Process a single YAML file ──────────────────────────────────────────────

function processFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return { file: filename, skipped: true };

  const raw = fs.readFileSync(filepath, 'utf8');
  const doc = YAML.parseDocument(raw);
  const programs = doc.toJSON();

  if (!Array.isArray(programs)) {
    return { file: filename, skipped: true, reason: 'Not an array' };
  }

  const changes = [];
  const warnings = [];

  // Get the YAML document's items (sequence)
  const seq = doc.contents;
  if (!YAML.isSeq(seq)) {
    return { file: filename, skipped: true, reason: 'Root is not a sequence' };
  }

  for (let i = 0; i < seq.items.length; i++) {
    const node = seq.items[i];
    const program = programs[i];
    if (!program || !program.id) continue;

    // Skip if already has counties
    if (program.counties) continue;

    const area = program.area || '';
    const city = program.city || '';
    const resolved = resolveArea(area, city, program.id);
    const impact = determineImpact(program);

    // Track changes
    if (resolved.normalizedArea !== area && area) {
      changes.push(`  ${program.id}: area "${area}" → "${resolved.normalizedArea}"`);
    }
    changes.push(`  ${program.id}: +counties [${resolved.counties.join(', ')}], impact=${impact}`);

    if (resolved.warnings.length > 0) {
      for (const w of resolved.warnings) {
        warnings.push(`  ${program.id}: ${w}`);
      }
    }

    if (APPLY && YAML.isMap(node)) {
      // Update area if it changed
      if (resolved.normalizedArea !== area && area) {
        node.set('area', resolved.normalizedArea);
      }

      // Add counties field after area (or after city if it exists)
      const countiesValue = doc.createNode(resolved.counties);
      countiesValue.flow = true; // inline array like [all] or [alameda, san-francisco]

      // Find insertion point: after 'city' if exists, else after 'area'
      const items = node.items;
      let insertAfterKey = 'area';
      for (const pair of items) {
        if (YAML.isScalar(pair.key) && pair.key.value === 'city') {
          insertAfterKey = 'city';
          break;
        }
      }

      // Find the index of the key to insert after
      let insertIdx = -1;
      for (let j = 0; j < items.length; j++) {
        if (YAML.isScalar(items[j].key) && items[j].key.value === insertAfterKey) {
          insertIdx = j + 1;
          break;
        }
      }

      if (insertIdx >= 0) {
        const pair = doc.createPair('counties', countiesValue);
        items.splice(insertIdx, 0, pair);
      } else {
        node.set('counties', countiesValue);
      }

      // Add impact field after counties
      const newItems = node.items;
      let countiesIdx = -1;
      for (let j = 0; j < newItems.length; j++) {
        if (YAML.isScalar(newItems[j].key) && newItems[j].key.value === 'counties') {
          countiesIdx = j + 1;
          break;
        }
      }
      if (countiesIdx >= 0) {
        const impactPair = doc.createPair('impact', impact);
        newItems.splice(countiesIdx, 0, impactPair);
      } else {
        node.set('impact', impact);
      }
    }
  }

  // Write back if applying
  if (APPLY && changes.length > 0) {
    const output = doc.toString({
      lineWidth: 0, // don't wrap lines
      singleQuote: true,
    });
    fs.writeFileSync(filepath, output, 'utf8');
  }

  return { file: filename, changes, warnings, count: programs.length };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Location Normalization ${APPLY ? '(APPLYING)' : '(DRY RUN)'}`);
  console.log(`${'='.repeat(60)}\n`);

  let totalPrograms = 0;
  let totalChanges = 0;
  let totalWarnings = 0;

  for (const filename of PROGRAM_FILES) {
    const result = processFile(filename);
    if (result.skipped) {
      console.log(`SKIP ${filename}${result.reason ? ': ' + result.reason : ''}`);
      continue;
    }

    totalPrograms += result.count;
    totalChanges += result.changes.length;
    totalWarnings += result.warnings.length;

    if (result.changes.length > 0 || result.warnings.length > 0) {
      console.log(`\n${filename} (${result.count} programs):`);
      if (result.changes.length > 0) {
        console.log(`  Changes (${result.changes.length}):`);
        for (const c of result.changes) console.log(`    ${c}`);
      }
      if (result.warnings.length > 0) {
        console.log(`  Warnings (${result.warnings.length}):`);
        for (const w of result.warnings) console.log(`    ⚠️  ${w}`);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Files processed: ${PROGRAM_FILES.length}`);
  console.log(`  Total programs:  ${totalPrograms}`);
  console.log(`  Changes:         ${totalChanges}`);
  console.log(`  Warnings:        ${totalWarnings}`);
  if (!APPLY) {
    console.log(`\n  Run with --apply to write changes to YAML files.`);
  } else {
    console.log(`\n  Changes written to YAML files.`);
  }
  console.log('');
}

main();
