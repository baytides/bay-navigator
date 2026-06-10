#!/usr/bin/env bash
# Build the on-device Knowledge Pack and copy the corpus into the Apple bundle.
#
# The corpus is a generated build artifact (gitignored), so run this before
# building the Apple targets — locally and as an Xcode "Run Script" build phase.
#
# Usage: apps/apple/scripts/sync-knowledge-pack.sh
set -euo pipefail

# Repo root = three levels up from apps/apple/scripts
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEST="$ROOT/apps/apple/BayNavigatorCore/Sources/BayNavigatorCore/Resources"

echo "Building knowledge pack..."
( cd "$ROOT" && npm run generate:pack )

mkdir -p "$DEST"
cp "$ROOT/public/api/knowledge-pack/corpus.sqlite" "$DEST/corpus.sqlite"
echo "Copied corpus.sqlite -> $DEST/corpus.sqlite"
