#!/usr/bin/env bash
# scripts/delete-setting.sh
# Usage:
#   ADMIN_TOKEN=<token> ./scripts/delete-setting.sh <key>

set -euo pipefail

if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable is not set."
  echo "Usage: ADMIN_TOKEN=<token> $0 <key>"
  exit 2
fi

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <key>"
  exit 2
fi

KEY="$1"
API_URL="${API_URL:-https://www.dollarchain.store/api/admin/settings}"

PAYLOAD=$(printf '{"key":%s,"value":null}' "$(printf '%s' "$KEY" | jq -R .)")

resp=$(curl -sS -X POST "${API_URL}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

if command -v jq >/dev/null 2>&1; then
  echo "$resp" | jq .
else
  echo "$resp"
fi
