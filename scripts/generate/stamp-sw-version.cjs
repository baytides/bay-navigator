#!/usr/bin/env node
/**
 * Stamp the service-worker cache version at build time.
 *
 * WHY: public/sw.js caches stable-path static assets (e.g. /assets/js/*.js) with a
 * cache-first strategy. Old caches are only purged when CACHE_VERSION changes. With a
 * hardcoded literal, sw.js shipped byte-identical every deploy, so browsers never saw
 * an updated worker and returning visitors were served months-old assets.
 *
 * This replaces the '__SW_VERSION__' placeholder in the BUILT dist/sw.js with a unique
 * per-build id, so every deploy produces a byte-different worker that busts old caches.
 *
 * Runs as the `postbuild` npm lifecycle step (after `astro build`), so it operates on the
 * minified output. Pass a path to override the target (used by tests).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PLACEHOLDER = '__SW_VERSION__';
const target = process.argv[2] || path.join(__dirname, '..', '..', 'dist', 'sw.js');

function buildId() {
  let sha = 'nogit';
  try {
    // execFileSync (no shell) with a fixed arg list — no injection surface.
    sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    /* not a git checkout — fall through to a timestamp */
  }
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return sha === 'nogit' ? `${date}.${Date.now()}` : `${date}.${sha}`;
}

if (!fs.existsSync(target)) {
  console.warn(`[stamp-sw] ${target} not found — skipping (run after astro build).`);
  process.exit(0);
}

const src = fs.readFileSync(target, 'utf8');
const occurrences = (src.match(new RegExp(PLACEHOLDER, 'g')) || []).length;

if (occurrences === 0) {
  console.error(
    `[stamp-sw] ERROR: placeholder ${PLACEHOLDER} not found in ${target}.\n` +
      `           Shipping an unstamped service worker would re-freeze the cache.\n` +
      `           Check that public/sw.js still contains the placeholder.`
  );
  process.exit(1);
}

const id = buildId();
fs.writeFileSync(target, src.split(PLACEHOLDER).join(id));
console.log(`[stamp-sw] cache version set to "${id}" (${occurrences} occurrence(s) in ${path.basename(target)})`);
