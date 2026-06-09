/**
 * Knowledge Pack builder — the shared on-device retrieval foundation.
 *
 * Produces a SQLite/FTS5 corpus + manifest that the apps bundle and query
 * locally, so the AI assistant can do retrieval without the network. The
 * `searchCorpus()` signature here is the RETRIEVAL CONTRACT that the Swift and
 * Dart local-retrieval layers mirror.
 *
 * Pure functions only (no CLI side effects) so they are unit-testable. The CLI
 * wrapper lives in scripts/generate/generate-knowledge-pack.cjs.
 *
 * Retrieval design (matches the existing remote Typesense/Fuse contract):
 *   - search fields, in priority order: name > keywords > description
 *   - category filtering
 *   - lexical FTS5 only (no typo tolerance); the on-device intent-parse LLM
 *     step corrects spelling and expands keywords before search runs.
 */

'use strict';

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA = [
  `CREATE TABLE resources (
     id TEXT PRIMARY KEY, type TEXT, title TEXT, body TEXT, category TEXT,
     area TEXT, city TEXT, keywords TEXT, url TEXT, lat REAL, lon REAL, meta TEXT
   )`,
  // Plain (non-external-content) FTS5 index. At ~6 MB the duplication is
  // negligible and it keeps the build simple. Column order documents the
  // ranking priority used by bm25() in searchCorpus: title > keywords > body.
  `CREATE VIRTUAL TABLE resources_fts USING fts5(id UNINDEXED, title, keywords, body, category)`,
];

function applySchema(db) {
  for (const ddl of SCHEMA) db.prepare(ddl).run();
}

/** Coerce a text field to a SQLite-bindable string (arrays -> comma-joined). */
function toText(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.filter((x) => x != null).join(', ');
  return String(v);
}

/** The common record shape every loader normalizes into. */
function makeRecord(fields) {
  return {
    id: String(fields.id),
    type: fields.type,
    title: toText(fields.title),
    body: toText(fields.body),
    category: toText(fields.category),
    area: toText(fields.area),
    city: toText(fields.city),
    keywords: toText(fields.keywords),
    url: toText(fields.url),
    lat: typeof fields.lat === 'number' ? fields.lat : null,
    lon: typeof fields.lon === 'number' ? fields.lon : null,
    meta: fields.meta || {},
  };
}

/**
 * Normalize search-index resource documents
 * ({id,name,description,keywords,category,area,city,groups}) into common records.
 * The searchable `body` folds in keywords so a single FTS column covers both.
 */
function normalizeResources(documents) {
  if (!Array.isArray(documents)) return [];
  return documents
    .filter((d) => d && d.id)
    .map((d) =>
      makeRecord({
        id: d.id,
        type: 'resource',
        title: d.name,
        body: [d.description, d.keywords].filter(Boolean).join(' '),
        category: d.category,
        area: d.area,
        city: d.city,
        keywords: d.keywords,
      })
    );
}

/**
 * Build the SQLite corpus from normalized records.
 * @param {Array} records  normalized records (see makeRecord)
 * @param {{path?: string}} opts  path defaults to ':memory:' (in-memory)
 * @returns {DatabaseSync}
 */
function buildDatabase(records, { path = ':memory:' } = {}) {
  const db = new DatabaseSync(path);
  applySchema(db);
  const ins = db.prepare(
    `INSERT INTO resources
       (id, type, title, body, category, area, city, keywords, url, lat, lon, meta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insF = db.prepare(
    `INSERT INTO resources_fts (id, title, keywords, body, category)
     VALUES (?, ?, ?, ?, ?)`
  );
  const seen = new Set();
  for (const r of records || []) {
    if (seen.has(r.id)) continue; // first occurrence wins
    seen.add(r.id);
    ins.run(r.id, r.type, r.title, r.body, r.category, r.area, r.city, r.keywords, r.url, r.lat, r.lon, JSON.stringify(r.meta || {}));
    insF.run(r.id, r.title, r.keywords, r.body, r.category);
  }
  return db;
}

// bm25 column weights, in the table's column order:
//   id (unindexed) · title · keywords · body · category
// Higher weight => stronger contribution, so title matches outrank body matches.
// This mirrors the existing remote contract: query_by name,keywords,description.
const BM25_WEIGHTS = [0.0, 10.0, 5.0, 1.0, 1.0];

/** Turn free text into a safe FTS5 MATCH expression (lexical, OR + prefix). */
function toMatchExpression(query) {
  const tokens = String(query || '').toLowerCase().match(/[a-z0-9]+/g);
  if (!tokens || tokens.length === 0) return null;
  return tokens.map((t) => `${t}*`).join(' OR ');
}

function rowToResult(row) {
  let meta = {};
  try {
    meta = row.meta ? JSON.parse(row.meta) : {};
  } catch {
    meta = {};
  }
  return { ...row, meta };
}

/**
 * RETRIEVAL CONTRACT — mirror this signature/behavior in the Swift & Dart
 * local-retrieval layers.
 *
 * @param {DatabaseSync} db
 * @param {string} query  free text (typos handled upstream by the LLM step)
 * @param {{category?: string, area?: string, limit?: number}} opts
 * @returns {Array<object>} ranked result rows (best first), `meta` parsed
 */
function searchCorpus(db, query, opts = {}) {
  const match = toMatchExpression(query);
  if (!match) return [];
  const { category = null, area = null, limit = 10 } = opts;

  const clauses = ['resources_fts MATCH ?'];
  const params = [match];
  if (category) {
    clauses.push('r.category = ?');
    params.push(category);
  }
  if (area) {
    clauses.push('r.area = ?');
    params.push(area);
  }
  params.push(limit);

  const sql = `
    SELECT r.id, r.type, r.title, r.body, r.category, r.area, r.city,
           r.keywords, r.url, r.lat, r.lon, r.meta
    FROM resources_fts
    JOIN resources r ON r.id = resources_fts.id
    WHERE ${clauses.join(' AND ')}
    ORDER BY bm25(resources_fts, ${BM25_WEIGHTS.join(', ')})
    LIMIT ?`;

  return db.prepare(sql).all(...params).map(rowToResult);
}

/**
 * Normalize the rich programs.json records (a superset of the search-index
 * documents) into resource records. Folds the eligibility/how-to fields into the
 * searchable body so "how do I apply / am I eligible" queries hit; keeps contact
 * details in meta for the app to surface.
 */
function loadPrograms(json) {
  const programs = json && Array.isArray(json.programs) ? json.programs : [];
  return programs
    .filter((p) => p && p.id)
    .map((p) =>
      makeRecord({
        id: p.id,
        type: 'resource',
        title: p.name,
        body: [
          p.description,
          p.fullDescription,
          p.whatTheyOffer,
          p.howToGetIt,
          p.howToApply,
          p.requirements,
          p.impact,
          p.keywords,
        ]
          .filter(Boolean)
          .join(' '),
        category: p.category,
        area: p.areas || p.counties || '',
        city: p.city,
        keywords: p.keywords,
        url: p.website || p.sourceUrl || '',
        meta: {
          phone: p.phone,
          email: p.email,
          agency: p.agency,
          address: p.address,
          howToApply: p.howToApply,
          cost: p.cost,
        },
      })
    );
}

/**
 * Normalize California codes content ({sections:[{code,section,title,text,keywords,url}]})
 * into ca_code records.
 */
function loadCaliforniaCodes(json) {
  const sections = json && Array.isArray(json.sections) ? json.sections : [];
  return sections
    .filter((s) => s && (s.text || s.title))
    .map((s) =>
      makeRecord({
        id: `ca:${s.code || 'NA'}-${s.section || s.url || s.title}`,
        type: 'ca_code',
        title: s.title || `${s.code} ${s.section}`,
        body: s.text || '',
        category: 'California Code',
        keywords: s.keywords || '',
        url: s.url || '',
        meta: { code: s.code, section: s.section },
      })
    );
}

/**
 * Flatten fetched per-city municipal objects
 * ({slug, city, topics:{<topic>:{sections:[{title,text,url,keywords,sectionId}]}}})
 * into muni_code records carrying the city name.
 */
function loadMunicipalCodes(cityObjects) {
  if (!Array.isArray(cityObjects)) return [];
  const records = [];
  for (const c of cityObjects) {
    if (!c || !c.topics) continue;
    for (const [topic, group] of Object.entries(c.topics)) {
      for (const s of (group && group.sections) || []) {
        if (!s || (!s.text && !s.title)) continue;
        records.push(
          makeRecord({
            id: `muni:${c.slug}:${topic}:${s.sectionId || s.url || s.title}`,
            type: 'muni_code',
            title: s.title || '',
            body: s.text || '',
            category: 'Municipal Code',
            city: c.city || c.slug || '',
            keywords: s.keywords || '',
            url: s.url || '',
            meta: { topic, slug: c.slug, sectionId: s.sectionId },
          })
        );
      }
    }
  }
  return records;
}

/**
 * Fetch municipal ordinance bodies from the public Azure Blob container at
 * build time (anonymous HTTPS — no auth). Reads `_index.json`, then each
 * per-city `<slug>.json`, merging the city name from the index. A city whose
 * file is unavailable is skipped (logged), not fatal.
 *
 * @param {string} baseUrl  e.g. https://baytidesstorage.blob.core.windows.net/municipal-codes
 * @param {{fetchImpl?: Function, log?: Function}} opts  fetchImpl injectable for tests
 * @returns {Promise<Array>} per-city objects ({slug, city, topics})
 */
async function fetchMunicipalCorpus(baseUrl, { fetchImpl = fetch, log = () => {} } = {}) {
  const idxRes = await fetchImpl(`${baseUrl}/_index.json`);
  if (!idxRes || !idxRes.ok) {
    log(`municipal index unavailable (${idxRes && idxRes.status}) — skipping muni codes`);
    return [];
  }
  const index = await idxRes.json();
  const slugs = Object.keys((index && index.cities) || {});
  const cities = [];
  for (const slug of slugs) {
    try {
      const res = await fetchImpl(`${baseUrl}/${slug}.json`);
      if (!res || !res.ok) {
        log(`municipal city ${slug} unavailable (${res && res.status}) — skipping`);
        continue;
      }
      const city = await res.json();
      city.slug = slug;
      city.city = (index.cities[slug] && index.cities[slug].city) || city.city || slug;
      cities.push(city);
    } catch (err) {
      log(`municipal city ${slug} failed: ${err.message} — skipping`);
    }
  }
  return cities;
}

/**
 * Build the Knowledge Pack manifest: version, per-file sha256 + size, and the
 * compatibility floors the apps gate on before swapping in a downloaded pack.
 *
 * @param {{version:number, files:Object<string,Buffer>, minAppVersion?:string,
 *          minModelVersion?:string}} opts
 */
const PROMPT_CONSTANTS = {
  systemPrompt: 'SYSTEM_PROMPT',
  intentParse: 'INTENT_PARSER_PROMPT',
  responseFormat: 'RESPONSE_FORMATTER_PROMPT',
};

/**
 * Extract Carl's tuned prompts from the canonical TypeScript source
 * (src/data/assistant-system-prompt.ts) so the pack stays DRY with the existing
 * remote pipeline rather than forking the prompt text.
 *
 * Note: prompts may still contain `${...}` date interpolation tokens; resolving
 * those is the generation layer's job (the on-device side knows today's date).
 */
function extractPrompts(tsSource) {
  const out = {};
  for (const [key, constName] of Object.entries(PROMPT_CONSTANTS)) {
    const pattern = new RegExp('export const ' + constName + ' = `([\\s\\S]*?)`;');
    const m = String(tsSource).match(pattern);
    if (!m) throw new Error(`prompt constant ${constName} not found in source`);
    out[key] = m[1];
  }
  return out;
}

/** Build the retrieval config from the existing Fuse SEARCH_KEYS weights. */
function buildRetrievalConfig(searchKeys = []) {
  const weights = {};
  for (const k of searchKeys) weights[k.name] = k.weight;
  return {
    searchKeys: searchKeys.map((k) => k.name),
    weights,
    synonyms: {},
  };
}

function buildManifest({ version, files = {}, minAppVersion = '0.0.0', minModelVersion = '0' }) {
  const fileEntries = {};
  for (const [name, buf] of Object.entries(files)) {
    const data = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    fileEntries[name] = {
      sha256: crypto.createHash('sha256').update(data).digest('hex'),
      bytes: data.length,
    };
  }
  return {
    version,
    generated: new Date().toISOString(),
    minAppVersion,
    minModelVersion,
    files: fileEntries,
  };
}

/**
 * Validate a built Knowledge Pack directory against its manifest: manifest
 * present + parseable, every listed file exists and its sha256 matches.
 * @returns {{ok: boolean, errors: string[]}}
 */
function validatePack(dir) {
  const errors = [];
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { ok: false, errors: ['manifest.json is missing'] };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    return { ok: false, errors: [`manifest.json is not valid JSON: ${err.message}`] };
  }
  for (const [name, entry] of Object.entries(manifest.files || {})) {
    const filePath = path.join(dir, name);
    if (!fs.existsSync(filePath)) {
      errors.push(`${name} is missing`);
      continue;
    }
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (sha256 !== entry.sha256) {
      errors.push(`${name} hash mismatch (expected ${entry.sha256}, got ${sha256})`);
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = {
  normalizeResources,
  loadPrograms,
  validatePack,
  loadCaliforniaCodes,
  loadMunicipalCodes,
  fetchMunicipalCorpus,
  extractPrompts,
  buildRetrievalConfig,
  buildDatabase,
  searchCorpus,
  buildManifest,
};
