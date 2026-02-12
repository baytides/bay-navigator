# Bay Navigator - Static JSON API Documentation

> Source of truth: [openapi/baynavigator-api.yaml](../openapi/baynavigator-api.yaml). The summary below is for quick reference. For client code, see the shared helpers in [shared/](../shared/).

## Base URL

```
https://baynavigator.org/api
```

## Overview

Bay Navigator uses a **static JSON API** generated from YAML program data. The API files are:

- Automatically generated via `scripts/generate-api.js`
- Cached globally via Azure Static Web Apps CDN
- Updated automatically when program data changes (via GitHub Actions)

## Endpoints

### 1. Get All Programs

**GET** `/api/programs.json`

Returns all programs with metadata.

**Example:**

```bash
curl https://baynavigator.org/api/programs.json
```

**Response:**

```json
{
  "total": 237,
  "count": 237,
  "offset": 0,
  "programs": [
    {
      "id": "alameda-food-bank",
      "name": "Alameda County Community Food Bank",
      "category": "food",
      "description": "Free food pantries and distributions throughout county",
      "eligibility": ["low-income", "everyone"],
      "areas": ["Alameda County"],
      "website": "https://www.accfb.org/",
      "lastUpdated": "2025-12-23"
    }
  ]
}
```

---

### 2. Get Program by ID

**GET** `/api/programs/{id}.json`

Returns a single program by its ID.

**Example:**

```bash
curl https://baynavigator.org/api/programs/alameda-food-bank.json
```

**Response:**

```json
{
  "id": "alameda-food-bank",
  "name": "Alameda County Community Food Bank",
  "category": "food",
  "description": "Free food pantries and distributions throughout county",
  "eligibility": ["low-income", "everyone"],
  "areas": ["Alameda County"],
  "website": "https://www.accfb.org/",
  "lastUpdated": "2025-12-23"
}
```

---

### 3. Get Categories

**GET** `/api/categories.json`

Returns all categories with program counts.

**Example:**

```bash
curl https://baynavigator.org/api/categories.json
```

**Response:**

```json
{
  "categories": [
    {
      "id": "food",
      "name": "Food",
      "icon": "🍎",
      "programCount": 23
    },
    {
      "id": "transportation",
      "name": "Transportation",
      "icon": "🚌",
      "programCount": 23
    }
  ]
}
```

---

### 4. Get Areas

**GET** `/api/areas.json`

Returns all geographic areas with program counts.

**Example:**

```bash
curl https://baynavigator.org/api/areas.json
```

**Response:**

```json
{
  "areas": [
    {
      "id": "san-francisco",
      "name": "San Francisco",
      "type": "county",
      "programCount": 38
    },
    {
      "id": "bay-area",
      "name": "Bay Area",
      "type": "region",
      "programCount": 45
    }
  ]
}
```

---

### 5. Get Eligibility Types

**GET** `/api/eligibility.json`

Returns all eligibility types with program counts.

**Example:**

```bash
curl https://baynavigator.org/api/eligibility.json
```

**Response:**

```json
{
  "eligibility": [
    {
      "id": "low-income",
      "name": "SNAP/EBT/Medi-Cal",
      "description": "For public benefit recipients",
      "icon": "💳",
      "programCount": 98
    },
    {
      "id": "seniors",
      "name": "Seniors (65+)",
      "description": "For adults age 65 and older",
      "icon": "👵",
      "programCount": 45
    }
  ]
}
```

---

### 6. Get API Metadata

**GET** `/api/metadata.json`

Returns API version and available endpoints.

**Example:**

```bash
curl https://baynavigator.org/api/metadata.json
```

**Response:**

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-12-23T00:00:00.000Z",
  "totalPrograms": 237,
  "endpoints": {
    "programs": "/api/programs.json",
    "categories": "/api/categories.json",
    "eligibility": "/api/eligibility.json",
    "areas": "/api/areas.json",
    "singleProgram": "/api/programs/{id}.json"
  }
}
```

---

## Filtering (Client-Side)

Since this is a static JSON API, filtering is done client-side. The website uses JavaScript to filter programs based on:

- Category
- Eligibility
- Geographic area
- Search text

**Example JavaScript:**

```javascript
// Fetch all programs and filter client-side
fetch('https://baynavigator.org/api/programs.json')
  .then((res) => res.json())
  .then((data) => {
    // Filter by category
    const foodPrograms = data.programs.filter((p) => p.category === 'food');
    console.log(`Found ${foodPrograms.length} food programs`);

    // Filter by eligibility
    const seniorPrograms = data.programs.filter((p) => p.eligibility.includes('seniors'));
    console.log(`Found ${seniorPrograms.length} senior programs`);
  });
```

---

## Response Headers

All responses include:

- `Content-Type: application/json`
- Azure Static Web Apps CDN caching headers

## Performance

- **Average response time**: 10-50ms (CDN-cached)
- **Global CDN**: Azure Static Web Apps edge locations
- **No cold starts**: Static files served directly

## Regenerating the API

When program data changes, the API is automatically regenerated:

```bash
# Manual regeneration
node scripts/generate-api.js
```

This script:

1. Reads all YAML files from `_data/programs/`
2. Transforms to JSON format
3. Generates individual program files in `/api/programs/`
4. Creates aggregate endpoints (`programs.json`, `categories.json`, etc.)

## Open Source

All API code and data is open source:
https://github.com/baytides/baynavigator

License: MIT (code) + CC BY 4.0 (data)

## Support

- **Issues**: https://github.com/baytides/baynavigator/issues
- **Discussions**: https://github.com/baytides/baynavigator/discussions

---

**Last Updated:** December 23, 2025
**API Version:** 1.0.0
**Status:** Production
