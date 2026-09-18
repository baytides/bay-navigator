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
 * The per-jurisdiction ordinance packs get the same treatment. They are SQLite
 * binaries that no current build step rewrites, but they are downloaded and
 * hash-verified exactly like the core files, and "nothing touches them today"
 * is not a property worth betting a silent on-device failure on.
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

/** Re-hash one manifest entry in place; returns true if the bytes had changed. */
function restamp(name, relPath, entry) {
  const file = path.join(PACK_DIR, relPath);
  if (!fs.existsSync(file)) {
    console.error(`[stamp-pack] manifest lists ${name} but it is not in dist — aborting.`);
    process.exit(1);
  }
  const actual = { sha256: sha256(file), bytes: fs.statSync(file).size };
  const differed = entry.sha256 !== actual.sha256;
  if (differed) {
    console.log(
      `[stamp-pack] ${name}: ${entry.bytes} -> ${actual.bytes} bytes (rewritten during build, re-hashing)`
    );
  }
  entry.sha256 = actual.sha256;
  entry.bytes = actual.bytes;
  return differed;
}

for (const [name, entry] of Object.entries(manifest.files || {})) {
  if (restamp(name, name, entry)) changed += 1;
}

const ordinances = (manifest.ordinances && manifest.ordinances.jurisdictions) || {};
for (const [slug, entry] of Object.entries(ordinances)) {
  if (restamp(`ordinance:${slug}`, entry.file, entry)) changed += 1;
}

// County and whole-Bay-Area tiers quote a download size to the person choosing
// one. Recompute them from the re-stamped packs so the number stays true.
if (manifest.ordinances) {
  const sumBytes = (slugs) =>
    slugs.reduce((n, s) => n + (ordinances[s] ? ordinances[s].bytes : 0), 0);
  for (const county of Object.values(manifest.ordinances.counties || {})) {
    county.bytes = sumBytes(county.jurisdictions || []);
  }
  if (manifest.ordinances.all) {
    manifest.ordinances.all.bytes = sumBytes(manifest.ordinances.all.jurisdictions || []);
  }
}

// The manifest is itself JSON in the pack directory, but it is not self-listed,
// so rewriting it here cannot invalidate its own hash.
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

console.log(
  changed === 0
    ? '[stamp-pack] manifest already matched the built files.'
    : `[stamp-pack] manifest re-stamped (${changed} file(s) differed).`
);
