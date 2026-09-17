#!/usr/bin/env node
/**
 * Stage 2 schema migration — recover curated data the pipeline was discarding.
 *
 * Three problems, all of which silently lost information a human had entered:
 *
 *   1. `category:` is dead. generate-api.cjs sets `category: categoryId` from
 *      the FILENAME, so the per-record `category:` field never reaches the API.
 *      371 records carry one, and much of it is genuinely finer-grained than the
 *      file it lives in — 82 "Museums" and 66 "Parks & Open Space" all publish
 *      as "recreation". This promotes those values to `subcategory:` so they
 *      survive, and drops the ones that merely restate the filename.
 *
 *   2. `lifeEvents` vs `life_events`. The generator reads snake_case only, so
 *      19 camelCase records in transportation.yml lose their life-event tags
 *      entirely — they are missing from life-event browsing. Renamed.
 *
 *   3. Free-text `area`. Four records use values like "Alameda & Contra Costa
 *      Counties", which no area filter can match. Their `counties:` arrays are
 *      already correct, so this records a canonical `area` and keeps the
 *      human-readable text as `area_label` for display.
 *
 * SAFETY: dry-run by default; pass --apply to write. Rewrites only the fields
 * above and preserves everything else, including comments where js-yaml allows.
 * Everything is in git — `git diff` is the review surface, and `git checkout` is
 * the undo.
 *
 * Usage:
 *   node scripts/migrate/normalize-program-schema.cjs            # report only
 *   node scripts/migrate/normalize-program-schema.cjs --apply    # write
 */
'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '..', '..', 'src', 'data');
const APPLY = process.argv.includes('--apply');

/** Files in src/data that are configuration, not program arrays. */
const NON_PROGRAM_FILES = new Set([
  'airports.yml',
  'bay-area-jurisdictions.yml',
  'chat-messages.yml',
  'cities.yml',
  'city-profiles.yml',
  'county-supervisors.yml',
  'custom-themes.yml',
  'groups.yml',
  'helplines.yml',
  'homepage-pills.yml',
  'quick-answers.yml',
  'search-config.yml',
  'site-config.yml',
  'suppressed.yml',
  'transit-agencies.yml',
  'zipcodes.yml',
]);

/** county slug -> the canonical `area` string used everywhere else. */
const COUNTY_AREA = {
  alameda: 'Alameda County',
  'contra-costa': 'Contra Costa County',
  marin: 'Marin County',
  napa: 'Napa County',
  'san-francisco': 'San Francisco',
  'san-mateo': 'San Mateo County',
  'santa-clara': 'Santa Clara County',
  solano: 'Solano County',
  sonoma: 'Sonoma County',
};

/** A record's `category:` is redundant when it only restates the filename. */
function restatesFilename(category, slug) {
  const norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return norm(category) === norm(slug);
}

/** Multi-county free text that no area filter can match. */
function isFreeTextArea(area) {
  return typeof area === 'string' && /[,&]/.test(area);
}

const stats = { subcategory: 0, categoryDropped: 0, lifeEvents: 0, area: 0, files: 0 };
const changes = [];

/**
 * Decide what to change, then apply it with LINE EDITS rather than a YAML
 * round-trip.
 *
 * js-yaml's dump() reflows `counties: [alameda]` into block style, reorders
 * keys and drops comments — a 675-line file comes back as 711 different-looking
 * lines. Across 19 files that is an unreviewable diff, and review is the only
 * safety net this migration has. So the parse is used purely to DECIDE, keyed by
 * record id, and the write only touches the specific lines involved.
 */
function planFor(docs, slug) {
  const plan = new Map(); // id -> { subcategory?, dropCategory?, renameLifeEvents?, area? }
  for (const rec of docs) {
    if (!rec || typeof rec !== 'object' || !rec.id) continue;
    const actions = {};

    if (rec.category != null) {
      if (restatesFilename(rec.category, slug)) actions.dropCategory = true;
      else if (rec.subcategory == null) actions.subcategory = true;
    }
    if (rec.lifeEvents != null && rec.life_events == null) actions.renameLifeEvents = true;

    if (isFreeTextArea(rec.area) && Array.isArray(rec.counties) && rec.counties.length) {
      const canonical = COUNTY_AREA[rec.counties[0]];
      if (canonical && rec.area_label == null) {
        actions.area = { label: rec.area, value: rec.counties.length > 1 ? 'Bay Area' : canonical };
      }
    }
    if (Object.keys(actions).length) plan.set(String(rec.id), actions);
  }
  return plan;
}

/** Apply a plan to the raw file text, one line at a time. */
function applyPlan(text, plan, file) {
  const lines = text.split('\n');
  const out = [];
  let current = null;

  for (const line of lines) {
    const idMatch = line.match(/^\s*-?\s*id:\s*["']?([^"'\s#]+)/);
    if (idMatch) current = idMatch[1];

    const actions = current ? plan.get(current) : null;
    if (!actions) {
      out.push(line);
      continue;
    }

    // category: -> subcategory:, or drop the line entirely
    const catMatch = line.match(/^(\s*)category:(\s*)(.*)$/);
    if (catMatch && (actions.subcategory || actions.dropCategory)) {
      if (actions.dropCategory) {
        stats.categoryDropped += 1;
        delete actions.dropCategory;
        continue; // omit the line
      }
      out.push(`${catMatch[1]}subcategory:${catMatch[2]}${catMatch[3]}`);
      stats.subcategory += 1;
      changes.push(`  ${file} · ${current}: category ${catMatch[3].trim()} -> subcategory`);
      delete actions.subcategory;
      continue;
    }

    // lifeEvents: -> life_events:
    const leMatch = line.match(/^(\s*)lifeEvents:(\s*)(.*)$/);
    if (leMatch && actions.renameLifeEvents) {
      out.push(`${leMatch[1]}life_events:${leMatch[2]}${leMatch[3]}`);
      stats.lifeEvents += 1;
      changes.push(`  ${file} · ${current}: lifeEvents -> life_events (was dropped from the API)`);
      delete actions.renameLifeEvents;
      continue;
    }

    // area: free text -> canonical value, original preserved as area_label
    const areaMatch = line.match(/^(\s*)area:(\s*)(.*)$/);
    if (areaMatch && actions.area) {
      const { label, value } = actions.area;
      out.push(`${areaMatch[1]}area: ${JSON.stringify(value)}`);
      out.push(`${areaMatch[1]}area_label: ${JSON.stringify(label)}`);
      stats.area += 1;
      changes.push(
        `  ${file} · ${current}: area ${JSON.stringify(label)} -> ${JSON.stringify(value)} (label kept)`
      );
      delete actions.area;
      continue;
    }

    out.push(line);
  }
  return out.join('\n');
}

for (const file of fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.yml') && !NON_PROGRAM_FILES.has(f))) {
  const full = path.join(DATA_DIR, file);
  const slug = file.replace(/\.yml$/, '');
  const raw = fs.readFileSync(full, 'utf8');

  let docs;
  try {
    docs = yaml.load(raw);
  } catch (err) {
    console.error(`  ${file}: unreadable (${err.message}) — skipped`);
    continue;
  }
  if (!Array.isArray(docs)) continue;

  const plan = planFor(docs, slug);
  if (plan.size === 0) continue;

  const updated = applyPlan(raw, plan, file);
  if (updated === raw) continue;

  // The result must still parse, and must still hold the same records.
  let reparsed;
  try {
    reparsed = yaml.load(updated);
  } catch (err) {
    console.error(`  ${file}: migration produced invalid YAML (${err.message}) — NOT written`);
    process.exitCode = 1;
    continue;
  }
  if (!Array.isArray(reparsed) || reparsed.length !== docs.length) {
    console.error(
      `  ${file}: record count changed ${docs.length} -> ${reparsed && reparsed.length} — NOT written`
    );
    process.exitCode = 1;
    continue;
  }

  stats.files += 1;
  if (APPLY) fs.writeFileSync(full, updated);
}

console.log(changes.slice(0, 20).join('\n'));
if (changes.length > 20) console.log(`  … and ${changes.length - 20} more`);

console.log(`\n${APPLY ? 'Applied' : 'Would apply'}:`);
console.log(
  `  category -> subcategory      ${stats.subcategory}  (curation that never reached the API)`
);
console.log(
  `  redundant category dropped   ${stats.categoryDropped}  (only restated the filename)`
);
console.log(`  lifeEvents -> life_events    ${stats.lifeEvents}  (silently dropped from the API)`);
console.log(`  free-text area normalized    ${stats.area}  (was unmatchable by any area filter)`);
console.log(`  files touched                ${stats.files}`);

if (!APPLY) {
  console.log('\nDry run — nothing written. Re-run with --apply, then review `git diff`.');
}
