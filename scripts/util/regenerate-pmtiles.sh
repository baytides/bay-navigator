#!/bin/bash
# Regenerate Bay Area PMTiles from latest Protomaps daily build
# This script extracts a Bay Area subset from the latest OpenStreetMap data
#
# Requirements:
# - pmtiles CLI (go install github.com/protomaps/go-pmtiles/cmd/pmtiles@latest)
# - Azure CLI (for upload to blob storage)
#
# Usage: ./scripts/regenerate-pmtiles.sh

set -e

# Bay Area bounding box (expanded slightly for edge coverage)
# West: Pacific coast, East: Livermore/Tracy, North: Napa/Sonoma, South: Santa Cruz
BBOX="-123.6,36.7,-121.0,39.0"

# Output file
OUTPUT_FILE="bayarea.pmtiles"
OUTPUT_DIR="/tmp/pmtiles"

# Protomaps daily builds URL (v4 format)
BUILDS_URL="https://build.protomaps.com"

echo "=== Bay Area PMTiles Regeneration ==="
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

# Find the latest build date
echo "Finding latest Protomaps build..."
# Get today's date and try recent dates
for i in 0 1 2 3 4 5 6; do
  DATE=$(date -v-${i}d +%Y%m%d 2>/dev/null || date -d "-${i} days" +%Y%m%d)
  BUILD_URL="${BUILDS_URL}/${DATE}.pmtiles"

  # Check if build exists (HEAD request)
  if curl -s --head "$BUILD_URL" | grep -q "200 OK"; then
    echo "Found build: $DATE"
    break
  fi
done

if [ -z "$DATE" ]; then
  echo "Error: Could not find recent Protomaps build"
  exit 1
fi

# Extract Bay Area subset
echo ""
echo "Extracting Bay Area tiles (bbox: $BBOX)..."
echo "This may take several minutes..."
echo ""

# Use pmtiles extract command
# --maxzoom=16 is sufficient for city-level navigation
~/go/bin/go-pmtiles extract "$BUILD_URL" "$OUTPUT_FILE" --bbox="$BBOX" --maxzoom=16

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: PMTiles extraction failed"
  exit 1
fi

# Show file size
SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo ""
echo "Generated: $OUTPUT_FILE ($SIZE)"

# Optionally upload to Azure Blob Storage
if [ "$1" == "--upload" ]; then
  echo ""
  echo "Uploading to Azure Blob Storage..."

  # Check if logged in to Azure
  if ! az account show > /dev/null 2>&1; then
    echo "Please login to Azure: az login"
    exit 1
  fi

  STORAGE_ACCOUNT="baytidesstorage"
  CONTAINER="tiles"

  # Upload with public read access
  az storage blob upload \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER" \
    --name "$OUTPUT_FILE" \
    --file "$OUTPUT_FILE" \
    --overwrite \
    --content-type "application/octet-stream" \
    --content-cache-control "public, max-age=86400"

  echo ""
  echo "Uploaded to: https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINER}/${OUTPUT_FILE}"
fi

echo ""
echo "=== Complete ==="
echo ""
echo "To upload to Azure, run:"
echo "  ./scripts/regenerate-pmtiles.sh --upload"
echo ""
echo "Or manually copy to Azure Blob Storage:"
echo "  az storage blob upload --account-name baytidesstorage --container-name tiles --name bayarea.pmtiles --file $OUTPUT_DIR/$OUTPUT_FILE"
