# Deployment Guide

This document explains how to deploy the Bay Area Discounts website to Azure Static Web Apps.

## Prerequisites

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure SWA CLI** - Install with `npm install -g @azure/static-web-apps-cli`
3. **Ruby & Jekyll** - For building the site locally
4. **Azure Login** - Run `az login` to authenticate

## Quick Deployment

The simplest way to deploy is using the provided deployment script:

```bash
./deploy.sh
```

This script will:
1. Check if the site is already built (or rebuild if needed)
2. Retrieve the deployment token from Azure automatically
3. Deploy to Azure Static Web Apps using the SWA CLI
4. Show the deployment status

## Manual Deployment

If you prefer to deploy manually:

### 1. Build the Jekyll site

```bash
bundle exec jekyll build
```

This generates the static site in the `_site` directory.

### 2. Get the deployment token

```bash
az staticwebapp secrets list \
  --name baytides-discounts-app \
  --resource-group baytides-discounts-rg \
  --query "properties.apiKey" \
  -o tsv
```

### 3. Deploy using SWA CLI

```bash
swa deploy _site \
  --deployment-token "<token-from-step-2>" \
  --env production
```

## GitHub Actions (Currently Disabled)

GitHub Actions automatic deployment is currently disabled due to persistent token authentication issues with the Azure Static Web Apps API. The workflow still builds the site but skips the deployment step.

To re-enable automatic deployment, edit `.github/workflows/deploy.yml` and change `if: false` to `if: true` in the `deploy-static` job.

## Azure Resources

- **Static Web App**: `baytides-discounts-app`
- **Resource Group**: `baytides-discounts-rg`
- **Region**: West US 2
- **Production URL**: https://bayareadiscounts.com
- **Azure URL**: https://blue-pebble-00a40d41e.4.azurestaticapps.net

## Troubleshooting

### "az command not found"
Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

### "swa command not found"
Install SWA CLI: `npm install -g @azure/static-web-apps-cli`

### "Failed to retrieve deployment token"
Make sure you're logged in to Azure: `az login`

### "No matching Static Web App was found"
This usually indicates a token issue. Use the local `deploy.sh` script which retrieves a fresh token automatically.

## Azure Functions

Azure Functions are deployed separately via the `azure-functions-deploy.yml` workflow, which deploys to:
- **Function App**: `bayarea-api-prod`
- **Resource Group**: `baytides-discounts-rg`

Functions deployment uses Azure credentials and works reliably through GitHub Actions.

## Post-Deployment Verification

After deployment, verify:
1. Site loads: https://bayareadiscounts.com
2. APCA checker works: Open browser console and run `window.APCA.scanPage()`
3. Accessibility toolbar: Click the ♿ button in top-left
4. Theme toggle: Test auto/light/dark modes in utility bar
5. High contrast mode: Enable in accessibility toolbar

## Rollback

To rollback to a previous deployment, check the deployment history in Azure Portal:
1. Navigate to the Static Web App resource
2. Go to "Deployment History"
3. Select a previous successful deployment
4. Click "Reactivate"

Alternatively, checkout a previous Git commit and run `./deploy.sh`:
```bash
git checkout <commit-hash>
./deploy.sh
git checkout main
```
