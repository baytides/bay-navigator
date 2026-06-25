#!/usr/bin/env node
/**
 * Relocate built static data from dist/api/ to dist/data/.
 *
 * WHY: Azure Static Web Apps reserves the /api/* route prefix for the Functions
 * backend (confirmed: even with zero functions linked, /api/* 404s via SWA
 * middleware). The whole source pipeline (generators, scheduled sync scripts,
 * ~850 committed files) writes to public/api/, which Astro copies to dist/api/.
 * Rather than re-wire every writer + workflow, we relocate the BUILT output to
 * dist/data/ (a non-reserved path) so the frontend can fetch it. Frontend fetch
 * paths reference /data/* to match.
 *
 * Runs in the `postbuild` npm lifecycle step, after `astro build`.
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', '..', 'dist');
const apiDir = path.join(dist, 'api');
const dataDir = path.join(dist, 'data');

if (!fs.existsSync(apiDir)) {
  console.warn('[relocate-data] dist/api not found — nothing to relocate (skipping).');
  process.exit(0);
}

fs.mkdirSync(dataDir, { recursive: true });

let moved = 0;
for (const entry of fs.readdirSync(apiDir)) {
  const from = path.join(apiDir, entry);
  const to = path.join(dataDir, entry);
  // If a same-named entry already exists in dist/data (e.g. a leftover), replace it.
  fs.rmSync(to, { recursive: true, force: true });
  fs.renameSync(from, to);
  moved += 1;
}

// Remove the now-empty dist/api so the reserved namespace ships nothing.
fs.rmSync(apiDir, { recursive: true, force: true });
console.log(`[relocate-data] moved ${moved} entr(ies) from dist/api -> dist/data`);
