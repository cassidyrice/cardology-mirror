# Hermes blog-cron production-checkout repair

## Goal

Restore the two Hermes daily blog jobs without weakening the production deployment guard, losing the current Elroy work, or allowing an unattended job to deploy from a dirty checkout.

## Current state

- Hermes has two active jobs, AM and PM, whose prompts and working directories point to `/Users/main/cardology-blog-cron`.
- That checkout intentionally refuses production deployment to the Cloudflare Pages project `cardology-mirror`.
- Production policy permits deployment only from `/Users/main/cardology-elroy-qa`.
- `/Users/main/cardology-elroy-qa` is on `release/elroy-20260808` and contains numerous uncommitted Elroy changes.
- `scripts/ship_daily_blog.sh` generates one post, stages only `lib/generated-blog-posts.json`, commits it, rebases onto `origin/main`, pushes `main`, builds, deploys, and performs live smoke checks.
- Running that workflow in the currently dirty Elroy checkout would mix unattended automation with unfinished release work and may fail during rebase, branch push, or the clean-tree deployment guard.

## Chosen approach

Keep `/Users/main/cardology-elroy-qa` as the sole canonical production checkout and reserve it for production automation after its current work has been made safe. Do not broaden the deployment allowlist and do not use `ALLOW_DIRTY` or `ALLOW_BRANCH` escape hatches.

The repair proceeds in gated phases:

1. Pause the AM and PM Hermes jobs before their next scheduled executions.
2. Inventory the uncommitted Elroy changes and preserve them without deleting, stashing, or committing them implicitly.
3. Ask for explicit approval of the proposed checkpoint/branch operation after presenting the inventory.
4. Establish `/Users/main/cardology-elroy-qa` as a clean checkout on local `main`, with local `main` tracking `origin/main`. This is stricter than the deployment guard because the blog script explicitly rebases and pushes `main`.
5. Update both Hermes job prompts and working directories from `/Users/main/cardology-blog-cron` to `/Users/main/cardology-elroy-qa`.
6. Run the AM and PM workflows with `DRY_RUN=1`, using non-production test dates or an equivalent no-publish validation that cannot consume live content unexpectedly.
7. Confirm the generated JSON is discarded, the repository remains clean, no commit or push occurs, all tests pass, and the deployment guard is not bypassed.
8. Reactivate both jobs only after validation succeeds.

## Safety constraints

- Do not delete, reset, clean, or overwrite either checkout.
- Do not change credentials.
- Do not reinstall or update Hermes.
- Do not weaken the canonical-directory, allowed-branch, or clean-tree deployment checks.
- Do not invoke `ALLOW_DIRTY=1`, `ALLOW_BRANCH=1`, `SKIP_BUILD=1`, or `SKIP_SMOKE=1`.
- Do not commit or stash the current Elroy changes without a separate, explicit approval based on an exact change inventory.
- Do not run a live blog generation or production deployment during repair validation.
- Preserve both cron schedules, names, delivery mode, and prompts apart from the checkout path correction.

## Failure handling

- If preserving the Elroy changes cannot produce a clean canonical checkout safely, leave both jobs paused and report the blocker.
- If dry-run generation, tests, or TypeScript checks fail, leave both jobs paused and retain all diagnostic output.
- If the repository becomes dirty after a dry run, stop and identify the exact files; do not discard them automatically.
- If Hermes changes the job configuration but cannot verify it, leave the jobs paused until their persisted definitions are inspected.

## Verification

The repair is complete only when all of the following are true:

- `/Users/main/cardology-elroy-qa` is clean on local `main`, and local `main` tracks `origin/main` without divergence.
- Both Hermes jobs reference `/Users/main/cardology-elroy-qa` in both `workdir` and prompt command.
- Both dry-run slots exit successfully without a commit, push, or deploy.
- The canonical checkout remains clean after validation.
- Both jobs are active with their original 09:00 and 16:00 America/Chicago schedules.
- Hermes gateway remains healthy and supervised by launchd.

## Out of scope

- Modifying blog content strategy or generation logic.
- Changing Cloudflare deployment credentials or project settings.
- Updating Hermes or application dependencies.
- Resolving unrelated Elroy product behavior.
- Removing the retired `cardology-blog-cron` checkout.
