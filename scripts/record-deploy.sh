#!/usr/bin/env bash
# Record the commit that was just deployed in ops/DEPLOY-SOURCE.md and
# scripts/verify-deploy-source.sh. Run right after `bun run pages:deploy`
# (and after a Worker deploy, so the live cardology-unlock version is stored).
#
#   bash scripts/record-deploy.sh            # records HEAD + live Worker
#   bash scripts/record-deploy.sh <sha>      # records a specific Pages commit + live Worker
# Never prints tokens or wrangler JSON.
set -euo pipefail

# Escape \, &, #, and / so they are literal in a sed replacement.
# Delimiter is #; / is escaped too in case a caller uses s///.
sed_escape_repl() {
  local s="$1"
  s=${s//\\/\\\\}
  s=${s//&/\\&}
  s=${s//#/\\#}
  s=${s//\//\\/}
  printf '%s' "$s"
}

# Rewrite the **Last verified:** line. $5 is the previous-record short sha.
update_last_verified() {
  local file="$1" today="$2" short="$3" subject="$4" prev_short="$5"
  local escaped
  escaped="$(sed_escape_repl "$subject")"
  sed -i '' -E "s#^\*\*Last verified: [0-9-]+\*\* \(deployed \`main\` @ \`[0-9a-f]{7}\`.*#**Last verified: ${today}** (deployed \`main\` @ \`${short}\` — ${escaped}; previous record \`${prev_short}\`)#" "$file"
}

# When sourced by tests, stop after defining helpers.
if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
  return 0
fi

cd "$(dirname "$0")/.."
sha="$(git rev-parse "${1:-HEAD}")"
short="${sha:0:7}"
subject="$(git log -1 --format=%s "$sha")"
today="$(date +%Y-%m-%d)"
prev="$(grep -oE 'DEPLOY_COMMIT="[0-9a-f]{40}"' scripts/verify-deploy-source.sh | grep -oE '[0-9a-f]{40}')"
WORKER_NAME="${WORKER_NAME:-cardology-unlock}"

worker_ids() {
  npx wrangler deployments list --name "$WORKER_NAME" --json 2>/dev/null | python3 -c '
import json, sys
deploys = json.load(sys.stdin)
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
'
}

ids="$(worker_ids)" || { echo "could not read Worker deployments for $WORKER_NAME" >&2; exit 1; }
worker_ver="$(printf '%s\n' "$ids" | sed -n '1p')"
worker_rb="$(printf '%s\n' "$ids" | sed -n '2p')"
[[ -n "$worker_ver" ]] || { echo "could not parse live Worker version" >&2; exit 1; }
old_worker="$(grep -oE 'WORKER_VERSION="[0-9a-f-]*"' scripts/verify-deploy-source.sh | grep -oE '[0-9a-f-]+' || true)"

pages_same=0
[[ "$prev" == "$sha" ]] && pages_same=1
if [[ "$pages_same" -eq 1 && "$old_worker" == "$worker_ver" ]]; then
  echo "already recorded: $short (worker ${worker_ver:0:8})"
  exit 0
fi

if [[ "$pages_same" -eq 0 ]]; then
  sed -i '' -E "s/DEPLOY_COMMIT=\"[0-9a-f]{40}\"/DEPLOY_COMMIT=\"$sha\"/" scripts/verify-deploy-source.sh
  sed -i '' -E "s/\| \*\*Deployed commit\*\* \| \`[0-9a-f]{40}\` \|/| **Deployed commit** | \`$sha\` |/" ops/DEPLOY-SOURCE.md
  update_last_verified ops/DEPLOY-SOURCE.md "$today" "$short" "$subject" "${prev:0:7}"
fi

sed -i '' -E "s/WORKER_VERSION=\"[0-9a-f-]*\"/WORKER_VERSION=\"$worker_ver\"/" scripts/verify-deploy-source.sh
sed -i '' -E "s/WORKER_ROLLBACK=\"[0-9a-f-]*\"/WORKER_ROLLBACK=\"$worker_rb\"/" scripts/verify-deploy-source.sh
sed -i '' -E "s/\| \*\*Worker version\*\* \| \`[0-9a-f-]*\` \|/| **Worker version** | \`$worker_ver\` |/" ops/DEPLOY-SOURCE.md
sed -i '' -E "s/\| \*\*Worker rollback\*\* \| \`[0-9a-f-]*\` \|/| **Worker rollback** | \`$worker_rb\` |/" ops/DEPLOY-SOURCE.md

grep -q "$worker_ver" ops/DEPLOY-SOURCE.md && grep -q "$worker_ver" scripts/verify-deploy-source.sh || { echo "record update failed" >&2; exit 1; }
if [[ "$pages_same" -eq 0 ]]; then
  grep -q "$sha" ops/DEPLOY-SOURCE.md && grep -q "$sha" scripts/verify-deploy-source.sh || { echo "record update failed" >&2; exit 1; }
fi
echo "recorded: main @ $short — $subject (was ${prev:0:7}); worker ${worker_ver:0:8} rollback ${worker_rb:0:8}"
echo "next: git commit -am \"Record deploy: main @ $short live $today\""
