#!/usr/bin/env bash
# Funnel report for cardblueprints — answers "voice or text?" with numbers.
#
# Needs a Cloudflare API token scoped to `Account Analytics: Read` and the
# account id. Neither is stored here; pass them in:
#
#   CF_ACCOUNT_ID=xxx CF_ANALYTICS_TOKEN=yyy ./scripts/funnel-report.sh
#   CF_ACCOUNT_ID=xxx CF_ANALYTICS_TOKEN=yyy ./scripts/funnel-report.sh 90
#
# Days of history defaults to 30. Analytics Engine retains 3 months.
set -euo pipefail

DAYS="${1:-30}"
: "${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}"
: "${CF_ANALYTICS_TOKEN:?set CF_ANALYTICS_TOKEN (needs Account Analytics: Read)}"

API="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql"

q() { # q "<sql>"
  curl -sS -X POST "$API" \
    -H "Authorization: Bearer ${CF_ANALYTICS_TOKEN}" \
    -H "Content-Type: text/plain" \
    --data "$1"
}

show() { # show "<title>" "<sql>"
  echo
  echo "=== $1"
  q "$2" | python3 -c '
import json,sys
raw = sys.stdin.read()
try: d = json.loads(raw)
except Exception: print("  (non-JSON response) " + raw[:200]); sys.exit()
if isinstance(d, dict) and d.get("errors"):
    print("  ERROR:", json.dumps(d["errors"])[:300]); sys.exit()
rows = d.get("data", d if isinstance(d, list) else [])
if not rows: print("  (no rows — no events in this window)"); sys.exit()
cols = list(rows[0].keys())
w = {c: max(len(str(c)), max(len(str(r.get(c,""))) for r in rows)) for c in cols}
print("  " + "  ".join(str(c).ljust(w[c]) for c in cols))
for r in rows[:40]:
    print("  " + "  ".join(str(r.get(c,"")).ljust(w[c]) for c in cols))
'
}

echo "cardblueprints funnel — last ${DAYS} days"

show "Every event, by volume" "
SELECT blob1 AS event, SUM(_sample_interval) AS n
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY
GROUP BY event ORDER BY n DESC"

show "THE VOICE QUESTION: call intent vs money" "
SELECT blob1 AS step, SUM(_sample_interval) AS n
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY
  AND blob1 IN ('calculator_completed','free_call_clicked','readings_viewed','offer_selected','checkout_started','purchase_completed')
GROUP BY step ORDER BY n DESC"

show "Which offer people actually pick" "
SELECT blob11 AS offer, blob1 AS event, SUM(_sample_interval) AS n
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY
  AND blob11 != '' AND blob1 IN ('offer_selected','checkout_started','purchase_completed')
GROUP BY offer, event ORDER BY n DESC"

show "Revenue by offer (cents)" "
SELECT blob11 AS offer, SUM(_sample_interval) AS sales, SUM(double1 * _sample_interval) AS cents
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY
  AND blob1 = 'purchase_completed'
GROUP BY offer ORDER BY cents DESC"

show "Where CTA clicks happen (placement)" "
SELECT blob12 AS placement, blob1 AS event, SUM(_sample_interval) AS n
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY AND blob12 != ''
GROUP BY placement, event ORDER BY n DESC"

show "Organic landing pages that feed the funnel" "
SELECT blob5 AS landing_path, SUM(_sample_interval) AS n
FROM cardblueprints_funnel
WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY AND blob1 = 'organic_landing'
GROUP BY landing_path ORDER BY n DESC"

cat <<'NOTE'

--- How to read this ---
The voice decision hinges on two ratios:

  free_call_clicked / calculator_completed
      Do curious people even reach for the phone? Low = call friction is real.

  purchase_completed / checkout_started
      Do they finish paying once they get to Stripe?

CAVEAT, from docs/analytics.md: a free-call click is INTENT, not proof the
call connected. There is no call-start or call-completion event — that needs a
lifecycle signal from the telephony provider. So this report cannot tell you
whether calls actually happen, only whether people reach toward them. If
free_call_clicked is healthy but purchases are not, the gap is either the call
experience itself or checkout — and today you cannot tell which apart.
NOTE
