/**
 * Guards the retrieval contract against silent drift.
 *
 * knowledge-pack.cjs says the Swift and Dart layers "must stay in sync" with
 * it. carl-mcp keeps a vendored copy so it can ship standalone, which means it
 * can drift too. This test is the tripwire.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SOURCE, VENDORED, sha256 } from '../scripts/sync-contract.mjs';

test('vendored knowledge-pack matches the repo source', (t) => {
  if (!fs.existsSync(SOURCE)) {
    // Published package installed from npm — the repo source isn't there.
    t.skip('repo source not present (running outside the monorepo)');
    return;
  }
  assert.equal(
    sha256(VENDORED),
    sha256(SOURCE),
    'vendored contract has drifted — run `npm run sync:contract` in carl-mcp/'
  );
});

test('contract exposes the loaders carl-mcp depends on', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const kp = require('../src/vendor/knowledge-pack.cjs');
  for (const fn of [
    'loadPrograms',
    'loadCaliforniaCodes',
    'loadMunicipalCodes',
    'loadMuseumAdmission',
    'fetchMunicipalCorpus',
    'buildDatabase',
    'searchCorpus',
  ]) {
    assert.equal(typeof kp[fn], 'function', `missing ${fn}`);
  }
});
