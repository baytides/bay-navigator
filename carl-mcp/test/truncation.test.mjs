/**
 * A partial ordinance must never be presented as a complete rule.
 *
 * The scraper caps section text, and what gets cut is the END of an ordinance —
 * where exceptions, penalties and "this does not apply if..." clauses live. So a
 * truncated quote can invert the answer to "is X allowed here".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHit, formatDetail } from '../src/format.mjs';

const base = {
  id: 'muni:richmond:parking:13.57.080',
  type: 'muni_code',
  title: '13.57.080 - Imposition of assessment.',
  body: 'No person shall park a vehicle...',
  category: 'Municipal Code',
  city: 'Richmond',
  area: '',
  url: 'https://library.municode.com/ca/richmond/codes',
};

test('a truncated ordinance is flagged in search results', () => {
  const out = formatHit({ ...base, meta: { truncated: true } });
  assert.match(out, /incomplete/i);
  assert.match(out, /source/i);
});

test('a complete ordinance carries no warning', () => {
  const out = formatHit({ ...base, meta: { truncated: false } });
  assert.doesNotMatch(out, /incomplete/i);
});

test('a missing meta object does not crash or warn', () => {
  const out = formatHit({ ...base });
  assert.doesNotMatch(out, /incomplete/i);
  assert.match(out, /13\.57\.080/);
});

test('full detail also warns when truncated', () => {
  const out = formatDetail({ ...base, meta: { truncated: true } });
  assert.match(out, /incomplete/i);
});
