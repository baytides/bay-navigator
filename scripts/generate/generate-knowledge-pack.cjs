#!/usr/bin/env node
/**
 * Build the on-device Knowledge Pack.
 *
 * Produces public/api/knowledge-pack/:
 *   - corpus.sqlite        FTS5-indexed retrieval corpus (resources + CA codes + muni codes)
 *   - prompts.json         Carl's tuned prompts (DRY from assistant-system-prompt.ts)
 *   - retrieval-config.json search keys/weights
 *   - manifest.json        version + per-file sha256 + compatibility floors
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

function readJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function main() {
  const skipMunicipal = process.argv.includes('--no-municipal');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Resources (the search-index documents are the resource directory)
  const searchIndex = readJson('public/api/search-index.json');
  const resources = kp.normalizeResources((searchIndex && searchIndex.documents) || []);
  console.log(`  resources:        ${resources.length}`);

  // 2. California codes (full text, in-repo)
  const caCodes = kp.loadCaliforniaCodes(readJson('public/data/california-codes-content.json'));
  console.log(`  california codes: ${caCodes.length}`);

  // 3. Municipal codes (full text, fetched from public Azure Blob at build time)
  let muniCodes = [];
  if (!skipMunicipal) {
    try {
      const cities = await kp.fetchMunicipalCorpus(MUNICIPAL_BLOB, { log: (m) => console.log(`    ${m}`) });
      muniCodes = kp.loadMunicipalCodes(cities);
    } catch (err) {
      console.warn(`  municipal fetch failed (non-fatal): ${err.message}`);
    }
  }
  console.log(`  municipal codes:  ${muniCodes.length}`);

  const records = [...resources, ...caCodes, ...muniCodes];
  console.log(`  total records:    ${records.length}`);

  // 4. Build the SQLite corpus
  const dbPath = path.join(OUT_DIR, 'corpus.sqlite');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
  const db = kp.buildDatabase(records, { path: dbPath });
  const indexed = db.prepare('SELECT COUNT(*) c FROM resources').get().c;
  db.close();
  if (indexed < records.length) {
    console.log(`  indexed:          ${indexed} (dropped ${records.length - indexed} duplicate ids)`);
  }

  // 5. Prompts (DRY) + retrieval config
  const tsSource = fs.readFileSync(path.join(ROOT, 'src', 'data', 'assistant-system-prompt.ts'), 'utf-8');
  const prompts = kp.extractPrompts(tsSource);
  const retrievalConfig = kp.buildRetrievalConfig(SEARCH_KEYS);
  fs.writeFileSync(path.join(OUT_DIR, 'prompts.json'), JSON.stringify(prompts, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'retrieval-config.json'), JSON.stringify(retrievalConfig, null, 2));

  // 6. Manifest (version = UTC date as YYYYMMDD integer)
  const now = new Date();
  const version = Number(
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`
  );
  const files = {
    'corpus.sqlite': fs.readFileSync(dbPath),
    'prompts.json': fs.readFileSync(path.join(OUT_DIR, 'prompts.json')),
    'retrieval-config.json': fs.readFileSync(path.join(OUT_DIR, 'retrieval-config.json')),
  };
  const manifest = kp.buildManifest({ version, files, minAppVersion: '0.0.0', minModelVersion: '0' });
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 7. Self-validate the built pack against its manifest.
  const validation = kp.validatePack(OUT_DIR);
  if (!validation.ok) {
    console.error('❌ pack validation failed:', validation.errors);
    process.exit(1);
  }

  console.log(`\n✅ Knowledge pack v${version} written + validated in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error('knowledge pack build failed:', err);
  process.exit(1);
});
