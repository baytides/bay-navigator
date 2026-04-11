#!/bin/bash
# Monitor the scraping process in real-time
# Shows progress updates every 30 seconds

PROGRESS_FILE="/tmp/municipal-scrape-logs/progress.json"
LOG_DIR="/tmp/municipal-scrape-logs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}🔍 Municipal Code Scraping Monitor${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

if [ ! -f "$PROGRESS_FILE" ]; then
  echo -e "${RED}Error: Progress file not found${NC}"
  echo -e "${YELLOW}Make sure scrape-all-municode-cities.sh is running${NC}"
  exit 1
fi

# Watch progress
while true; do
  if [ -f "$PROGRESS_FILE" ]; then
    clear
    echo -e "${BLUE}🔍 Municipal Code Scraping Monitor${NC}"
    echo -e "${BLUE}===================================${NC}"
    echo ""

    # Extract stats
    total=$(jq -r '.total' "$PROGRESS_FILE")
    completed=$(jq -r '.completed' "$PROGRESS_FILE")
    failed=$(jq -r '.failed' "$PROGRESS_FILE")
    skipped=$(jq -r '.skipped' "$PROGRESS_FILE")
    current=$(jq -r '.current // "None"' "$PROGRESS_FILE")
    started=$(jq -r '.started' "$PROGRESS_FILE")

    # Calculate progress
    processed=$((completed + failed + skipped))
    remaining=$((total - processed))
    percent=$((100 * processed / total))

    # Calculate rate
    start_seconds=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$started" +%s 2>/dev/null || date +%s)
    now_seconds=$(date +%s)
    elapsed=$((now_seconds - start_seconds))
    cities_per_min=$(echo "scale=1; $processed * 60 / $elapsed" | bc 2>/dev/null || echo "0")

    # Estimate remaining time
    if [ "$processed" -gt 0 ]; then
      remaining_mins=$((remaining * elapsed / processed / 60))
    else
      remaining_mins=0
    fi

    echo -e "${YELLOW}Started:${NC} $(date -r $start_seconds)"
    echo -e "${YELLOW}Elapsed:${NC} $((elapsed / 60)) minutes"
    echo ""
    echo -e "${BLUE}📊 Progress:${NC}"
    echo -e "  ${GREEN}Completed: ${completed}/${total}${NC}"
    echo -e "  ${RED}Failed:    ${failed}/${total}${NC}"
    echo -e "  ${YELLOW}Skipped:   ${skipped}/${total}${NC}"
    echo -e "  Remaining: ${remaining}"
    echo ""

    # Progress bar
    bar_width=50
    filled=$((percent * bar_width / 100))
    empty=$((bar_width - filled))
    bar=$(printf '%*s' "$filled" | tr ' ' '█')
    bar="$bar$(printf '%*s' "$empty" | tr ' ' '░')"
    echo -e "  [${bar}] ${percent}%"
    echo ""

    echo -e "${YELLOW}⏱️  Rate:${NC} ${cities_per_min} cities/min"
    echo -e "${YELLOW}⏳ ETA:${NC} ~${remaining_mins} minutes"
    echo ""
    echo -e "${BLUE}🔄 Current:${NC} ${current}"
    echo ""

    # Show last 5 completed cities
    echo -e "${GREEN}✅ Recently Completed:${NC}"
    jq -r '.cities | to_entries[] | select(.value.status == "completed") | "\(.key): \(.value.sections) sections"' "$PROGRESS_FILE" | tail -5
    echo ""

    # Show failed cities
    failed_count=$(jq -r '[.cities | to_entries[] | select(.value.status == "failed")] | length' "$PROGRESS_FILE")
    if [ "$failed_count" -gt 0 ]; then
      echo -e "${RED}❌ Failed Cities:${NC}"
      jq -r '.cities | to_entries[] | select(.value.status == "failed") | "\(.key)"' "$PROGRESS_FILE" | head -5
      echo ""
    fi

    echo -e "${BLUE}Logs:${NC} $LOG_DIR"
    echo -e "${BLUE}Progress JSON:${NC} $PROGRESS_FILE"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to exit monitor (scraping will continue)${NC}"
  else
    echo -e "${RED}Progress file disappeared - scraping may have finished${NC}"
    break
  fi

  sleep 30
done

echo ""
echo -e "${GREEN}Monitoring stopped${NC}"
