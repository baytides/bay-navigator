#!/bin/bash

# Sync GitHub Actions IP Ranges to Azure Storage Account
# Run this periodically (e.g., weekly via cron) to keep firewall rules up to date

set -e

# Configuration
RESOURCE_GROUP="baynavigator-rg"
STORAGE_ACCOUNT="badfuncstoragepe"
GITHUB_META_URL="https://api.github.com/meta"
MAX_RULES=200  # Azure Storage limit

echo "=== GitHub Actions IP Sync to Azure Storage ==="
echo ""

# Check if logged in to Azure
if ! az account show &>/dev/null; then
  echo "❌ Not logged in to Azure. Run: az login"
  exit 1
fi

echo "✓ Azure CLI authenticated"

# Fetch GitHub Actions IP ranges
echo "📥 Fetching GitHub Actions IP ranges..."
GITHUB_IPS=$(curl -s "$GITHUB_META_URL" | jq -r '.actions[]')
TOTAL_IPS=$(echo "$GITHUB_IPS" | wc -l | tr -d ' ')

echo "   Found $TOTAL_IPS IP ranges from GitHub"

# Azure Storage supports max ~200 IP rules
# Strategy: Add most commonly used ranges (smaller CIDRs = broader coverage)
# Sort by CIDR size (smaller CIDR = larger range = better coverage)
echo "📊 Prioritizing IP ranges by coverage..."

SORTED_IPS=$(echo "$GITHUB_IPS" | awk -F'/' '{print $2 " " $0}' | sort -n | head -n $MAX_RULES | cut -d' ' -f2-)
SELECTED_COUNT=$(echo "$SORTED_IPS" | wc -l | tr -d ' ')

echo "   Selected top $SELECTED_COUNT ranges (CIDR coverage priority)"

# Get current IP rules
echo "🔍 Checking current storage firewall rules..."
CURRENT_RULES=$(az storage account network-rule list \
  -g "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT" \
  --query "ipRules[].value" -o tsv 2>/dev/null || echo "")

if [ -z "$CURRENT_RULES" ]; then
  CURRENT_COUNT=0
else
  CURRENT_COUNT=$(echo "$CURRENT_RULES" | wc -l | tr -d ' ')
fi

echo "   Current rules: $CURRENT_COUNT"

# Compare and update if different
echo "🔄 Syncing IP rules..."

# Remove old GitHub IP rules (we'll re-add the current ones)
if [ $CURRENT_COUNT -gt 0 ]; then
  echo "   Removing existing IP rules..."
  echo "$CURRENT_RULES" | while read -r ip; do
    az storage account network-rule remove \
      -g "$RESOURCE_GROUP" \
      --account-name "$STORAGE_ACCOUNT" \
      --ip-address "$ip" \
      --output none 2>/dev/null || true
  done
fi

# Add new GitHub IP rules
echo "   Adding $SELECTED_COUNT IP rules..."
ADDED=0
while IFS= read -r ip; do
  az storage account network-rule add \
    -g "$RESOURCE_GROUP" \
    --account-name "$STORAGE_ACCOUNT" \
    --ip-address "$ip" \
    --output none 2>/dev/null && ((ADDED++)) || echo "   ⚠️  Failed to add $ip (may be duplicate)"
done <<< "$SORTED_IPS"

echo ""
echo "✅ Sync complete!"
echo "   Added: $ADDED IP rules"
echo "   Coverage: Top $MAX_RULES GitHub Actions ranges"
echo ""
echo "💡 Recommendation: Run this script weekly via cron:"
echo "   0 3 * * 0 /path/to/sync-github-ips.sh"
echo ""
