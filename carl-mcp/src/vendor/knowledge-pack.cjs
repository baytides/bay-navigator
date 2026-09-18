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
    ins.run(
      r.id,
      r.type,
      r.title,
      r.body,
      r.category,
      r.area,
      r.city,
      r.keywords,
      r.url,
      r.lat,
      r.lon,
      JSON.stringify(r.meta || {})
    );
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
  const tokens = String(query || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g);
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
 * @param {{category?: string, area?: string, city?: string, limit?: number}} opts
 * @returns {Array<object>} ranked result rows (best first), `meta` parsed
 */
function searchCorpus(db, query, opts = {}) {
  const match = toMatchExpression(query);
  if (!match) return [];
  const { category = null, area = null, city = null, limit = 10 } = opts;

  const clauses = ['resources_fts MATCH ?'];
  const params = [match];
  if (category) {
    clauses.push('r.category = ?');
    params.push(category);
  }
  // Jurisdiction scoping (parity with Swift LocalRetrievalService): municipal
  // codes are city-specific; resources and state codes stay city-agnostic.
  if (city) {
    clauses.push("(r.type != 'muni_code' OR LOWER(r.city) = LOWER(?))");
    params.push(city);
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

  return db
    .prepare(sql)
    .all(...params)
    .map(rowToResult);
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
            // `truncated` travels with the record so the assistant can say the
            // ordinance is partial rather than quoting it as the whole rule. The
            // cut-off end of an ordinance is where exceptions and penalties live.
            meta: { topic, slug: c.slug, sectionId: s.sectionId, truncated: !!s.truncated },
          })
        );
      }
    }
  }
  return records;
}

/**
 * Canonical county label, matching what every program record uses.
 *
 * WHY: museum venues carried a bare county ("San Mateo") while all 800+ program
 * records carry the suffixed form ("San Mateo County"). The `area` facet is an
 * exact match, so a search filtered to "San Mateo County" returned 81 programs
 * and ZERO venues — Filoli, CuriOdyssey and the San Mateo County History Museum
 * were silently invisible to any county-scoped query, and a host model reading
 * that emptiness reported "nothing in San Mateo County" as a fact.
 *
 * San Francisco is a consolidated city-county and is never suffixed.
 */
function canonicalCountyArea(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^san francisco$/i.test(raw)) return 'San Francisco';
  if (/ county$/i.test(raw)) return raw;
  return `${raw} County`;
}

/**
 * Normalize the museum/cultural free-admission knowledge
 * ({programs:[{id,name,scope,eligibility,benefit,how,dates2026,notes,url}],
 *   venues:[{name,county,city,type,pathways,freeDays,notes}]})
 * into museum_program / museum_venue records. Eligibility and pathway arrays are
 * folded into the body + keywords so the on-device model has the whole rule
 * grounded in text (e.g. Blue Star's active-duty-only caveat travels with it).
 */
function loadMuseumAdmission(json) {
  if (!json || typeof json !== 'object') return [];
  const records = [];

  for (const p of Array.isArray(json.programs) ? json.programs : []) {
    if (!p || !p.name) continue;
    const body = [
      p.scope ? `Who: ${p.scope}.` : '',
      // Which card actually works, and where that is uncertain. Medi-Cal is not
      // EBT, and conflating them sends someone on a wasted trip they may not be
      // well enough to make twice.
      p.eligibilityBasis ? `Eligibility is based on: ${p.eligibilityBasis}` : '',
      p.medicalStatus ? `Medi-Cal: ${p.medicalStatus}` : '',
      p.benefit || '',
      p.how ? `How: ${p.how}` : '',
      p.dates2026 ? `Dates: ${p.dates2026}.` : '',
      p.notes || '',
    ]
      .filter(Boolean)
      .join(' ');
    records.push(
      makeRecord({
        id: `museum-program:${p.id || p.name}`,
        type: 'museum_program',
        title: p.name,
        body,
        category: 'Museum Admission',
        area: 'Bay Area',
        keywords: [p.name, 'free admission', 'discount']
          .concat(Array.isArray(p.eligibility) ? p.eligibility : [])
          .join(', '),
        url: p.url || '',
        meta: { programId: p.id, scope: p.scope },
      })
    );
  }

  for (const v of Array.isArray(json.venues) ? json.venues : []) {
    if (!v || !v.name) continue;
    const body = [
      v.type ? `${v.type}.` : '',
      v.freeDays ? `Free days: ${v.freeDays}` : '',
      Array.isArray(v.pathways) && v.pathways.length ? `Discounts: ${v.pathways.join('; ')}` : '',
      v.notes || '',
    ]
      .filter(Boolean)
      .join(' ');
    records.push(
      makeRecord({
        id: `museum-venue:${v.name}`,
        type: 'museum_venue',
        title: v.name,
        body,
        category: 'Museum Admission',
        area: canonicalCountyArea(v.county),
        city: v.city || v.county || '',
        // Keep BOTH forms searchable so a query using either one still matches.
        keywords: ['free admission', 'discount', v.type || '', v.county || '', canonicalCountyArea(v.county)]
          .concat(Array.isArray(v.keywords) ? v.keywords : [])
          .filter(Boolean)
          .join(', '),
        url: '',
        meta: { county: v.county, venueType: v.type },
      })
    );
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
 *
 * Ordinance packs are validated too, but a MISSING one is not an error by
 * default — on a device only the jurisdictions someone chose are on disk. A
 * present-but-corrupt pack is always an error. Pass requireOrdinances at build
 * time, where every pack really should be there.
 *
 * @param {string} dir
 * @param {{requireOrdinances?: boolean}} opts
 * @returns {{ok: boolean, errors: string[]}}
 */
function validatePack(dir, { requireOrdinances = false } = {}) {
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

  const ordinances = manifest.ordinances;
  for (const [slug, entry] of Object.entries((ordinances && ordinances.jurisdictions) || {})) {
    const filePath = path.join(dir, entry.file);
    if (!fs.existsSync(filePath)) {
      if (requireOrdinances) errors.push(`ordinance pack ${slug} is missing`);
      continue;
    }
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (sha256 !== entry.sha256) {
      errors.push(`ordinance pack ${slug} hash mismatch`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// --- Tiered ordinance packs -------------------------------------------------

/**
 * Nobody should have to download the whole Bay Area's municipal law to find out
 * whether they can park a camper outside their own house. Ordinances therefore
 * ship as one SQLite pack PER JURISDICTION, and the apps let people choose how
 * much goes on device:
 *
 *   my city        → one pack
 *   my county      → the county's own code plus every city pack in it
 *   whole Bay Area → all of them
 *
 * The per-jurisdiction file is the atomic unit for all three tiers, so "county"
 * and "all" are lists rather than separately-built blobs: no duplicated bytes on
 * the CDN, and someone who lives in Berkeley but works in Oakland can add a
 * second city without re-downloading either.
 *
 * Everything that is NOT an ordinance — programs, state law, museums — stays in
 * the core corpus, which always ships. Those are exactly the answers someone
 * needs when they do not know which jurisdiction they are standing in.
 */

/** Slug for a jurisdiction name; matches the deep scraper's slugify(). */
function slugifyJurisdiction(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Split built records into the always-shipped core and per-jurisdiction
 * ordinance groups, keyed by slug.
 *
 * @param {Array} records normalized records (see makeRecord)
 * @returns {{core: Array, ordinances: Map<string, Array>}}
 */
function partitionOrdinanceRecords(records) {
  const core = [];
  const ordinances = new Map();
  for (const r of records || []) {
    if (!r) continue;
    if (r.type !== 'muni_code') {
      core.push(r);
      continue;
    }
    const slug = (r.meta && r.meta.slug) || slugifyJurisdiction(r.city);
    if (!slug) {
      // No jurisdiction to file it under — keep it in core rather than drop it.
      core.push(r);
      continue;
    }
    if (!ordinances.has(slug)) ordinances.set(slug, []);
    ordinances.get(slug).push(r);
  }
  return { core, ordinances };
}

/**
 * Write one standalone SQLite pack per jurisdiction. Each pack carries the same
 * schema as the core corpus, so the retrieval code can ATTACH it and query it
 * with the identical contract.
 *
 * @param {Map<string, Array>} ordinances  slug -> records (from partitionOrdinanceRecords)
 * @param {{outDir: string}} opts
 * @returns {Array<{slug, file, bytes, sha256, sections}>}
 */
function buildOrdinancePacks(ordinances, { outDir }) {
  fs.mkdirSync(outDir, { recursive: true });
  const built = [];
  for (const [slug, records] of ordinances) {
    if (!records.length) continue;
    const file = path.join(outDir, `${slug}.sqlite`);
    if (fs.existsSync(file)) fs.rmSync(file);
    const db = buildDatabase(records, { path: file });
    const sections = db.prepare('SELECT COUNT(*) c FROM resources').get().c;
    db.close();
    const data = fs.readFileSync(file);
    built.push({
      slug,
      file,
      bytes: data.length,
      sha256: crypto.createHash('sha256').update(data).digest('hex'),
      sections,
    });
  }
  return built.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Assemble the catalog the apps render their download picker from: every built
 * jurisdiction pack, plus county and whole-Bay-Area rollups with real byte
 * totals so the UI never has to do arithmetic to show "Alameda County — 6.2 MB".
 *
 * `available` vs `total` is deliberate. Scraper coverage is partial, and a
 * picker that says "Alameda County" without saying 3 of 15 cities are actually
 * in there would overstate what someone is getting.
 *
 * @param {Array} packs     from buildOrdinancePacks
 * @param {Object} registry slug -> {name, county, type} for ALL known jurisdictions
 * @param {{dir?: string}} opts
 */
function buildOrdinanceCatalog(packs, registry = {}, { dir = 'ordinances' } = {}) {
  const jurisdictions = {};
  for (const p of packs) {
    const meta = registry[p.slug] || {};
    jurisdictions[p.slug] = {
      name: meta.name || p.slug,
      county: meta.county || '',
      type: meta.type || 'city',
      file: `${dir}/${p.slug}.sqlite`,
      sha256: p.sha256,
      bytes: p.bytes,
      sections: p.sections,
    };
  }

  // County rollups. Counted over the registry so `total` reflects what exists in
  // the Bay Area, not just what we managed to scrape.
  const counties = {};
  for (const [slug, meta] of Object.entries(registry)) {
    const countyName = meta.county;
    if (!countyName) continue;
    const key = slugifyJurisdiction(countyName);
    if (!counties[key]) {
      counties[key] = {
        name: `${countyName} County`,
        jurisdictions: [],
        bytes: 0,
        sections: 0,
        available: 0,
        total: 0,
      };
    }
    const c = counties[key];
    c.total += 1;
    if (jurisdictions[slug]) {
      c.jurisdictions.push(slug);
      c.bytes += jurisdictions[slug].bytes;
      c.sections += jurisdictions[slug].sections;
      c.available += 1;
    }
  }
  for (const c of Object.values(counties)) c.jurisdictions.sort();

  // San Francisco is a consolidated city-county; "San Francisco County" would be
  // a tier with exactly one member and a confusing name, so leave it as a city.
  const sfKey = slugifyJurisdiction('San Francisco');
  if (counties[sfKey] && counties[sfKey].total <= 1) delete counties[sfKey];

  const allSlugs = Object.keys(jurisdictions).sort();
  return {
    dir,
    jurisdictions,
    counties,
    all: {
      jurisdictions: allSlugs,
      bytes: allSlugs.reduce((n, s) => n + jurisdictions[s].bytes, 0),
      sections: allSlugs.reduce((n, s) => n + jurisdictions[s].sections, 0),
      available: allSlugs.length,
      total: Object.keys(registry).length || allSlugs.length,
    },
  };
}

/**
 * Open the core corpus with zero or more ordinance packs attached, as one
 * queryable handle. Pass the result to searchPackSet().
 *
 * Each pack's slug is remembered so a city-scoped search can skip every pack
 * that cannot possibly match — which is what keeps "I downloaded the whole Bay
 * Area" from costing 109 queries to answer a question about one city.
 *
 * @param {string} corePath
 * @param {string[]} ordinancePaths  packs the person chose to download
 */
function openPackSet(corePath, ordinancePaths = []) {
  const db = new DatabaseSync(corePath);
  const attached = [];
  ordinancePaths.forEach((file, i) => {
    const alias = `ord_${i}`;
    db.prepare(`ATTACH DATABASE ? AS ${alias}`).run(file);
    attached.push({ alias, slug: path.basename(file).replace(/\.sqlite$/, '') });
  });
  return { db, attached, close: () => db.close() };
}

/**
 * Search the core corpus and every attached ordinance pack as one result list.
 *
 * Ranking caveat, stated plainly: bm25 is computed per-database, so scores from
 * two packs are comparable but not strictly commensurable (each carries its own
 * term statistics). In practice ordinance queries are scoped to one city via
 * `opts.city`, which collapses this to a single pack. Cross-city comparisons
 * ("legal in Oakland but not Berkeley?") get a sensible interleaving rather than
 * a mathematically exact global ranking.
 */
function searchPackSet({ db, attached = [] }, query, opts = {}) {
  const match = toMatchExpression(query);
  if (!match) return [];
  const { category = null, area = null, city = null, limit = 10 } = opts;

  // A city filter means no other jurisdiction's pack can contribute a row, so
  // don't pay to query them.
  const wanted = city ? slugifyJurisdiction(city) : null;
  const schemas = [
    'main',
    ...attached.filter((a) => !wanted || a.slug === wanted).map((a) => a.alias),
  ];

  const COLS = `r.id, r.type, r.title, r.body, r.category, r.area, r.city,
                r.keywords, r.url, r.lat, r.lon, r.meta`;

  const branches = [];
  const params = [];
  for (const s of schemas) {
    const clauses = ['resources_fts MATCH ?'];
    params.push(match);
    if (category) {
      clauses.push('r.category = ?');
      params.push(category);
    }
    if (city) {
      clauses.push("(r.type != 'muni_code' OR LOWER(r.city) = LOWER(?))");
      params.push(city);
    }
    if (area) {
      clauses.push('r.area = ?');
      params.push(area);
    }
    // NOTE: the FTS table is referenced qualified in FROM/JOIN but bare in
    // MATCH and bm25() — FTS5 resolves those against the FROM item's name, and
    // a schema-qualified or aliased form there is a "no such column" error.
    branches.push(`
      SELECT ${COLS}, bm25(resources_fts, ${BM25_WEIGHTS.join(', ')}) AS score
      FROM ${s}.resources_fts
      JOIN ${s}.resources r ON r.id = ${s}.resources_fts.id
      WHERE ${clauses.join(' AND ')}`);
  }
  params.push(limit);

  return db
    .prepare(`${branches.join('\n      UNION ALL\n')}\n      ORDER BY score LIMIT ?`)
    .all(...params)
    .map(rowToResult);
}

module.exports = {
  normalizeResources,
  loadPrograms,
  validatePack,
  loadCaliforniaCodes,
  loadMunicipalCodes,
  loadMuseumAdmission,
  fetchMunicipalCorpus,
  extractPrompts,
  buildRetrievalConfig,
  buildDatabase,
  searchCorpus,
  buildManifest,
  slugifyJurisdiction,
  partitionOrdinanceRecords,
  buildOrdinancePacks,
  buildOrdinanceCatalog,
  openPackSet,
  searchPackSet,
};
