#!/usr/bin/env bash
# Ship one E-E-A-T SEO blog article for Card Blueprints (AM or PM slot).
# Usage: POST_SLOT=am|pm [POST_DATE=YYYY-MM-DD] [DRY_RUN=1] bash scripts/ship_daily_blog.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export POST_SLOT="${POST_SLOT:-am}"
export POST_DATE="${POST_DATE:-$(date -u +%F)}"
SLOT_TAG="${POST_DATE}-${POST_SLOT}"
LOG_DIR="${HOME}/cardblueprints-content/ops/seo-multi-agent/blog-cron"
DESK_DIR="${HOME}/Desktop/hermes-outputs/blog-cron-${POST_DATE}"
mkdir -p "$LOG_DIR" "$DESK_DIR"

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_DIR/${SLOT_TAG}.log"
}

log "START slot=$POST_SLOT date=$POST_DATE dry=${DRY_RUN:-0}"

git config user.name cassidyrice
git config user.email 220546746+cassidyrice@users.noreply.github.com

BEFORE="$(python3 -c 'import json;from pathlib import Path;print(len(json.loads(Path("lib/generated-blog-posts.json").read_text())))')"
log "posts_before=$BEFORE"

set +e
GEN_OUT="$(env -u DRY_RUN POST_SLOT="$POST_SLOT" POST_DATE="$POST_DATE" bun run generate:daily-blog 2>&1)"
GEN_RC=$?
set -e
printf '%s\n' "$GEN_OUT" | tee -a "$LOG_DIR/${SLOT_TAG}.log"
if [[ "$GEN_RC" -ne 0 ]]; then
  log "FAIL generate rc=$GEN_RC"
  exit "$GEN_RC"
fi

if echo "$GEN_OUT" | rg -q "No eligible daily blog topic"; then
  log "NOOP empty queue"
  printf 'status=noop\nreason=empty_queue\nslot=%s\ndate=%s\n' "$POST_SLOT" "$POST_DATE" >"$DESK_DIR/${POST_SLOT}.txt"
  exit 0
fi

AFTER="$(python3 -c 'import json;from pathlib import Path;print(len(json.loads(Path("lib/generated-blog-posts.json").read_text())))')"
NEW_SLUG="$(python3 -c 'import json;from pathlib import Path;p=json.loads(Path("lib/generated-blog-posts.json").read_text());print(p[-1]["slug"] if p else "")')"
if [[ "$AFTER" -le "$BEFORE" ]]; then
  log "NOOP no new post"
  printf 'status=noop\nslot=%s\ndate=%s\n' "$POST_SLOT" "$POST_DATE" >"$DESK_DIR/${POST_SLOT}.txt"
  exit 0
fi
log "generated slug=$NEW_SLUG count=$AFTER"

python3 - <<'PY'
import json, re, sys
from pathlib import Path
post = json.loads(Path("lib/generated-blog-posts.json").read_text())[-1]
blob = json.dumps(post)
for b in [r"phone reading", r"ai voice reading", r"\$99", r"/unlock", r"7-day trial", r"free call"]:
    if re.search(b, blob, re.I):
        print("BANNED", b)
        sys.exit(2)
for n in ["/birth-card-calculator", "/products/personal-card-blueprint", "/methodology", "/editorial-policy"]:
    if n not in blob:
        print("MISSING", n)
        sys.exit(3)
assert len(post.get("faqs", [])) >= 4
assert len(post.get("sections", [])) >= 3
assert len((post.get("seoTitle") or post["title"])) <= 70
assert len(post["description"]) <= 160
print("seo_gate_ok", post["slug"])
PY

bun run test 2>&1 | tee -a "$LOG_DIR/${SLOT_TAG}.log"

# Fail on app TS errors only (ignore stale .next stubs).
TSC_ERRS="$(bunx tsc --noEmit -p tsconfig.json --pretty false 2>&1 | rg -v '\.next/types' | rg 'error TS' || true)"
if [[ -n "$TSC_ERRS" ]]; then
  log "FAIL tsc"
  printf '%s\n' "$TSC_ERRS" | tee -a "$LOG_DIR/${SLOT_TAG}.log"
  exit 1
fi
log "tsc ok"

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  log "DRY_RUN discard generated json"
  git checkout -- lib/generated-blog-posts.json
  printf 'status=dry_run\nslug=%s\n' "$NEW_SLUG" >"$DESK_DIR/${POST_SLOT}.txt"
  exit 0
fi

git add lib/generated-blog-posts.json
git commit -m "content(blog): ${NEW_SLUG} (${POST_SLOT} E-E-A-T SEO)"
git pull --rebase origin main 2>&1 | tee -a "$LOG_DIR/${SLOT_TAG}.log"
git push origin main 2>&1 | tee -a "$LOG_DIR/${SLOT_TAG}.log"

bun run pages:build 2>&1 | tee -a "$LOG_DIR/${SLOT_TAG}.log"
bun run pages:deploy 2>&1 | tee -a "$LOG_DIR/${SLOT_TAG}.log"

sleep 6
CODE=$(curl -s -o /tmp/blog-cron-probe.html -w '%{http_code}' -A 'Googlebot' \
  "https://cardblueprints.com/blog/${NEW_SLUG}?v=$(date +%s)" || echo 000)
TITLE=$(rg -o '<title>[^<]+</title>' /tmp/blog-cron-probe.html | head -1 || true)
log "live_status=$CODE $TITLE"

cat >"$DESK_DIR/${POST_SLOT}.txt" <<STATUS
status=shipped
slot=$POST_SLOT
date=$POST_DATE
slug=$NEW_SLUG
url=https://cardblueprints.com/blog/${NEW_SLUG}
live_http=$CODE
title=$TITLE
log=$LOG_DIR/${SLOT_TAG}.log
STATUS
cp "$DESK_DIR/${POST_SLOT}.txt" "$LOG_DIR/${SLOT_TAG}.status"
log "DONE slug=$NEW_SLUG"
