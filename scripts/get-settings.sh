#!/usr/bin/env bash
# scripts/get-settings.sh
# Usage: ADMIN_TOKEN=<token> ./scripts/get-settings.sh
set -euo pipefail

API_URL="${API_URL:-https://www.dollarchain.store/api/admin/settings?nocache=1}"

if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable is not set."
  echo "Usage: ADMIN_TOKEN=<token> $0"
  exit 2
fi

resp=$(curl -sS -H "Authorization: Bearer ${ADMIN_TOKEN}" "${API_URL}")

# Pretty-print if jq available, otherwise raw output
if command -v jq >/dev/null 2>&1; then
  echo "$resp" | jq .
else
  echo "$resp"
fi
