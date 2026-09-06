---
description: Test, deploy to production, record the deploy
---
Ship the current `main` of `~/cardology-elroy-qa` to cardblueprints.com. Steps, in order, stopping at the first failure:
1. `git status --short` must be empty and branch must be `main`. If not, say what is dirty and stop.
2. `bun run test` (the only tolerated failure is `scripts/card-meaning-equity.test.ts`).
3. Ask: "Deploy `<short sha>` — `<subject>`? (y/n)". Wait for y.
4. `bun run pages:deploy`
5. `bash scripts/record-deploy.sh` then commit the record: `git commit -am "Record deploy: main @ <sha> live <date>"`.
6. `bash scripts/verify-deploy-source.sh` must exit 0. Reply with one line: live commit + verify result.
