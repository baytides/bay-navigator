#!/bin/bash
# Cleanup GitHub Deployments Script
# This script deletes old/inactive deployments, keeping the most recent ones

set -e

echo "🧹 GitHub Deployments Cleanup"
echo "=============================="
echo ""

# Check if gh is authenticated
if ! gh auth status > /dev/null 2>&1; then
  echo "❌ GitHub CLI not authenticated."
  echo "Please run: gh auth login"
  exit 1
fi

# Number of recent deployments to keep (default: 5)
KEEP_COUNT=${1:-5}

echo "Fetching all deployments..."
ALL_DEPLOYMENTS=$(gh api repos/baytides/baynavigator/deployments --paginate --jq '.[] | {id: .id, created: .created_at, env: .environment}')

if [ -z "$ALL_DEPLOYMENTS" ]; then
  echo "✅ No deployments found. Repository is clean!"
  exit 0
fi

TOTAL=$(echo "$ALL_DEPLOYMENTS" | jq -s 'length')
echo "Found $TOTAL total deployments"

# Get IDs of deployments to delete (all except the most recent $KEEP_COUNT)
echo "Keeping the $KEEP_COUNT most recent deployments..."
DEPLOYMENT_IDS=$(gh api repos/baytides/baynavigator/deployments --paginate --jq '.[].id' | tail -n +$((KEEP_COUNT + 1)))

if [ -z "$DEPLOYMENT_IDS" ]; then
  echo "✅ Only $TOTAL deployments found, all will be kept!"
  exit 0
fi

TO_DELETE=$(echo "$DEPLOYMENT_IDS" | wc -l | xargs)
echo "Will delete $TO_DELETE old deployments (keeping $KEEP_COUNT newest)"
echo ""

read -p "Continue with deletion? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

COUNT=0
DELETED=0
FAILED=0

for DEPLOYMENT_ID in $DEPLOYMENT_IDS; do
  COUNT=$((COUNT + 1))
  echo -n "[$COUNT/$TO_DELETE] Deleting deployment $DEPLOYMENT_ID... "

  # Set deployment to inactive first
  gh api -X POST "repos/baytides/baynavigator/deployments/$DEPLOYMENT_ID/statuses" \
    -f state=inactive > /dev/null 2>&1 || true

  # Delete the deployment
  if gh api -X DELETE "repos/baytides/baynavigator/deployments/$DEPLOYMENT_ID" > /dev/null 2>&1; then
    echo "✅"
    DELETED=$((DELETED + 1))
  else
    echo "⚠️  Failed"
    FAILED=$((FAILED + 1))
  fi

  # Rate limiting: pause every 50 requests
  if [ $((COUNT % 50)) -eq 0 ]; then
    echo "  💤 Pausing for rate limiting..."
    sleep 2
  fi
done

echo ""
echo "=============================="
echo "✨ Cleanup Complete!"
echo "   Kept:    $KEEP_COUNT (newest)"
echo "   Deleted: $DELETED"
echo "   Failed:  $FAILED"
echo "   Total:   $TOTAL"
