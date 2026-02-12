#!/bin/bash
# Missing Persons Sync Runner for Mac Mini
# Runs the sync script and commits changes if any

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$SCRIPT_DIR/logs"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Load nvm and node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Source environment variables if .env file exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
    export $(cat "$PROJECT_DIR/.env.local" | grep -v '^#' | xargs)
fi

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Starting missing persons sync..."

# Navigate to project directory
cd "$PROJECT_DIR"

# Ensure we're on main branch and up to date
git fetch origin main
git checkout main
git pull origin main

# Run the sync script
node scripts/sync-missing-persons.cjs --verbose

# Check for changes
if git diff --quiet public/api/missing-persons.json && \
   git diff --quiet public/api/missing-persons-previous.json; then
    echo "[$TIMESTAMP] No changes to commit"
    exit 0
fi

# Configure git if not already configured
if [ -z "$(git config user.name)" ]; then
    git config user.name "Bay Navigator Mac Mini"
    git config user.email "steven@baytides.org"
fi

# Commit and push changes
git add public/api/missing-persons.json public/api/missing-persons-previous.json

git commit -m "chore: Sync missing persons data [skip ci]

Automated sync of NCMEC missing children data for Bay Area counties.
Generated from NCMEC RSS feed, enriched via Ollama (Carl).

Synced from: Mac Mini (carl-ai-vm)
Timestamp: $TIMESTAMP"

git push origin main

echo "[$TIMESTAMP] Sync complete and pushed to GitHub"
