#!/usr/bin/env bash
# scripts/upsert-setting.sh
# Usage:
#   ADMIN_TOKEN=<token> ./scripts/upsert-setting.sh <key> <value-as-json>
# Examples:
#   ADMIN_TOKEN=... ./scripts/upsert-setting.sh charts.show7DayMA true
#   ADMIN_TOKEN=... ./scripts/upsert-setting.sh my_setting '"a string value"'
#   ADMIN_TOKEN=... ./scripts/upsert-setting.sh complex '{"a":1,"b":false}'

set -euo pipefail

if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable is not set."
  echo "Usage: ADMIN_TOKEN=<token> $0 <key> <value-as-json>"
  exit 2
fi

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <key> <value-as-json>"
  echo "Example: $0 charts.show7DayMA true"
  echo "Note: pass JSON-valid value for <value-as-json>. Strings must be quoted."
  exit 2
fi

KEY="$1"
VALUE_RAW="$2"

API_URL="${API_URL:-https://www.dollarchain.store/api/admin/settings}"

# Build payload (value is inserted raw so caller must pass valid JSON token)
PAYLOAD=$(printf '{"key":%s,"value":%s}' "$(printf '%s' "$KEY" | jq -R .)" "$VALUE_RAW")

resp=$(curl -sS -X POST "${API_URL}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

if command -v jq >/dev/null 2>&1; then
  echo "$resp" | jq .
else
  echo "$resp"
fi
