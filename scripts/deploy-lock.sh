#!/usr/bin/env bash
# A hard link atomically publishes an already-written regular lock file. The
# existing foreman checks -f; mkdir locks would silently bypass that guard.
acquire_deploy_lock() {
  local lock="$1"
  DEPLOY_LOCK_CANDIDATE="$(mktemp "${lock}.owner.XXXXXX")" || return 1
  printf '%s pid=%s\n' "$(date -u +%FT%TZ)" "$$" > "$DEPLOY_LOCK_CANDIDATE"
  if ! ln "$DEPLOY_LOCK_CANDIDATE" "$lock" 2>/dev/null; then
    rm -f "$DEPLOY_LOCK_CANDIDATE"
    echo "Deployment lock exists: $lock. Inspect its owner; do not remove an active lock." >&2
    return 1
  fi
  DEPLOY_OWNED_LOCK="$lock"
  trap release_deploy_lock EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
}
release_deploy_lock() {
  if [[ -n "${DEPLOY_LOCK_CANDIDATE:-}" && -n "${DEPLOY_OWNED_LOCK:-}" && "$DEPLOY_LOCK_CANDIDATE" -ef "$DEPLOY_OWNED_LOCK" ]]; then
    rm -f "$DEPLOY_OWNED_LOCK"
  fi
  [[ -z "${DEPLOY_LOCK_CANDIDATE:-}" ]] || rm -f "$DEPLOY_LOCK_CANDIDATE"
}
