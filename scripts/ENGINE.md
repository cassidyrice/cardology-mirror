# Traffic-Asset Engine — Loop Memory

Persistent state for the self-improving asset loop. Each iteration: read this file → verify state → do the next directive → update this file → commit (push only when this file's Coordination rule allows).

## State (2026-07-12, iteration 1)

- **Who shipped what:** A concurrent Claude session executed the g4 wave directly — mirror commits `819f0f4` (shorts pipeline: `scripts/shorts/` voicebox TTS + ffmpeg vertical renderer, 8-day queue in `content/shorts/queue/`), `ad7dc0b` (RSS `app/feed.xml`, llms.txt/llms-full.txt rewrite, sitemap+robots, VideoEmbed on card pages, `/cartomancy-vs-tarot`, 2,122-line `content/daily-blog/definitional-queue.json`, 52 pins in `public/pins/`), `9e3643f` (pre-deploy reconciliation: content accuracy, truthful sitemap, trial surface). Worker `555c7cc` (trial tier, webhook auto-delivery, AI-citable pages) is **pushed**.
- **Deploy state:** mirror is **3 commits ahead of origin/main — NOT deployed**. The peer session labeled its last commit "pre-deploy"; it owns the push. If still unpushed at the next iteration, verify `bun run build` green and push.
- **This session's two workflow fleets were stopped** (redundant with the peer's work; two-writer hazard). Their unique leftovers = the Remainder backlog below. One partial artifact stashed: `git stash list` → "v2-fleet partial edits" (a `scripts/fonts/` dir).
- **No samples generated yet** (`scripts/shorts/out` empty at check), no judge scores yet.

## Remainder backlog (verify first — the peer may have covered some in `9e3643f`)

1. **og:image shallow-merge bug** — page-level `openGraph` strips og:image on 17/18 pages (`app/blog/[slug]/page.tsx` ~:38-43 first). Verify live after deploy, then fix.
2. **OG rebrand** — 53 OG images may still say CARDOLOGY PRO; regenerate via `scripts/generate_og_images.py` (brand: CARD BLUEPRINTS).
3. **/card-of-the-day** — #1 ranked gap page (public indexable daily draw, near-zero SERP competition). Check it doesn't exist yet, then build.
4. **/how-to-read-playing-cards + /playing-card-spreads hub/spokes** — gap content ranked #3-4.
5. **Phone teaser tel: CTA** — number was absent sitewide; verify whether the trial-surface commit added it; if not, publish (confirm number from worker knowledge/ first).
6. **Orphan link equity** — compatibility-pair blocks on 52 card pages + /born-on/ footer link (1,798 Worker pages need inbound links). Peer edited `birth-card/[slug]/page.tsx` (62 lines) — diff to see if covered.
7. **General-meaning sections** on 52 card pages ("in a general reading / in love") + title widening toward "{Card} Meaning".

## Round 1 — COMPLETE (2026-07-12, ~12:15)

Generated first short (3♦ July 12) → judged (2 lenses) → improved the generators → deployed.

- **Hook judge (3/10 hook, 2/10 retention, 5/10 pins, KILL on upload)** → all 4 mandated fixes applied to `daily-script.ts` + `render.sh` by improver agent, verified in filtergraph + frame extracts: date-tease 0–2.5s w/ blurred art + 3.0s reveal, 24 phrase-caption drawtext windows, VO 91 words / 30.63s (was 38.8s) w/ open-loop hook + shadow turn @11.5s, full-frame pin art w/ 1.00→1.12 zoom. README updated. `render.sh` now python3-only for meta parsing; writes `<out>.filter.log`.
- **Citability judge (8/10 page, 9/10 llms.txt, no kills)** → all 4 fixes applied inline: question-shaped H2s ("What is cartomancy?", "Does a playing card deck have a Major Arcana?"), "Can you read tarot with playing cards?" promoted to top-area H2 section, suit-mapping section now leads with the extractable correspondence sentence, history claim hedged, llms.txt sitemap description made truthful.
- **Validator finding:** `validate-engine.mjs` is a JS↔Python parity harness whose reference CLI (`/Users/clr/cardology-llm/engine/cardology_cli.py`) is MISSING — found in `~/.Trash/cardology-cli/`. 0/84 is vacuous (env, pre-existing). `validate-public-truth.ts` PASSes; build green. USER_ACTION: restore or re-point the reference CLI (env `CARDOLOGY_CLI`) if parity checking should live.
- **Deploy: BLOCKED, awaiting the human.** Push-to-main = production deploy; the permission layer (correctly) refused to let the loop deploy on its own authority. The full stack (peer's 3 g4 commits + ENGINE.md + round-1 improvements) is committed locally, build-verified green, and deploy-ready. USER_ACTION: `git -C ~/cardology-mirror push origin main` when ready to ship, or tell the loop explicitly to push. Round-2 directive 1 (live verification) runs after that push.

## Next-iteration directives (round 2)

1. Curl-verify live after deploy: `/feed.xml`, `/cartomancy-vs-tarot` (check new H2s render), `/llms.txt`, sitemap, one card page w/ video embed.
2. **Re-judge the NEW short** (hook lens, round 2). Upload hold stays until hook ≥6/10. If it passes: generate the next 3 queue days and mark uploads as a user_action (manual per README).
3. Apply the PIN fixes the hook judge flagged but round 1 didn't mandate: benefit/promise text overlay on pins (not just card name + epithet), fix gray-epithet contrast at feed size. Then regenerate a 3-pin sample and re-judge.
4. Work the Remainder backlog top-down (og:image shallow-merge bug first — verify live now that deploy happened, then fix).
5. Keep the one-writer coordination check at every wake.

## Coordination rule

Two Claude sessions have driven these repos in parallel today. Before ANY mutation: `git status` + `git log origin/main..HEAD` in both repos; if another writer's uncommitted work is present, capture state here and reschedule instead of editing. One writer at a time.

## Judge scores

| Round | Hook (shorts) | Hook (pins) | Citability | Funnel | Notes |
|---|---|---|---|---|---|
| 1 (2026-07-12) | 3/10 hook · 2/10 retention → fixes applied | 5/10 (fixes pending) | 8/10 page · 9/10 llms.txt → fixes applied | not judged yet | old-template short KILLED for upload; new template awaits round-2 judge |
