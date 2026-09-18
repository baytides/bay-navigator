/**
 * Area resolution for the MCP.
 *
 * Two bugs this pins down, both of which turned a reasonable question into
 * silence or a wrong answer:
 *
 *   Strict `area` equality dropped every Statewide and Nationwide program from a
 *   county-scoped search, so asking for CalFresh in Alameda County returned
 *   everything EXCEPT CalFresh.
 *
 *   Only county labels resolved, so a host model passing area: "Oakland" — the
 *   obvious thing to pass when someone says "a food bank in Oakland" — matched
 *   no record at all.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getCorpus, resolveArea, search } from '../src/corpus.mjs';

const db = await getCorpus();

test('resolves a county name to itself', () => {
  assert.equal(resolveArea('Alameda County', db), 'Alameda County');
  assert.equal(resolveArea('santa clara county', db), 'Santa Clara County');
});

test('resolves a city to its county', () => {
  assert.equal(resolveArea('Oakland', db), 'Alameda County');
  assert.equal(resolveArea('Daly City', db), 'San Mateo County');
});

test('prefers the county when a city shares its name', () => {
  // Both "Alameda" and "Alameda County" exist as area labels. For a filter the
  // county is the superset, so resolving to the city would hide most of what
  // the person asked for.
  assert.equal(resolveArea('Alameda', db), 'Alameda County');
});

test('is case insensitive', () => {
  assert.equal(resolveArea('oAkLaNd', db), 'Alameda County');
});

test('understands common shorthand', () => {
  assert.equal(resolveArea('SF', db), 'San Francisco');
  assert.equal(resolveArea('the city', db), 'San Francisco');
  assert.equal(resolveArea('East Bay', db), 'Alameda County');
});

test('returns null for somewhere it does not know', () => {
  assert.equal(resolveArea('Atlantis', db), null);
  assert.equal(resolveArea('', db), null);
});

test('a county-scoped search keeps statewide programs', async () => {
  const hits = await search('calfresh', { area: 'Alameda County', limit: 10 });
  assert.ok(hits.length > 0, 'expected results for calfresh in Alameda County');
  const areas = new Set(hits.map((h) => String(h.area || '').toLowerCase()));
  assert.ok(
    [...areas].some((a) => a === '' || a === 'statewide' || a === 'bay area' || a === 'nationwide'),
    `expected a statewide/bay-area program to survive the county filter, got: ${[...areas].join(', ')}`
  );
});

test('a city-scoped search finds that county’s programs', async () => {
  const byCity = await search('food bank', { area: 'Oakland', limit: 10 });
  assert.ok(byCity.length > 0, 'area: "Oakland" must not return silence');
  assert.ok(
    byCity.some((h) => String(h.area || '').toLowerCase() === 'alameda county'),
    'expected at least one Alameda County result'
  );
});

test('a county filter excludes other counties', async () => {
  const hits = await search('food bank', { area: 'Sonoma County', limit: 20 });
  const foreign = hits.filter((h) => {
    const a = String(h.area || '').toLowerCase();
    return a !== 'sonoma county' && !['', 'statewide', 'bay area', 'nationwide'].includes(a);
  });
  assert.equal(
    foreign.length,
    0,
    `unexpected out-of-county results: ${foreign.map((f) => f.area).join(', ')}`
  );
});
