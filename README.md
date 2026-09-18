# Bay Navigator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Data License: CC BY 4.0](https://img.shields.io/badge/Data%20License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

<a href="https://www.w3.org/WAI/WCAG2AAA-Conformance"
  title="Explanation of WCAG 2 Level AAA conformance">
<img height="32" width="88"
     src="https://www.w3.org/WAI/WCAG22/wcag2.2AAA"
     alt="Level AAA conformance, W3C WAI Web Content Accessibility Guidelines 2.2">
</a>

**[BayNavigator.org](https://baynavigator.org)** — A searchable directory of free and low-cost programs across the San Francisco Bay Area.

Find benefits and discounts for:

- 💳 Income-eligible (e.g., SNAP/EBT and Medi-Cal recipients)
- 👵 Seniors (65+)
- 🧒 Youth
- 🎓 College students
- 🎖️ Veterans and active duty military
- 👨‍👩‍👧 Families and caregivers
- 🧑‍🦽 People with disabilities
- 🤝 Nonprofit organizations
- 🌎 Everyone

---

## 🎯 Project Goals

This community-driven resource aims to:

- **Improve awareness** of local programs and benefits
- **Support financial accessibility** across the Bay Area
- **Reduce stigma** around using assistance programs
- **Promote community engagement** and local exploration

---

## ✨ Features

- 🔍 **Smart Search** - Fuzzy search with typo tolerance and search suggestions
- 🏷️ **Category Filters** - Browse by type (Food, Health, Transportation, Technology, etc.)
- 📍 **Location Filters** - Find programs by county or area
- 👥 **Eligibility Filters** - See only programs you qualify for
- ♿ **Accessibility Toolbar** - Font size (50-200%), high contrast, dyslexia-friendly fonts, focus mode, keyboard navigation
- 📱 **Mobile-Optimized** - Works great on phones, tablets, and computers
- 🌐 **PWA with Offline Support** - Install as an app from the utility bar; service worker caching for offline access
- 🎨 **Theme Support** - Light, dark, and auto modes with manual override
- 🤖 **Carl** - On-device assistant in the apps (Apple Intelligence), and an MCP server so any AI chatbot can search programs, municipal codes and crisis resources
- 🔒 **Privacy-First** - No personal data or cookies; self-hosted Plausible with aggregate metrics only
- 🔗 **Transparent Referrals** - External program links carry `utm_source=baynavigator` for anonymous impact tracking; no compensation or referral fees
- 🧭 **Step Flow + Local Preferences** - Set eligibility and county in a guided overlay; preferences are saved only in your browser (local storage). No accounts or email subscriptions
- ⌨️ **Keyboard Shortcuts** - Ctrl/Cmd+K for search, full keyboard navigation support

---

## ✅ Quality & Compliance

- **Data validation**: `npm run validate:data` (schema + referential integrity checks)
- **Accessibility checks**: `npm run test:a11y` (axe-core + Playwright, desktop + mobile)
- **PWA caching**: network-first for `/data/*.json`, cache-first for immutable build assets

---

## 🔌 Static JSON API

Bay Navigator provides static JSON API files for accessing program data:

**Base URL:** `https://baynavigator.org/data/`

> **Not `/api/`.** Azure Static Web Apps reserves that route for its Functions
> backend, so the build relocates the generated files to `/data/`. Requests to
> `/api/*.json` return a server error.

**Endpoints:**

- `/data/programs.json` - All programs (800+ total)
- `/data/programs/{id}.json` - Individual program by ID
- `/data/categories.json` - All categories
- `/data/areas.json` - Geographic service areas
- `/data/groups.json` - Audience groups (seniors, veterans, families, …)
- `/data/search-index.json` - Compact index used for in-browser search
- `/data/emergency.json` - Crisis and emergency contacts
- `/data/municipal-codes.json` - Municipal code coverage index
- `/data/metadata.json` - API metadata

Full specification: [`openapi/baynavigator-api.yaml`](openapi/baynavigator-api.yaml)

**Features:**

- ⚡ Fast (CDN-cached, ~10-50ms response time)
- 🌍 Global CDN via Azure Static Web Apps
- 💰 Free to use
- 📖 Open source
- 📊 Updated automatically via GitHub Actions

**Example:**

```javascript
fetch('https://baynavigator.org/data/programs.json')
  .then((res) => res.json())
  .then((data) => console.log(`Found ${data.total} programs`));
```

---

## 🤖 Carl, as an MCP server

Carl is Bay Navigator's assistant. Rather than running a model ourselves, we publish
him over the [Model Context Protocol](https://modelcontextprotocol.io) so any AI
chatbot can answer Bay Area questions grounded in this data.

**Hosted** (ChatGPT, Claude web — add as a custom connector):

```
https://baynavigator-carl-mcp.azurewebsites.net/mcp
```

**Local** (Claude Desktop, Claude Code, Cursor, Zed, VS Code):

```bash
npx -y @baytides/carl-mcp
```

Eight read-only tools: `search_resources`, `get_resource`, `find_local_code`,
`list_filters`, `transit_directions`, `get_local_conditions`, `get_bay_area_sports`,
`get_emergency_help`. Everything returns source links so the assistant can cite rather
than paraphrase, and a no-match answer routes to 2-1-1 rather than inviting the model to
invent a program.

See [`carl-mcp/README.md`](carl-mcp/README.md) for the design notes — including why it
reuses the Knowledge Pack retrieval contract verbatim instead of reimplementing search.

---

## 📦 On-device Knowledge Pack

The apps answer offline from a local SQLite/FTS5 corpus built by
`npm run generate:pack`. It ships in two parts.

**Core** (`corpus.sqlite`, always bundled) — programs, California codes, museum
admission. These are the answers someone needs when they don't know which
jurisdiction they're standing in, so they are never an optional download.

**Ordinances** (`ordinances/<slug>.sqlite`, downloaded on request) — one pack per
city, town and county. Municipal law is the bulk of the corpus and almost all of it
is irrelevant to any given person, so the apps let people choose:

| Choice          | What it fetches                                  |
| --------------- | ------------------------------------------------ |
| My city         | that one pack                                    |
| My county       | the county's own code plus every city pack in it |
| Entire Bay Area | all of them                                      |

The per-jurisdiction file is the atomic unit for all three tiers, so "county" and
"all" are lists rather than separately-built blobs — nothing is duplicated on the
CDN, and someone who lives in one city and works in another can add a second pack
without re-downloading either.

`manifest.json` carries the catalog the picker renders: per-pack sha256 and bytes,
plus county and whole-Bay-Area rollups with real totals. Each tier also reports
`available` vs `total`, because scraper coverage is partial and a tier labelled
"Alameda County" should say it currently holds 3 of 15 jurisdictions rather than
imply the whole county.

Retrieval attaches the downloaded packs to the core corpus and unions the search
(`openPackSet` / `searchPackSet` in JS, `LocalRetrievalService` in Swift). A city
filter skips packs that can't match, so downloading everything doesn't cost a
hundred subqueries to answer a question about one street.

`carl-mcp` is unaffected — it's a server with no download budget, so it builds one
combined corpus from the published JSON feeds.

---

## � Documentation

- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[API Documentation](docs/API_ENDPOINTS.md)** - Static JSON API endpoints (see also [OpenAPI spec](openapi/baynavigator-api.yaml))
- **[Accessibility](docs/ACCESSIBILITY.md)** - WCAG 2.2 AAA compliance details
- **[All Documentation](docs/)** - Complete docs directory

---

## Runtime Matrix

Use these versions for local development and CI parity:

- **Node.js:** 22.x LTS
- **npm:** 10+
- **Git:** latest stable
- **Flutter (optional, mobile app work):** 3.x
- **Dart (optional, mobile app work):** 3.x

Contributor setup docs reference this section:

- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- [docs/CONTRIBUTING_QUICKSTART.md](docs/CONTRIBUTING_QUICKSTART.md)

---

## Tech Stack

**Built with:**

- [Astro](https://astro.build/) - Static site generator
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/) - Hosting and CDN
- [Model Context Protocol](https://modelcontextprotocol.io) - Carl as an MCP server (`carl-mcp/`)
- Apple Intelligence (FoundationModels) - on-device Carl in the iOS/macOS apps
- [Fuse.js](https://fusejs.io/) - in-browser search over a prebuilt index
- _Retired September 2026:_ vLLM/Ollama with Qwen2.5-3B and Typesense, both self-hosted
- [Fuse.js](https://fusejs.io/) - Client-side fuzzy search (offline fallback)
- [Flutter](https://flutter.dev/) + [SwiftUI](https://developer.apple.com/swift/) - Mobile/desktop apps
- [Cloudflare](https://www.cloudflare.com/) - CDN, DDoS protection, AI proxy
- YAML - Structured data storage for programs
- Static JSON API - Generated from YAML via Node.js script

**Key Directories:**

- `src/data/` - Program data organized by category (YAML files)
- `src/components/` - Astro components (SmartAssistant, SearchBar, etc.)
- `scripts/` - Build, sync, and scraping scripts (100+)
- `azure-functions/` - Serverless backend (geocoding, push notifications)
- `apps/` - Flutter mobile/desktop + Swift native iOS apps
- `local/` - launchd service configs for data syncs that ran on a self-hosted Mac Mini. **Dormant since September 2026** — that machine was retired, so these syncs (missing persons, NPS parks) are not currently running and their data will go stale until they are rehomed.
- `infrastructure/` - Bicep IaC templates

---

## 📂 Repository Structure

```
bay-navigator/
├── src/
│   ├── data/              # Program data (YAML) — source of truth
│   ├── components/        # Astro components (SmartAssistant, SearchBar, etc.)
│   ├── pages/             # Route pages
│   ├── layouts/           # Page layouts
│   ├── i18n/              # Internationalization (11 languages)
│   └── styles/            # CSS stylesheets
├── public/api/            # Generated JSON API (auto-generated at build)
├── apps/                  # Flutter mobile/desktop + Swift native iOS
├── azure-functions/       # Serverless backend (geocode, push, congress)
├── scripts/               # Build, sync, and scraping scripts (100+)
├── carl-mcp/              # Carl as an MCP server (stdio + HTTP)
├── local/                 # launchd configs for data syncs (dormant, see below)
├── workers/               # Cloudflare Workers (AI proxy)
├── infrastructure/        # Bicep IaC templates (Tor, etc.)
├── tests/                 # Playwright E2E + unit tests
├── docs/                  # Documentation
└── README.md
```

---

## 🎯 Scope & Focus

**This resource focuses on Bay Area programs.** National or statewide programs are included when they:

- Have specific Bay Area locations or chapters
- Provide significant value to Bay Area residents
- Are widely used and impactful (e.g., Museums for All)

**Geographic priority:**

1. **Bay Area-specific** programs (preferred)
2. **California statewide** programs available to Bay Area residents
3. **National programs** with Bay Area presence or significant local impact

---

## 🤝 How to Contribute

We welcome contributions! There are two ways to help:

> **Note:** By submitting a listing—whether via pull request, issue, email, or API—authorized representatives acknowledge and agree to our [Terms of Service](https://baynavigator.org/terms), [Partnership Requirements](https://baynavigator.org/partnerships), and [Non-Discrimination Policy](https://baynavigator.org/partnerships#non-discrimination-policy).

### For Everyone: Submit a Program

**Found a resource that should be listed?**
👉 [Open an issue](../../issues/new) with:

- Program/service name
- Who it helps (eligibility)
- What benefit it provides
- Official website link
- Location/area served
- Any deadlines or special requirements

### For Technical Contributors

**Want to add programs directly or improve the site?**  
👉 See **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** for detailed technical instructions

---

## 🚀 Quick Start

### Using the Static JSON API (Easiest)

Access all program data via our static JSON API:

```bash
# Get all programs
curl https://baynavigator.org/data/programs.json

# Get categories
curl https://baynavigator.org/data/categories.json

# Get a specific program
curl https://baynavigator.org/data/programs/alameda-food-bank.json
```

See **[API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)** for complete API documentation.

### Local Development

```bash
# Clone the repository
git clone https://github.com/baytides/baynavigator.git
cd baynavigator

# Install dependencies
npm install

# Run local server
npm run dev

# View at http://localhost:4321
```

### Regenerating the API

```bash
# After modifying YAML files in src/data/
npm run generate-api

# API files are generated in /public/api/ (deployed as /data/)
```

---

## 📊 Data Structure

Programs are stored in YAML files under `src/data/`. Each program follows this format:

```yaml
- id: unique-program-id
  name: Program Name
  category: Category Name
  area: Geographic Area # County, "Bay Area", "Statewide", or "Nationwide"
  city: City Name # Optional: specific city
  groups:
    - income-eligible # Eligibility groups
    - seniors
    - everyone
  description: Brief description of the program
  what_they_offer: | # Detailed benefits (optional)
    - Benefit 1
    - Benefit 2
  how_to_get_it: Steps to access the program (optional)
  timeframe: Ongoing
  link: https://official-website.com
  link_text: Apply
```

### Available Categories:

- Childcare
- Community Services
- Education
- Equipment
- Finance
- Food
- Health
- Legal Services
- Library Resources
- Museums
- Parks & Open Space
- Pet Resources
- Recreation
- Tax Preparation
- Technology
- Transportation
- Utilities

### Eligibility Groups:

- `income-eligible` - 💳 SNAP/EBT/Medi-Cal recipients
- `seniors` - 👵 Seniors (60+)
- `youth` - 🧒 Youth
- `college-students` - 🎓 College students
- `veterans` - 🎖️ Veterans/Active duty
- `families` - 👨‍👩‍👧 Families
- `disability` - 🧑‍🦽 People with disabilities
- `lgbtq` - 🌈 LGBT+ community
- `first-responders` - 🚒 First responders
- `teachers` - 👩‍🏫 Teachers/Educators
- `unemployed` - 💼 Job seekers
- `immigrants` - 🌍 Immigrants/Refugees
- `unhoused` - 🏠 Unhoused
- `caregivers` - 🤲 Caregivers
- `foster-youth` - 🏡 Foster youth
- `nonprofits` - 🤝 Nonprofit organizations
- `everyone` - 🌎 Everyone

---

## 🔄 Maintenance & Updates

This is a **community-maintained project**. Programs are verified periodically, but:

- ⚠️ **Always check the official website** for the most current information
- 📅 Availability and eligibility requirements can change
- 🔗 If you find outdated info, please [open an issue](../../issues/new)

---

## 🔒 Privacy & Transparency

- **No personal data, no cookies**: The site does not collect or store personal information and sets zero cookies.
- **Self-hosted Plausible (aggregate only)**: We use a self-hosted Plausible Analytics instance that records aggregate metrics (utm/source, country, browser, OS, visit counts) without IPs, cookies, or user identifiers.
- **AI-powered features**: We run no AI server. In the apps, Carl runs on your device via Apple Intelligence, so questions never leave it. Elsewhere, Carl is an [MCP server](carl-mcp/) your own AI assistant calls — that assistant's provider handles your conversation under their policy, and we receive only the search terms. Simple Language text is pre-generated and ships with the site. The self-hosted inference server was retired in September 2026.
- **Mobile app crash reporting**: Optional [Sentry](https://sentry.io/) crash reporting in mobile apps (can be disabled). See our [Privacy Policy](https://baynavigator.org/privacy) for details.
- **Standardized UTMs for impact**: External program links include `utm_source=baynavigator&utm_medium=referral&utm_campaign=directory` so program partners can see anonymous referral volume; no per-user tracking.
- **No compensation or paid placement**: We do not receive fees, commissions, or referral payments for any listings or links.
- **Security**: Cloudflare (Project Galileo) provides TLS, CDN, and DDoS protection; hosting and API run on Azure Static Web Apps. Tor hidden service available for censorship-resistant access.

---

## 🙏 Acknowledgments

This project is maintained by volunteers who believe in making community resources more accessible. Special thanks to:

- All contributors who submit programs and updates
- Organizations providing these valuable services
- The open-source community for the tools that make this possible

---

## Contributors

Thanks to these wonderful people who have contributed to Bay Navigator:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

To add a contributor, comment on an issue or PR with:
`@all-contributors please add @username for code, content, doc, etc.`

See the [Emoji Key](https://allcontributors.org/docs/en/emoji-key) for contribution types.

---

## 📝 License

This project uses a dual-license model to ensure proper attribution while maximizing reuse:

### Code License: MIT

All code, including HTML, CSS, JavaScript, Astro components, and configuration files, is licensed under the **MIT License**.

**You are free to:**

- Use the code commercially
- Modify and distribute
- Use privately

**Requirements:**

- Include the MIT license and copyright notice
- Provide attribution to Bay Navigator

See [LICENSE](./LICENSE) for full details.

### Data License: CC BY 4.0

All program data in `src/data/` is licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

**You are free to:**

- Share and redistribute the data
- Adapt and build upon the data

**Requirements:**

- Give appropriate credit to Bay Navigator
- Provide a link to the license
- Indicate if changes were made

**Suggested attribution:**

```
Program data from Bay Navigator (https://baynavigator.org)
licensed under CC BY 4.0
```

See [LICENSE-DATA](./LICENSE-DATA) for full details.

---

### Why Dual License?

This approach ensures:

- **Credit where credit is due** - Both licenses require attribution
- **Maximum community benefit** - Other cities can create similar resources
- **Commercial use allowed** - Apps, tools, and services can be built using our work
- **Open source forever** - All improvements benefit the community

---

## 📧 Contact

- 🐛 **Found a bug?** [Open an issue](../../issues/new)
- 💡 **Have a suggestion?** [Start a discussion](../../discussions)
- 📬 **Other inquiries:** Create an issue and we'll respond

---

**Last Updated:** February 11, 2026
**Hosted on:** Azure Static Web Apps
