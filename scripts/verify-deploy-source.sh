#!/usr/bin/env bash
# Verify that cardblueprints.com is serving the commit ops/DEPLOY-SOURCE.md claims.
#
# Method: assert artifacts that exist ONLY in the deployed commit against the
# live URLs. Read-only — this never deploys and never writes.
#
# Usage:
#   bash scripts/verify-deploy-source.sh
#
# Exit codes:
#   0  production matches the recorded Pages commit AND Worker version
#   1  MISMATCH — production is not serving the recorded commit / Worker
#   2  could not reach production / probe inconclusive
set -euo pipefail

SITE_ORIGIN="${SITE_ORIGIN:-https://cardblueprints.com}"

# --- The record. Keep in sync with ops/DEPLOY-SOURCE.md ---
DEPLOY_BRANCH="main"
DEPLOY_COMMIT="866771b147cbb3d1acdf1cb671db4b99760fe9e6"
WORKER_NAME="cardology-unlock"
WORKER_VERSION="da24f699-4b1f-4473-a218-82a8eff38988"
WORKER_ROLLBACK="60becbc0-7aaf-4474-bfd4-e68e392f2988"

WELLKNOWN_PATH="/.well-known/apple-developer-merchantid-domain-association"
WELLKNOWN_REPO_PATH="public/.well-known/apple-developer-merchantid-domain-association"
EXPECTED_WELLKNOWN_SHA256="2de7b483319c713bf649352f7f158f1fedbda92f546bebfe576ae0a2d2c526c6"

HEADER_PATH="/birth-card-calculator"
EXPECTED_PAYMENT_POLICY='payment=(self "https://js.stripe.com")'

# Probe 3: per-page OG image that first shipped in ba899e1 (SEO polish).
OG_PATH="/og/what-is-cardology.png"
OG_REPO_PATH="public/og/what-is-cardology.png"
EXPECTED_OG_SHA256="3e61589fa956276477af28f202a4b03f7da735b6453be256454573ce666f437d"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

command -v curl >/dev/null || { red "curl is required"; exit 2; }
command -v shasum >/dev/null || { red "shasum is required"; exit 2; }

CURL=(curl -sS --max-time 20 --retry 2 --retry-delay 2)

fail=0
inconclusive=0

echo "=========================================="
echo " Verifying deploy source"
echo " Site:   $SITE_ORIGIN"
echo " Record: $DEPLOY_BRANCH @ ${DEPLOY_COMMIT:0:7}"
echo " Worker: $WORKER_NAME @ ${WORKER_VERSION:0:8} (rollback ${WORKER_ROLLBACK:0:8})"
echo "=========================================="

# --- Probe 1: file that first shipped in 0b60efb; older builds 404 ---
echo "→ probe 1: ${WELLKNOWN_PATH}"
code="$("${CURL[@]}" -o /dev/null -w '%{http_code}' "${SITE_ORIGIN}${WELLKNOWN_PATH}" || echo 000)"

if [[ "$code" == "000" ]]; then
  red "  UNREACHABLE — could not contact ${SITE_ORIGIN}"
  inconclusive=1
elif [[ "$code" != "200" ]]; then
  red "  FAIL: expected HTTP 200, got ${code}"
  red "  This file first shipped in 0b60efb. A 404 means an older build is live."
  fail=1
else
  live_sha="$("${CURL[@]}" "${SITE_ORIGIN}${WELLKNOWN_PATH}" | shasum -a 256 | awk '{print $1}')"
  if [[ "$live_sha" == "$EXPECTED_WELLKNOWN_SHA256" ]]; then
    green "  OK: HTTP 200, sha256 matches the blob in ${DEPLOY_COMMIT:0:7}"
  else
    red "  FAIL: HTTP 200 but body digest differs"
    red "    expected ${EXPECTED_WELLKNOWN_SHA256}"
    red "    live     ${live_sha}"
    fail=1
  fi
fi

# --- Probe 2: header changed in 2837ba5; older builds serve payment=() ---
echo "→ probe 2: Permissions-Policy on ${HEADER_PATH}"
policy="$("${CURL[@]}" -I "${SITE_ORIGIN}${HEADER_PATH}" 2>/dev/null | grep -i '^permissions-policy:' | tr -d '\r' || true)"

if [[ -z "$policy" ]]; then
  red "  FAIL: no Permissions-Policy header returned"
  red "  public/_headers may not have shipped."
  fail=1
elif [[ "$policy" == *"$EXPECTED_PAYMENT_POLICY"* ]]; then
  green "  OK: ${EXPECTED_PAYMENT_POLICY}"
elif [[ "$policy" == *"payment=()"* ]]; then
  red "  FAIL: payment=() — a pre-2837ba5 build is live. Apple Pay / Google Pay are BROKEN."
  red "  ${policy}"
  fail=1
else
  red "  FAIL: unexpected payment directive"
  red "  ${policy}"
  fail=1
fi

# --- Probe 3: OG image that first shipped in ba899e1; older builds 404 ---
echo "→ probe 3: ${OG_PATH}"
og_code="$("${CURL[@]}" -o /dev/null -w '%{http_code}' "${SITE_ORIGIN}${OG_PATH}" || echo 000)"

if [[ "$og_code" == "000" ]]; then
  red "  UNREACHABLE — could not contact ${SITE_ORIGIN}"
  inconclusive=1
elif [[ "$og_code" != "200" ]]; then
  red "  FAIL: expected HTTP 200, got ${og_code}"
  red "  This file first shipped in ba899e1. A 404 means an older build is live."
  fail=1
else
  og_sha="$("${CURL[@]}" "${SITE_ORIGIN}${OG_PATH}" | shasum -a 256 | awk '{print $1}')"
  if [[ "$og_sha" == "$EXPECTED_OG_SHA256" ]]; then
    green "  OK: HTTP 200, sha256 matches the blob in ${DEPLOY_COMMIT:0:7}"
  else
    red "  FAIL: HTTP 200 but body digest differs"
    red "    expected ${EXPECTED_OG_SHA256}"
    red "    live     ${og_sha}"
    fail=1
  fi
fi

# --- Probe 4: live Worker version vs the record (wrangler CLI; no tokens printed) ---
echo "→ probe 4: Worker $WORKER_NAME version"
worker_pair="$(npx wrangler deployments list --name "$WORKER_NAME" --json 2>/dev/null | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    deploys = json.loads(raw)
except Exception:
    sys.exit(1)
if not isinstance(deploys, list) or not deploys:
    sys.exit(1)
deploys = sorted(deploys, key=lambda d: d.get("created_on") or "")

def vid(d):
    vs = d.get("versions") or []
    if not vs or not isinstance(vs[0], dict):
        return ""
    return vs[0].get("version_id") or ""

live = vid(deploys[-1])
if not live:
    sys.exit(1)
prev = ""
for d in reversed(deploys[:-1]):
    v = vid(d)
    if v and v != live:
        prev = v
        break
print(live)
print(prev)
' || true)"
live_worker="$(printf '%s\n' "$worker_pair" | sed -n '1p')"
live_rollback="$(printf '%s\n' "$worker_pair" | sed -n '2p')"

if [[ -z "$live_worker" ]]; then
  yellow "  INCONCLUSIVE: could not list Worker deployments (wrangler auth or network)."
  inconclusive=1
else
  if [[ "$live_worker" == "$WORKER_VERSION" ]]; then
    green "  OK: live Worker ${live_worker:0:8} matches the record"
  else
    red "  FAIL: live Worker is ${live_worker:0:8}, record is ${WORKER_VERSION:0:8}"
    red "  Run bash scripts/record-deploy.sh after the Worker deploy, or rollback."
    fail=1
  fi
  if [[ -n "$WORKER_ROLLBACK" && "$live_rollback" != "$WORKER_ROLLBACK" ]]; then
    red "  FAIL: live rollback target is ${live_rollback:0:8}, record is ${WORKER_ROLLBACK:0:8}"
    fail=1
  elif [[ -n "$WORKER_ROLLBACK" ]]; then
    green "  OK: rollback ${WORKER_ROLLBACK:0:8} matches previous Worker version"
  fi
fi

# --- Cross-check: does the record still match the repo? (advisory) ---
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git cat-file -e "${DEPLOY_COMMIT}^{commit}" 2>/dev/null; then
    repo_sha="$(git show "${DEPLOY_COMMIT}:${WELLKNOWN_REPO_PATH}" 2>/dev/null | shasum -a 256 | awk '{print $1}' || true)"
    if [[ -n "$repo_sha" && "$repo_sha" != "$EXPECTED_WELLKNOWN_SHA256" ]]; then
      red "  FAIL: EXPECTED_WELLKNOWN_SHA256 does not match the blob in ${DEPLOY_COMMIT:0:7}"
      red "  The record in this script has drifted from the repo."
      fail=1
    fi

    repo_og_sha="$(git show "${DEPLOY_COMMIT}:${OG_REPO_PATH}" 2>/dev/null | shasum -a 256 | awk '{print $1}' || true)"
    if [[ -n "$repo_og_sha" && "$repo_og_sha" != "$EXPECTED_OG_SHA256" ]]; then
      red "  FAIL: EXPECTED_OG_SHA256 does not match the blob in ${DEPLOY_COMMIT:0:7}"
      red "  The record in this script has drifted from the repo."
      fail=1
    fi

    head_commit="$(git rev-parse HEAD)"
    if [[ "$head_commit" != "$DEPLOY_COMMIT" ]]; then
      yellow "  NOTE: this worktree's HEAD (${head_commit:0:7}) is not the deployed commit."
      yellow "  Undeployed work exists, or you are in a non-canonical worktree."
    fi
  else
    yellow "  NOTE: commit ${DEPLOY_COMMIT:0:7} not found locally — skipping repo cross-check."
  fi
else
  yellow "  NOTE: not inside a git worktree — skipping repo cross-check."
fi

echo "=========================================="
if [[ "$fail" -ne 0 ]]; then
  red "MISMATCH: production is NOT serving the recorded deploy source."
  red "Either an unexpected deploy happened, or ops/DEPLOY-SOURCE.md is stale."
  red "Do not deploy again until this is understood."
  exit 1
fi
if [[ "$inconclusive" -ne 0 ]]; then
  yellow "INCONCLUSIVE: could not reach production. Network problem, not a deploy problem."
  exit 2
fi
green "OK: production is serving ${DEPLOY_BRANCH} @ ${DEPLOY_COMMIT:0:7} and Worker ${WORKER_VERSION:0:8} as recorded."
exit 0
