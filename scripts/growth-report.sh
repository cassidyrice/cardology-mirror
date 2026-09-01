#!/usr/bin/env bash
# Growth read for cardblueprints.com: Cloudflare funnel (Analytics Engine) + Stripe sessions.
#   bash scripts/growth-report.sh [days]   (default 14)
# Auth: Cloudflare = the wrangler OAuth login (~/.wrangler/config/default.toml) or CF_ANALYTICS_TOKEN;
#       Stripe = STRIPE_SECRET_KEY from .env.local (Card Blueprint account). Nothing is printed but numbers.
set -euo pipefail
cd "$(dirname "$0")/.."
DAYS="${1:-14}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-ed56f6f3b938abe4f3f024a53a789d4f}"
TOK="${CF_ANALYTICS_TOKEN:-$(grep -m1 oauth_token ~/.wrangler/config/default.toml 2>/dev/null | sed -E 's/.*= *"([^"]+)".*/\1/')}"
[[ -n "$TOK" ]] || { echo "no Cloudflare token (run: npx wrangler login)"; exit 2; }
q() {
  curl -sS -X POST "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql" \
    -H "Authorization: Bearer ${TOK}" -H "Content-Type: text/plain" --data "$1" |
  python3 -c 'import json,sys
d=json.load(sys.stdin); rows=d.get("data",[])
if not rows: print("  (no rows)"); sys.exit()
cols=list(rows[0]); w={c:max(len(c),*(len(str(r[c])) for r in rows)) for c in cols}
print("  "+"  ".join(c.ljust(w[c]) for c in cols))
for r in rows: print("  "+"  ".join(str(r[c]).ljust(w[c]) for c in cols))'
}
echo "== funnel, last ${DAYS}d"
q "SELECT blob1 AS step, SUM(_sample_interval) AS n FROM cardblueprints_funnel WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY AND blob1 IN ('organic_landing','calculator_completed','offer_cta_clicked','checkout_started','checkout_error','purchase_completed') GROUP BY step ORDER BY n DESC"
echo "== by day"
q "SELECT toDate(timestamp) AS day, SUM(IF(blob1='calculator_completed',_sample_interval,0)) AS calc, SUM(IF(blob1='offer_cta_clicked',_sample_interval,0)) AS cta, SUM(IF(blob1='checkout_started',_sample_interval,0)) AS checkout, SUM(IF(blob1='purchase_completed',_sample_interval,0)) AS paid FROM cardblueprints_funnel WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY GROUP BY day ORDER BY day"
echo "== CTA placement"
q "SELECT blob12 AS placement, SUM(_sample_interval) AS n FROM cardblueprints_funnel WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY AND blob1='offer_cta_clicked' GROUP BY placement ORDER BY n DESC LIMIT 10"
if [[ -f .env.local ]]; then
  SK="$(grep -m1 '^STRIPE_SECRET_KEY=' .env.local | cut -d= -f2- | tr -d '"' )"
  if [[ -n "$SK" ]]; then
    echo "== Stripe checkout sessions, last ${DAYS}d (Card Blueprint account)"
    since=$(( $(date +%s) - DAYS*86400 ))
    curl -sS -g -u "${SK}:" "https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${since}" |
    python3 -c 'import json,sys,collections
d=json.load(sys.stdin); c=collections.Counter()
for s in d.get("data",[]): c[(s["amount_total"]/100, s["status"])]+=1
for (amt,st),n in sorted(c.items()): print(f"  ${amt:.0f}  {st:9}  {n}")'
  fi
fi
