#!/bin/bash
# Scrape All Municode-Based Bay Area Cities & Counties
# Runs in background with monitoring and progress tracking

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/tmp/municipal-scrape-logs"
PROGRESS_FILE="$LOG_DIR/progress.json"
OUTPUT_DIR="/tmp/municipal-codes-deep"
AZURE_CONTAINER="municipal-codes"
AZURE_ACCOUNT="baytidesstorage"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory
mkdir -p "$LOG_DIR"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🔍 Bay Area Municipal Code Scraper${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Extract all Municode cities from JSON
echo -e "${YELLOW}📋 Extracting Municode cities...${NC}"
MUNICODE_CITIES=$(cat "$PROJECT_DIR/public/data/municipal-codes-content.json" | \
  jq -r '.cities | to_entries[] | select(.value.platform == "municode") | .key' | \
  sort)

TOTAL_CITIES=$(echo "$MUNICODE_CITIES" | wc -l | tr -d ' ')
echo -e "${GREEN}Found ${TOTAL_CITIES} Municode-based cities/counties${NC}"
echo ""

# Check already scraped cities in Azure
echo -e "${YELLOW}🔍 Checking Azure for already-scraped cities...${NC}"
ALREADY_SCRAPED=$(az storage blob list \
  --account-name "$AZURE_ACCOUNT" \
  --container-name "$AZURE_CONTAINER" \
  --query "[?name!='_index.json'].name" \
  --output tsv 2>/dev/null | \
  sed 's/.json$//' | \
  sort) || ALREADY_SCRAPED=""

SCRAPED_COUNT=$(echo "$ALREADY_SCRAPED" | grep -v '^$' | wc -l | tr -d ' ')
echo -e "${GREEN}Already scraped: ${SCRAPED_COUNT} cities${NC}"
echo ""

# Initialize progress tracking
cat > "$PROGRESS_FILE" <<EOF
{
  "started": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total": $TOTAL_CITIES,
  "completed": 0,
  "failed": 0,
  "skipped": $SCRAPED_COUNT,
  "current": null,
  "cities": {}
}
EOF

echo -e "${BLUE}📊 Scraping Progress:${NC}"
echo -e "  Total cities: ${TOTAL_CITIES}"
echo -e "  Already done: ${SCRAPED_COUNT}"
echo -e "  Remaining: $((TOTAL_CITIES - SCRAPED_COUNT))"
echo ""
echo -e "${YELLOW}⏳ Starting scraping process...${NC}"
echo -e "${YELLOW}Logs: ${LOG_DIR}${NC}"
echo ""

# Function to update progress
update_progress() {
  local city="$1"
  local status="$2"
  local sections="${3:-0}"
  local error="${4:-}"

  jq --arg city "$city" \
     --arg status "$status" \
     --argjson sections "$sections" \
     --arg error "$error" \
     --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
     '.current = $city |
      .cities[$city] = {
        "status": $status,
        "sections": $sections,
        "timestamp": $now,
        "error": $error
      } |
      if $status == "completed" then .completed += 1
      elif $status == "failed" then .failed += 1
      elif $status == "skipped" then .skipped += 1
      else . end' \
     "$PROGRESS_FILE" > "$PROGRESS_FILE.tmp" && mv "$PROGRESS_FILE.tmp" "$PROGRESS_FILE"
}

# Function to scrape a single city
scrape_city() {
  local city="$1"
  local city_slug=$(echo "$city" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  local log_file="$LOG_DIR/${city_slug}.log"

  echo -e "${YELLOW}⏳ Scraping: ${city}${NC}"
  update_progress "$city" "in_progress" 0 ""

  # Run scraper
  if node "$SCRIPT_DIR/deep-scrape-municipal-codes.cjs" \
      --city="$city" \
      > "$log_file" 2>&1; then

    # Check if content was actually extracted
    local sections=0
    if [ -f "$OUTPUT_DIR/${city_slug}.json" ]; then
      sections=$(jq '.sections | length' "$OUTPUT_DIR/${city_slug}.json" 2>/dev/null || echo 0)
    fi

    if [ "$sections" -gt 0 ]; then
      echo -e "${GREEN}✅ ${city}: ${sections} sections${NC}"
      update_progress "$city" "completed" "$sections" ""
      return 0
    else
      echo -e "${RED}⚠️  ${city}: No content extracted${NC}"
      update_progress "$city" "failed" 0 "No content extracted"
      return 1
    fi
  else
    local error=$(tail -5 "$log_file" | tr '\n' ' ')
    echo -e "${RED}❌ ${city}: Failed${NC}"
    update_progress "$city" "failed" 0 "$error"
    return 1
  fi
}

# Function to show progress summary
show_progress() {
  if [ -f "$PROGRESS_FILE" ]; then
    local completed=$(jq -r '.completed' "$PROGRESS_FILE")
    local failed=$(jq -r '.failed' "$PROGRESS_FILE")
    local skipped=$(jq -r '.skipped' "$PROGRESS_FILE")
    local total=$(jq -r '.total' "$PROGRESS_FILE")
    local current=$(jq -r '.current // "None"' "$PROGRESS_FILE")

    echo ""
    echo -e "${BLUE}📊 Progress Update${NC}"
    echo -e "  Total: ${total}"
    echo -e "  ${GREEN}Completed: ${completed}${NC}"
    echo -e "  ${RED}Failed: ${failed}${NC}"
    echo -e "  ${YELLOW}Skipped: ${skipped}${NC}"
    echo -e "  Current: ${current}"
    echo -e "  Progress: $((100 * (completed + failed + skipped) / total))%"
    echo ""
  fi
}

# Scrape each city
CITY_NUM=0
for city in $MUNICODE_CITIES; do
  CITY_NUM=$((CITY_NUM + 1))
  city_slug=$(echo "$city" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

  # Skip if already scraped
  if echo "$ALREADY_SCRAPED" | grep -q "^${city_slug}$"; then
    echo -e "${BLUE}⏭️  Skipping ${city} (already scraped)${NC}"
    update_progress "$city" "skipped" 0 "Already in Azure"
    continue
  fi

  # Show progress every 10 cities
  if [ $((CITY_NUM % 10)) -eq 0 ]; then
    show_progress
  fi

  # Scrape city
  scrape_city "$city" || true

  # Rate limiting: 2 seconds between cities
  sleep 2
done

# Final progress
show_progress

# Generate final report
echo ""
echo -e "${BLUE}📝 Generating final report...${NC}"

cat > "$LOG_DIR/final-report.txt" <<EOF
Bay Area Municipal Code Scraping - Final Report
================================================
Date: $(date)

Summary:
--------
Total cities: $TOTAL_CITIES
Completed: $(jq -r '.completed' "$PROGRESS_FILE")
Failed: $(jq -r '.failed' "$PROGRESS_FILE")
Skipped: $(jq -r '.skipped' "$PROGRESS_FILE")

Failed Cities:
--------------
$(jq -r '.cities | to_entries[] | select(.value.status == "failed") | "\(.key): \(.value.error)"' "$PROGRESS_FILE")

Logs Directory: $LOG_DIR
Output Directory: $OUTPUT_DIR

Azure Blob Storage:
-------------------
Container: https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/

To regenerate index:
--------------------
cd $PROJECT_DIR
node scripts/generate-municipal-codes-index.cjs

To upload to Azure:
-------------------
(Already done automatically by scraper)

EOF

cat "$LOG_DIR/final-report.txt"

echo ""
echo -e "${GREEN}✅ Scraping complete!${NC}"
echo -e "${YELLOW}Full report: ${LOG_DIR}/final-report.txt${NC}"
echo -e "${YELLOW}Progress JSON: ${PROGRESS_FILE}${NC}"
