/**
 * Unit tests for the Knowledge Pack builder (on-device AI retrieval foundation).
 *
 * Tests the local-retrieval corpus builder without side effects.
 * Run with: node --test tests/unit/knowledge-pack.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const kp = require('../../scripts/generate/lib/knowledge-pack.cjs');

/** Build a full normalized record for tests, filling sensible defaults. */
function kpRecord(fields) {
  return {
    id: fields.id,
    type: fields.type || 'resource',
    title: fields.title || '',
    body: fields.body || '',
    category: fields.category || '',
    area: fields.area || '',
    city: fields.city || '',
    keywords: fields.keywords || '',
    url: fields.url || '',
    lat: fields.lat ?? null,
    lon: fields.lon ?? null,
    meta: fields.meta || {},
  };
}

describe('knowledge-pack builder API', () => {
  it('exposes the builder functions', () => {
    assert.strictEqual(typeof kp.normalizeResources, 'function');
    assert.strictEqual(typeof kp.buildDatabase, 'function');
    assert.strictEqual(typeof kp.searchCorpus, 'function');
    assert.strictEqual(typeof kp.buildManifest, 'function');
  });
});

describe('normalizeResources', () => {
  const docs = [
    {
      id: '211-bay-area',
      name: '2-1-1 Bay Area',
      description: 'free confidential helpline connecting residents to food assistance',
      keywords: '211, helpline, food, housing',
      category: 'Community Services',
      area: 'Bay Area',
      city: '',
      groups: ['everyone'],
    },
  ];

  it('maps search-index documents to the common record shape', () => {
    const out = kp.normalizeResources(docs);
    assert.strictEqual(out.length, 1);
    const r = out[0];
    assert.strictEqual(r.id, '211-bay-area');
    assert.strictEqual(r.type, 'resource');
    assert.strictEqual(r.title, '2-1-1 Bay Area');
    assert.strictEqual(r.category, 'Community Services');
    assert.strictEqual(r.area, 'Bay Area');
  });

  it('includes description and keywords in the searchable body', () => {
    const r = kp.normalizeResources(docs)[0];
    assert.match(r.body, /helpline/);
    assert.match(r.body, /housing/); // keywords folded into body
  });

  it('produces the full set of columns expected by the database', () => {
    const r = kp.normalizeResources(docs)[0];
    for (const key of ['id', 'type', 'title', 'body', 'category', 'area', 'city', 'keywords', 'url', 'lat', 'lon', 'meta']) {
      assert.ok(key in r, `missing column: ${key}`);
    }
  });

  it('skips records without an id', () => {
    const out = kp.normalizeResources([{ name: 'no id here' }, ...docs]);
    assert.strictEqual(out.length, 1);
  });
});

describe('buildDatabase', () => {
  const recs = [
    kpRecord({ id: 'a', title: 'Alameda Food Bank', body: 'free groceries CalFresh emergency food', category: 'Food', city: 'Oakland', keywords: 'food' }),
    kpRecord({ id: 'b', title: 'Bike Repair Co-op', body: 'fix bicycles tools', category: 'Recreation', city: 'San Francisco', keywords: 'bike' }),
  ];

  it('creates an FTS5-searchable corpus', () => {
    const db = kp.buildDatabase(recs);
    const rows = db
      .prepare('SELECT id FROM resources_fts WHERE resources_fts MATCH ? ORDER BY rank')
      .all('food');
    assert.ok(rows.some((r) => r.id === 'a'), 'food matches the food bank');
    assert.ok(!rows.some((r) => r.id === 'b'), 'food does not match the bike co-op');
    db.close();
  });

  it('stores full rows in the resources table for filtering', () => {
    const db = kp.buildDatabase(recs);
    const row = db.prepare('SELECT category, city FROM resources WHERE id = ?').get('a');
    assert.strictEqual(row.category, 'Food');
    assert.strictEqual(row.city, 'Oakland');
    db.close();
  });
});
