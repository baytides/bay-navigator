# Bay Area Discounts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Data License: CC BY 4.0](https://img.shields.io/badge/Data%20License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

<a href="https://www.w3.org/WAI/WCAG2AAA-Conformance"
  title="Explanation of WCAG 2 Level AAA conformance">
  <img height="32" width="88"
     src="https://www.w3.org/WAI/WCAG22/wcag2.2AAA"
     alt="Level AAA conformance, W3C WAI Web Content Accessibility Guidelines 2.2">
</a>

**[BayAreaDiscounts.com](https://bayareadiscounts.com)** — A searchable directory of free and low-cost programs across the San Francisco Bay Area.

Find benefits and discounts for:
- 💳 SNAP/EBT/Medi-Cal recipients
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

- 🔍 **Smart Search** - Search by keyword, program name, or organization
- 🏷️ **Category Filters** - Browse by type (Food, Health, Transportation, Technology, etc.)
- 📍 **Location Filters** - Find programs by county or area
- 👥 **Eligibility Filters** - See only programs you qualify for
- ♿ **Accessibility Toolbar** - Font size, high contrast, dyslexia-friendly fonts, keyboard navigation
- 📱 **Mobile-Optimized** - Works great on phones, tablets, and computers
- 🌐 **Offline Support** - PWA (Progressive Web App) with service worker caching
- 🎨 **Dark Mode** - Automatic based on system preference
- 🔒 **Privacy-First** - No personal data or cookies; self-hosted Plausible with aggregate metrics only
- 🔗 **Transparent Referrals** - External program links carry `utm_source=bayareadiscounts` for anonymous impact tracking; no compensation or referral fees
 - 🧭 **Step Flow + Local Preferences** - Set eligibility and county in a guided overlay; preferences are saved only in your browser (local storage). No accounts or email subscriptions.

---

## 🔌 Static JSON API

Bay Area Discounts provides static JSON API files for accessing program data:

**Base URL:** `https://bayareadiscounts.com/api/`

**Endpoints:**
- `/api/programs.json` - All programs (237 total)
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
fetch('https://bayareadiscounts.com/api/programs.json')
  .then(res => res.json())
  .then(data => console.log(`Found ${data.total} programs`));
```

---

## � Documentation

- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[API Documentation](docs/API_ENDPOINTS.md)** - REST API endpoints (see also [OpenAPI spec](openapi/bayareadiscounts-api.yaml))
- **[Accessibility](docs/ACCESSIBILITY.md)** - WCAG 2.2 AAA compliance details
- **[Azure Setup](docs/GETTING_STARTED_AZURE.md)** - Infrastructure and deployment
- **[Security](docs/SECURITY_HARDENING.md)** - Security measures and best practices
- **[All Documentation](docs/)** - Complete docs directory

---

## �🛠️ Tech Stack

**Built with:**
- [Jekyll](https://jekyllrb.com/) - Static site generator
- [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/) - Hosting and deployment
- [Azure Cosmos DB](https://azure.microsoft.com/services/cosmos-db/) - NoSQL database (serverless)
- [Azure Functions](https://azure.microsoft.com/services/functions/) - Serverless REST API
- YAML - Structured data storage
- Vanilla JavaScript - Search, filters, and accessibility features
- Responsive CSS - Mobile-first design optimized for all devices including Apple Vision Pro

**Key Components:**
- `_data/programs/` - Program data organized by category (YAML files)
- `azure-functions/` - Serverless API endpoints
- `infrastructure/` - Azure Infrastructure as Code (Bicep)
- `_includes/` - Reusable components (search UI, program cards, etc.)
- `_layouts/` - Page templates
- `assets/js/` - JavaScript for search/filter functionality
- `assets/css/` - Styling and responsive design

**Azure Integration:**
See [AZURE_INTEGRATION.md](docs/AZURE_INTEGRATION.md) for details on how we use Azure while staying 100% open source.

---

## 📂 Repository Structure

```
bayareadiscounts/
├── _data/
│   └── programs/          # Program data files (YAML)
│       ├── college-university.yml
│       ├── community.yml
│       ├── education.yml
│       ├── equipment.yml
│       ├── finance.yml
│       ├── food.yml
│       ├── health.yml
│       ├── legal.yml
│       ├── library_resources.yml
│       ├── pet_resources.yml
│       ├── recreation.yml
│       ├── technology.yml
│       ├── transportation.yml
│       └── utilities.yml
├── _includes/             # Reusable components
│   ├── program-card.html
│   └── search-filter-ui.html
├── _layouts/              # Page templates
│   └── default.html
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   └── images/           # Logos, favicons
├── index.md              # Homepage
├── students.md           # Student-specific page
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

### Using the API (Easiest)

Access all program data via our REST API:

```bash
# Get all programs
curl https://bayareadiscounts-func-prod-clx32fwtnzehq.azurewebsites.net/api/programs

# Get food programs
curl https://bayareadiscounts-func-prod-clx32fwtnzehq.azurewebsites.net/api/programs?category=Food

# Get statistics
curl https://bayareadiscounts-func-prod-clx32fwtnzehq.azurewebsites.net/api/stats
```

See **[API_ENDPOINTS.md](./docs/API_ENDPOINTS.md)** for complete API documentation.

### Local Development (Website)

```bash
# Clone the repository
git clone https://github.com/baytides/bayareadiscounts.git
cd bayareadiscounts

# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve

# View at http://localhost:4000
```

### Local Development (API Functions)

```bash
# Navigate to Azure Functions
cd azure-functions

# Install dependencies
npm install

# Create local settings (see azure-functions/README.md)
# Then start functions locally
func start

# Test at http://localhost:7071
```

---

## 📊 Data Structure

Programs are stored in YAML files under `_data/programs/`. Each program follows this format:

```yaml
- id: "unique-program-id"
  name: "Program Name"
  category: "Category Name"
  area: "Geographic Area"
  eligibility:
    - "💳"  # SNAP/EBT/Medi-Cal
    - "👵"  # Seniors
  benefit: "Description of what the program provides"
  timeframe: "Ongoing"
  link: "https://official-website.com"
  link_text: "Apply"
```

### Available Categories:
- Childcare Assistance
- Clothing Assistance
- Community Services
- Education
- Equipment
- Finance
- Food
- Health
- Legal Services
- Library Resources
- Museums
- Pet Resources
- Public Transit
- Recreation
- Tax Preparation
- Technology
- Transportation
- Utilities

### Eligibility Emojis:
- 💳 = SNAP/EBT/Medi-Cal recipients
- 👵 = Seniors (65+)
- 🧒 = Youth
- 🎓 = College students
- 🎖️ = Veterans/Active duty
- 👨‍👩‍👧 = Families & caregivers
- 🧑‍🦽 = People with disabilities
- 🤝 = Nonprofit organizations
- 🌎 = Everyone

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
- **Standardized UTMs for impact**: External program links include `utm_source=bayareadiscounts&utm_medium=referral&utm_campaign=directory` so program partners can see anonymous referral volume; no per-user tracking.
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
- Provide attribution to Bay Area Discounts

See [LICENSE](./LICENSE) for full details.

### Data License: CC BY 4.0

All program data in `_data/programs/` is licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.

**You are free to:**
- Share and redistribute the data
- Adapt and build upon the data (even commercially)

**Requirements:**
- Give appropriate credit to Bay Area Discounts
- Provide a link to the license
- Indicate if changes were made

**Suggested attribution:**
```
Program data from Bay Area Discounts (https://bayareadiscounts.com)
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

**Last Updated:** December 18, 2025 
**Maintained by:** [semicoloncolonel](https://github.com/semicoloncolonel) 
**Hosted on:** GitHub Pages
