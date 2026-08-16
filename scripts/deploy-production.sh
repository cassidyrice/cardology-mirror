#!/usr/bin/env bash
# Production deploy for cardblueprints.com (Cloudflare Pages project: cardology-mirror).
#
# Canonical tree only. Other clones must hard-fail pages:deploy.
#
# Usage:
#   bun run pages:deploy
#   bash scripts/deploy-production.sh
#
# Optional env:
#   SKIP_BUILD=1   reuse existing .vercel/output/static
#   SKIP_SMOKE=1   skip post-deploy checks (emergency only)
#   ALLOW_DIRTY=1  allow uncommitted changes (discouraged; still records dirty flag)
#   ALLOW_BRANCH=1 skip branch allowlist check
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="cardology-mirror"
SITE_ORIGIN="https://cardblueprints.com"
CANONICAL_DIR_NAME="cardology-elroy-qa"
ARTIFACT_DIR=".vercel/output/static"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

die() {
  red "ERROR: $*"
  exit 1
}

# --- Guard: canonical path ---
base="$(basename "$ROOT")"
if [[ "$base" != "$CANONICAL_DIR_NAME" ]]; then
  die "Production deploys are only allowed from ~/${CANONICAL_DIR_NAME} (cwd is $ROOT)."
fi

# --- Guard: git repo ---
command -v git >/dev/null || die "git is required"
command -v curl >/dev/null || die "curl is required"
command -v npx >/dev/null || die "npx is required"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "Not a git work tree: $ROOT"
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
COMMIT="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"
SUBJECT="$(git log -1 --pretty=%s)"

# --- Guard: branch allowlist ---
if [[ "${ALLOW_BRANCH:-}" != "1" ]]; then
  case "$BRANCH" in
    main|master|release/*|hotfix/*) ;;
    *)
      die "Branch '$BRANCH' is not allowed for production. Use main/release/* or ALLOW_BRANCH=1."
      ;;
  esac
fi

# --- Guard: clean working tree ---
DIRTY=0
if [[ -n "$(git status --porcelain)" ]]; then
  DIRTY=1
  if [[ "${ALLOW_DIRTY:-}" != "1" ]]; then
    git status --short | head -40
    die "Working tree is dirty. Commit/stash first, or set ALLOW_DIRTY=1 (not recommended)."
  fi
  yellow "WARNING: ALLOW_DIRTY=1 — deploying with a dirty working tree."
fi

# --- Guard: artifact path is local ---
if [[ ! -d "app" || ! -f "package.json" ]]; then
  die "Does not look like the Card Blueprints app root: $ROOT"
fi

echo "=========================================="
echo " Production deploy → ${PROJECT_NAME}"
echo " Tree:    $ROOT"
echo " Branch:  $BRANCH"
echo " Commit:  $SHORT ($COMMIT)"
echo " Subject: $SUBJECT"
echo " Dirty:   $DIRTY"
echo "=========================================="

# --- Build ---
if [[ "${SKIP_BUILD:-}" == "1" ]]; then
  yellow "SKIP_BUILD=1 — reusing existing artifact"
else
  echo "→ next build"
  bun run build
  echo "→ pages:build (next-on-pages)"
  bun run pages:build
fi

if [[ ! -d "$ARTIFACT_DIR" ]]; then
  die "Missing deploy artifact: $ARTIFACT_DIR (run without SKIP_BUILD)"
fi

# Quick local artifact sanity: no Turnstile sitekey baked into client chunks
if command -v rg >/dev/null 2>&1; then
  if rg -l "0x4AAAA|data-elroy-turnstile|challenges\.cloudflare\.com/turnstile" \
    "$ARTIFACT_DIR/_next" 2>/dev/null | head -1 | grep -q .; then
    die "Artifact still contains Turnstile client assets. Refusing to ship."
  fi
fi

# --- Deploy (never default to commit-dirty unless forced) ---
DEPLOY_ARGS=(
  pages deploy "$ARTIFACT_DIR"
  --project-name "$PROJECT_NAME"
  --branch main
  --commit-hash "$COMMIT"
  --commit-message "prod: ${SHORT} ${SUBJECT}"
)

if [[ "$DIRTY" -eq 1 ]]; then
  DEPLOY_ARGS+=(--commit-dirty=true)
else
  DEPLOY_ARGS+=(--commit-dirty=false)
fi

echo "→ wrangler ${DEPLOY_ARGS[*]}"
npx wrangler "${DEPLOY_ARGS[@]}"

# --- Smoke ---
if [[ "${SKIP_SMOKE:-}" == "1" ]]; then
  yellow "SKIP_SMOKE=1 — skipping live verification"
  exit 0
fi

echo "→ waiting for edge propagation"
sleep 5

smoke_fail=0

echo "→ smoke: Elroy API (no Turnstile)"
ELROY_BODY="$(curl -sS -X POST "${SITE_ORIGIN}/api/elroy/micro-reading" \
  -H 'content-type: application/json' \
  -H "origin: ${SITE_ORIGIN}" \
  --data '{"birthdate":"2001-01-15","email":"deploy-smoke@example.test","consent":true,"source":"/deploy-smoke"}' \
  || true)"
ELROY_CODE="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "${SITE_ORIGIN}/api/elroy/micro-reading" \
  -H 'content-type: application/json' \
  -H "origin: ${SITE_ORIGIN}" \
  --data '{"birthdate":"2001-01-15","email":"deploy-smoke@example.test","consent":true,"source":"/deploy-smoke"}' \
  || echo 000)"

if [[ "$ELROY_CODE" != "200" ]]; then
  red "Elroy smoke FAILED (HTTP ${ELROY_CODE}): ${ELROY_BODY:0:200}"
  smoke_fail=1
elif echo "$ELROY_BODY" | grep -qi 'Verification is required'; then
  red "Elroy still requires Turnstile verification — wrong/stale build?"
  smoke_fail=1
elif ! echo "$ELROY_BODY" | grep -q '"birthCard"'; then
  red "Elroy response missing birthCard: ${ELROY_BODY:0:200}"
  smoke_fail=1
else
  green "Elroy OK (HTTP 200)"
fi

echo "→ smoke: homepage title"
HOME_TITLE="$(curl -sS "${SITE_ORIGIN}/" | sed -n 's/.*<title[^>]*>\([^<]*\)<\/title>.*/\1/p' | head -1 || true)"
if echo "$HOME_TITLE" | grep -qi 'Birth Cards'; then
  green "Homepage title OK: $HOME_TITLE"
else
  yellow "Homepage title unexpected: $HOME_TITLE"
fi

echo "→ smoke: product URLs in sitemap"
SITEMAP="$(curl -sS "${SITE_ORIGIN}/sitemap.xml" || true)"
if echo "$SITEMAP" | grep -q 'products/personal-card-blueprint' \
  && echo "$SITEMAP" | grep -q 'products/analog-algorithm' \
  && echo "$SITEMAP" | grep -q 'products/complete-card-blueprint'; then
  green "Sitemap product URLs OK"
else
  yellow "Sitemap missing product URLs (CDN delay or regression)"
fi

echo "→ smoke: security headers (HSTS)"
if curl -sSI "${SITE_ORIGIN}/" | grep -qi 'strict-transport-security'; then
  green "HSTS present"
else
  yellow "HSTS header not observed"
fi

echo "→ smoke: free-course videos"
for video in \
  /free-course/media/01-foundations.mp4 \
  /free-course/media/02-rank-and-suit.mp4 \
  /free-course/media/03-states.mp4 \
  /free-course/media/04-pattern-builder.mp4
do
  VIDEO_HEADERS="$(curl -sSI "${SITE_ORIGIN}${video}" || true)"
  VIDEO_CODE="$(printf '%s\n' "$VIDEO_HEADERS" | awk 'BEGIN{c="000"} toupper($1) ~ /^HTTP/{c=$2} END{print c}')"
  VIDEO_TYPE="$(printf '%s\n' "$VIDEO_HEADERS" | awk 'BEGIN{IGNORECASE=1} /^content-type:/{print $2; exit}' | tr -d '\r')"
  if [[ "$VIDEO_CODE" != "200" || "$VIDEO_TYPE" != video/mp4* ]]; then
    red "Course video FAILED ${video} (HTTP ${VIDEO_CODE}, type ${VIDEO_TYPE:-unknown})"
    smoke_fail=1
  else
    green "Course video OK ${video}"
  fi
done

if [[ "$smoke_fail" -ne 0 ]]; then
  red "Deploy finished but smoke checks FAILED. Production may be bad — investigate before further deploys."
  exit 2
fi

green "Production deploy complete and smoke checks passed."
echo "Commit: $SHORT  Branch: $BRANCH  Project: $PROJECT_NAME"
