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
- 🔒 **Privacy-First** - No personal data or cookies; self-hosted Plausible with aggregate metrics only
- 🔗 **Transparent Referrals** - External program links carry `utm_source=baynavigator` for anonymous impact tracking; no compensation or referral fees
- 🧭 **Step Flow + Local Preferences** - Set eligibility and county in a guided overlay; preferences are saved only in your browser (local storage). No accounts or email subscriptions
- ⌨️ **Keyboard Shortcuts** - Ctrl/Cmd+K for search, full keyboard navigation support

---

## 🔌 Static JSON API

Bay Navigator provides static JSON API files for accessing program data:

**Base URL:** `https://baynavigator.org/api/`

**Endpoints:**
- `/api/programs.json` - All programs (600+ total)
- `/api/programs/{id}.json` - Individual program by ID
- `/api/categories.json` - All categories
- `/api/areas.json` - Geographic service areas
- `/api/eligibility.json` - Eligibility types
- `/api/metadata.json` - API metadata

**Features:**
- ⚡ Fast (CDN-cached, ~10-50ms response time)
- 🌍 Global CDN via Azure Static Web Apps
- 💰 Free to use
- 📖 Open source
- 📊 Updated automatically via GitHub Actions

**Example:**
```javascript
fetch('https://baynavigator.org/api/programs.json')
  .then(res => res.json())
  .then(data => console.log(`Found ${data.total} programs`));
```

---

## � Documentation

- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[API Documentation](docs/API_ENDPOINTS.md)** - Static JSON API endpoints (see also [OpenAPI spec](openapi/baynavigator-api.yaml))
- **[Accessibility](docs/ACCESSIBILITY.md)** - WCAG 2.2 AAA compliance details
- **[All Documentation](docs/)** - Complete docs directory

---

## Tech Stack

**Built with:**
- [Astro](https://astro.build/) - Static site generator
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/) - Hosting and deployment
- YAML - Structured data storage for programs
- Static JSON API - Generated from YAML via Node.js script
- [Fuse.js](https://fusejs.io/) - Fuzzy search
- Responsive design - Mobile-first, optimized for all devices including Apple Vision Pro

**Key Components:**
- `src/data/` - Program data organized by category (YAML files)
- `api/` - Static JSON API endpoints (auto-generated)
- `scripts/` - Build scripts including API generator and data sync scripts
- `src/components/` - Astro components (search UI, program cards, etc.)
- `src/layouts/` - Page layouts
- `src/pages/` - Page routes
- `public/assets/` - Static assets (images, favicons)

---

## 📂 Repository Structure

```
baynavigator/
├── src/
│   ├── data/              # Program data files (YAML)
│   │   ├── cities.yml     # City-to-county mapping
│   │   ├── groups.yml     # Eligibility group definitions
│   │   ├── community.yml
│   │   ├── education.yml
│   │   ├── food.yml
│   │   ├── health.yml
│   │   ├── recreation.yml # Parks, museums, activities
│   │   ├── technology.yml
│   │   └── ...            # 15+ category files
│   ├── components/        # Astro components
│   ├── layouts/           # Page layouts
│   ├── pages/             # Page routes
│   └── styles/            # CSS stylesheets
├── public/
│   └── assets/            # Static assets (images, favicons)
├── api/                   # Static JSON API (auto-generated)
├── scripts/               # Build and sync scripts
├── apps/                  # Mobile app projects (iOS, Android)
├── docs/                  # Documentation
├── tests/                 # Playwright E2E tests
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
curl https://baynavigator.org/api/programs.json

# Get categories
curl https://baynavigator.org/api/categories.json

# Get a specific program
curl https://baynavigator.org/api/programs/alameda-food-bank.json
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

# API files are generated in /api/ directory
```

---

## 📊 Data Structure

Programs are stored in YAML files under `src/data/`. Each program follows this format:

```yaml
- id: unique-program-id
  name: Program Name
  category: Category Name
  area: Geographic Area        # County, "Bay Area", "Statewide", or "Nationwide"
  city: City Name              # Optional: specific city
  groups:
    - income-eligible          # Eligibility groups
    - seniors
    - everyone
  description: Brief description of the program
  what_they_offer: |           # Detailed benefits (optional)
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
- **Standardized UTMs for impact**: External program links include `utm_source=baynavigator&utm_medium=referral&utm_campaign=directory` so program partners can see anonymous referral volume; no per-user tracking.
- **No compensation or paid placement**: We do not receive fees, commissions, or referral payments for any listings or links.
- **Security**: Cloudflare provides TLS and DDoS protection; hosting and API run on Azure.

---

## 🙏 Acknowledgments

This project is maintained by volunteers who believe in making community resources more accessible. Special thanks to:
- All contributors who submit programs and updates
- Organizations providing these valuable services
- The open-source community for the tools that make this possible

---

## 📝 License

This project uses a dual-license model to ensure proper attribution while maximizing reuse:

### Code License: MIT

All code, including HTML, CSS, JavaScript, Jekyll templates, and configuration files, is licensed under the **MIT License**.

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

**Last Updated:** January 2, 2026
**Hosted on:** Azure Static Web Apps
