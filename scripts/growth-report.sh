#!/usr/bin/env bash
# Growth read for cardblueprints.com: Cloudflare funnel (Analytics Engine) + Stripe sessions.
#   bash scripts/growth-report.sh [days]   (default 14)
# Auth: Cloudflare = the wrangler OAuth login (~/.wrangler/config/default.toml) or CF_ANALYTICS_TOKEN;
#       Stripe = STRIPE_SECRET_KEY from .env.local (Card Blueprint account). Nothing is printed but numbers.
# Override the wrangler toml path with WRANGLER_CONFIG (tests / alt login files).
set -euo pipefail
cd "$(dirname "$0")/.."
DAYS="${1:-14}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-ed56f6f3b938abe4f3f024a53a789d4f}"
WRANGLER_LIVE_CONFIG="${WRANGLER_LIVE_CONFIG:-${HOME}/.wrangler/config/default.toml}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-$WRANGLER_LIVE_CONFIG}"

# Return 0 if expiration is still in the future (ISO-8601, optional fractional seconds + Z).
wrangler_exp_ok() {
  local iso="${1:-}"
  [[ -n "$iso" ]] || return 1
  iso="${iso%Z}"
  iso="${iso%.*}Z"
  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  [[ "$iso" > "$now" ]]
}

toml_field() {
  grep -m1 "$1" "$2" 2>/dev/null | sed -E 's/.*= *"([^"]+)".*/\1/' || true
}

ensure_wrangler_token() {
  local cfg="$WRANGLER_CONFIG"
  local exp
  exp="$(toml_field expiration_time "$cfg")"
  if ! wrangler_exp_ok "$exp"; then
    npx wrangler whoami >/dev/null 2>&1 || true
    cfg="$WRANGLER_LIVE_CONFIG"
    exp="$(toml_field expiration_time "$cfg")"
    if ! wrangler_exp_ok "$exp"; then
      echo "wrangler token expired; run: npx wrangler login" >&2
      exit 2
    fi
  fi
  toml_field oauth_token "$cfg"
}

if [[ -n "${CF_ANALYTICS_TOKEN:-}" ]]; then
  TOK="$CF_ANALYTICS_TOKEN"
else
  TOK="$(ensure_wrangler_token)"
fi
[[ -n "$TOK" ]] || { echo "no Cloudflare token (run: npx wrangler login)"; exit 2; }
q() {
  curl -sS -X POST "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/analytics_engine/sql" \
    -H "Authorization: Bearer ${TOK}" -H "Content-Type: text/plain" --data "$1" |
  python3 -c 'import json,sys
d=json.load(sys.stdin)
if d.get("success") is False:
    errs=d.get("errors") or []
    msg=""
    if errs and isinstance(errs[0], dict):
        msg=errs[0].get("message") or ""
    print(msg or "analytics query failed")
    sys.exit(3)
rows=d.get("data",[])
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
echo "== calculator_completed by placement"
q "SELECT blob12 AS placement, SUM(_sample_interval) AS n FROM cardblueprints_funnel WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY AND blob1='calculator_completed' GROUP BY placement ORDER BY n DESC"
echo "== calculator → CTA by page (blob4)"
q "SELECT blob4 AS page, SUM(IF(blob1='calculator_completed',_sample_interval,0)) AS calc, SUM(IF(blob1='offer_cta_clicked',_sample_interval,0)) AS cta FROM cardblueprints_funnel WHERE timestamp > NOW() - INTERVAL '${DAYS}' DAY AND blob1 IN ('calculator_completed','offer_cta_clicked') GROUP BY page ORDER BY calc DESC"
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
