/**
 * Unit tests for the Knowledge Pack builder (on-device AI retrieval foundation).
 *
 * Tests the local-retrieval corpus builder without side effects.
 * Run with: node --test tests/unit/knowledge-pack.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const kp = require('../../scripts/generate/lib/knowledge-pack.cjs');

describe('knowledge-pack builder API', () => {
  it('exposes the builder functions', () => {
    assert.strictEqual(typeof kp.normalizeResources, 'function');
    assert.strictEqual(typeof kp.buildDatabase, 'function');
    assert.strictEqual(typeof kp.searchCorpus, 'function');
    assert.strictEqual(typeof kp.buildManifest, 'function');
  });
});
