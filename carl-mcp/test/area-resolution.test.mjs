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

test('museum venues are reachable by county, not just by bare county name', async () => {
  // Venues stored `area: "San Mateo"` while every program stored "San Mateo
  // County". The area facet is an exact match, so a county-scoped search
  // returned 81 programs and ZERO venues — Filoli and CuriOdyssey were
  // invisible, and a host model reported "nothing in San Mateo County".
  const hits = await search('Filoli', { area: 'San Mateo County', limit: 10 });
  assert.ok(
    hits.some((h) => /filoli/i.test(h.title)),
    'Filoli must be findable when scoped to San Mateo County'
  );
});

test('listAll returns the complete set, not a ranked page', async () => {
  const { listAll } = await import('../src/corpus.mjs');
  const rows = await listAll({ category: 'Museum Admission', area: 'San Mateo County' });
  const titles = rows.map((r) => r.title);
  assert.ok(
    titles.some((t) => /filoli/i.test(t)),
    'expected Filoli'
  );
  assert.ok(
    titles.some((t) => /curiodyssey/i.test(t)),
    'expected CuriOdyssey'
  );
});

test('a truncated page says so and names the enumeration tool', async () => {
  const { formatResults } = await import('../src/format.mjs');
  const { noMatch } = await import('../src/guidance.mjs');
  const hits = await search('museums for all', { limit: 3 });
  const text = formatResults(hits, { query: 'museums for all', bodyChars: 50, noMatch });
  assert.match(text, /Showing 3 of \d+/);
  assert.match(text, /list_all_matching/);
  assert.match(text, /NOT the full list/);
});

test('an untruncated page does not cry wolf', async () => {
  const { formatResults } = await import('../src/format.mjs');
  const { noMatch } = await import('../src/guidance.mjs');
  const hits = await search('calfresh', { limit: 50 });
  const text = formatResults(hits, { query: 'calfresh', bodyChars: 50, noMatch });
  assert.doesNotMatch(text, /NOT the full list/);
});

test('listAll discloses its own cap rather than truncating silently', async () => {
  // The tool exists because silent truncation made a model report absence as
  // fact. Reintroducing that defect inside the fix would be the worst outcome.
  const { listAll } = await import('../src/corpus.mjs');
  const { formatRoster } = await import('../src/format.mjs');
  const { noMatch } = await import('../src/guidance.mjs');

  const capped = await listAll({ type: 'muni_code', city: 'Oakland', max: 5 });
  assert.equal(capped.length, 5);
  assert.ok(capped.totalMatches > 5, 'expected more matches than the cap');
  const text = formatRoster(capped, { query: '', filters: { city: 'Oakland' }, noMatch });
  assert.match(text, /STILL not the full set/);
  assert.doesNotMatch(text, /This IS the full set/);
});

test('an uncapped roster states plainly that it is complete', async () => {
  const { listAll } = await import('../src/corpus.mjs');
  const { formatRoster } = await import('../src/format.mjs');
  const { noMatch } = await import('../src/guidance.mjs');
  const rows = await listAll({ category: 'Museum Admission', area: 'San Mateo County' });
  const text = formatRoster(rows, { query: '', filters: {}, noMatch });
  assert.match(text, /This IS the full set/);
});

test('ordinance results warn against summarising partial law', async () => {
  const { formatResults } = await import('../src/format.mjs');
  const { noMatch } = await import('../src/guidance.mjs');
  const hits = await search('parking', { city: 'Oakland', type: 'muni_code', limit: 3 });
  const text = formatResults(hits, { query: 'parking', bodyChars: 50, noMatch });
  assert.match(text, /not the whole rule/i);
});

test('ordinances can be enumerated by city', async () => {
  const { listAll } = await import('../src/corpus.mjs');
  const rows = await listAll({ type: 'muni_code', city: 'Oakland', max: 400 });
  assert.ok(rows.length > 100, `expected Oakland's ordinance set, got ${rows.length}`);
  assert.ok(rows.every((r) => String(r.city).toLowerCase() === 'oakland'));
});
