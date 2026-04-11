#!/bin/bash
# Cron wrapper for missing persons sync
# Runs on Mac Mini every 15 minutes via:
#   */15 * * * * /path/to/bay-navigator/scripts/run-missing-persons-sync.sh
#
# Required environment variables (set in this script or export before calling):
#   AZURE_STORAGE_KEY  - Azure Blob Storage account key for baytidesstorage
#   PUSH_FUNCTION_KEY  - Azure Function key for push notifications (optional)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_DIR}/logs/missing-persons-sync.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Load environment variables if a .env file exists
if [ -f "${PROJECT_DIR}/.env" ]; then
  set -a
  source "${PROJECT_DIR}/.env"
  set +a
fi

# Use localhost Ollama (faster than going through ai.baytides.org)
export CARL_API_URL="${CARL_API_URL:-http://localhost:11434}"

echo "=== Missing Persons Sync: $(date -Iseconds) ===" >> "$LOG_FILE"

node "${SCRIPT_DIR}/sync-missing-persons.cjs" --verbose >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "[ERROR] Sync exited with code $EXIT_CODE" >> "$LOG_FILE"
fi

echo "=== Done: $(date -Iseconds) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Keep log file from growing unbounded (retain last 5000 lines)
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE")" -gt 10000 ]; then
  tail -n 5000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

exit $EXIT_CODE
