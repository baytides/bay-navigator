#!/usr/bin/env node
/**
 * Re-vendor the Knowledge Pack retrieval contract.
 *
 * carl-mcp ships standalone on npm, so it cannot reach into the repo at
 * runtime — it carries a copy of scripts/generate/lib/knowledge-pack.cjs. That
 * copy is the thing most likely to rot, and silent drift would make the MCP
 * assistant rank results differently from the web and Apple assistants.
 *
 * Run this after changing the builder; `npm test` fails until you do.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SOURCE = path.resolve(
  here,
  '..',
  '..',
  'scripts',
  'generate',
  'lib',
  'knowledge-pack.cjs'
);
export const VENDORED = path.resolve(here, '..', 'src', 'vendor', 'knowledge-pack.cjs');

export const sha256 = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source contract not found at ${SOURCE} (are you outside the repo?)`);
    process.exit(1);
  }
  const before = fs.existsSync(VENDORED) ? sha256(VENDORED) : null;
  fs.copyFileSync(SOURCE, VENDORED);
  const after = sha256(VENDORED);
  console.log(
    before === after
      ? `already in sync (${after.slice(0, 12)})`
      : `re-vendored: ${before?.slice(0, 12) || 'missing'} -> ${after.slice(0, 12)}`
  );
}
