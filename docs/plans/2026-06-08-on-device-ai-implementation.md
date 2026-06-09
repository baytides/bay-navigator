# On-Device AI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move user-facing Carl AI on-device in the apps and retire the self-hosted GPU,
starting with the shared local-retrieval layer that both apps are blocked on.

**Architecture:** Separate retrieval (local SQLite/FTS5 over the ~6 MB corpus, one shared
builder) from generation (Apple FoundationModels on-device; Flutter hosted-first behind a
capability seam; Android Gemini Nano later). A versioned "Knowledge Pack" carries corpus +
prompts + config for OTA updates. Website left unchanged.

**Tech Stack:** Node 24 (`node:sqlite` builtin, FTS5) for the builder + tests; Swift 6 /
FoundationModels (iOS 26+) for Apple; Dart/Flutter + ML Kit GenAI for Android.

**Design doc:** `docs/plans/2026-06-08-on-device-ai-migration-design.md`

**Reality check (assessed 2026-06-08):** assistant is 100% remote today
(`ai.baytides.org`, `ollama.baytides.org`, `search.baytides.org`). Existing on-device code is
orphaned (iOS, against a non-existent API), dead (Flutter), or stubbed (Android). Local
retrieval is 100% missing. **Preserve** crisis detection, PII sanitization, and Tor/
domain-fronting on every path.

---

## Phasing & toolchain reality

| Phase | Scope | Buildable/verifiable here? |
|---|---|---|
| **1** | Knowledge Pack builder + local retrieval contract | ✅ Yes — `node:sqlite` builtin. **This plan details it fully.** |
| **2** | Apple: rewrite FM service vs real API, bundle corpus, tools, routing | ⚠️ Needs Xcode + iOS 26 SDK. Outline below → own plan later. |
| **3** | Flutter/Android: wire seam, local retrieval, real Nano inference | ❌ Flutter not installed here. Outline below → own plan later. |
| **4** | Telemetry taxonomy + cutover gating | Partly here (shared schema), rest with apps. |

Phase 1 is the critical path: it is the missing foundation, and it defines the **retrieval
contract** the apps mirror. Build it first, verified, before touching app code.

---

# PHASE 1 — Knowledge Pack Builder (detailed)

**Outcome:** `npm run generate:pack` produces `public/api/knowledge-pack/` containing
`corpus.sqlite` (FTS5-indexed) + `prompts.json` + `retrieval-config.json` + `manifest.json`,
wired into the existing `generate-api` pipeline. A documented `searchCorpus()` function is the
retrieval contract.

**Inputs (existing, verified):**
- `public/api/search-index.json` -> `.documents[]` = `{id,name,description,keywords,category,area,city,groups}` (~1,486 resource records)
- `public/data/california-codes-content.json` (2.0 MB)
- `public/data/municipal-codes-content.json` (1.5 MB; object keyed by `cities`, `categories`, `stats`, ...)
- `public/api/programs.json` (1.4 MB, benefits)
- `public/data/open-data-cache.json` (788 KB)

**Conventions:** tests are `node --test tests/unit/*.test.cjs` (see `package.json`). Builder is
a `.cjs` under `scripts/generate/`. Commit after each green task.

---

### Task 1: Scaffold builder + test + npm script

**Files:**
- Create: `scripts/generate/lib/knowledge-pack.cjs` (pure functions, importable/testable)
- Create: `scripts/generate/generate-knowledge-pack.cjs` (thin CLI wrapper)
- Create: `tests/unit/knowledge-pack.test.cjs`
- Modify: `package.json` (add `"generate:pack"` and include in `generate-api`)

**Step 1 — failing test:**
```js
// tests/unit/knowledge-pack.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const kp = require('../../scripts/generate/lib/knowledge-pack.cjs');

test('module exposes the builder API', () => {
  assert.strictEqual(typeof kp.normalizeResources, 'function');
  assert.strictEqual(typeof kp.buildDatabase, 'function');
  assert.strictEqual(typeof kp.searchCorpus, 'function');
  assert.strictEqual(typeof kp.buildManifest, 'function');
});
```

**Step 2 — run, expect fail:** `npm run test:unit -- tests/unit/knowledge-pack.test.cjs`
Expected: FAIL (module not found).

**Step 3 — minimal impl:** create `lib/knowledge-pack.cjs` exporting the four functions as
stubs that throw `'not implemented'`.

**Step 4 — run, expect pass.**

**Step 5 — commit:** `git commit -m "feat(pack): scaffold knowledge-pack builder + tests"`

---

### Task 2: Normalize resource records into the common shape

The corpus mixes record types. Define one normalized shape:
```
{ id, type, title, body, category, area, city, keywords, url, lat, lon, meta }
```
`type` is one of `resource | ca_code | muni_code | program`. `body` is the searchable long text.

**Step 1 — failing test:**
```js
test('normalizeResources maps search-index documents to common shape', () => {
  const docs = [{ id: '211-bay-area', name: '2-1-1 Bay Area',
    description: 'free helpline ... food assistance', keywords: '211, helpline, food',
    category: 'Community Services', area: 'Bay Area', city: '', groups: ['everyone'] }];
  const out = kp.normalizeResources(docs);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].type, 'resource');
  assert.strictEqual(out[0].title, '2-1-1 Bay Area');
  assert.match(out[0].body, /helpline/);
  assert.strictEqual(out[0].category, 'Community Services');
});
```

**Step 2 — fail. Step 3 — implement** `normalizeResources(documents)` mapping `name -> title`,
`description (+ keywords) -> body`, passthrough category/area/city, `type:'resource'`.
**Step 4 — pass. Step 5 — commit.**

---

### Task 3: Build the SQLite database with FTS5

**Step 1 — failing test:**
```js
test('buildDatabase creates an FTS5-searchable corpus', () => {
  const recs = [
    { id:'a', type:'resource', title:'Alameda Food Bank', body:'free groceries CalFresh emergency food', category:'Food', area:'Alameda', city:'Oakland', keywords:'food', url:'', lat:null, lon:null, meta:{} },
    { id:'b', type:'resource', title:'Bike Repair Co-op', body:'fix bicycles tools', category:'Recreation', area:'SF', city:'San Francisco', keywords:'bike', url:'', lat:null, lon:null, meta:{} },
  ];
  const db = kp.buildDatabase(recs); // in-memory DatabaseSync
  const rows = db.prepare("SELECT id FROM resources_fts WHERE resources_fts MATCH ? ORDER BY rank").all('food');
  assert.ok(rows.some(r => r.id === 'a'));
  assert.ok(!rows.some(r => r.id === 'b'));
});
```

**Step 3 — implement** with `node:sqlite`. Define the DDL as SQL and apply it via the
database's bulk-statement method, then insert rows with prepared statements:

```sql
CREATE TABLE resources (id TEXT PRIMARY KEY, type TEXT, title TEXT, body TEXT,
  category TEXT, area TEXT, city TEXT, keywords TEXT, url TEXT, lat REAL, lon REAL, meta TEXT);
CREATE VIRTUAL TABLE resources_fts USING fts5(id, title, body, keywords, category);
```

```js
const { DatabaseSync } = require('node:sqlite');
function buildDatabase(records, { path = ':memory:' } = {}) {
  const db = new DatabaseSync(path);
  applySchema(db);  // runs the DDL above via the database's bulk-statement method
  const ins = db.prepare(`INSERT INTO resources
    (id,type,title,body,category,area,city,keywords,url,lat,lon,meta)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insF = db.prepare(`INSERT INTO resources_fts
    (id,title,body,keywords,category) VALUES (?,?,?,?,?)`);
  for (const r of records) {
    ins.run(r.id, r.type, r.title, r.body, r.category, r.area, r.city,
            r.keywords, r.url, r.lat, r.lon, JSON.stringify(r.meta||{}));
    insF.run(r.id, r.title, r.body, r.keywords, r.category);
  }
  return db;
}
```
(Using a plain — non-external-content — FTS5 table keeps it simple at this scale; the
`resources` table holds full rows for filtering, the FTS table is the index.)
**Step 4 — pass. Step 5 — commit.**

---

### Task 4: `searchCorpus()` — the retrieval contract

This signature is what the Swift/Dart retrieval layers mirror. Document it.

**Step 1 — failing test:** query returns ranked results; `category` filter narrows; `limit`
caps; empty query returns `[]`.
```js
test('searchCorpus ranks by relevance and honors filters', () => {
  const db = kp.buildDatabase(/* fixtures incl Food + Recreation */);
  const hits = kp.searchCorpus(db, 'food', { limit: 5 });
  assert.ok(hits[0].title.match(/Food/));
  const filtered = kp.searchCorpus(db, 'food', { category: 'Recreation' });
  assert.strictEqual(filtered.length, 0);
  assert.deepStrictEqual(kp.searchCorpus(db, '   '), []);
});
```

**Step 3 — implement** `searchCorpus(db, query, {category, area, limit=10})`: sanitize query
into an FTS5 MATCH expression (escape quotes, OR the tokens, add prefix `*`), join the
`resources` table for the full row + filters, order by `bm25(resources_fts)`, map to result
objects. Return `[]` on blank query. **Step 4 — pass. Step 5 — commit.**

> Note: FTS5 is lexical (no typo tolerance). The model's intent-parse step supplies expanded
> keywords. Semantic embeddings are deferred (design section 13, YAGNI) — revisit if telemetry
> shows misses.

---

### Task 5: Loaders for California & municipal codes

**Step 1 — failing tests:** `loadCaliforniaCodes(json)` and `loadMunicipalCodes(json)` each
return normalized records with `type:'ca_code'`/`'muni_code'`, non-empty `body`, and a `city`
for muni codes. Use a small inline fixture mirroring the real structure (first inspect
`public/data/municipal-codes-content.json` under `.cities` during implementation).

**Step 3 — implement** the two loaders, walking each source's structure into the common shape
(title = section name, body = ordinance/section text, city from the muni structure).
**Step 4 — pass. Step 5 — commit.**

---

### Task 6: Assemble prompts + retrieval-config from existing sources (DRY)

Do **not** rewrite prompts — extract the existing tuned ones so on-device and remote share a
source of truth.

**Step 1 — failing test:** `buildPromptPack()` returns `{ systemPrompt, intentParse,
responseFormat }`, all non-empty strings, sourced from existing files.

**Step 3 — implement:** read from `src/data/assistant-system-prompt.ts` (and/or the prompt
strings in `SmartAssistantService.swift` — pick the canonical one and note it) and emit
`prompts.json`. Emit `retrieval-config.json` with `{ searchKeys, weights, synonyms:{} }`
seeded from `generate-search-index.cjs` `SEARCH_KEYS`. **Step 4 — pass. Step 5 — commit.**

---

### Task 7: Manifest with versioning + hashes

**Step 1 — failing test:**
```js
test('buildManifest carries version, sha256 hashes, and compat floors', () => {
  const m = kp.buildManifest({ version: 42, files: { 'corpus.sqlite': Buffer.from('x') } });
  assert.strictEqual(m.version, 42);
  assert.match(m.files['corpus.sqlite'].sha256, /^[a-f0-9]{64}$/);
  assert.ok('minAppVersion' in m && 'minModelVersion' in m);
});
```

**Step 3 — implement** `buildManifest({version, files, minAppVersion, minModelVersion})` using
`node:crypto` sha256 per file. **Step 4 — pass. Step 5 — commit.**

---

### Task 8: CLI wrapper + wire into pipeline

**Files:** `scripts/generate/generate-knowledge-pack.cjs`; `package.json`.

**Step 1:** implement the CLI: load all real inputs -> normalize -> build the database at
`public/api/knowledge-pack/corpus.sqlite` -> write `prompts.json`, `retrieval-config.json`,
`manifest.json`. Add `"generate:pack": "node scripts/generate/generate-knowledge-pack.cjs"`
and append `&& npm run generate:pack` to `generate-api`.

**Step 2 — verify end-to-end (real data):**
```bash
npm run generate:pack
ls -la public/api/knowledge-pack/
node -e "const {DatabaseSync}=require('node:sqlite');const kp=require('./scripts/generate/lib/knowledge-pack.cjs');const db=new DatabaseSync('public/api/knowledge-pack/corpus.sqlite');console.log(kp.searchCorpus(db,'food bank',{limit:3}).map(r=>r.title));console.log(kp.searchCorpus(db,'pet pig',{limit:3}).map(r=>r.title));"
```
Expected: food results for "food bank"; a San Jose municipal-code section for "pet pig".

**Step 3 — commit:** `git commit -m "feat(pack): build knowledge pack from full corpus + wire into generate-api"`

---

### Task 9: Pack validator (CI-friendly)

**Step 1 — failing test:** `validatePack(dir)` returns `{ok:true}` for a good pack and
`{ok:false, errors:[...]}` when a file is missing or a hash mismatches the manifest.
**Step 3 — implement.** **Step 4 — pass.** Optionally add to `scripts/validate/`. **Commit.**

---

### Phase 1 Definition of Done
- `npm run test:unit` green (all knowledge-pack tests).
- `npm run generate:pack` builds `public/api/knowledge-pack/*` from real data.
- Real queries return relevant hits (food bank -> food; pet pig -> San Jose muni code).
- `searchCorpus()` contract documented in `lib/knowledge-pack.cjs` header.
- Coverage meets repo gate (`test:unit:coverage` >= 80/80/70).

---

# PHASE 2 — Apple on-device (outline; needs Xcode + iOS 26 SDK -> own plan)

**Bump deployment target** of `BayNavigatorCore` (Apple targets) to iOS/macOS 26 for the FM
paths (guarded with `#available`).

1. **Rewrite `AppleIntelligenceService.swift` against the real API** (current code won't
   compile): `SystemLanguageModel.default` + `switch model.availability`; sessions via
   `LanguageModelSession(model:tools:instructions:)`; `respond(to:)` / streaming.
2. **Bundle `corpus.sqlite`** in `BayNavigatorCore` resources; add `LocalRetrievalService`
   (GRDB or SQLite C) implementing the Phase-1 `searchCorpus` contract.
3. **Define FoundationModels Tools:** `SearchResourcesTool` (-> LocalRetrievalService) and
   `FindNearbyTool` (-> MapKit), with `@Generable` argument structs.
4. **Knowledge Pack sync service:** fetch manifest, download newer compatible pack to
   Application Support, swap; bundled baseline as fallback.
5. **Routing in `SmartAssistantViewModel`/`SmartAssistantService`:** if FM available -> on-device
   agent; else -> existing remote path. **Preserve** crisis detection, PII sanitization,
   Tor/domain-fronting on the fallback path.
6. **Verify:** build in Xcode; run iOS 26 simulator/device against the eval set
   (design section 12); confirm no network in the on-device path.

# PHASE 3 — Flutter / Android (outline; needs Flutter -> own plan)

1. **`Generator` seam in Dart:** `HostedGenerator` (existing remote) + `OnDeviceGenerator`
   (platform channel); capability-based selection. **Wire `OnDeviceAIService` into the actual
   flow** (`api_service.performAISearch`) — it is currently dead code.
2. **Bundle `corpus.sqlite`** as a Flutter asset; local retrieval via `sqlite3`/`drift`
   mirroring `searchCorpus` — retrieval is local even when generation is hosted.
3. **Replace `OnDeviceAIPlugin.kt` stub** with real ML Kit GenAI Prompt API calls (text-only;
   no native tool calling — hand-roll tool behavior via prompt+parse). Feature-detect -> hosted
   fallback.
4. **Preserve** crisis detection + PII sanitization in the Dart path.
5. **Verify:** `flutter test`; run on a supported Android device (Pixel 9/Galaxy S25 class) +
   a non-supported device to exercise both branches.

# PHASE 4 — Telemetry & cutover (outline)

1. **Event taxonomy (anonymous counters only, no query content):** `on_device_ok`,
   `fallback_unsupported_device`, `fallback_local_failed`. Distinguishing the last two is the
   cut/no-cut signal.
2. **Threshold + dashboard;** when `fallback_local_failed` is ~0 and supported-device traffic
   dominates, retire the website widget + VM (separate change; **website untouched in this
   work**).

---

## Risks / notes
- FTS5 is lexical only; rely on model query-expansion, defer embeddings (YAGNI).
- Apple FM tool-calling is first-class; Android Nano is text-only — do not block Flutter launch
  on on-device tool-calling.
- Keep one **source of truth for prompts** (the Knowledge Pack) to stop Swift/Dart/remote
  drifting.
- Safety features (crisis, PII, Tor, domain-fronting) are non-negotiable on every path.
