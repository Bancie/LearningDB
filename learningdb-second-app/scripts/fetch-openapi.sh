#!/usr/bin/env bash
# Refresh OpenAPI snapshot for design/stitch-context (requires API on port 8000).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/design/stitch-context/openapi.snapshot.json"
URL="${OPENAPI_URL:-http://127.0.0.1:8000/openapi.json}"
echo "Fetching $URL -> $OUT"
curl -sfS "$URL" -o "$OUT"
echo "OK ($(wc -c < "$OUT") bytes)"
