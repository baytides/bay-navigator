# On-Device AI Migration Design

**Date:** 2026-06-08
**Status:** Design — validated through brainstorming, not yet planned for implementation
**Author:** Steven (with Claude)

## 1. Goal & Drivers

Move user-facing AI ("Carl") out of the self-hosted inference path and into the apps,
running on-device wherever the platform allows. Retire the self-hosted `carl-ai-vm` GPU
(Ollama / `Qwen2.5-3B-Instruct`).

Driver priority (user-confirmed mix):

- **A — Kill the self-hosted GPU.** Carl going down currently takes the app's AI down,
  and the VM is a standing cost/strain on personal hardware.
- **B — Privacy.** User queries should not leave the device.
- **C — Latency.** No network round-trip in the AI hot path.

All three point the same way: **zero network in the AI hot path** on capable platforms.
Any call to a remote model is therefore a *fallback*, never the normal flow.

## 2. End State

> AI for **users** lives only in the **apps**, on-device where possible. The **website
> frontend** has **no user-facing AI** (search + maps + data browsing only). The website
> **backend/build** may still use AI for data enrichment — never shipped to users. The
> self-hosted `carl-ai-vm` GPU is retired entirely.

### Platform map

| Surface | Tech | User-facing AI |
|---|---|---|
| Website — frontend | Astro | **None.** Strong search UI + maps over the same corpus. `SmartAssistant.astro` user widget removed. |
| Website — backend/build | CI / scripts | AI used for data enrichment only (not shipped to users). |
| Apple apps | native **Swift** (`BayNavigatorCore`) | **On-device** via Apple Foundation Models (tool-calling agent). |
| Other apps (Android, etc.) | **Flutter** (`apps/lib/...`) | **Hosted-first** (rented API), with an on-device seam for later. |

Historical note: the apps were once all Flutter; Apple has since been moved to native
Swift (`BayNavigatorCore`). Non-Apple platforms remain Flutter.

## 2a. Current State (assessed 2026-06-08)

The assistant is **100% remote on both apps today.** Every query hits the servers:

| Service | Endpoint | Role |
|---|---|---|
| vLLM (GPU) | `ai.baytides.org/v1/chat/completions` | intent parse + response format |
| Ollama (CPU) | `ollama.baytides.org/api/chat` | fallback |
| Typesense | `search.baytides.org` | retrieval (the corpus) |

The `carl-ai-vm` now sits behind these domains (not the raw IP).

A Jan-2026 commit (`4c4d52b8` "Deeper AI Integration") added **on-device scaffolding that is
orphaned or stubbed** — useful as a blueprint, but not a working head start:

- **iOS `AppleIntelligenceService.swift`** — exists, but `SmartAssistantViewModel` only calls
  it to set an availability *label*; generation still goes remote. **And it is written against
  a non-existent API**: it targets iOS 18.1 / macOS 15.1 and uses
  `LanguageModelSession.isAvailable`, whereas the real FoundationModels framework is
  **iOS/macOS 26.0+** and gates on `SystemLanguageModel.default` + `.availability`. **It will
  not compile against the real framework — it needs rewriting, not just wiring.**
- **Flutter `on_device_ai_service.dart`** — structurally complete but **dead code** (referenced
  nowhere outside itself).
- **Android `OnDeviceAIPlugin.kt`** — `generateResponse()` is a **stub returning `null`**,
  forcing remote fallback.
- **Local retrieval is 100% missing** on both platforms (no SQLite/FTS/bundled corpus). This
  is the real bottleneck and the critical path.

**Reusable assets (keep and preserve):** the two-call RAG pipeline + well-tuned prompts,
intent parsing, conversation history, **crisis detection, PII sanitization**, and **Tor +
domain-fronting** for users in censored regions. These must survive on-device *and* on the
hosted fallback — they are non-negotiable for this app's audience.

## 3. Core Architectural Principle — Separate Retrieval from Generation

Carl today is a RAG pipeline, not just an LLM:

```
Call 1 (intent parse) → Typesense search → Call 2 (response format)
```

The model never sees the whole corpus; **retrieval** finds the relevant slice and feeds
only that into the model. The migration keeps this shape and splits the two halves so each
can be placed where it is cheapest:

- **Retrieval** — cheap, deterministic, portable. Runs **locally on every platform**
  (SQLite + FTS5). One corpus, one indexer, bundled into every app. Compiles for both
  Swift and Flutter unchanged.
- **Generation** — expensive and platform-fragmented. Pushed to whoever can do it cheapest
  per platform: on-device on Apple, rented-hosted on Flutter/old-Apple, dropped entirely on
  the website.

This single split is what lets **one corpus serve three different AI postures**.

## 4. The Corpus (verified sizes, 2026-06-08)

The retrievable Q&A corpus is small. Geo/map data (transit-stops ~6 MB, caltrans ~5 MB) is
**not** part of it — that is handled by MapKit as structured lookups, never fed to the LLM.

| Data | Size |
|---|---|
| Resource directory / search index (~1,486 records) | 560 KB |
| California codes content | 2.0 MB |
| Municipal codes content | 1.5 MB |
| Programs / benefits | ~1.4 MB |
| Open-data cache | 788 KB |
| **Core total** | **~6 MB of text** |

~6 MB bundles into an app trivially. Storage is not the design constraint; **retrieval
quality** is (finding the right ~6 KB slice of the 6 MB).

## 5. Retrieval Engine — SQLite FTS5 (start here)

Decision: **start with SQLite FTS5 (keyword/full-text).**

- Matches today's behavior (Typesense/Fuse are primarily lexical + typo-tolerant).
- Tiny, instant, rock-solid offline. Same engine on Swift and Flutter.
- Lexical-only weakness ("food bank" ≠ "CalFresh") is mitigated because the model's
  **intent-parse step expands the query to keywords** before search.
- **Later upgrade if telemetry shows lexical misses:** add on-device embeddings
  (Apple `NLEmbedding` / Core ML) for semantic recall, or hybrid (FTS5 recall + embedding
  rerank). Deferred under YAGNI.

The same `search-index.json` that powers the website's search compiles into the SQLite DB,
so the website's no-AI search also improves for free.

## 6. The Agent (Apple) — Tools, not a fixed pipeline

Apple's Foundation Models has first-class **tool calling** and `@Generable` structured
output (verified — see Appendix). So on Apple, Carl becomes a small **agent with tools**,
which is richer than today's rigid two-call pipeline:

```swift
@Tool searchResources(query, category) -> [Resource]   // FTS5 over the 6 MB corpus
@Tool findNearby(resources, location)  -> [MapResult]   // MapKit
```

For a query like *"find me a food bank near Oakland"*, the model composes tools:
`searchResources("food bank")` → pipe into `findNearby(..., Oakland)` → answer with map
pins. The model decides which tools to invoke; maps stop being a special case and become
just another tool.

This composition is the part that is genuinely **better** on-device than today, not merely
cheaper.

## 7. Generation per Platform

### Apple (native Swift)
- Foundation Models, on-device, tool-calling agent (Section 6).
- No network in the hot path → satisfies A, B, C fully on capable devices.
- Old/unsupported Apple devices during transition: fall back to the **same thin hosted API
  as Flutter** (never the self-hosted VM).

### Flutter (Android, etc.) — hosted-first, on-device seam
Android has **no universal on-device model**, and Flutter has **no first-class bridge** to
the system Gemini Nano (Firebase's on-device hybrid explicitly excludes Flutter — see
Appendix). So:

- **Now:** thin **hosted API** (rented inference, e.g. Claude Haiku). This still kills the
  self-hosted GPU (driver A) — you rent per-call instead of running a GPU 24/7 — but keeps
  network in the path (no B/C for Flutter users yet). Retrieval stays local.
- **Architect the seam now:** put generation behind an interface with two implementations
  and a runtime capability check choosing between them:

  ```
  abstract class Generator { Future<Answer> generate(Prompt p); }
  class HostedGenerator     implements Generator { ... }   // ships first
  class OnDeviceGenerator   implements Generator { ... }   // filled in later
  Generator pick() => deviceSupportsOnDevice() ? OnDeviceGenerator() : HostedGenerator();
  ```

- **Later upgrade (option 2):** turn on Android on-device for supported devices. Two routes,
  both more work than Apple:
  1. **Platform channels → ML Kit GenAI Prompt API** (system Nano via AICore). But the
     Prompt API is **text-in/text-out only — no native tool calling** (Appendix), so the
     agent's tool-calling would have to be hand-rolled (prompt-to-JSON + parse), which is
     fragile on a 3B. Use feature detection + hosted fallback.
  2. **`flutter_gemma`** (MediaPipe + a bundled Gemma model, cross-platform, advertises
     function calling) — but ships its own large model download.

Do **not** block the Flutter launch on on-device tool-calling working well. Ship
hosted-first; flip devices to on-device as the seam allows.

### Website
- No user generation. Drop `SmartAssistant.astro`'s user widget. Expose the corpus as a
  strong search UI (+ maps). Backend/build AI for data enrichment is unaffected.

## 8. Knowledge Pack — OTA updates without app releases

Goal: push **listings** and **Carl's behavior** without an App Store / Play release. (The
on-device model *weights* are the OS's job — Apple/Google update them via OS updates — and
are neither shippable nor desirable for us to ship.)

A versioned **Knowledge Pack** rides one sync channel, reusing the existing weekly data
pipeline:

```
knowledge-pack-v<N>/
  corpus.sqlite          ← FTS5 listings (the ~6 MB)
  prompts.json           ← system prompt, instructions, tool specs
  examples.json          ← few-shot tuning for Carl's voice/behavior
  retrieval-config.json  ← ranking weights, synonyms
  manifest.json          ← { version, hash, minAppVersion, minModelVersion }
```

Today these behavior files already exist as `assistant-system-prompt.ts`,
`carl-knowledge.ts`, `carl-responses.ts`, `refinement-config.json` — moving them into the
synced pack is natural.

**Flow:**
1. App **bundles a baseline pack** → works offline on first launch / on a plane.
2. On launch, fetch `manifest.json`; if a newer **compatible** pack exists, download to
   writable storage and swap it in.
3. Read remote pack if present & valid, else fall back to bundled baseline.

**Properties:**
- Sync is **content-neutral** — requests "latest pack," never sends a user query → preserves
  B; not in the hot path → does not touch C.
- `minModelVersion` gates packs so a prompt tuned for one OS model version is not pushed to
  an older on-device model it misbehaves on.
- `minAppVersion` gates pack-format changes so an old app keeps its bundled baseline rather
  than choking on a new format.

Net: ~90% of "update the AI without shipping the app" — everything except the weights,
which are not ours to ship.

## 9. Phased Migration (evidence-gated)

1. **Now:** Apple apps get on-device AI (Foundation Models agent + FTS5 + MapKit). Carl/VM
   stays only as a cold fallback for old Apple devices and the (still-present) website
   widget. Flutter swaps the self-hosted VM for the thin hosted API.
2. **Watch:** telemetry shows the local-path success rate climbing and server traffic
   falling.
3. **Cut:** retire the website's user-facing AI widget and the self-hosted VM. AI is
   app-only.

## 10. Telemetry — the cut/no-cut signal

The migration is gated on data, so the **event taxonomy** matters more than volume. Must
distinguish:

- **Fallback because the device can't run local** (expected; permanent until old-device
  support is dropped).
- **Fallback because local *failed*** (quality/error — the number we want driven to zero).

Counting only "requests to the hosted API" blurs these and the cut decision becomes
unknowable. Keep telemetry to **anonymous counters** — never query content — so it does not
undermine driver B.

## 11. What Dies

- `carl-ai-vm` GPU + self-hosted Ollama / `Qwen2.5-3B-Instruct`.
- `SmartAssistant.astro` user-facing widget (website).
- The hard dependency of app AI on a single self-hosted host.

## 12. Risks & Open Questions

- **Quality parity:** Apple's on-device 3B vs the tuned Qwen pipeline — needs side-by-side
  eval before cutting the VM. Build an eval set of real Carl questions
  (e.g. "Can I have a pet pig in San Jose?", "food bank near Oakland").
- **Android on-device tool-calling gap:** no clean native path today; revisit as ML Kit /
  Nano matures.
- **Architecture fork cost:** Apple (on-device agent) and Flutter (hosted) diverge; the
  shared retrieval layer + Knowledge Pack is what keeps the fork affordable.
- **Data freshness vs offline:** baseline pack can go stale on a device that never syncs;
  acceptable for static reference data, surfaced via pack version in UI if needed.
- **Fast-moving platforms:** capability claims here are current to 2026-06-08 (Appendix).

## 13. YAGNI (explicitly deferred)

- On-device embeddings / hybrid retrieval (only if FTS5 telemetry shows misses).
- Android on-device generation (hosted-first; seam built, implementation deferred).
- Custom Foundation Models adapters (system model + prompt tuning is enough to start).

## 14. Next Steps (when moving to implementation)

1. Build the **indexer**: corpus JSON → `corpus.sqlite` (FTS5) + Knowledge Pack, wired into
   the existing weekly pipeline.
2. Apple: Foundation Models agent + `searchResources`/`findNearby` tools over the bundled
   pack.
3. Flutter: `Generator` seam + `HostedGenerator` + local FTS5 retrieval.
4. Telemetry taxonomy (Section 10).
5. Eval harness for quality parity (Section 12).
6. Website: replace `SmartAssistant.astro` widget with search UI over the same index.

---

## Appendix — Verified Platform Capabilities (as of 2026-06-08)

Sources: Apple Developer docs, Google ML Kit GenAI docs, pub.dev. Fast-moving area.

**Apple Foundation Models framework**
- First-class **tool calling** and `@Generable` structured output; the model decides if/when
  to call tools (`session.transcript` records tool calls). On-device, iOS/macOS 26+.
- Requires Apple Intelligence hardware (iPhone 15 Pro+ / M-series).

**Android — Gemini Nano via AICore / ML Kit GenAI**
- **Prompt API** (free-form, runs Nano via AICore): **text-in / image+text-in → text-out
  only. No native function/tool calling, no structured-schema output.**
- Real device support (flagship-only, growing):
  - *nano-v2:* Pixel 9 family, Samsung Galaxy Z Fold7 / Z TriFold, Xiaomi 15 family,
    OnePlus 13/13s, Honor Magic 7 / V5, iQOO 13, Motorola Razr 60 Ultra, Oppo Find N5,
    POCO F7/F8 Ultra, realme GT 7 Pro, vivo X200 family, etc.
  - *nano-v3:* Pixel 10 family, Samsung Galaxy S26 family, OnePlus 15/15R, Oppo Find X9
    family, Honor Magic 8 Pro, iQOO 15, vivo X300 family, etc.
- Feature-specific APIs (Summarization, Proofreading, Rewriting, Image Description) have a
  separate (also flagship-only) device list and fixed built-in prompts.
- Pattern: feature-detect availability → on-device if present, hosted/cloud fallback
  otherwise (Google's documented hybrid-inference pattern).

**Flutter**
- **No first-class bridge to system Nano.** Firebase's on-device hybrid (Nano on
  Android/Chrome, Foundation Models on iOS) **has no Flutter support.**
- On-device routes from Flutter: (1) platform channels → ML Kit GenAI (text-only, no native
  tools); (2) `flutter_gemma` (MediaPipe + bundled Gemma model; cross-platform Android/iOS/
  Web/Desktop; advertises function calling, vision, thinking mode — but ships its own model
  download).
