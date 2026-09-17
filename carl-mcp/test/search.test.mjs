/**
 * Retrieval behaviour tests — offline, against a fixture corpus.
 *
 * These pin the precision floor, which is the one place carl-mcp intentionally
 * diverges from the shared contract (the contract assumes a typo-correcting LLM
 * runs before search; an MCP host provides no such step).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { tokenOverlap } from '../src/corpus.mjs';

const require = createRequire(import.meta.url);
const kp = require('../src/vendor/knowledge-pack.cjs');

const FIXTURES = [
  {
    id: 'fb-1',
    name: 'Alameda County Community Food Bank',
    description: 'Free groceries and pantry referrals',
    keywords: 'food bank, groceries, pantry',
    category: 'food',
    area: 'Alameda County',
  },
  {
    id: 'rent-1',
    name: 'Section 8 Housing Choice Voucher',
    description: 'Rental assistance for low-income households',
    keywords: 'rent, housing, voucher',
    category: 'housing',
    area: 'Bay Area',
  },
  {
    id: 'noise-1',
    name: 'Permit application',
    description: 'Any person may apply for a permit for a thing',
    keywords: 'permit, application',
    category: 'Municipal Code',
    area: '',
  },
];

function fixtureDb() {
  return kp.buildDatabase(kp.normalizeResources(FIXTURES));
}

/** Mirrors src/corpus.mjs search() filtering, against an injected db. */
function searchFixture(db, query, { limit = 10, ratio = 0.5 } = {}) {
  let hits = kp.searchCorpus(db, query, { limit: 40 });
  if (ratio > 0) {
    hits = hits.filter((h) => {
      const { matched, total } = tokenOverlap(query, h);
      return total === 0 || matched >= Math.max(1, Math.ceil(total * ratio));
    });
  }
  return hits.slice(0, limit);
}

test('tokenOverlap counts distinct query tokens present in a row', () => {
  const row = {
    title: 'Food Bank',
    keywords: 'groceries',
    body: '',
    category: 'food',
    city: '',
    area: '',
  };
  assert.deepEqual(tokenOverlap('food bank', row), { matched: 2, total: 2 });
  assert.deepEqual(tokenOverlap('food pizza', row), { matched: 1, total: 2 });
  assert.deepEqual(tokenOverlap('', row), { matched: 0, total: 0 });
  // Duplicate tokens count once.
  assert.deepEqual(tokenOverlap('food food food', row), { matched: 1, total: 1 });
});

test('a real query returns the right entry', () => {
  const hits = searchFixture(fixtureDb(), 'food bank');
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].id, 'fb-1');
});

test('a nonsense query returns nothing rather than a weak match', () => {
  // Raw contract behaviour would match 'noise-1' on the stray token "thing".
  const db = fixtureDb();
  assert.ok(
    kp.searchCorpus(db, 'zxqw nonexistent thing', { limit: 10 }).length > 0,
    'precondition: contract matches loosely'
  );
  assert.equal(searchFixture(db, 'zxqw nonexistent thing').length, 0, 'floor should reject it');
});

test('ratio 0 restores raw contract behaviour', () => {
  const hits = searchFixture(fixtureDb(), 'zxqw nonexistent thing', { ratio: 0 });
  assert.ok(hits.length > 0, 'disabling the floor must not change ranking semantics');
});

test('a multi-word natural question still finds the right entry', () => {
  const hits = searchFixture(fixtureDb(), 'rental assistance housing');
  assert.equal(hits[0].id, 'rent-1');
});
