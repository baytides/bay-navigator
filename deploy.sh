#!/bin/bash
# Simple deployment script for Bay Area Discounts
# Uses Azure SWA CLI to deploy the static site

set -e

echo "🚀 Bay Area Discounts Deployment Script"
echo "========================================"

# Check if SWA CLI is installed
if ! command -v swa &> /dev/null; then
    echo "❌ Error: Azure SWA CLI not found"
    echo "Install it with: npm install -g @azure/static-web-apps-cli"
    exit 1
fi

# Check if _site directory exists
if [ ! -d "_site" ]; then
    echo "📦 Building Jekyll site..."
    bundle exec jekyll build
else
    echo "✓ Found existing _site directory"
    read -p "Rebuild Jekyll site? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Rebuilding Jekyll site..."
        bundle exec jekyll build
    fi
fi

# Get deployment token from Azure
echo "🔑 Retrieving deployment token from Azure..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name baytides-discounts-app \
    --resource-group baytides-discounts-rg \
    --query "properties.apiKey" \
    -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo "❌ Error: Failed to retrieve deployment token"
    echo "Make sure you're logged in: az login"
    exit 1
fi

# Deploy to Azure Static Web Apps
echo "🚀 Deploying to Azure Static Web Apps..."
swa deploy _site \
    --deployment-token "$DEPLOYMENT_TOKEN" \
    --env production

echo ""
echo "✅ Deployment complete!"
echo "🌐 Site: https://bayareadiscounts.com"
echo "🔗 Azure: https://blue-pebble-00a40d41e.4.azurestaticapps.net"
