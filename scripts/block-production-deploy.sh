#!/usr/bin/env bash
# Installed as pages:deploy in non-canonical clones to prevent production thrash.
set -euo pipefail
cat <<'EOF' >&2

ERROR: Production deploy blocked in this worktree.

cardblueprints.com is the Cloudflare Pages project "cardology-mirror".
Only the canonical tree may publish to it:

  ~/cardology-elroy-qa
  bun run pages:deploy
  # → scripts/deploy-production.sh (clean tree + smoke checks)

This clone must not run:
  wrangler pages deploy … --project-name cardology-mirror

If you need this tree for local work only, use:
  bun run dev
  bun run build

EOF
exit 1
