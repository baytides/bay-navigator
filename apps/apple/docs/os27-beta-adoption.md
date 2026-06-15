# OS 27 Beta Adoption — Design & Roadmap

**Date:** 2026-06-14
**Branch:** `feature/os27-beta`
**Worktree:** `.claude/worktrees/os27-beta`
**App:** Bay Navigator — Apple multi-platform app (`apps/apple/`)

---

## Goal

Adopt the **OS 27 generation** (iOS 27 / macOS 27 "Golden Gate" / visionOS 27) for
the Bay Navigator Apple app. The app currently targets **iOS 17 / macOS 14 /
visionOS 1**, so it skipped the entire "26" generation — meaning the Liquid Glass
redesign and the realigned Apple-Intelligence frameworks land all at once.

This worktree's **immediate, shippable deliverable is Phase 0 (foundation)**: a clean,
mergeable build against the SDK 27 toolchain with minimum deployment targets kept low.
The three feature tracks below are the **roadmap** this foundation enables; they are
not built in this first pass.

---

## Environment (verified 2026-06-14)

- **Xcode 27.0 (27A5194q)** is installed at `/Applications/Xcode-beta.app`.
- SDK 27 present for all three platforms: `iphoneos27.0`, `macosx27.0`, `xros27.0`
  (+ simulators), plus tvOS/watchOS 27.
- Toolchain is **Swift 6.4**, default target `arm64-apple-macosx27.0.0`.
- **Gotcha:** `xcode-select -p` points at `/Library/Developer/CommandLineTools`, **not**
  the beta. Plain `xcodebuild`/`swift` on `PATH` do not use Xcode 27. Build with:
  ```
  DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcodebuild ...
  ```
  (non-invasive) — or `sudo xcode-select -s /Applications/Xcode-beta.app/Contents/Developer`
  to switch system-wide (requires sudo; not done automatically).
- **Xcode 27 is Apple-silicon-only.** CI/build runners must be Apple silicon.

## Baseline (verified 2026-06-14)

`swift build` of the shared `BayNavigatorCore` package under the SDK 27 toolchain
**fails to compile.** All errors are in
`apps/apple/BayNavigatorCore/Sources/BayNavigatorCore/Services/AppleIntelligenceService.swift`
(647 lines). Root cause: the file was written against the **original 2024 Apple
Intelligence beta** (`iOS 18.1 / macOS 15.1 / visionOS 2.1`), but Apple **realigned
`FoundationModels` to the 26/27 generation** and changed the API.

Concrete errors:
- `AppleIntelligenceService.swift:132` — stored property `languageSession` marked
  `@available(iOS 18.1, macOS 15.1, visionOS 2.1, *)`; **stored properties cannot be
  potentially unavailable**.
- `:133, :148, :180` — `LanguageModelSession` / `init(model:tools:instructions:)` /
  `respond(to:options:)` are **`macOS 26.0+`** now, not 15.1 — the `#available` guards
  use the wrong version floor.
- `:28, :142, :179` — `LanguageModelSession.isAvailable` **no longer exists** (API
  changed; availability is now expressed differently, e.g. via
  `SystemLanguageModel().availability`).
- 38 warnings, incl. `String: Generable` conformance now `macOS 26.0+`.

The code compiles fine against the *current* (pre-27) toolchain on `main`; there is no
"passing SDK-27 baseline" because migrating to SDK 27 is the entire point of this branch.

---

## Phase 0 — Foundation (this worktree's deliverable)

Goal: a clean, mergeable build against the SDK 27 toolchain, minimums kept low, no
regressions. Ship-ready.

1. **Build setup**
   - Establish a repeatable `DEVELOPER_DIR`-based build/test invocation for the
     `BayNavigator.xcodeproj` (all three destinations) and `BayNavigatorCore`.
   - Decide CI story (GitHub Actions runner must be Apple silicon for Xcode 27).
2. **Fix the FoundationModels compile breakage** in `AppleIntelligenceService.swift`
   - Re-floor availability to `iOS 26 / macOS 26 / visionOS 26`.
   - Replace removed `LanguageModelSession.isAvailable` with the current availability
     check (`SystemLanguageModel(...).availability`).
   - Remove `@available` from the stored property — gate at the type or use an
     untyped/erased store + availability-gated accessor.
   - This is the minimal change to make the shared core compile; the *richer*
     Foundation Models adoption is Track A below.
3. **Keep minimum deployment targets LOW.** Build *against* SDK 27 (this triggers
   Liquid Glass + new APIs) but do **not** raise the floor (iOS 17 / macOS 14 /
   visionOS 1 stay, or a modest bump only if justified). New 27-only APIs go behind
   `if #available`. Rationale: civic/public-service app — do not strand users.
4. **Liquid Glass QA pass.** Building against SDK 27 auto-applies Liquid Glass and the
   opt-out is being removed. Audit custom chrome for contrast/legibility:
   Carl's chat surface, transit/civic cards, alert/emergency banners, tab & nav bars,
   and any AppKit interop on the Mac target. Emergency-alert legibility is the priority.
5. **TLS audit.** OS 27 tightens TLS enforcement. Verify the self-hosted endpoint
   `ai.baytides.org` (Ollama) meets modern TLS/cert requirements. Azure endpoints
   (`*.azurewebsites.net`, `*.blob.core.windows.net`) are expected fine.
6. **Verify** all targets build for their SDK-27 destinations; smoke-test launch in
   simulators. Document remaining warnings.

**Exit criteria:** `BayNavigatorCore` + all app targets compile against SDK 27;
app launches on iOS/macOS/visionOS 27 simulators; Liquid Glass legibility reviewed
on alert surfaces; TLS endpoint verified; minimums unchanged (or deliberately bumped).

---

## Roadmap — feature tracks (NOT in this pass)

Selected as the intended direction once Phase 0 merges.

### Track A — Carl on Foundation Models
Adopt Apple's `LanguageModel` protocol as an on-device / offline / fallback path
alongside the existing Ollama/Qwen + Typesense backend.
- One API spanning the on-device ~3B model, **Private Cloud Compute (free tier for
  apps under 2M first-time downloads — Bay Navigator likely qualifies)**, and swappable
  Claude/Gemini providers via SPM.
- Multimodal prompts; built-in `OCRTool` / `BarcodeReaderTool`; a local Spotlight-backed
  RAG tool.
- Builds directly on the now-modernized `AppleIntelligenceService` from Phase 0.

### Track B — App Intents + Spotlight semantic index
- **SiriKit is formally deprecated** (App Intents only; ~2–3 yr removal window).
  Migrate any remaining SiriKit surfaces.
- New entity/intent schemas push transit stops, civic services, and missing-persons
  entries into the system semantic index and the new (Gemini-backed) Siri.
- Shared win in `BayNavigatorCore`.

### Track C — visionOS immersive layer (greenfield)
- RealityKit Gaussian-splat Bay Area landmarks, immersive navigation, Reverb Mesh
  spatial audio for alerts, widgets now on Vision Pro, Visual Intelligence AR helper.
- Higher effort, smaller installed base — lowest priority of the three.

---

## Key decisions locked

- **Build against SDK 27, keep minimum targets low.** Liquid Glass + new APIs come from
  the SDK you build with, not the minimum deployment target. Gate 27-only APIs with
  `if #available`.
- **Phase 0 is the ship-ready unit.** Feature tracks follow on later branches.
- **Use `DEVELOPER_DIR` per-build**, do not switch `xcode-select` system-wide without
  explicit approval.

## Open items to verify during implementation

- Exact current `FoundationModels` availability-check API surface (replacing
  `isAvailable`) — confirm against the SDK 27 headers / WWDC26 session 241.
- Whether any other files beyond `AppleIntelligenceService.swift` break under SDK 27
  (the package build halted at the first failing module — re-check after the fix).
- MapKit: no OS-27-specific changes surfaced in research; treat as unchanged until
  verified against the WWDC26 session catalog.
- Exact minimum deployment floor Xcode 27 enforces for macOS/visionOS (iOS floor
  confirmed at 15; the others were unverified in research).

## Sources

Live research compiled 2026-06-14 from Apple developer docs (developer.apple.com
`/ios|/macos|/visionos /whats-new/`, WWDC26 sessions 241/277/287/339), Apple Newsroom,
and reputable coverage (MacRumors, 9to5Mac, UploadVR, AppleInsider). Full per-platform
reports retained in the conversation that produced this design.
