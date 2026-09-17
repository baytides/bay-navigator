/**
 * Upstream data sources for Carl.
 *
 * Carl's MCP server holds no private state: everything it answers with is
 * published, public Bay Navigator data. This module is the single place that
 * knows *where* that data lives and how long to trust a cached copy.
 *
 * ROUTE GOTCHA: the site's own `metadata.json` still advertises `/api/*`
 * endpoints, but Azure Static Web Apps reserves `/api/*` for the Functions
 * backend, so `scripts/generate/relocate-api-to-data.cjs` moves the built JSON
 * to `/data/*` at build time. `/api/*` returns 500 in production. Always use
 * `/data/*`; do not "fix" this by trusting metadata.json.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Public site data root. Override for staging via CARL_DATA_BASE. */
export const DATA_BASE = (process.env.CARL_DATA_BASE || 'https://baynavigator.org/data').replace(
  /\/+$/,
  ''
);

/**
 * Cloudflare-free origin, tried when DATA_BASE refuses us.
 *
 * WHY: baynavigator.org sits behind Cloudflare, which challenges traffic from
 * datacenter ASNs. A laptop gets 200; the identical request from an Azure
 * Function gets 403. That broke the hosted server while stdio kept working — an
 * asymmetry invisible in local testing, because local testing IS the case that
 * succeeds.
 *
 * The Static Web App's own hostname serves byte-identical files with no
 * Cloudflare in front, so we fall back to it rather than depending on a WAF
 * allowlist someone has to remember to maintain.
 */
export const DATA_FALLBACK = (
  process.env.CARL_DATA_FALLBACK || 'https://blue-pebble-00a40d41e.4.azurestaticapps.net/data'
).replace(/\/+$/, '');

/** Bases tried in order; collapses to one when both point at the same place. */
export const DATA_BASES = [...new Set([DATA_BASE, DATA_FALLBACK].filter(Boolean))];

/** Municipal ordinance full text lives in Azure Blob, not on the site. */
export const MUNI_BASE = (
  process.env.CARL_MUNI_BASE || 'https://baytidesstorage.blob.core.windows.net/municipal-codes'
).replace(/\/+$/, '');

/** How long a cached corpus stays fresh. Site data regenerates daily. */
export const CACHE_TTL_MS = Number(process.env.CARL_CACHE_TTL_MS || 6 * 60 * 60 * 1000);

/** Per-request network timeout. Keeps a hung CDN from hanging the client. */
export const FETCH_TIMEOUT_MS = Number(process.env.CARL_FETCH_TIMEOUT_MS || 20_000);

export const ENDPOINTS = {
  programs: 'programs.json',
  searchIndex: 'search-index.json',
  categories: 'categories.json',
  areas: 'areas.json',
  groups: 'groups.json',
  californiaCodes: 'california-codes.json',
  municipalCodes: 'municipal-codes.json',
  museumAdmission: 'museum-admission.json',
  metadata: 'metadata.json',
  emergency: 'emergency.json',
};

/** Where we keep the built corpus between runs. */
export function cacheDir() {
  if (process.env.CARL_CACHE_DIR) return process.env.CARL_CACHE_DIR;
  return path.join(os.tmpdir(), 'carl-mcp-cache');
}

/** Fetch JSON with a timeout. Returns `fallback` on any failure. */
export async function fetchJSON(url, { fallback = null, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'carl-mcp' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (fallback !== null) return fallback;
    throw new Error(`Could not load ${url}: ${err.message}`, { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

/** Absolute URL for a known site endpoint. */
export function dataUrl(key) {
  const file = ENDPOINTS[key];
  if (!file) throw new Error(`Unknown endpoint: ${key}`);
  return `${DATA_BASE}/${file}`;
}

/**
 * Fetch a data file, walking the base list until one answers.
 *
 * Returns `fallback` only when EVERY base fails, so a Cloudflare 403 on the
 * primary degrades to the origin instead of taking Carl down.
 */
export async function fetchData(file, { fallback = null, log = () => {} } = {}) {
  const errors = [];
  for (const base of DATA_BASES) {
    try {
      return await fetchJSON(`${base}/${file}`);
    } catch (err) {
      errors.push(`${base}: ${err.message}`);
      log(`${file} unavailable via ${base} (${err.message})`);
    }
  }
  if (fallback !== null) return fallback;
  throw new Error(`Could not load ${file} from any source — ${errors.join('; ')}`);
}

/** Read a cached JSON blob if it exists and is younger than the TTL. */
export function readCache(name, ttlMs = CACHE_TTL_MS) {
  try {
    const file = path.join(cacheDir(), name);
    const stat = fs.statSync(file);
    if (Date.now() - stat.mtimeMs > ttlMs) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Best-effort cache write. A read-only filesystem must not break the server. */
export function writeCache(name, value) {
  try {
    fs.mkdirSync(cacheDir(), { recursive: true });
    fs.writeFileSync(path.join(cacheDir(), name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
