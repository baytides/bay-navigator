# Contributing to Bay Area Discounts

Thank you for your interest in contributing! This guide will help you add programs, fix issues, and improve the site.

---

## 📋 Table of Contents

1. [Ways to Contribute](#ways-to-contribute)
2. [Quick Start](#quick-start)
3. [Adding a New Program](#adding-a-new-program)
4. [Adding a New Category](#adding-a-new-category)
5. [Updating Existing Programs](#updating-existing-programs)
6. [Code Style Guidelines](#code-style-guidelines)
7. [Testing Your Changes](#testing-your-changes)
8. [Submitting Your Changes](#submitting-your-changes)
9. [Project Structure](#project-structure)
10. [Privacy & Data Practices](#privacy-and-data-practices)

---

## 🤝 Ways to Contribute

### Non-Technical Contributors
- 📝 Submit program suggestions via [GitHub Issues](../../issues/new)
- 🔍 Report outdated information or broken links
- 💡 Suggest new features or improvements
- 📣 Share the resource with your community

### Technical Contributors
- ➕ Add new programs directly via Pull Request
- 🐛 Fix bugs and issues
- ✨ Improve existing features
- ♿ Enhance accessibility
- 📱 Improve mobile experience
- 🎨 Improve design and UX

---

## 🎯 Geographic Scope & Editorial Guidelines

### Geographic Focus

**This resource prioritizes Bay Area programs.** When adding programs, follow this priority:

1. **✅ Bay Area-specific programs** (strongly preferred)
   - Programs serving specific Bay Area counties or cities
   - Local organizations and initiatives
   - Regional benefits and services

2. **✅ California statewide programs** available to Bay Area residents
   - State government programs
   - Statewide nonprofits with Bay Area presence

3. **✅ National programs** ONLY when they have:
   - Specific Bay Area locations or chapters
   - Significant impact and widespread use (e.g., Museums for All)
   - Clear value to Bay Area residents

**❌ Do NOT include:**
- Programs only available outside the Bay Area
- National programs without Bay Area presence
- Programs that require travel outside the region

### Editorial Standards

**This is a factual, community-focused resource. All contributions must be:**

#### ✅ Impartial & Factual
- Stick to objective facts about programs
- Use neutral language
- No promotional or marketing language
- No personal opinions or recommendations
- Write as if documenting, not advertising
- Use clean, canonical links only (no affiliate codes or tracking parameters). The site automatically appends standard `utm_source=bayareadiscounts` referrals to program links for anonymous impact reporting.

#### ✅ Community-Focused
- Programs must benefit the community, not individuals or businesses
- Focus on public good and accessibility
- No self-promotion or business advertising
- This is NOT a business directory

---

## 🔒 Privacy & Data Practices {#privacy-and-data-practices}

This project is privacy-first. Contributors must ensure changes do not introduce any collection of personal data or user tracking.

- No user accounts or authentication. Do not add sign-in, user profiles, or backend user storage.
- No email subscriptions or notifications. Do not add forms that collect email addresses or services that send emails to users.
- Preferences are local-only. The “Update Filters” step flow stores selections in browser local storage; nothing is sent to servers.
- Avoid cookies and tracking scripts. Keep analytics aggregate-only if present and self-hosted.
- Respect Content Security Policy and security headers in configuration.

#### ❌ What We Don't Accept

**Business Promotion:**
- No private businesses (unless they offer verified public benefit programs)
- No individual service providers
- No affiliate links or referral codes
- No marketing copy
- No paid placements or compensation-based listings

**Personal Beliefs & Causes:**
- No edits based on personal political views
- No removal of programs based on ideology
- No promotion of personal causes or agendas
- Keep all contributions neutral and fact-based

**Religious Activities:**
- ❌ NO religious services, worship events, or faith-based programs that include religious instruction
- ❌ NO programs that use activities as a means to promote religious beliefs
- ✅ YES to secular community services provided by religious organizations that:
  - Are open to the public regardless of faith
  - Are recurring or seasonal community activities (food pantries, free meals, community events)
  - Do NOT require participation in religious activities
  - Do NOT include religious instruction or proselytizing

**Example - Acceptable:**
```yaml
- id: "church-free-lunch"
  name: "Weekly Community Lunch"
  benefit: "Free hot lunch every Saturday from 12-2pm; open to all community members"
```

**Example - NOT Acceptable:**
```yaml
- id: "church-service"
  name: "Sunday Worship Service"
  benefit: "Join us for worship and community"  # ❌ Religious service
```

### Quality Standards

All programs must be:
- **Verifiable** - Official website or documentation required
- **Active** - Currently operating (not historical or planned)
- **Accessible** - Clear eligibility and access information
- **Legitimate** - From recognized organizations
- **Ongoing or Regular** - Not one-time or short-duration events

#### Timing Requirements

**✅ Programs we include:**
- **Ongoing programs** - Available continuously (e.g., "Apply anytime")
- **Seasonal programs** - Recurring annually (e.g., "Summer only", "November-March")
- **Regular recurring events** - Consistent schedule (e.g., "First Monday of each month", "Weekly on Saturdays", "Every other Tuesday")
- **Long-term programs** - Extended duration with clear timeframe (e.g., "6-month program starting quarterly")

**❌ Programs we exclude:**
- One-time events (e.g., "Free concert on July 15th")
- Short single-period events (e.g., "3-day workshop")
- Irregular or unpredictable availability
- "When funding available" without regular schedule

**Examples:**

✅ **Good - Ongoing:**
```yaml
timeframe: "Ongoing"
benefit: "Free library card with 24/7 digital access"
```

✅ **Good - Seasonal:**
```yaml
timeframe: "Annual (November-March)"
benefit: "Free tax preparation assistance during tax season"
```

✅ **Good - Regular recurring:**
```yaml
timeframe: "Weekly on Saturdays, 12-2pm"
benefit: "Free community meal every Saturday"
```

✅ **Good - Regular basis:**
```yaml
timeframe: "First Monday of each month"
benefit: "Free legal clinic on the first Monday of every month"
```

❌ **Bad - One-time event:**
```yaml
timeframe: "June 15, 2024"
benefit: "Free health screening day"  # Single event, not recurring
```

❌ **Bad - Short duration without recurrence:**
```yaml
timeframe: "Weekend workshop"
benefit: "Three-day financial literacy workshop"  # No recurring schedule
```

**If in doubt, ask yourself:**
- Does this help the Bay Area community?
- Is this factual and neutral?
- Would this benefit multiple people, not just me or my organization?
- Is this information, not promotion?
- **Is this available on a consistent, predictable basis?**

---

## 🚀 Quick Start

### Prerequisites
- Git
- Ruby (2.7+)
- Bundler

### Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/bayareadiscounts.git
cd bayareadiscounts

# 3. Install dependencies
bundle install

# 4. Run local server
bundle exec jekyll serve

# 5. Open in browser
# Navigate to http://localhost:4000
```

---

## ➕ Adding a New Program

**Note:** Programs are stored in YAML files for version control, but the live website uses Azure Cosmos DB. After your PR is merged, a maintainer will sync the changes to the database using the migration script. See [Data Architecture](#data-architecture) for details.

### Step 1: Choose the Right File

Programs are organized by category in `_data/programs/`:

```
_data/programs/
├── college-university.yml  # College/university-specific programs
├── community.yml           # Community services, meeting spaces
├── education.yml           # Educational programs, scholarships
├── equipment.yml           # Equipment donations, surplus property
├── finance.yml             # Financial assistance, banking
├── food.yml                # Food assistance, meal programs
├── health.yml              # Healthcare, insurance
├── legal.yml               # Legal services
├── library_resources.yml   # Library cards, services
├── pet_resources.yml       # Pet care, veterinary
├── recreation.yml          # Parks, activities
├── technology.yml          # Internet, devices, software
├── transportation.yml      # Transportation assistance
└── utilities.yml           # Utility assistance
```

**Choose the file that best matches the program's primary purpose.**

### Step 2: Add the Program Entry

Open the appropriate YAML file and add your program following this structure:

```yaml
- id: "unique-program-id"
  name: "Official Program Name"
  category: "Category Name"
  area: "Geographic Coverage"    # County, "Bay Area-wide", "Statewide", or "Nationwide"
  city: "City Name"              # Optional: specific city (county auto-derived)
  eligibility:
    - "emoji"
  benefit: "Clear description of what the program provides"
  timeframe: "Ongoing"
  link: "https://official-website.com"
  link_text: "Apply"
```

### Step 3: Follow the Data Standards

#### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier (lowercase, hyphenated) | `"sf-library-card"` |
| `name` | Official program name | `"San Francisco Public Library Card"` |
| `category` | Category name (must match existing category) | `"Library Resources"` |
| `area` | Geographic area served | `"San Francisco"` |
| `eligibility` | Array of emoji codes | `["💳", "🌎"]` |
| `benefit` | What the program provides | `"Free library card with access to books, digital resources, and community programs"` |
| `timeframe` | When available | `"Ongoing"` |
| `link` | Official URL | `"https://sfpl.org"` |
| `link_text` | Call to action text | `"Get Library Card"` |

#### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| `city` | Specific city (county auto-derived) | `"Oakland"` |

#### Area Options

Use the most specific area that applies:

**Counties:**
- `"Alameda County"`
- `"Contra Costa County"`
- `"Marin County"`
- `"Napa County"`
- `"San Francisco"` (city-county)
- `"San Mateo County"`
- `"Santa Clara County"`
- `"Solano County"`
- `"Sonoma County"`

**Broader Areas:**
- `"Bay Area-wide"`
- `"Statewide"`
- `"Nationwide"`

**City-Level Programs:**

For programs specific to a city, you can use the optional `city` field. The county will be auto-derived from `_data/cities.yml`:

```yaml
- id: "oakland-tool-library"
  name: "Oakland Tool Lending Library"
  city: "Oakland"              # County auto-derived to "Alameda County"
  # area field can be omitted when city is specified
```

All Bay Area cities are mapped in `_data/cities.yml`. If you add a program for a city not in the list, add the city mapping first.

#### Eligibility Emojis

| Emoji | Meaning | Code |
|-------|---------|------|
| 💳 | SNAP/EBT/Medi-Cal recipients | `"💳"` |
| 👵 | Seniors (65+) | `"👵"` |
| 🧒 | Youth | `"🧒"` |
| 🎓 | College students | `"🎓"` |
| 🎖️ | Veterans/Active duty | `"🎖️"` |
| 👨‍👩‍👧 | Families & caregivers | `"👨‍👩‍👧"` |
| 🧑‍🦽 | People with disabilities | `"🧑‍🦽"` |
| 🤝 | Nonprofit organizations | `"🤝"` |
| 🌎 | Everyone | `"🌎"` |

**Multiple eligibilities:** List all that apply:
```yaml
eligibility:
  - "💳"
  - "👵"
  - "🧒"
```

#### Writing Good Benefits

✅ **Good:**
```yaml
benefit: "Free internet with speeds up to 50 Mbps for eligible households; includes free Wi-Fi router and no installation fees"
```

❌ **Too vague:**
```yaml
benefit: "Cheap internet"
```

**Tips for benefits:**
- Be specific about what's included
- Mention key details (amounts, frequencies, limits)
- Use clear, accessible language
- Avoid jargon
- Keep it concise but complete

#### Link Text Options

Common link text phrases:
- `"Apply"`
- `"Learn More"`
- `"Enroll"`
- `"Register"`
- `"Get Started"`
- `"Visit Program"`
- `"Find Location"`

### Step 4: Example - Complete Program Entry

```yaml
- id: "sf-lifeline-phone"
  name: "California LifeLine Program"
  category: "Technology"
  area: "Statewide"
  eligibility:
    - "💳"
  benefit: "Discounted home phone service or free wireless service for income-eligible California residents; must qualify through Medi-Cal, SNAP, SSI, or income verification"
  timeframe: "Ongoing"
  link: "https://www.californialifeline.com"
  link_text: "Apply"
```

---

## 🆕 Adding a New Category

If none of the existing categories fit:

### Step 1: Create the Data File

Create a new file in `_data/programs/`:

```bash
touch _data/programs/your-new-category.yml
```

### Step 2: Add Category Header

```yaml
# Your New Category Name

- id: "first-program-id"
  name: "First Program"
  category: "Your New Category Name"
  # ... rest of fields
```

### Step 3: Update the Filter UI

Edit `_includes/search-filter-ui.html` and add your category to the filter buttons (in alphabetical order):

```html
<button class="filter-btn" data-filter-type="category" data-filter-value="Your New Category Name">
  Your New Category Name
</button>
```

### Step 4: Update README

Add your new category to the list in `README.md`.

---

## 📝 Updating Existing Programs

### Fixing Outdated Information

1. Find the program in the appropriate `_data/programs/*.yml` file
2. Update the relevant fields
3. Add a note in your commit message: `"Update [program-name]: [what changed]"`

### Removing Programs

If a program is no longer available:

1. Delete the entire program entry from the YAML file
2. Commit with message: `"Remove [program-name]: program discontinued"`

---

## 🎨 Code Style Guidelines

### YAML Formatting

✅ **Correct:**
```yaml
- id: "program-id"
  name: "Program Name"
  category: "Category"
  area: "Area"
  eligibility:
    - "💳"
    - "👵"
  benefit: "Clear description"
  timeframe: "Ongoing"
  link: "https://example.com"
  link_text: "Apply"
```

❌ **Incorrect indentation:**
```yaml
- id: "program-id"
name: "Program Name"      # ← Missing indentation
  eligibility:
  - "💳"                  # ← Inconsistent indentation
```

**Rules:**
- Use 2 spaces for indentation (no tabs)
- Each new program starts with `-` at column 0
- All fields under a program are indented 2 spaces
- Array items (eligibility) are indented 4 spaces with `-` at position 4

### ID Naming Conventions

- Use lowercase
- Use hyphens (not underscores or spaces)
- Keep it short but descriptive
- Format: `"organization-program"` or `"area-program"`

Examples:
- ✅ `"sf-library-card"`
- ✅ `"bart-discount"`
- ✅ `"calworks-child-care"`
- ❌ `"SFLibrary"`
- ❌ `"sf_library"`
- ❌ `"library123"`

---

## 🧪 Testing Your Changes

### Before Submitting

1. **Run locally:**
   ```bash
   bundle exec jekyll serve
   ```

2. **Test these scenarios:**
   - ✅ Your program appears on the homepage
   - ✅ Search finds your program by name
   - ✅ Category filter works
   - ✅ Area filter works  
   - ✅ Eligibility filter works
   - ✅ Link opens correctly
   - ✅ No JavaScript errors in console (F12 → Console tab)

3. **Check YAML syntax:**
   ```bash
   # The build will fail if YAML is invalid
   bundle exec jekyll build
   ```

4. **Test on mobile:**
   - Use browser DevTools responsive mode
   - Check that cards display properly
   - Verify filters work on mobile

---

## 📤 Submitting Your Changes

### Step 1: Create a Branch

```bash
git checkout -b add-program-name
```

### Step 2: Commit Your Changes

```bash
git add _data/programs/category.yml
git commit -m "Add [Program Name] to [Category]"
```

**Good commit messages:**
- `"Add SF Lifeline Phone to Technology"`
- `"Update BART discount: new eligibility requirements"`
- `"Fix broken link for CalFresh application"`
- `"Remove discontinued food pantry program"`

### Step 3: Push to Your Fork

```bash
git push origin add-program-name
```

### Step 4: Create Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Write a clear description:

```markdown
## Summary
Added [Program Name] to [Category]

## Details
- **What**: [Brief description of the program]
- **Who**: [Eligibility]
- **Where**: [Geographic area]

## Checklist
- [x] Tested locally
- [x] YAML syntax is valid
- [x] Program link works
- [x] Follows data standards
```

---

## 📁 Project Structure

```
bayareadiscounts/
├── _data/
│   ├── cities.yml             # 📍 City-to-county mapping
│   └── programs/              # 📊 Program data (YAML files)
│       ├── community.yml
│       ├── technology.yml
│       └── ...
│
├── _includes/                 # 🧩 Reusable components
│   ├── footer.html
│   ├── utility-bar.html      # Theme, spacing, share, install controls
│   ├── program-card.html     # Individual program display
│   └── search-filter-ui.html # Search and filter interface
│
├── _layouts/                  # 📄 Page templates
│   └── default.html          # Main layout with PWA and scripts
│
├── api/                       # 📡 Static JSON API (auto-generated)
│
├── assets/
│   ├── css/                   # 🎨 Stylesheets
│   │   ├── design-tokens.css
│   │   ├── base.css
│   │   ├── responsive-optimized.css
│   │   └── accessibility-toolbar.css
│   │
│   ├── js/                    # ⚙️ JavaScript
│   │   ├── search-filter.js       # Fuzzy search/filter
│   │   ├── accessibility-toolbar.js
│   │   ├── step-flow.js           # Onboarding wizard
│   │   └── apca-contrast.js       # WCAG 3.0 contrast
│   │
│   └── images/                # 🖼️ Logos, icons, favicons
│
├── scripts/                   # 🔧 Build scripts
│   └── generate-api.js       # API generation from YAML
│
├── tests/                     # 🧪 Playwright E2E tests
│
├── index.md                   # 🏠 Homepage
├── students.md                # 🎓 Student-specific page
├── README.md                  # 📖 Project documentation
├── _config.yml                # ⚙️ Jekyll configuration
└── sw.js                      # 📱 Service worker for PWA
```

### Key Files to Know

**Data Files:**
- `_data/programs/*.yml` - All program data (14 category files)
- `_data/cities.yml` - City-to-county mapping for auto-derivation

**Templates:**
- `_includes/program-card.html` - How each program displays
- `_includes/search-filter-ui.html` - Search and filter interface
- `_includes/utility-bar.html` - Theme selector, text spacing, share, PWA install
- `_layouts/default.html` - Main page template with PWA handling

**Scripts:**
- `assets/js/search-filter.js` - Powers fuzzy search and filtering
- `assets/js/accessibility-toolbar.js` - Accessibility features
- `assets/js/step-flow.js` - Onboarding wizard for preferences
- `scripts/generate-api.js` - Generates static JSON API from YAML

**Styles:**
- `assets/css/design-tokens.css` - CSS custom properties for theming
- `assets/css/base.css` - Core styles
- `assets/css/responsive-optimized.css` - Mobile/tablet/desktop optimizations
- `assets/css/accessibility-toolbar.css` - Accessibility toolbar styles

---

## ❓ FAQ

### "Which category should I use?"

Choose the primary benefit. If a program fits multiple categories, pick the most specific one.

### "Can I add a program that requires payment?"

Yes, if it's:
- Significantly discounted for eligible groups
- A sliding scale based on income
- Low-cost compared to market rates

Clearly describe the cost in the `benefit` field.

### "What if a program serves multiple counties?"

Use `"Bay Area-wide"` if it serves 3+ Bay Area counties.

### "Should I include national programs?"

Yes, if they:
- Have specific Bay Area locations
- Are available to Bay Area residents
- Provide meaningful value to the community

Use `"Nationwide"` for the area.

### "How do I know if my YAML is valid?"

Run `bundle exec jekyll build`. If it succeeds, your YAML is valid. If there are errors, Jekyll will tell you the line number.

---

## 🏗️ Data Architecture

### YAML + Cosmos DB Hybrid Model

Bay Area Discounts uses a hybrid approach for data storage:

**YAML Files (`_data/programs/*.yml`)**
- ✅ Version control - Track all changes via Git
- ✅ Open source transparency - Anyone can view/download data
- ✅ Easy contributions - Submit PRs to update programs
- ✅ Backup - Redundant copy of all program data

**Azure Cosmos DB (Production Database)**
- ✅ Fast API access - Powers the REST API
- ✅ Real-time queries - No site rebuilds needed
- ✅ Scalable - Handles any traffic volume
- ✅ Global distribution - Low latency worldwide

### Data Flow

```
Contributors → YAML Files (PR) → Merged → Maintainer runs migration → Cosmos DB → Live API
```

### For Maintainers: Syncing Data

After merging PRs that change YAML files, sync to Cosmos DB:

```bash
cd scripts
npm install

# Set environment variables (get from Azure Portal)
export COSMOS_DB_ENDPOINT="https://..."
export COSMOS_DB_KEY="your-key"
export COSMOS_DB_DATABASE_NAME="bayareadiscounts"
export COSMOS_DB_CONTAINER_NAME="programs"

# Run migration
npm run migrate
```

See [AZURE_INTEGRATION.md](./AZURE_INTEGRATION.md) for complete Azure setup.

---

## 📞 Need Help?

- 💬 [Open a Discussion](../../discussions) for questions
- 🐛 [Report an Issue](../../issues) for bugs
- 📧 Contact maintainers through GitHub issues
- 📖 See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for API documentation
- ☁️ See [AZURE_INTEGRATION.md](./AZURE_INTEGRATION.md) for Azure setup

---

## 🙏 Thank You!

Every contribution helps make community resources more accessible. Whether you're adding one program or fifty, your work makes a difference.

**Happy contributing!** 🎉
