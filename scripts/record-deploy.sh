#!/usr/bin/env bash
# Record the commit that was just deployed in ops/DEPLOY-SOURCE.md and
# scripts/verify-deploy-source.sh. Run right after `bun run pages:deploy`.
#
#   bash scripts/record-deploy.sh            # records HEAD
#   bash scripts/record-deploy.sh <sha>      # records a specific commit
set -euo pipefail
cd "$(dirname "$0")/.."
sha="$(git rev-parse "${1:-HEAD}")"
short="${sha:0:7}"
subject="$(git log -1 --format=%s "$sha")"
today="$(date +%Y-%m-%d)"
prev="$(grep -oE 'DEPLOY_COMMIT="[0-9a-f]{40}"' scripts/verify-deploy-source.sh | grep -oE '[0-9a-f]{40}')"
[[ "$prev" == "$sha" ]] && { echo "already recorded: $short"; exit 0; }
sed -i '' -E "s/DEPLOY_COMMIT=\"[0-9a-f]{40}\"/DEPLOY_COMMIT=\"$sha\"/" scripts/verify-deploy-source.sh
sed -i '' -E "s/\| \*\*Deployed commit\*\* \| \`[0-9a-f]{40}\` \|/| **Deployed commit** | \`$sha\` |/" ops/DEPLOY-SOURCE.md
sed -i '' -E "s/^\*\*Last verified: [0-9-]+\*\* \(deployed \`main\` @ \`[0-9a-f]{7}\`[^)]*\)/**Last verified: $today** (deployed \`main\` @ \`$short\` — $subject; previous record \`${prev:0:7}\`)/" ops/DEPLOY-SOURCE.md
grep -q "$sha" ops/DEPLOY-SOURCE.md && grep -q "$sha" scripts/verify-deploy-source.sh || { echo "record update failed" >&2; exit 1; }
echo "recorded: main @ $short — $subject (was ${prev:0:7})"
echo "next: git commit -am \"Record deploy: main @ $short live $today\""
