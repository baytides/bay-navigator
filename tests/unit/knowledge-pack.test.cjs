/**
 * Unit tests for the Knowledge Pack builder (on-device AI retrieval foundation).
 *
 * Tests the local-retrieval corpus builder without side effects.
 * Run with: node --test tests/unit/knowledge-pack.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
    for (const key of [
      'id',
      'type',
      'title',
      'body',
      'category',
      'area',
      'city',
      'keywords',
      'url',
      'lat',
      'lon',
      'meta',
    ]) {
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
    kpRecord({
      id: 'a',
      title: 'Alameda Food Bank',
      body: 'free groceries CalFresh emergency food',
      category: 'Food',
      city: 'Oakland',
      keywords: 'food',
    }),
    kpRecord({
      id: 'b',
      title: 'Bike Repair Co-op',
      body: 'fix bicycles tools',
      category: 'Recreation',
      city: 'San Francisco',
      keywords: 'bike',
    }),
  ];

  it('creates an FTS5-searchable corpus', () => {
    const db = kp.buildDatabase(recs);
    const rows = db
      .prepare('SELECT id FROM resources_fts WHERE resources_fts MATCH ? ORDER BY rank')
      .all('food');
    assert.ok(
      rows.some((r) => r.id === 'a'),
      'food matches the food bank'
    );
    assert.ok(!rows.some((r) => r.id === 'b'), 'food does not match the bike co-op');
    db.close();
  });

  it('skips duplicate ids without throwing (keeps first)', () => {
    const dup = [
      kpRecord({ id: 'x', title: 'First', body: 'one' }),
      kpRecord({ id: 'x', title: 'Second', body: 'two' }),
      kpRecord({ id: 'y', title: 'Other', body: 'three' }),
    ];
    let db;
    assert.doesNotThrow(() => {
      db = kp.buildDatabase(dup);
    });
    assert.strictEqual(db.prepare('SELECT COUNT(*) c FROM resources').get().c, 2);
    assert.strictEqual(
      db.prepare('SELECT title FROM resources WHERE id = ?').get('x').title,
      'First'
    );
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
      kpRecord({
        id: 'food1',
        title: 'Alameda County Food Bank',
        body: 'free groceries and emergency food',
        category: 'Food',
        area: 'Alameda',
        city: 'Oakland',
        keywords: 'food, groceries, calfresh',
      }),
      kpRecord({
        id: 'food2',
        title: 'Community Pantry',
        body: 'food distribution every saturday',
        category: 'Food',
        area: 'SF',
        city: 'San Francisco',
        keywords: 'food, pantry',
      }),
      kpRecord({
        id: 'rec1',
        title: 'Bike Repair Co-op',
        body: 'fix your bicycle with volunteer help',
        category: 'Recreation',
        area: 'SF',
        city: 'San Francisco',
        keywords: 'bike, repair',
      }),
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
    db.prepare(
      'INSERT INTO resources_fts (id, title, keywords, body, category) VALUES (?,?,?,?,?)'
    ).run('z', 'Generic Service', '', 'we are not a bank but mention bank in passing', 'Other');
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

  it('scopes municipal codes by city but keeps city-agnostic results (parity with Swift)', () => {
    const db = kp.buildDatabase([
      kpRecord({
        id: 'sj',
        type: 'muni_code',
        title: 'San Jose Animal Code',
        body: 'no pet pig kept',
        city: 'San Jose',
      }),
      kpRecord({
        id: 'rc',
        type: 'muni_code',
        title: 'Redwood City Animal Code',
        body: 'no pet pig kept',
        city: 'Redwood City',
      }),
      kpRecord({
        id: 'st',
        type: 'resource',
        title: 'Statewide Pig Helpline',
        body: 'advice on keeping a pig',
        city: '',
      }),
    ]);
    const ids = kp.searchCorpus(db, 'pig', { city: 'San Jose' }).map((r) => r.id);
    assert.ok(ids.includes('sj'), 'San Jose ordinance kept');
    assert.ok(!ids.includes('rc'), "other city's ordinance excluded");
    assert.ok(ids.includes('st'), 'city-agnostic resource kept');
  });

  it('honors the area filter', () => {
    const db = corpus();
    const hits = kp.searchCorpus(db, 'food', { area: 'Alameda' });
    assert.ok(hits.length >= 1);
    assert.ok(hits.every((h) => h.area === 'Alameda'));
    db.close();
  });

  it('falls back to empty meta when stored meta is malformed', () => {
    const db = corpus();
    db.prepare('UPDATE resources SET meta = ? WHERE id = ?').run('{not json', 'food1');
    const hit = kp.searchCorpus(db, 'food').find((h) => h.id === 'food1');
    assert.deepStrictEqual(hit.meta, {});
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

describe('loadPrograms (rich resource detail)', () => {
  const json = {
    programs: [
      {
        id: '211-bay-area',
        name: '2-1-1 Bay Area',
        description: 'Free referral helpline',
        fullDescription: 'Connects residents to food, housing, and legal help',
        whatTheyOffer: 'Referrals to food assistance and shelter',
        howToApply: 'Dial 2-1-1 any time',
        requirements: 'Open to all Bay Area residents',
        category: 'Community Services',
        areas: ['Alameda', 'San Francisco'],
        city: 'Oakland',
        keywords: 'helpline, 211',
        website: 'https://211bayarea.org',
        sourceUrl: 'https://src',
        phone: '211',
        email: 'info@211.org',
        agency: '211 Bay Area',
      },
    ],
  };

  it('maps programs to records with rich searchable body', () => {
    const out = kp.loadPrograms(json);
    assert.strictEqual(out.length, 1);
    const r = out[0];
    assert.strictEqual(r.id, '211-bay-area');
    assert.match(r.body, /Dial 2-1-1/); // howToApply is searchable
    assert.match(r.body, /residents/); // requirements is searchable
    assert.strictEqual(r.url, 'https://211bayarea.org'); // website preferred
  });

  it('keeps contact details in meta for the app to surface', () => {
    const r = kp.loadPrograms(json)[0];
    assert.strictEqual(r.meta.phone, '211');
    assert.strictEqual(r.meta.email, 'info@211.org');
    assert.strictEqual(r.meta.agency, '211 Bay Area');
  });

  it('returns [] for missing/empty input', () => {
    assert.deepStrictEqual(kp.loadPrograms(null), []);
    assert.deepStrictEqual(kp.loadPrograms({}), []);
  });
});

describe('loadCaliforniaCodes', () => {
  const json = {
    sections: [
      {
        code: 'CIV',
        section: '1940',
        title: 'Application of tenant law',
        text: '(a) this chapter shall apply to dwelling units',
        keywords: 'tenant, rental',
        url: 'https://leginfo/CIV/1940',
      },
      {
        code: 'VEH',
        section: '22500',
        title: 'No parking zones',
        text: 'No person shall stop or park a vehicle',
        keywords: 'parking',
        url: 'https://leginfo/VEH/22500',
      },
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

  it('falls back when code/section/title/url are absent', () => {
    const out = kp.loadCaliforniaCodes({ sections: [{ text: 'body only' }] });
    assert.strictEqual(out.length, 1);
    assert.ok(out[0].id.startsWith('ca:'));
    assert.strictEqual(out[0].url, '');
  });

  it('coerces array keywords to a string (SQLite cannot bind arrays)', () => {
    const out = kp.loadCaliforniaCodes({
      sections: [
        {
          code: 'CIV',
          section: '1',
          title: 't',
          text: 'body',
          keywords: ['rent', 'tenant'],
          url: 'u',
        },
      ],
    });
    assert.strictEqual(typeof out[0].keywords, 'string');
    assert.match(out[0].keywords, /rent/);
    assert.match(out[0].keywords, /tenant/);
  });

  it('produces records whose every column is a bindable scalar', () => {
    const out = kp.loadCaliforniaCodes({
      sections: [
        { code: 'CIV', section: '1', title: 't', text: 'b', keywords: ['a', 'b'], url: 'u' },
      ],
    });
    const db = kp.buildDatabase(out); // must not throw on bind
    assert.strictEqual(db.prepare('SELECT COUNT(*) c FROM resources').get().c, 1);
    db.close();
  });
});

describe('loadMunicipalCodes', () => {
  const cityObjects = [
    {
      slug: 'san-jose',
      city: 'San Jose',
      topics: {
        pets: {
          sections: [
            {
              title: '7.04.010 - Animals',
              text: 'No person shall keep a pig within the city',
              url: 'https://sj/7.04.010',
              keywords: 'pig, animal',
              sectionId: '7.04.010',
            },
          ],
        },
        parking: {
          sections: [
            {
              title: '11.20 - Parking',
              text: 'Street parking rules',
              url: 'https://sj/11.20',
              keywords: 'parking',
              sectionId: '11.20',
            },
          ],
        },
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

  it('tolerates cities without topics, empty groups, and missing section fields', () => {
    const out = kp.loadMunicipalCodes([
      { slug: 'sj' }, // no topics -> skipped
      { slug: 'oak', topics: { empty: {} } }, // group has no sections
      { slug: 'rc', topics: { pets: { sections: [{ text: 'no pigs' }] } } }, // missing title/url/city
    ]);
    assert.strictEqual(out.length, 1);
    assert.strictEqual(out[0].city, 'rc'); // falls back to slug when city name absent
    assert.strictEqual(out[0].url, '');
  });
});

describe('loadMuseumAdmission', () => {
  const json = {
    disclaimer: 'Policies change; verify on the venue site.',
    programs: [
      {
        id: 'museums-for-all',
        name: 'Museums for All',
        scope: 'national',
        eligibility: ['EBT', 'SNAP', 'CalFresh'],
        benefit: 'Free to $5 admission for up to 4 people.',
        how: 'Present EBT card + photo ID at the door.',
        notes: 'Terms vary by site.',
        url: 'https://museums4all.org',
      },
      {
        id: 'blue-star-museums',
        name: 'Blue Star Museums',
        scope: 'active-duty military + families',
        eligibility: ['Active-duty military', 'Reserves', 'National Guard'],
        benefit: 'Free admission for the service member plus up to five family members.',
        dates2026: 'May 16, 2026 through September 7, 2026',
        how: 'Show CAC or DD Form 1173.',
        notes:
          'IMPORTANT: Does NOT cover veterans or retirees unless a venue offers veteran pricing.',
        url: 'https://www.arts.gov/initiatives/blue-star-museums',
      },
    ],
    venues: [
      {
        name: 'Oakland Museum of California (OMCA)',
        county: 'Alameda',
        city: 'Oakland',
        type: 'art / history museum',
        pathways: ['Museums for All: $1 admission for up to 4', 'BoA Museums on Us'],
        freeDays: 'Free First Sundays (galleries).',
        notes: 'Children 12 & under free.',
      },
    ],
  };

  it('maps programs to museum_program records with eligibility in keywords', () => {
    const out = kp.loadMuseumAdmission(json);
    const mfa = out.find((r) => r.title === 'Museums for All');
    assert.strictEqual(mfa.type, 'museum_program');
    assert.strictEqual(mfa.category, 'Museum Admission');
    assert.strictEqual(mfa.url, 'https://museums4all.org');
    assert.match(mfa.body, /Free to \$5/);
    assert.match(mfa.keywords, /EBT/);
  });

  it('maps venues to museum_venue records carrying the county and city', () => {
    const out = kp.loadMuseumAdmission(json);
    const omca = out.find((r) => /Oakland Museum/.test(r.title));
    assert.strictEqual(omca.type, 'museum_venue');
    assert.strictEqual(omca.city, 'Oakland');
    assert.match(omca.area, /Alameda/);
    assert.match(omca.body, /First Sundays/);
    assert.match(omca.body, /Museums for All/); // pathways folded into the body
  });

  it('bakes the active-duty-only caveat into the Blue Star record body', () => {
    const out = kp.loadMuseumAdmission(json);
    const blueStar = out.find((r) => r.title === 'Blue Star Museums');
    assert.match(blueStar.body, /active-duty/i);
    assert.match(blueStar.body, /veteran/i); // the "does NOT cover veterans" guard must be grounded in text
  });

  it('gives every record a unique non-empty id', () => {
    const ids = kp.loadMuseumAdmission(json).map((r) => r.id);
    assert.ok(ids.every(Boolean));
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('returns [] for missing/empty input', () => {
    assert.deepStrictEqual(kp.loadMuseumAdmission(null), []);
    assert.deepStrictEqual(kp.loadMuseumAdmission({}), []);
  });

  it('tolerates venues/programs missing optional fields', () => {
    const out = kp.loadMuseumAdmission({
      programs: [{ id: 'p', name: 'P', benefit: 'free' }], // no eligibility/how/notes/url
      venues: [{ name: 'V Museum', county: 'Marin' }], // no city/type/pathways/freeDays/notes
    });
    assert.strictEqual(out.length, 2);
    const venue = out.find((r) => r.type === 'museum_venue');
    assert.strictEqual(venue.city, 'Marin'); // falls back to county when city absent
    assert.strictEqual(venue.url, '');
  });

  it('produces records whose every column is a bindable scalar', () => {
    const out = kp.loadMuseumAdmission(json);
    const db = kp.buildDatabase(out); // must not throw on bind (arrays coerced to strings)
    assert.strictEqual(db.prepare('SELECT COUNT(*) c FROM resources').get().c, out.length);
    db.close();
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
    [`${base}/_index.json`]: {
      cities: { 'san-jose': { city: 'San Jose' }, oakland: { city: 'Oakland' } },
    },
    [`${base}/san-jose.json`]: {
      slug: 'san-jose',
      topics: {
        pets: {
          sections: [{ title: 'Pigs', text: 'no pigs', url: 'u', keywords: '', sectionId: '1' }],
        },
      },
    },
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
    assert.ok(
      cities.every((c) => c && c.topics),
      'no broken entries'
    );
    assert.ok(!cities.some((c) => c.slug === 'oakland'), 'missing city skipped');
  });

  it('returns [] when the index itself is unavailable', async () => {
    const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({}) });
    const out = await kp.fetchMunicipalCorpus(base, { fetchImpl });
    assert.deepStrictEqual(out, []);
  });

  it('tolerates a per-city fetch that throws', async () => {
    const fetchImpl = async (url) => {
      if (url.endsWith('_index.json'))
        return { ok: true, status: 200, json: async () => ({ cities: { x: { city: 'X' } } }) };
      throw new Error('network blip');
    };
    const out = await kp.fetchMunicipalCorpus(base, { fetchImpl });
    assert.deepStrictEqual(out, []);
  });

  it('returns [] when the index has no cities', async () => {
    const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({}) });
    assert.deepStrictEqual(await kp.fetchMunicipalCorpus(base, { fetchImpl }), []);
  });

  it('falls back to the slug when the index entry lacks a city name', async () => {
    const fetchImpl = async (url) =>
      url.endsWith('_index.json')
        ? { ok: true, status: 200, json: async () => ({ cities: { a: {} } }) }
        : { ok: true, status: 200, json: async () => ({ topics: {} }) };
    const out = await kp.fetchMunicipalCorpus(base, { fetchImpl });
    assert.strictEqual(out[0].city, 'a');
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

  it('accepts string file contents (coerces to Buffer)', () => {
    const m = kp.buildManifest({ version: 1, files: { x: 'hello' } });
    assert.strictEqual(m.files.x.bytes, 5);
    assert.match(m.files.x.sha256, /^[a-f0-9]{64}$/);
  });
});

describe('extractPrompts (DRY: pull from the canonical .ts source)', () => {
  const tsSource = [
    'const today = new Date();',
    'export const SYSTEM_PROMPT = `You are Carl, a friendly assistant.`;',
    'export const INTENT_PARSER_PROMPT = `You are a search intent parser.`;',
    'export const RESPONSE_FORMATTER_PROMPT = `You are Carl. Format the answer.`;',
    'export const OLLAMA_CONFIG = { temperature: 0.4 };',
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

describe('validatePack', () => {
  function writePack() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kp-'));
    fs.writeFileSync(path.join(dir, 'corpus.sqlite'), Buffer.from('binary-corpus'));
    const manifest = kp.buildManifest({
      version: 1,
      files: { 'corpus.sqlite': Buffer.from('binary-corpus') },
    });
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    return dir;
  }

  it('returns ok for a well-formed pack', () => {
    const dir = writePack();
    assert.deepStrictEqual(kp.validatePack(dir), { ok: true, errors: [] });
  });

  it('flags a missing file listed in the manifest', () => {
    const dir = writePack();
    fs.rmSync(path.join(dir, 'corpus.sqlite'));
    const res = kp.validatePack(dir);
    assert.strictEqual(res.ok, false);
    assert.ok(res.errors.some((e) => /corpus\.sqlite/.test(e) && /missing/i.test(e)));
  });

  it('flags a hash mismatch', () => {
    const dir = writePack();
    fs.writeFileSync(path.join(dir, 'corpus.sqlite'), Buffer.from('tampered'));
    const res = kp.validatePack(dir);
    assert.strictEqual(res.ok, false);
    assert.ok(res.errors.some((e) => /corpus\.sqlite/.test(e) && /hash/i.test(e)));
  });

  it('flags a missing manifest', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kp-'));
    const res = kp.validatePack(dir);
    assert.strictEqual(res.ok, false);
    assert.ok(res.errors.some((e) => /manifest/i.test(e)));
  });

  it('flags an unparseable manifest', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kp-'));
    fs.writeFileSync(path.join(dir, 'manifest.json'), '{ not valid json');
    const res = kp.validatePack(dir);
    assert.strictEqual(res.ok, false);
    assert.ok(res.errors.some((e) => /valid JSON/i.test(e)));
  });

  it('treats a manifest with no files block as valid', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kp-'));
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ version: 1 }));
    assert.deepStrictEqual(kp.validatePack(dir), { ok: true, errors: [] });
  });
});
