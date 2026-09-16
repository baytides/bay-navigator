#!/usr/bin/env node
/**
 * Re-stamp the Knowledge Pack manifest against the FINAL built files.
 *
 * WHY THIS EXISTS: the manifest records a sha256 for each pack file, and the
 * apps verify those hashes before installing a downloaded pack. But the
 * manifest is written by generate-knowledge-pack.cjs during generation, and
 * `astro-compress` minifies JSON afterwards — so prompts.json and
 * retrieval-config.json were being served with different bytes than the
 * manifest claimed. Every over-the-air pack update would have failed
 * verification, silently, on device.
 *
 * Rather than exempt the pack from compression (which only defers the problem
 * to the next build-time transform), this recomputes the manifest from whatever
 * actually ended up in dist/. The manifest then describes what is served, which
 * is the only thing the apps can check it against.
 *
 * Runs in `postbuild`, AFTER relocate-api-to-data.cjs has moved the files.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PACK_DIR = path.join(__dirname, '..', '..', 'dist', 'data', 'knowledge-pack');
const MANIFEST = path.join(PACK_DIR, 'manifest.json');

if (!fs.existsSync(MANIFEST)) {
  console.warn('[stamp-pack] no knowledge pack in dist/data — skipping.');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

let changed = 0;
for (const name of Object.keys(manifest.files || {})) {
  const file = path.join(PACK_DIR, name);
  if (!fs.existsSync(file)) {
    console.error(`[stamp-pack] manifest lists ${name} but it is not in dist — aborting.`);
    process.exit(1);
  }
  const actual = { sha256: sha256(file), bytes: fs.statSync(file).size };
  const recorded = manifest.files[name];
  if (recorded.sha256 !== actual.sha256) {
    console.log(
      `[stamp-pack] ${name}: ${recorded.bytes} -> ${actual.bytes} bytes (rewritten during build, re-hashing)`
    );
    changed += 1;
  }
  manifest.files[name] = actual;
}

// The manifest is itself JSON in the pack directory, but it is not self-listed,
// so rewriting it here cannot invalidate its own hash.
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

console.log(
  changed === 0
    ? '[stamp-pack] manifest already matched the built files.'
    : `[stamp-pack] manifest re-stamped (${changed} file(s) differed).`
);
