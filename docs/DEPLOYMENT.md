# Deployment Guide

This document explains how Bay Navigator is built and deployed.

## Architecture

Bay Navigator is an **Astro** static site deployed to **Azure Static Web Apps** via GitHub Actions.

```
Source (src/) → Astro Build → Static HTML/CSS/JS (dist/) → Azure Static Web Apps CDN
```

## Automatic Deployment (GitHub Actions)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. **Checkout** code
2. **Setup Node.js 22** with npm cache
3. **Install dependencies** (`npm ci`)
4. **Generate static API** (`node scripts/generate-api.cjs`) — converts YAML data to JSON
5. **Build Astro site** (`npm run build`) — outputs to `dist/`
6. **Sync Typesense** (`node scripts/sync-typesense.cjs`) — updates search index
7. **Deploy to Azure Static Web Apps** via `Azure/static-web-apps-deploy@v1`

No manual deployment steps are needed for the web app.

## Local Development

```bash
# Clone and install
git clone https://github.com/baytides/bay-navigator.git
cd bay-navigator
npm install

# Generate API files (required before first run)
npm run generate-api

# Start dev server
npm run dev
# → http://localhost:4321
```

## Build Locally

```bash
npm run build    # Output in dist/
npm run preview  # Preview built site at http://localhost:4321
```

## Environment Variables

The build uses these secrets (configured in GitHub Actions):

| Variable                          | Purpose                |
| --------------------------------- | ---------------------- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deploy to Azure SWA    |
| `PUBLIC_PMTILES_URL`              | Map tile source URL    |
| `PUBLIC_AZURE_MAPS_KEY`           | Azure Maps geocoding   |
| `PUBLIC_OLLAMA_API_KEY`           | Carl AI authentication |
| `TYPESENSE_HOST`                  | Search server URL      |
| `TYPESENSE_API_KEY`               | Search server key      |

For local development, copy relevant values to `.env.local`.

## Azure Resources

| Resource                                   | Purpose                                          |
| ------------------------------------------ | ------------------------------------------------ |
| **Azure Static Web Apps**                  | Hosts the Astro site + CDN                       |
| **Azure Blob Storage** (`baytidesstorage`) | Municipal codes, missing persons data, map tiles |
| **Azure Functions** (`baynavigator-push`)  | Push notifications, geocoding, congress lookup   |
| **Azure Translator**                       | i18n translations                                |

## Post-Deployment Verification

After deployment, verify:

1. Site loads: https://baynavigator.org
2. Search works (try searching for "food")
3. Carl AI responds (open the chat)
4. API endpoints return data: `curl https://baynavigator.org/api/metadata.json`

## Rollback

Azure Static Web Apps maintains deployment history:

1. Navigate to the Static Web App in Azure Portal
2. Go to "Deployment History"
3. Select a previous successful deployment
4. Click "Reactivate"

Or revert the commit on `main` — a new deploy will trigger automatically.
