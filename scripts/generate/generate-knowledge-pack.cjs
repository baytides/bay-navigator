#!/usr/bin/env node
/**
 * Build the on-device Knowledge Pack.
 *
 * Produces public/api/knowledge-pack/:
 *   - corpus.sqlite        FTS5-indexed CORE corpus (resources + CA codes + museums)
 *   - ordinances/<slug>.sqlite  one optional pack per jurisdiction
 *   - prompts.json         Carl's tuned prompts (DRY from assistant-system-prompt.ts)
 *   - retrieval-config.json search keys/weights
 *   - manifest.json        version + per-file sha256 + compatibility floors
 *                          + the ordinance catalog the download picker renders
 *
 * Municipal ordinances are split OUT of the core corpus so people can choose how
 * much law they put on their phone — their city, their county, or the whole Bay
 * Area. Core (programs, state law, museums) always ships: those are the answers
 * someone needs when they do not know which jurisdiction they are standing in.
 *
 * Municipal ordinance bodies are fetched from the public Azure Blob container at
 * build time (anonymous HTTPS, no auth). Use --no-municipal to skip that fetch.
 *
 * Run: node scripts/generate/generate-knowledge-pack.cjs
 * Or:  npm run generate:pack
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const kp = require('./lib/knowledge-pack.cjs');

const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'public', 'api', 'knowledge-pack');
const MUNICIPAL_BLOB = 'https://baytidesstorage.blob.core.windows.net/municipal-codes';

// Mirrors generate-search-index.cjs SEARCH_KEYS (kept in sync intentionally).
const SEARCH_KEYS = [
  { name: 'name', weight: 0.4 },
  { name: 'keywords', weight: 0.3 },
  { name: 'description', weight: 0.2 },
  { name: 'category', weight: 0.05 },
  { name: 'area', weight: 0.05 },
];

/**
 * slug -> {name, county, type} for every Bay Area jurisdiction, from the
 * canonical registry. Drives the county rollups in the download picker, and is
 * the reason a county tier can honestly say "3 of 15 cities available".
 */
function loadJurisdictionRegistry() {
  const p = path.join(ROOT, 'src', 'data', 'bay-area-jurisdictions.yml');
  const doc = yaml.load(fs.readFileSync(p, 'utf-8'));
  const registry = {};
  for (const j of (doc && doc.jurisdictions) || []) {
    if (!j || !j.name) continue;
    registry[kp.slugifyJurisdiction(j.name)] = {
      name: j.name,
      county: j.county || '',
      type: j.type || 'city',
    };
  }
  return registry;
}

function readJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// Read a local deep-scrape output dir (per-city JSON + _index.json) into the same
// shape fetchMunicipalCorpus returns — for verifying fresh scrapes before upload.
function loadMunicipalFromDir(dir) {
  const indexPath = path.join(dir, '_index.json');
  const index = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
    : { cities: {} };
  const cities = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json') || f === '_index.json') continue;
    const city = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    const slug = city.slug || f.replace(/\.json$/, '');
    city.slug = slug;
    city.city = (index.cities[slug] && index.cities[slug].city) || city.city || slug;
    cities.push(city);
  }
  return cities;
}

async function main() {
  const skipMunicipal = process.argv.includes('--no-municipal');
  const municipalDirArg = process.argv.find((a) => a.startsWith('--municipal-dir='));
  const municipalDir = municipalDirArg ? municipalDirArg.split('=')[1] : null;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Resources: prefer the rich programs.json (eligibility/how-to detail);
  //    add any search-index documents that aren't programs so nothing is lost.
  const programs = kp.loadPrograms(readJson('public/api/programs.json'));
  const programIds = new Set(programs.map((p) => p.id));
  const searchIndex = readJson('public/api/search-index.json');
  const extras = kp
    .normalizeResources((searchIndex && searchIndex.documents) || [])
    .filter((r) => !programIds.has(r.id));
  const resources = [...programs, ...extras];
  console.log(
    `  resources:        ${resources.length} (${programs.length} rich programs + ${extras.length} extras)`
  );

  // 2. California codes (full text, in-repo)
  const caCodes = kp.loadCaliforniaCodes(readJson('public/data/california-codes-content.json'));
  console.log(`  california codes: ${caCodes.length}`);

  // 3. Municipal codes (full text, fetched from public Azure Blob at build time)
  let muniCodes = [];
  if (!skipMunicipal) {
    try {
      const cities = municipalDir
        ? loadMunicipalFromDir(municipalDir)
        : await kp.fetchMunicipalCorpus(MUNICIPAL_BLOB, { log: (m) => console.log(`    ${m}`) });
      if (municipalDir) console.log(`    (local source: ${municipalDir}, ${cities.length} cities)`);
      muniCodes = kp.loadMunicipalCodes(cities);
    } catch (err) {
      console.warn(`  municipal fetch failed (non-fatal): ${err.message}`);
    }
  }
  console.log(`  municipal codes:  ${muniCodes.length}`);

  // 4. Museum & cultural free-admission knowledge (programs + venues, in-repo)
  const museums = kp.loadMuseumAdmission(readJson('public/api/museum-admission.json'));
  console.log(`  museum admission: ${museums.length}`);

  const records = [...resources, ...caCodes, ...muniCodes, ...museums];
  console.log(`  total records:    ${records.length}`);

  // 5. Split: core corpus (always ships) + one ordinance pack per jurisdiction
  const { core, ordinances } = kp.partitionOrdinanceRecords(records);
  const dbPath = path.join(OUT_DIR, 'corpus.sqlite');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
  const db = kp.buildDatabase(core, { path: dbPath });
  const indexed = db.prepare('SELECT COUNT(*) c FROM resources').get().c;
  db.close();
  if (indexed < core.length) {
    console.log(`  indexed:          ${indexed} (dropped ${core.length - indexed} duplicate ids)`);
  }

  const ordDir = path.join(OUT_DIR, 'ordinances');
  if (fs.existsSync(ordDir)) fs.rmSync(ordDir, { recursive: true });
  const packs = kp.buildOrdinancePacks(ordinances, { outDir: ordDir });
  const registry = loadJurisdictionRegistry();
  const catalog = kp.buildOrdinanceCatalog(packs, registry);
  const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
  console.log(`  core corpus:      ${core.length} records, ${mb(fs.statSync(dbPath).size)}`);
  console.log(
    `  ordinance packs:  ${packs.length} jurisdictions, ${mb(catalog.all.bytes)} if you take them all`
  );
  for (const [key, c] of Object.entries(catalog.counties)) {
    if (!c.available) continue;
    console.log(
      `    ${key.padEnd(14)} ${String(c.available).padStart(2)}/${c.total} · ${mb(c.bytes)}`
    );
  }

  // Unknown slugs mean the scraper produced a jurisdiction the registry does not
  // know — it would silently vanish from every county tier, so say so loudly.
  const unknown = packs.map((p) => p.slug).filter((s) => !registry[s]);
  if (unknown.length) {
    console.warn(`  ⚠️  not in bay-area-jurisdictions.yml: ${unknown.join(', ')}`);
  }

  // 6. Prompts (DRY) + retrieval config
  const tsSource = fs.readFileSync(
    path.join(ROOT, 'src', 'data', 'assistant-system-prompt.ts'),
    'utf-8'
  );
  const prompts = kp.extractPrompts(tsSource);
  const retrievalConfig = kp.buildRetrievalConfig(SEARCH_KEYS);
  fs.writeFileSync(path.join(OUT_DIR, 'prompts.json'), JSON.stringify(prompts, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, 'retrieval-config.json'),
    JSON.stringify(retrievalConfig, null, 2)
  );

  // 7. Manifest (version = UTC date as YYYYMMDD integer)
  const now = new Date();
  const version = Number(
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`
  );
  const files = {
    'corpus.sqlite': fs.readFileSync(dbPath),
    'prompts.json': fs.readFileSync(path.join(OUT_DIR, 'prompts.json')),
    'retrieval-config.json': fs.readFileSync(path.join(OUT_DIR, 'retrieval-config.json')),
  };
  // Compatibility floor for the ordinance split.
  //
  // A build that predates the split expects corpus.sqlite to contain municipal
  // codes. It would happily adopt this newer pack, find the ordinances gone, and
  // keep answering local-law questions — just without any local law in it. That
  // failure is invisible: no error, no empty state, only Carl quietly not
  // knowing your city's rules any more.
  //
  // So only builds that know how to download ordinance packs may take this pack.
  // Raise the app's version to at least this when shipping pack-aware clients.
  const PACK_SPLIT_MIN_APP_VERSION = '0.2.0';

  const manifest = kp.buildManifest({
    version,
    files,
    minAppVersion: PACK_SPLIT_MIN_APP_VERSION,
    minModelVersion: '0',
  });
  // The picker reads this: per-jurisdiction packs plus county / whole-Bay-Area
  // rollups with real byte totals, so the UI never has to do the arithmetic.
  manifest.ordinances = catalog;
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 8. Self-validate the built pack against its manifest.
  const validation = kp.validatePack(OUT_DIR, { requireOrdinances: true });
  if (!validation.ok) {
    console.error('❌ pack validation failed:', validation.errors);
    process.exit(1);
  }

  console.log(
    `\n✅ Knowledge pack v${version} written + validated in ${path.relative(ROOT, OUT_DIR)}/`
  );
}

main().catch((err) => {
  console.error('knowledge pack build failed:', err);
  process.exit(1);
});
