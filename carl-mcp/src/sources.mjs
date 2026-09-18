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

import crypto from 'node:crypto';
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

/**
 * Where we keep the built corpus between runs.
 *
 * The old default was `<tmpdir>/carl-mcp-cache`, a fixed name inside a
 * world-writable directory. On any shared machine another user can create that
 * path first — as a directory they own, or as a symlink pointing somewhere
 * else — and then they control what our "cache" is, which means they control
 * what Carl serves. `mkdirSync(..., { recursive: true })` does not complain
 * about an existing directory, whoever owns it, so nothing here noticed.
 *
 * Preferring a per-user cache directory removes the shared-directory problem
 * rather than guarding against it.
 *
 * There is deliberately no temp-directory fallback. An earlier version used
 * `<tmpdir>/carl-mcp-cache-<uid>`, and a uid suffix narrows the problem
 * without removing it — the directory still sits somewhere every account on
 * the machine can write. Returning null instead means an environment with no
 * usable home builds the corpus in memory: a slower start, which is the right
 * trade against serving whatever someone else left in a shared directory.
 * Callers already treat null the same as a read-only filesystem.
 */
export function cacheDir() {
  if (process.env.CARL_CACHE_DIR) return process.env.CARL_CACHE_DIR;
  const base = process.env.XDG_CACHE_HOME || (os.homedir() && path.join(os.homedir(), '.cache'));
  if (base && path.isAbsolute(base)) return path.join(base, 'carl-mcp');
  return null;
}

/**
 * Create the cache directory owner-only, and refuse it if it is not ours.
 *
 * Returns the path when it is safe to write to, or null when it is not — the
 * callers treat null the same as a read-only filesystem and fall back to
 * building in memory. Losing the cache costs a slower start; writing into a
 * directory somebody else controls costs correctness.
 */
export function ensureCacheDir() {
  const dir = cacheDir();
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    // lstat, not stat: a symlink here is the attack, and stat would follow it.
    const st = fs.lstatSync(dir);
    if (!st.isDirectory()) return null;
    if (typeof process.getuid === 'function' && st.uid !== process.getuid()) return null;
    return dir;
  } catch {
    return null;
  }
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

/**
 * Read a cached JSON blob if it exists and is younger than the TTL.
 *
 * Opened once and inspected through the file descriptor: the previous version
 * called statSync and then readFileSync on the same name, so the thing it
 * checked the age of was not necessarily the thing it went on to read.
 */
export function readCache(name, ttlMs = CACHE_TTL_MS) {
  let fd;
  try {
    const dir = cacheDir();
    if (!dir) return null;
    fd = fs.openSync(path.join(dir, name), 'r');
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) return null;
    if (Date.now() - stat.mtimeMs > ttlMs) return null;
    return JSON.parse(fs.readFileSync(fd, 'utf8'));
  } catch {
    return null;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        /* already gone */
      }
    }
  }
}

/**
 * Best-effort cache write. A read-only filesystem must not break the server.
 *
 * Writes to an unpredictable temporary name with the exclusive flag, then
 * renames over the target, so a half-written file is never visible to a reader
 * and an existing name cannot be turned into a write somewhere else.
 */
export function writeCache(name, value) {
  const dir = ensureCacheDir();
  if (!dir) return false;
  const tmp = path.join(dir, `.${name}.${crypto.randomBytes(8).toString('hex')}.tmp`);
  try {
    // 'wx' fails rather than following or truncating anything already there.
    fs.writeFileSync(tmp, JSON.stringify(value), { flag: 'wx', mode: 0o600 });
    fs.renameSync(tmp, path.join(dir, name));
    return true;
  } catch {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* nothing to clean up */
    }
    return false;
  }
}
