# On-Device AI — Phase 2 (Apple) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Requires a machine with **Xcode + iOS 26 SDK** (not available in the env where Phase 1 was built).

**Goal:** Make Carl answer fully on-device on Apple platforms — local FTS5 retrieval (the Phase 1 corpus) feeding a FoundationModels tool-calling agent — with the existing remote pipeline kept only as a fallback.

**Architecture:** Bundle the Phase 1 `corpus.sqlite`. A `LocalRetrievalService` (GRDB/FTS5) mirrors the Phase 1 `searchCorpus` contract. A rewritten `AppleIntelligenceService` runs a `LanguageModelSession` with two `Tool`s (`searchResources`, `findNearby`). `SmartAssistantViewModel` routes to on-device when available, else the existing remote `SmartAssistantService.search()`. Crisis detection, PII sanitization, and Tor/domain-fronting are preserved on the fallback.

**Tech Stack:** Swift 6, FoundationModels (iOS/macOS 26+), GRDB.swift (SQLite/FTS5), MapKit, Swift Testing.

**Prerequisites:**
- Phase 1 merged; `npm run generate:pack` produces `public/api/knowledge-pack/corpus.sqlite`.
- The pack is gitignored — Task 1 defines how the Apple build obtains it.

**Reality from assessment (2026-01 commit `4c4d52b8`):** `AppleIntelligenceService.swift`
is orphaned AND written against a non-existent API (iOS 18.1 / `LanguageModelSession.isAvailable`).
It must be **rewritten**, not wired. `SmartAssistantService.swift` is the working remote pipeline
(endpoints `ai.baytides.org`, `ollama.baytides.org`, `search.baytides.org`; `search()` at line 255;
Tor at 199–227; vLLM model `qwen2.5:3b-instruct`). `SmartAssistantViewModel` calls
`assistantService.search()` (~line 100) and only reads `AppleIntelligenceService` for an availability label.

---

### Task 1: Bundle the corpus + add GRDB + raise FM availability

**Files:**
- Modify: `apps/apple/BayNavigatorCore/Package.swift`
- Add (build step): `apps/apple/scripts/sync-knowledge-pack.sh`
- Resource: `apps/apple/BayNavigatorCore/Sources/BayNavigatorCore/Resources/corpus.sqlite`

**Steps:**
1. Add GRDB to `Package.swift` dependencies:
   `.package(url: "https://github.com/groue/GRDB.swift.git", from: "7.0.0")` and add
   `.product(name: "GRDB", package: "GRDB.swift")` to the target.
2. Add the corpus to the target `resources:` array as **`.copy("Resources/corpus.sqlite")`**
   (copy, not process — it's a binary; `.process` would try to optimize it).
3. Create `apps/apple/scripts/sync-knowledge-pack.sh` that runs `npm run generate:pack` at repo
   root and copies `public/api/knowledge-pack/corpus.sqlite` into the Resources dir. Document
   running it before an Xcode build (and add as an Xcode "Run Script" build phase later).
4. Keep `platforms` at iOS 17 / macOS 14 (the app still supports them); gate all FoundationModels
   code with `if #available(iOS 26, macOS 26, *)`. Do NOT raise the package floor — that would
   drop older devices entirely.

**Verify:** `cd apps/apple/BayNavigatorCore && swift build` resolves GRDB and finds the resource.
**Commit.**

---

### Task 2: `LocalRetrievalService` (GRDB/FTS5) — mirror the `searchCorpus` contract

**Files:**
- Create: `apps/apple/BayNavigatorCore/Sources/BayNavigatorCore/Services/LocalRetrievalService.swift`
- Test: `apps/apple/BayNavigatorCore/Tests/BayNavigatorCoreTests/LocalRetrievalServiceTests.swift`

This is the Swift twin of Phase 1's `searchCorpus`. Same behavior: bm25 weights
title>keywords>body, category/area filters, OR+prefix tokens, lexical only.

**Step 1 — failing test (Swift Testing):** build a tiny in-memory GRDB DB with the Phase 1
schema, insert two rows (food bank, bike co-op), assert `search("food")` returns the food bank
and not the bike co-op, and that a title match outranks a body-only match.

**Step 2 — run, expect fail.**

**Step 3 — implement** `LocalRetrievalService`:
- `init(databaseURL:)` opens the bundled `corpus.sqlite` (read-only `DatabaseQueue`).
- `func search(_ query: String, category: String? = nil, area: String? = nil, limit: Int = 10) -> [RetrievedResource]`
- Sanitize the query the same way Phase 1 does: lowercase, extract `[a-z0-9]+` tokens, map to
  `token*` joined by ` OR ` (return `[]` for blank).
- SQL: `SELECT r.* FROM resources_fts JOIN resources r ON r.id = resources_fts.id WHERE
  resources_fts MATCH ? [AND r.category = ?] [AND r.area = ?] ORDER BY
  bm25(resources_fts, 0.0, 10.0, 5.0, 1.0, 1.0) LIMIT ?` (weights = id,title,keywords,body,category).
- Map rows to a `RetrievedResource` struct (id, type, title, body, category, city, url, meta).

**Step 4 — run, expect pass. Step 5 — commit.**

> Keep the bm25 weight vector and tokenization identical to `scripts/generate/lib/knowledge-pack.cjs`.
> If they drift, retrieval differs between platforms. Add a code comment cross-referencing it.

---

### Task 3: Rewrite `AppleIntelligenceService` against the real FoundationModels API

**Files:** Modify `apps/apple/BayNavigatorCore/Sources/BayNavigatorCore/Services/AppleIntelligenceService.swift`

The current file uses non-existent symbols. Replace with the real API:
- Availability: `SystemLanguageModel.default` then `switch model.availability { case .available / .unavailable(let reason) }`. Expose `var isAvailable: Bool`.
- Generation: `let session = LanguageModelSession(model: .default, tools: [...], instructions: ...)`,
  then `let response = try await session.respond(to: prompt)` (or `streamResponse`).
- Gate everything with `if #available(iOS 26, macOS 26, visionOS 26, *)`; non-26 → `isAvailable = false`.

**Step 1 — failing test:** a test asserting `AppleIntelligenceService.shared.isAvailable` is a
Bool and (on a non-26 host / unavailable model) generation routes return nil/throws cleanly so
the caller falls back. (Full generation is verified on-device in Task 7.)

**Step 3 — implement** the rewrite. Delete the bogus `LanguageModelSession.isAvailable` / iOS 18.1
paths entirely (do not adapt them).

**Step 4 — build + test. Step 5 — commit.**

---

### Task 4: FoundationModels Tools — `searchResources` + `findNearby`

**Files:**
- Create: `.../Services/AITools/SearchResourcesTool.swift`, `.../Services/AITools/FindNearbyTool.swift`
- Test: `.../Tests/BayNavigatorCoreTests/AIToolsTests.swift`

**Step 1 — failing test:** construct `SearchResourcesTool(retrieval: LocalRetrievalService(testDB))`,
call its `call(arguments:)` with `{query:"food", category:nil}`, assert it returns the food bank
record. (Tool conformance is exercised directly, no model needed.)

**Step 3 — implement:**
- `SearchResourcesTool: Tool` with `@Generable struct Arguments { @Guide(description:...) var query: String; var category: String? }`,
  `name = "searchResources"`, `description = "Search Bay Area resources, programs, and local/state codes."`
  `func call(arguments:) async -> ...` returns the top N `LocalRetrievalService.search` results as a
  string/`GeneratedContent` the model can cite.
- `FindNearbyTool: Tool` taking `{category, latitude, longitude}` (or a resolved place), using
  MapKit (`MKLocalSearch` / distance against resource lat/lon) to rank by proximity.

**Step 4 — build + test. Step 5 — commit.**

---

### Task 5: `KnowledgePackService` — bundled baseline + OTA swap

**Files:** Create `.../Services/KnowledgePackService.swift`; test with an injected fetcher.

**Step 1 — failing test:** with a fake manifest fetcher returning a higher `version` than the
bundled one and a matching `minAppVersion`/`minModelVersion`, the service selects the downloaded
DB path; when the remote is older or incompatible, it keeps the bundled path; on fetch failure it
falls back to bundled.

**Step 3 — implement:** read bundled `manifest.json`; fetch remote manifest; compare version +
compatibility floors; download to Application Support and verify sha256 before swapping; expose the
active `corpus.sqlite` URL for `LocalRetrievalService`. Content-neutral request (no query content)
— preserves the privacy property. **Step 4 — test. Step 5 — commit.**

---

### Task 6: Route the assistant — on-device agent, remote fallback (preserve safety)

**Files:** Modify `.../ViewModels/SmartAssistantViewModel.swift` (~line 100) and
`.../Services/SmartAssistantService.swift`.

**Step 1 — failing test:** a routing test (inject a fake `AppleIntelligenceService` whose
`isAvailable` toggles): when available, the VM uses the on-device agent path; when unavailable, it
calls the existing `assistantService.search(...)`. Assert crisis-detection + PII-sanitization run
on **both** paths.

**Step 3 — implement:**
- Add an on-device path: build the `LanguageModelSession` (tools from Task 4, instructions from the
  bundled `prompts.json`), call it, map the result into the same view model used today
  (`.programs` + `.message`).
- Keep the remote `search()` path unchanged as the `else` branch (incl. Tor/domain-fronting at
  `SmartAssistantService:199–227`).
- Run crisis detection + PII sanitization **before** either path (factor out if currently inline in
  the remote path).

**Step 4 — build + test. Step 5 — commit.**

---

### Task 7: On-device verification + eval

**Steps:**
1. Build & run on an **iOS 26 simulator/device** with Apple Intelligence enabled.
2. Run the eval set in-app and confirm correct, grounded answers (quote source):
   - "Can I have a pet pig in San Jose?" → municipal code
   - "Food bank near Oakland" → resource + map (findNearby)
   - "How do I apply for CalFresh?" → program with how-to + phone
   - "What does the noise ordinance say?" → muni code
3. Confirm **no network** on the on-device path (Instruments/Charles) — proves drivers B & C.
4. Toggle Apple Intelligence off → confirm clean fallback to remote, with crisis/PII intact.
5. **Commit** results notes.

---

## Definition of Done
- `swift build` + `swift test` green for new services/tools/routing.
- On-device path answers the eval set correctly with zero network.
- Fallback to remote works on non-26 / Apple-Intelligence-off devices, safety features intact.
- bm25 weights + tokenization match Phase 1 `knowledge-pack.cjs` (cross-referenced in comments).

## Risks / notes
- GRDB vs raw SQLite3: GRDB chosen for ergonomic FTS5 + migrations; raw `sqlite3` is the fallback if avoiding the dep.
- Bundled corpus is gitignored — CI/Xcode must run `sync-knowledge-pack.sh` before building, or commit a baseline pack for the Apple target specifically.
- Quality parity: compare on-device answers vs the current vLLM pipeline on the eval set before trusting it as primary.
