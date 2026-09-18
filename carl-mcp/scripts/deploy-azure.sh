#!/usr/bin/env bash
#
# Deploy the Carl MCP server to its Azure Function App.
#
# There was no script and no workflow for this — the app had been published by
# hand, so shipping a change meant rediscovering the steps. The awkward one is
# the `file:..` dependency: `npm install` symlinks @baytides/carl-mcp out of the
# bundle, and `--install-links` does NOT prevent that when the source sits in
# the same tree, so a plain zip deploys a dangling link and the app boots with
# "Cannot find package '@baytides/carl-mcp'". The symlink is replaced with a
# real copy below.
#
# Usage: carl-mcp/scripts/deploy-azure.sh
set -euo pipefail

APP="${CARL_MCP_APP:-baynavigator-carl-mcp}"
GROUP="${CARL_MCP_GROUP:-baytides-rg}"
PUBLIC_URL="${CARL_MCP_URL:-https://baynavigator.org/mcp}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CARL="$ROOT/carl-mcp"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "→ Running tests before shipping"
(cd "$CARL" && npm test >/dev/null) || { echo "❌ tests failed — not deploying"; exit 1; }

echo "→ Staging bundle in $STAGE"
cp -R "$CARL/http/host.json" "$CARL/http/package.json" "$CARL/http/src" "$STAGE/"
mkdir -p "$STAGE/carl-mcp"
cp -R "$CARL/package.json" "$CARL/src" "$STAGE/carl-mcp/"

# Repoint the file: dependency at the copy we just staged.
node -e '
  const fs = require("fs");
  const p = process.argv[1] + "/package.json";
  const d = JSON.parse(fs.readFileSync(p, "utf8"));
  d.dependencies["@baytides/carl-mcp"] = "file:./carl-mcp";
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
' "$STAGE"

echo "→ Installing production dependencies"
(cd "$STAGE" && npm install --omit=dev --no-audit --no-fund >/dev/null)

# npm symlinks file: deps even with --install-links; replace with a real copy or
# the zip carries a broken link and the function app fails to start.
rm -f "$STAGE/node_modules/@baytides/carl-mcp"
cp -R "$STAGE/carl-mcp" "$STAGE/node_modules/@baytides/carl-mcp"
rm -rf "$STAGE/carl-mcp"

if [ -L "$STAGE/node_modules/@baytides/carl-mcp" ]; then
  echo "❌ @baytides/carl-mcp is still a symlink — the deploy would boot broken."
  exit 1
fi

echo "→ Zipping"
(cd "$STAGE" && zip -qr "$STAGE/../mcp-deploy.zip" . -x "*.DS_Store")
ZIP="$STAGE/../mcp-deploy.zip"
echo "   $(du -h "$ZIP" | cut -f1)"

echo "→ Deploying to $APP ($GROUP)"
az functionapp deployment source config-zip \
  -g "$GROUP" -n "$APP" --src "$ZIP" --build-remote false >/dev/null

echo "→ Waiting for the new build to answer"
for i in $(seq 1 20); do
  TOOLS=$(curl -sS --max-time 20 -X POST "$PUBLIC_URL" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' 2>/dev/null \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log((JSON.parse(s).result.tools||[]).length)}catch{console.log(0)}})')
  if [ "${TOOLS:-0}" -gt 0 ]; then
    echo "✅ $PUBLIC_URL is serving $TOOLS tools"
    exit 0
  fi
  sleep 6
done

echo "⚠️  Deployed, but $PUBLIC_URL did not answer within ~2 minutes. Check:"
echo "    az webapp log tail -g $GROUP -n $APP"
exit 1
