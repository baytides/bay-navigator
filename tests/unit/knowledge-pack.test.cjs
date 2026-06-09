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

describe('searchCorpus (retrieval contract)', () => {
  function corpus() {
    return kp.buildDatabase([
      kpRecord({ id: 'food1', title: 'Alameda County Food Bank', body: 'free groceries and emergency food', category: 'Food', area: 'Alameda', city: 'Oakland', keywords: 'food, groceries, calfresh' }),
      kpRecord({ id: 'food2', title: 'Community Pantry', body: 'food distribution every saturday', category: 'Food', area: 'SF', city: 'San Francisco', keywords: 'food, pantry' }),
      kpRecord({ id: 'rec1', title: 'Bike Repair Co-op', body: 'fix your bicycle with volunteer help', category: 'Recreation', area: 'SF', city: 'San Francisco', keywords: 'bike, repair' }),
    ]);
  }

  it('returns matching resources as full result objects', () => {
    const db = corpus();
    const hits = kp.searchCorpus(db, 'food');
    assert.ok(hits.length >= 2);
    assert.ok(hits.every((h) => h.id && h.title && 'category' in h));
    assert.ok(hits.some((h) => h.id === 'food1'));
    assert.ok(!hits.some((h) => h.id === 'rec1'));
    db.close();
  });

  it('ranks a title match above a body-only match', () => {
    const db = corpus();
    // "bank" appears in food1's TITLE; add a record where it appears only in body.
    db.prepare('INSERT INTO resources_fts (id, title, keywords, body, category) VALUES (?,?,?,?,?)')
      .run('z', 'Generic Service', '', 'we are not a bank but mention bank in passing', 'Other');
    const hits = kp.searchCorpus(db, 'bank');
    assert.strictEqual(hits[0].id, 'food1', 'title match ranks first');
    db.close();
  });

  it('honors the category filter', () => {
    const db = corpus();
    const hits = kp.searchCorpus(db, 'food', { category: 'Recreation' });
    assert.strictEqual(hits.length, 0);
    db.close();
  });

  it('caps results at the requested limit', () => {
    const db = corpus();
    const hits = kp.searchCorpus(db, 'food', { limit: 1 });
    assert.strictEqual(hits.length, 1);
    db.close();
  });

  it('returns an empty array for a blank query', () => {
    const db = corpus();
    assert.deepStrictEqual(kp.searchCorpus(db, '   '), []);
    assert.deepStrictEqual(kp.searchCorpus(db, ''), []);
    db.close();
  });

  it('matches any of multiple query tokens (OR semantics)', () => {
    const db = corpus();
    const hits = kp.searchCorpus(db, 'bicycle groceries');
    const ids = hits.map((h) => h.id);
    assert.ok(ids.includes('rec1'));
    assert.ok(ids.includes('food1'));
    db.close();
  });

  it('does not throw on FTS5 special characters', () => {
    const db = corpus();
    assert.doesNotThrow(() => kp.searchCorpus(db, 'food "near" me (oakland)'));
    db.close();
  });
});

describe('loadCaliforniaCodes', () => {
  const json = {
    sections: [
      { code: 'CIV', section: '1940', title: 'Application of tenant law', text: '(a) this chapter shall apply to dwelling units', keywords: 'tenant, rental', url: 'https://leginfo/CIV/1940' },
      { code: 'VEH', section: '22500', title: 'No parking zones', text: 'No person shall stop or park a vehicle', keywords: 'parking', url: 'https://leginfo/VEH/22500' },
    ],
  };

  it('maps sections to ca_code records with body from text', () => {
    const out = kp.loadCaliforniaCodes(json);
    assert.strictEqual(out.length, 2);
    assert.strictEqual(out[0].type, 'ca_code');
    assert.match(out[0].body, /dwelling units/);
    assert.strictEqual(out[0].url, 'https://leginfo/CIV/1940');
  });

  it('gives each section a unique non-empty id', () => {
    const ids = kp.loadCaliforniaCodes(json).map((r) => r.id);
    assert.ok(ids.every(Boolean));
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('returns [] for missing/empty input', () => {
    assert.deepStrictEqual(kp.loadCaliforniaCodes(null), []);
    assert.deepStrictEqual(kp.loadCaliforniaCodes({}), []);
  });
});

describe('loadMunicipalCodes', () => {
  const cityObjects = [
    {
      slug: 'san-jose',
      city: 'San Jose',
      topics: {
        pets: { sections: [{ title: '7.04.010 - Animals', text: 'No person shall keep a pig within the city', url: 'https://sj/7.04.010', keywords: 'pig, animal', sectionId: '7.04.010' }] },
        parking: { sections: [{ title: '11.20 - Parking', text: 'Street parking rules', url: 'https://sj/11.20', keywords: 'parking', sectionId: '11.20' }] },
      },
    },
  ];

  it('flattens topics/sections into muni_code records carrying the city', () => {
    const out = kp.loadMunicipalCodes(cityObjects);
    assert.strictEqual(out.length, 2);
    const pig = out.find((r) => /pig/.test(r.body));
    assert.strictEqual(pig.type, 'muni_code');
    assert.strictEqual(pig.city, 'San Jose');
    assert.strictEqual(pig.url, 'https://sj/7.04.010');
    assert.strictEqual(pig.meta.topic, 'pets');
  });

  it('returns [] for missing/empty input', () => {
    assert.deepStrictEqual(kp.loadMunicipalCodes(null), []);
    assert.deepStrictEqual(kp.loadMunicipalCodes([]), []);
  });
});

describe('fetchMunicipalCorpus (injected fetch, no real network)', () => {
  function fakeFetch(routes) {
    return async (url) => {
      if (!(url in routes)) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => routes[url] };
    };
  }

  const base = 'https://blob.test/municipal-codes';
  const routes = {
    [`${base}/_index.json`]: { cities: { 'san-jose': { city: 'San Jose' }, oakland: { city: 'Oakland' } } },
    [`${base}/san-jose.json`]: { slug: 'san-jose', topics: { pets: { sections: [{ title: 'Pigs', text: 'no pigs', url: 'u', keywords: '', sectionId: '1' }] } } },
    // oakland.json intentionally missing -> 404, must be tolerated
  };

  it('fetches the index then each city, merging the city name', async () => {
    const cities = await kp.fetchMunicipalCorpus(base, { fetchImpl: fakeFetch(routes) });
    const sj = cities.find((c) => c.slug === 'san-jose');
    assert.ok(sj, 'san-jose fetched');
    assert.strictEqual(sj.city, 'San Jose');
    assert.ok(sj.topics.pets);
  });

  it('tolerates a city whose file is missing', async () => {
    const cities = await kp.fetchMunicipalCorpus(base, { fetchImpl: fakeFetch(routes) });
    assert.ok(cities.every((c) => c && c.topics), 'no broken entries');
    assert.ok(!cities.some((c) => c.slug === 'oakland'), 'missing city skipped');
  });
});

describe('buildManifest', () => {
  it('records version, per-file sha256, and compatibility floors', () => {
    const m = kp.buildManifest({
      version: 42,
      files: { 'corpus.sqlite': Buffer.from('hello'), 'prompts.json': Buffer.from('{}') },
      minAppVersion: '2.0.0',
      minModelVersion: 'apple-fm-1',
    });
    assert.strictEqual(m.version, 42);
    assert.strictEqual(m.minAppVersion, '2.0.0');
    assert.strictEqual(m.minModelVersion, 'apple-fm-1');
    assert.match(m.files['corpus.sqlite'].sha256, /^[a-f0-9]{64}$/);
    assert.strictEqual(m.files['corpus.sqlite'].bytes, 5);
    assert.ok(typeof m.generated === 'string');
  });

  it('produces stable hashes for identical content', () => {
    const a = kp.buildManifest({ version: 1, files: { x: Buffer.from('same') } });
    const b = kp.buildManifest({ version: 1, files: { x: Buffer.from('same') } });
    assert.strictEqual(a.files.x.sha256, b.files.x.sha256);
  });

  it('applies sensible defaults for the compatibility floors', () => {
    const m = kp.buildManifest({ version: 1, files: {} });
    assert.ok('minAppVersion' in m);
    assert.ok('minModelVersion' in m);
  });
});

describe('extractPrompts (DRY: pull from the canonical .ts source)', () => {
  const tsSource = [
    "const today = new Date();",
    "export const SYSTEM_PROMPT = `You are Carl, a friendly assistant.`;",
    "export const INTENT_PARSER_PROMPT = `You are a search intent parser.`;",
    "export const RESPONSE_FORMATTER_PROMPT = `You are Carl. Format the answer.`;",
    "export const OLLAMA_CONFIG = { temperature: 0.4 };",
  ].join('\n');

  it('extracts the three prompt constants by name', () => {
    const p = kp.extractPrompts(tsSource);
    assert.match(p.systemPrompt, /friendly assistant/);
    assert.match(p.intentParse, /intent parser/);
    assert.match(p.responseFormat, /Format the answer/);
  });

  it('throws if a required prompt constant is absent', () => {
    assert.throws(() => kp.extractPrompts('export const SYSTEM_PROMPT = `hi`;'));
  });
});

describe('buildRetrievalConfig', () => {
  it('carries the search keys/weights and an empty synonyms map', () => {
    const cfg = kp.buildRetrievalConfig([
      { name: 'name', weight: 0.4 },
      { name: 'keywords', weight: 0.3 },
    ]);
    assert.deepStrictEqual(cfg.searchKeys, ['name', 'keywords']);
    assert.strictEqual(cfg.weights.name, 0.4);
    assert.deepStrictEqual(cfg.synonyms, {});
  });
});
