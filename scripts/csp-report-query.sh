#!/usr/bin/env bash
# Read redacted CSP report-only violations from Analytics Engine.
#
# The dataset is cardblueprints_csp (binding CSP_REPORTS). It is not the
# funnel dataset. Workers logs carry the same line, prefixed [csp-report]:
#
#   npx wrangler pages deployment tail --project-name cardology-mirror
#
# Needs a Cloudflare API token scoped to Account Analytics: Read.
#
#   CF_ACCOUNT_ID=xxx CF_ANALYTICS_TOKEN=yyy ./scripts/csp-report-query.sh
#   CF_ACCOUNT_ID=xxx CF_ANALYTICS_TOKEN=yyy ./scripts/csp-report-query.sh 14
set -euo pipefail

DAYS="${1:-7}"
if ! [[ "$DAYS" =~ ^[0-9]+$ ]]; then
  echo "days must be an integer" >&2
  exit 1
fi
: "${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}"
: "${CF_ANALYTICS_TOKEN:?set CF_ANALYTICS_TOKEN (needs Account Analytics: Read)}"

API="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql"

q() {
  curl -sS -X POST "$API" \
    -H "Authorization: Bearer ${CF_ANALYTICS_TOKEN}" \
    -H "Content-Type: text/plain" \
    --data "$1"
}

echo "cardblueprints CSP reports — last ${DAYS} days"
echo "Logs: npx wrangler pages deployment tail --project-name cardology-mirror"
echo "Look for lines starting with [csp-report]."
echo

q "SELECT blob1 AS directive, blob2 AS blocked_host, blob3 AS document_path, blob4 AS disposition, blob5 AS source, SUM(_sample_interval) AS n FROM cardblueprints_csp WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY GROUP BY directive, blocked_host, document_path, disposition, source ORDER BY n DESC LIMIT 40" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except Exception:
    print(raw[:500])
    sys.exit(0)
if isinstance(data, dict) and data.get("errors"):
    print("ERROR:", json.dumps(data["errors"])[:400])
    sys.exit(1)
rows = data.get("data", data if isinstance(data, list) else [])
if not rows:
    print("(no rows — dataset collects after the next production deploy)")
    sys.exit(0)
cols = list(rows[0].keys())
width = {col: max(len(str(col)), max(len(str(row.get(col, ""))) for row in rows)) for col in cols}
print("  " + "  ".join(str(col).ljust(width[col]) for col in cols))
for row in rows:
    print("  " + "  ".join(str(row.get(col, "")).ljust(width[col]) for col in cols))
'
