/**
 * Carl's retrieval layer — the THIRD TWIN of the Knowledge Pack contract.
 *
 * `scripts/generate/lib/knowledge-pack.cjs` declares `searchCorpus()` as the
 * retrieval contract; `LocalRetrievalService.swift` mirrors it on-device. This
 * module is the third implementation, and it deliberately does NOT reimplement
 * the contract: it imports the vendored builder verbatim so ranking here is
 * byte-identical to the web and Apple assistants. `test/contract.test.mjs`
 * fails if the vendored copy drifts from the repo source.
 *
 * WHY BUILD INSTEAD OF DOWNLOAD: the prebuilt `corpus.sqlite` is a gitignored
 * build artifact that is not published (`/data/knowledge-pack/` 404s). Every
 * JSON it is built FROM is public, so we rebuild it here from those endpoints.
 * Side benefit: Carl is never staler than baynavigator.org itself.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { DATA_BASE, MUNI_BASE, CACHE_TTL_MS, ENDPOINTS, cacheDir, fetchData } from './sources.mjs';

const require = createRequire(import.meta.url);
const kp = require('./vendor/knowledge-pack.cjs');

export const CORPUS_FILE = 'corpus.sqlite';
export const STAMP_FILE = 'corpus.stamp.json';

/**
 * Fetch every public source and normalize it through the shared loaders.
 *
 * Each source is independently fault-tolerant: if the museum feed is down,
 * Carl still answers program questions. A total failure of `programs.json` is
 * fatal, because a Carl with no programs is worse than an honest error.
 */
export async function loadRecords({ log = () => {} } = {}) {
  const [programs, caCodes, museums] = await Promise.all([
    fetchData(ENDPOINTS.programs, { log }),
    fetchData('california-codes-content.json', { fallback: {}, log }),
    fetchData(ENDPOINTS.museumAdmission, { fallback: {}, log }),
  ]);

  const records = [];

  const programRecords = kp.loadPrograms(programs);
  if (programRecords.length === 0) {
    throw new Error('programs.json returned no programs — refusing to build an empty corpus');
  }
  records.push(...programRecords);
  log(`programs: ${programRecords.length}`);

  const caRecords = kp.loadCaliforniaCodes(caCodes);
  records.push(...caRecords);
  log(`california codes: ${caRecords.length}`);

  const museumRecords = kp.loadMuseumAdmission(museums);
  records.push(...museumRecords);
  log(`museum admission: ${museumRecords.length}`);

  // Municipal ordinance bodies live in Azure Blob, not on the site. Non-fatal:
  // Carl degrades to "I don't have that city's code" rather than failing.
  try {
    const cities = await kp.fetchMunicipalCorpus(MUNI_BASE, { log });
    const muniRecords = kp.loadMunicipalCodes(cities);
    records.push(...muniRecords);
    log(`municipal codes: ${muniRecords.length} from ${cities.length} cities`);
  } catch (err) {
    log(`municipal codes unavailable (non-fatal): ${err.message}`);
  }

  return records;
}

function stampPath() {
  return path.join(cacheDir(), STAMP_FILE);
}
function corpusPath() {
  return path.join(cacheDir(), CORPUS_FILE);
}

/** True when a cached corpus exists and is younger than the TTL. */
function cacheIsFresh(ttlMs) {
  try {
    const stamp = JSON.parse(fs.readFileSync(stampPath(), 'utf8'));
    if (stamp.dataBase !== DATA_BASE) return false; // built against a different site
    if (!fs.existsSync(corpusPath())) return false;
    return Date.now() - stamp.builtAt < ttlMs;
  } catch {
    return false;
  }
}

/**
 * Build the corpus and persist it so the next process start is instant.
 * Falls back to an in-memory build if the cache directory is not writable.
 */
async function buildAndCache({ log }) {
  const records = await loadRecords({ log });
  try {
    fs.mkdirSync(cacheDir(), { recursive: true });
    const tmp = `${corpusPath()}.${process.pid}.tmp`;
    fs.rmSync(tmp, { force: true });
    const built = kp.buildDatabase(records, { path: tmp });
    built.close();
    fs.renameSync(tmp, corpusPath()); // atomic swap; concurrent readers stay valid
    fs.writeFileSync(
      stampPath(),
      JSON.stringify({ builtAt: Date.now(), dataBase: DATA_BASE, records: records.length })
    );
    log(`corpus cached at ${corpusPath()} (${records.length} records)`);
    return openCached();
  } catch (err) {
    log(`cache unavailable (${err.message}) — building in memory`);
    return kp.buildDatabase(records);
  }
}

function openCached() {
  const { DatabaseSync } = require('node:sqlite');
  return new DatabaseSync(corpusPath(), { readOnly: true });
}

let corpusPromise = null;

/**
 * Get the shared corpus handle, building it on first use.
 * Concurrent callers share one build (the promise is memoized before await).
 */
export function getCorpus({ log = () => {}, ttlMs = CACHE_TTL_MS, force = false } = {}) {
  if (force) corpusPromise = null;
  if (!corpusPromise) {
    corpusPromise = (async () => {
      if (cacheIsFresh(ttlMs)) {
        try {
          log('using cached corpus');
          return openCached();
        } catch {
          /* fall through to rebuild */
        }
      }
      return buildAndCache({ log });
    })().catch((err) => {
      corpusPromise = null; // let the next call retry rather than cache a failure
      throw err;
    });
  }
  return corpusPromise;
}

/**
 * How many distinct query tokens a hit actually contains.
 *
 * WHY THIS EXISTS: the shared contract matches tokens with OR + prefix
 * (`a* OR b* OR c*`), which is correct for the web and on-device assistants
 * because a typo-correcting LLM step runs BEFORE search there. An MCP host has
 * no such step — it forwards the user's words raw — so the query
 * "zxqw nonexistent thing" matched 8 unrelated noise ordinances on "thing".
 *
 * Re-ranking in SQL would fork the retrieval contract, so instead we leave
 * searchCorpus authoritative for ORDER and apply precision as a post-filter.
 */
export function tokenOverlap(query, row) {
  const tokens = [
    ...new Set(
      String(query || '')
        .toLowerCase()
        .match(/[a-z0-9]+/g) || []
    ),
  ];
  if (tokens.length === 0) return { matched: 0, total: 0 };
  const hay = [row.title, row.keywords, row.body, row.category, row.city, row.area]
    .join(' ')
    .toLowerCase();
  return { matched: tokens.filter((t) => hay.includes(t)).length, total: tokens.length };
}

/**
 * Minimum fraction of query tokens a hit must contain to be returned.
 *
 * TODO(steven): tune this — see the recall-vs-precision question in chat.
 *   Higher => fewer, tighter results. Risk: someone misses help that exists.
 *   Lower  => more results. Risk: the host model confidently cites something
 *             irrelevant as if Bay Navigator vouched for it.
 *   0      => disables the filter, restoring raw contract behaviour.
 */
export const RELEVANCE_RATIO = Number(process.env.CARL_RELEVANCE_RATIO ?? 0.5);

// --- Area resolution -------------------------------------------------------
//
// Two problems this solves, both of which made a reasonable question return
// nothing:
//
// 1. `area` was matched with strict equality, so scoping a search to "Alameda
//    County" excluded every Statewide, Nationwide and Bay Area program. Asking
//    for CalFresh in Alameda County returned everything EXCEPT CalFresh, which
//    is statewide. The website has always kept `county OR all`; this did not.
//
// 2. Only county labels were accepted. A host model told "I need a food bank in
//    Oakland" naturally passes area: "Oakland", which matched no record at all
//    and returned silence rather than Alameda County's food banks.

/** Areas that serve everyone, whatever county is asked for. */
const UNIVERSAL_AREAS = new Set(['bay area', 'statewide', 'nationwide', '']);

let cityAreaCache = null;

/**
 * city -> canonical area label, derived from the corpus itself rather than a
 * bundled table, so it cannot drift from the data it describes. Where a city
 * appears under several areas the most common one wins.
 */
function cityToArea(db) {
  if (cityAreaCache) return cityAreaCache;
  const rows = db
    .prepare(
      `SELECT LOWER(city) AS city, area, COUNT(*) AS n FROM resources
       WHERE city <> '' AND area <> '' GROUP BY LOWER(city), area ORDER BY n DESC`
    )
    .all();
  cityAreaCache = new Map();
  for (const r of rows) if (!cityAreaCache.has(r.city)) cityAreaCache.set(r.city, r.area);
  return cityAreaCache;
}

/**
 * Turn whatever the host model passed — a county, a city, any casing — into a
 * canonical area label. Returns null when it cannot be resolved, so the caller
 * can ignore the filter rather than silently return nothing.
 */
export function resolveArea(input, db) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  let norm = raw.toLowerCase();

  // Abbreviations a person actually types. Without these "SF" resolved to null
  // and the filter was silently dropped.
  const ALIASES = {
    sf: 'san francisco',
    's.f.': 'san francisco',
    'the city': 'san francisco',
    'east bay': 'alameda county',
    'south bay': 'santa clara county',
    'north bay': 'marin county',
    'the peninsula': 'san mateo county',
    silicon_valley: 'santa clara county',
    'silicon valley': 'santa clara county',
  };
  if (ALIASES[norm]) norm = ALIASES[norm];

  const known = db
    .prepare(`SELECT DISTINCT area FROM resources WHERE area <> ''`)
    .all()
    .map((r) => r.area);

  // County form FIRST. Several cities share a name with their county — both
  // "Alameda" and "Alameda County" exist as areas — and for a FILTER the county
  // is the safer reading: it is a superset that still includes the city's own
  // programs, whereas resolving to the city would hide the rest of the county.
  const county = known.find((a) => a.toLowerCase() === `${norm} county`);
  if (county) return county;

  const exact = known.find((a) => a.toLowerCase() === norm);
  if (exact) return exact;

  // "Alameda County" typed when only "Alameda" exists as a label.
  const stripped = known.find((a) => `${a.toLowerCase()} county` === norm);
  if (stripped) return stripped;

  const byCity = cityToArea(db).get(norm);
  if (byCity) return byCity;

  return null;
}

/** Does this record serve the requested area? */
function servesArea(row, resolved) {
  const area = String(row.area || '').toLowerCase();
  return area === resolved.toLowerCase() || UNIVERSAL_AREAS.has(area);
}

/**
 * Ranked search over the corpus. Ranking comes from the shared contract; the
 * precision floor above is applied afterwards.
 *
 * @param {string} query free text
 * @param {{category?:string, area?:string, city?:string, limit?:number,
 *          type?:string, ratio?:number}} opts
 */
export async function search(query, opts = {}) {
  const db = await getCorpus();
  const { type, limit = 10, ratio = RELEVANCE_RATIO, area, ...rest } = opts;

  // Area is resolved and post-filtered here rather than handed to the shared
  // contract, which matches it with strict equality and would drop every
  // statewide program from a county-scoped search.
  const resolvedArea = area ? resolveArea(area, db) : null;

  // Over-fetch so post-filtering still has enough to fill a page.
  const overFetch = type || ratio > 0 || resolvedArea ? Math.max(limit * 5, 40) : limit;
  let hits = kp.searchCorpus(db, query, { ...rest, limit: overFetch });
  if (type) hits = hits.filter((h) => h.type === type);

  if (resolvedArea) {
    hits = hits.filter((h) => servesArea(h, resolvedArea));
    // Local beats universal when both match, mirroring the website's boost.
    const exact = hits.filter(
      (h) => String(h.area || '').toLowerCase() === resolvedArea.toLowerCase()
    );
    const universal = hits.filter((h) => !exact.includes(h));
    hits = [...exact, ...universal];
  }

  if (ratio > 0 && hits.length > 0) {
    // Strict floor, deliberately with no "weak but real" fallback: returning
    // nothing routes the host model to guidance.noMatch(), which tells it to
    // stop and offer 2-1-1. Returning a bad match invites it to present an
    // unrelated ordinance as if Bay Navigator vouched for it.
    hits = hits.filter((h) => {
      const { matched, total } = tokenOverlap(query, h);
      return total === 0 || matched >= Math.max(1, Math.ceil(total * ratio));
    });
  }

  return hits.slice(0, limit);
}

/** Look up one record by its corpus id. */
export async function getById(id) {
  const db = await getCorpus();
  const row = db
    .prepare(
      `SELECT id, type, title, body, category, area, city, keywords, url, lat, lon, meta
       FROM resources WHERE id = ?`
    )
    .get(String(id));
  if (!row) return null;
  try {
    row.meta = row.meta ? JSON.parse(row.meta) : {};
  } catch {
    row.meta = {};
  }
  return row;
}

/** Distinct facet values with counts — lets a model pick valid filters. */
export async function facets() {
  const db = await getCorpus();
  const rows = (sql) => db.prepare(sql).all();
  return {
    categories: rows(
      `SELECT category AS value, COUNT(*) AS count FROM resources
       WHERE category <> '' GROUP BY category ORDER BY count DESC`
    ),
    areas: rows(
      `SELECT area AS value, COUNT(*) AS count FROM resources
       WHERE area <> '' GROUP BY area ORDER BY count DESC`
    ),
    types: rows(
      `SELECT type AS value, COUNT(*) AS count FROM resources GROUP BY type ORDER BY count DESC`
    ),
    codeCities: rows(
      `SELECT city AS value, COUNT(*) AS count FROM resources
       WHERE type = 'muni_code' AND city <> '' GROUP BY city ORDER BY value`
    ),
  };
}

export const __testing = { cacheIsFresh, corpusPath, stampPath, kp };
