# Scripts

Utility scripts for maintaining Bay Navigator.

## Data Sync Scripts

### sync-nps-parks.cjs

**Purpose:** Syncs National Park Service (NPS) data for Bay Area parks.

**Usage:**

```bash
NPS_API_KEY="your-key" node scripts/sync-nps-parks.cjs
```

**Data source:** [NPS API](https://www.nps.gov/subjects/developer/api-documentation.htm)

---

### sync-imls-museums.cjs

**Purpose:** Imports museum data from the IMLS (Institute of Museum and Library Services) Museum Directory dataset.

**Usage:**

```bash
# First download the dataset from Kaggle
kaggle datasets download imls/museum-directory -p data-exports/gov-datasets/ --unzip

# Then run the sync
node scripts/sync-imls-museums.cjs
```

**Data source:** [IMLS Museum Directory (Kaggle)](https://www.kaggle.com/datasets/imls/museum-directory)

**Features:**

- Filters to Bay Area museums only
- Merges with existing manually-curated entries
- Converts names/addresses to Title Case
- Adds `groups: ['everyone']` to new entries
- Uses address-based Google Maps links

**Note:** The IMLS dataset is from 2014 and may contain outdated information. New museums are added with `sync_source: imls-museums` for tracking.

---

### sync-smc-parks.cjs

**Purpose:** Syncs San Mateo County parks data from the county open data portal.

**Usage:**

```bash
node scripts/sync-smc-parks.cjs
```

**Data source:** San Mateo County Open Data

---

### sync-smc-wifi.cjs

**Purpose:** Syncs San Mateo County public WiFi locations.

**Usage:**

```bash
node scripts/sync-smc-wifi.cjs
```

**Data source:** San Mateo County Open Data

---

### sync-usagov-benefits.cjs

**Purpose:** Syncs federal benefits data from USA.gov.

**Usage:**

```bash
node scripts/sync-usagov-benefits.cjs
```

**Data source:** [USA.gov Benefits API](https://www.usa.gov/benefits)

---

---

## API Generation

### generate-api.cjs

**Purpose:** Generates static JSON API files from YAML program data.

**Usage:**

```bash
node scripts/generate-api.cjs
```

**When to use:**

- Runs automatically via GitHub Actions when `src/data/` changes
- Can be run manually to preview API changes locally

**Features:**

- Reads all YAML files from `src/data/`
- Generates individual program JSON files in `public/api/programs/`
- Generates category and eligibility indexes
- Generates full programs list with metadata

**Output:**
Static JSON files in `public/api/` that Astro ships as `/api/*` at build/deploy time.

---

## CI/CD Scripts

### verify-gate.cjs

**Purpose:** Single authoritative CI gate command that runs all critical validations.

**Usage:**

```bash
npm run verify:gate
```

**What it checks:**

- YAML data validation
- API file generation
- Minimum program count (>100)
- JSON schema validation
- Astro build
- Duplicate ID detection
- GeoJSON generation

---

### setup.cjs

**Purpose:** One-command bootstrap for new contributors.

**Usage:**

```bash
npm run setup
```

**What it does:**

- Checks Node.js, npm, Git prerequisites
- Verifies project structure
- Installs dependencies
- Generates API files
- Validates data
- Shows optional environment variables

---

### validate-changed-links.cjs

**Purpose:** Fast link validation for PRs - only checks links in changed files.

**Usage:**

```bash
node scripts/validate-changed-links.cjs          # Check changes vs main
node scripts/validate-changed-links.cjs --all    # Check all links
node scripts/validate-changed-links.cjs --staged # Check staged files
```

**Features:**

- HEAD request with GET fallback
- Retries on failure
- Severity levels (federal > partner > other)
- Only fails on broken federal links

---

### validate-schemas.cjs

**Purpose:** Validates generated API files against JSON schemas.

**Usage:**

```bash
node scripts/validate-schemas.cjs
```

**Features:**

- Checks all files in `schemas/` against `public/api/`
- Validates required fields, types, patterns

---

## Utility Scripts

### generate-icons.sh

**Purpose:** Generates favicon and app icons from source logo.

**Usage:**

```bash
./scripts/generate-icons.sh
```

**Requirements:** ImageMagick (`convert` command)

---

### add_verification_dates.py

**Purpose:** Bulk add or update `verified_date` field in YAML files.

**Usage:**

```bash
python3 scripts/add_verification_dates.py
```

**When to use:**

- After bulk verification of programs
- When updating verification dates for all programs
- Data cleanup tasks

**Note:** This modifies YAML files directly. Review changes with `git diff` before committing.

---

### check-duplicates.cjs

**Purpose:** Checks for duplicate program entries across YAML files.

**Usage:**

```bash
node scripts/check-duplicates.cjs
```

---

### filter-bay-area-schools.cjs

**Purpose:** Filters school data to Bay Area institutions only.

**Usage:**

```bash
node scripts/filter-bay-area-schools.cjs
```

---

### cleanup-deployments.sh

**Purpose:** Cleans up old GitHub deployments.

**Usage:**

```bash
./scripts/cleanup-deployments.sh
```

---

### sync-github-ips.sh

**Purpose:** Syncs GitHub IP ranges for Azure Static Web Apps security configuration.

**Usage:**

```bash
./scripts/sync-github-ips.sh
```

See [GITHUB_IP_SYNC.md](./GITHUB_IP_SYNC.md) for details.

---

### update-git-date.sh

**Purpose:** Updates git commit dates (utility for maintenance).

**Usage:**

```bash
./scripts/update-git-date.sh
```

---

## License

These scripts are part of Bay Navigator and licensed under MIT.
See [LICENSE](../LICENSE) for details.
