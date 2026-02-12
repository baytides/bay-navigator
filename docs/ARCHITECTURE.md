# Bay Navigator Architecture

Bay Navigator connects Bay Area residents with free and low-cost programs for food, housing, healthcare, utilities, and more.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Clients                                    │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  Web (Astro)     │  Mobile (Flutter)│  Desktop (Flutter)            │
│  baynavigator.org│  iOS / Android   │  Windows / macOS / Linux      │
└────────┬─────────┴────────┬─────────┴──────────┬────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Azure Static Web Apps (CDN)                       │
│               Static HTML/CSS/JS + JSON API files                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌────────────────┐  ┌─────────────────────────┐
│  Azure Functions │  │ Cloudflare     │  │ Mac Mini M2 (carl-ai-vm)│
│  - geocode       │  │ Worker (proxy) │  │ - Ollama (Carl AI)      │
│  - congress      │  │ - /chat → AI   │  │ - vLLM GPU inference    │
│  - push-send     │  │ - /search → TS │  │ - Typesense search      │
│  - partnership   │  │ - /v1/* → vLLM │  │ - Launchd data syncs    │
└─────────────────┘  └────────────────┘  └─────────────────────────┘
                                                    │
                                          ┌─────────┴──────────┐
                                          ▼                    ▼
                                  ┌──────────────┐   ┌─────────────────┐
                                  │ Azure Blob   │   │ Cloudflare      │
                                  │ Storage      │   │ Tunnel          │
                                  │ - muni codes │   │ (connects Mac   │
                                  │ - tiles      │   │  Mini to web)   │
                                  └──────────────┘   └─────────────────┘
```

## Directory Structure

```
bay-navigator/
├── src/                      # Web application source
│   ├── components/           # Astro components (SmartAssistant, SearchBar, etc.)
│   ├── pages/                # Route pages (directory, chat, transit, etc.)
│   ├── layouts/              # Page layouts
│   ├── data/                 # YAML program data (source of truth)
│   ├── i18n/                 # Internationalization strings (11 languages)
│   └── styles/               # Global CSS
├── apps/                     # Mobile/desktop apps
│   ├── lib/                  # Flutter/Dart source code
│   └── apple/                # Native Swift iOS/macOS/visionOS app
├── azure-functions/          # Serverless backend
│   ├── geocode/              # Address geocoding
│   ├── congress-lookup/      # Representative finder
│   ├── push-register/        # Push notification registration
│   ├── push-send/            # Push notification delivery
│   ├── partnership-form/     # Contact form handler
│   └── shared/               # Shared utilities + AI reference data
├── scripts/                  # Build, sync, and scraping scripts (100+)
├── local/                    # Mac Mini launchd service configs
├── workers/                  # Cloudflare Workers (AI proxy)
├── infrastructure/           # IaC (Bicep templates for Tor, etc.)
├── tests/                    # Playwright E2E + unit tests
├── public/                   # Static assets + generated API files
│   └── api/                  # Generated JSON API (programs, categories, etc.)
├── shared/                   # Shared code (API client, i18n)
├── telegram-bot/             # Telegram bot integration
└── docs/                     # Documentation
```

## Data Flow

### Program Data Pipeline

```
YAML Files (src/data/*.yml)
       │
       ▼
┌──────────────────────────┐
│  generate-api.cjs        │  Build-time script
│  (converts YAML → JSON)  │
└──────────────────────────┘
       │
       ├──► public/api/programs.json (all programs)
       ├──► public/api/programs/{id}.json (individual)
       ├──► public/api/categories.json
       ├──► public/api/groups.json
       ├──► public/api/areas.json
       ├──► public/api/metadata.json
       └──► public/api/search-index.json (Fuse.js)
       │
       ├──► Web App (static imports at build, fetch at runtime)
       ├──► Mobile App (HTTP fetch + 24h local cache)
       └──► Typesense (synced at deploy via sync-typesense.cjs)
```

### Carl AI — Two-Call LLM Pattern

```
User Message
    │
    ▼
┌──────────────────────────────────────────┐
│  Call 1: Intent Parser (vLLM)            │
│  Model: Qwen2.5-3B-Instruct             │
│  Endpoint: ai.baytides.org              │
│  Output: { query, category, is_crisis }  │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Typesense Search                        │
│  Filtered by intent (category, location) │
│  Returns matching programs               │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Call 2: Response Formatter (vLLM)       │
│  Context: programs + municipal codes +   │
│           public services + open data    │
│  Output: friendly 2-3 sentence response  │
└──────────────────────────────────────────┘
    │
    └──► Streaming response + program cards in UI
```

### Scheduled Data Syncs (Mac Mini)

All periodic data syncs run locally on the Mac Mini via launchd:

| Service         | Schedule      | Script                     |
| --------------- | ------------- | -------------------------- |
| Missing persons | Every 15 min  | `sync-missing-persons.cjs` |
| Sports data     | Every 3 hours | `sync-sports-data.cjs`     |
| Open data cache | Daily 6 AM    | `sync-open-data-cache.cjs` |
| NPS parks       | Weekly Sunday | `sync-nps-parks.cjs`       |
| PMTiles         | Every 2 days  | (PMTiles update)           |

These commit changes to the repo and push, triggering redeploys when data changes.

## Technology Stack

### Web Frontend

| Component | Technology                | Purpose                                     |
| --------- | ------------------------- | ------------------------------------------- |
| Framework | Astro 5                   | Static site generation                      |
| Styling   | Tailwind CSS 3            | Utility-first CSS                           |
| Search    | Fuse.js                   | Client-side fuzzy search (offline fallback) |
| Search    | Typesense                 | Server-side typo-tolerant search (primary)  |
| Testing   | Playwright                | E2E and accessibility tests                 |
| i18n      | Custom + Azure Translator | 11 languages                                |

### Mobile/Desktop

| Component     | Technology | Purpose                            |
| ------------- | ---------- | ---------------------------------- |
| Framework     | Flutter    | Cross-platform UI                  |
| Native iOS    | SwiftUI    | iOS/macOS/visionOS native features |
| State         | Provider   | Reactive state management          |
| Navigation    | go_router  | Declarative routing                |
| Crash Reports | Sentry     | Error tracking (opt-in)            |

### Backend & Infrastructure

| Component    | Technology                   | Purpose                              |
| ------------ | ---------------------------- | ------------------------------------ |
| Hosting      | Azure Static Web Apps        | CDN + static hosting                 |
| Serverless   | Azure Functions (Node.js 20) | Geocoding, push, congress lookup     |
| AI           | vLLM (Qwen2.5-3B-Instruct)   | Intent parsing + response formatting |
| AI Runtime   | Mac Mini M2 (Ollama)         | Self-hosted GPU inference            |
| Search       | Typesense (Mac Mini)         | Full-text program search             |
| Storage      | Azure Blob Storage           | Municipal codes, map tiles           |
| CDN/Security | Cloudflare (Project Galileo) | DDoS, WAF, DNS, Tunnel               |
| AI Proxy     | Cloudflare Worker            | CORS proxy for AI endpoints          |
| Analytics    | Plausible CE (self-hosted)   | Privacy-first analytics              |
| Translations | Azure Translator             | Multi-language support               |
| Privacy      | Tor Hidden Service           | Censorship-resistant access          |

## Key Design Decisions

### 1. YAML-Based Data Model

Programs are stored in human-readable YAML files rather than a database. This provides version-controlled history, easy community contributions, no database maintenance, and offline-capable builds.

### 2. Static API Generation

JSON APIs are pre-generated at build time. Zero runtime database queries, global CDN caching, works offline after first load, no cold starts.

### 3. Privacy-First Architecture

No cookies, no tracking pixels, no user accounts. Self-hosted analytics. GPS never leaves the device. Tor hidden service available.

### 4. Hybrid Local + Cloud

The Mac Mini handles always-on services (AI inference, search, data syncs) to maximize its 24/7 uptime. Azure handles HTTP endpoints and CDN. This keeps cloud costs minimal while providing local GPU inference.

### 5. Self-Hosted AI

Carl uses self-hosted vLLM on a Mac Mini rather than third-party AI APIs. User queries are never sent to OpenAI, Google, or other cloud AI providers. This ensures privacy and eliminates per-query API costs.

## Deployment

### CI/CD Workflows

| Workflow                          | Trigger         | Purpose                      |
| --------------------------------- | --------------- | ---------------------------- |
| `ci.yml`                          | Push + PR       | Lint, test, validate schemas |
| `deploy.yml`                      | Push to main    | Build + deploy to Azure SWA  |
| `release.yml`                     | Tag `v*`        | Build mobile app releases    |
| `codeql.yml`                      | Push + weekly   | Security analysis            |
| `deep-scrape-municipal-codes.yml` | Weekly          | Scrape city ordinance text   |
| `translate-i18n.yml`              | On i18n changes | Auto-translate UI strings    |

### Infrastructure as Code

Bicep templates in `/infrastructure/`:

- `tor-onion/container-instance.bicep` — Azure Container Instance for Tor hidden service

## Security

See [SECURITY.md](../SECURITY.md) for full details. Key points:

- Strict Content Security Policy
- CodeQL + OSV-Scanner on every PR
- No user accounts or cookies
- Function-level auth keys for Azure Functions
- All AI queries self-hosted (no third-party AI)

## Accessibility (WCAG 2.2 AAA + 3.0 Draft)

- Semantic HTML with ARIA labels
- Color contrast ratio 7:1 minimum
- Full keyboard navigation
- Screen reader tested (VoiceOver, NVDA)
- Font size adjustment (50-200%)
- High contrast mode
- Dyslexia-friendly font option
- Focus mode for reduced distractions
- Simple language toggle
