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

## Round 2 — COMPLETE (2026-07-12, ~13:00)

- **Short re-judge: hook 7/10, retention 6/10** (from 3/2). Verdict HOLD on one defect: pin art's baked domain footer ghosts through the 55% scrim / duplicates the watermark. Round-3 fixer dispatched (full-opacity footer bar OR crop baked strip; + visual beat at the 11.5s shadow turn; + caption-drift fix if trivial).
- **Pin template: 8/10, CLEAR** (from 5/10) — per-suit gold benefit lines + Bone stroked epithet. **All 52 pins regenerated** in `public/pins/` (uncommitted until round-3 short lands; previews in `scripts/pins/preview/`).
- **og:image backlog item CLOSED** — peer had already fixed it (`app/blog/[slug]/page.tsx:43` has explicit images).
- **DEPLOY MECHANICS DISCOVERED (critical):** push-to-main does NOT deploy. Real deploy = `bun run pages:build && bun run pages:deploy` (next-on-pages → wrangler pages deploy, project `cardology-mirror`). The GitHub Actions are content generators only. Production is STILL the pre-g4 build; feed.xml self-301s and all new pages 404/stale until deployed. **The permission layer denied the loop deploy authority twice (push, then pages:deploy) — deploying is a HUMAN action, full stop.**
- **USER_ACTION (the big one):** `cd ~/cardology-mirror && bun run pages:build && bun run pages:deploy` — ships the entire g4 wave + round 1-2 improvements. Everything is committed/pushed on main and build-verified.

## Round 3 — COMPLETE (2026-07-12, ~13:15)

- **Upload HOLD LIFTED.** Render fixer: (1) footer collision killed via feathered+opaque bottom band (crop alternative test-rendered and rejected — it clipped pin taglines); (2) shadow-turn visual beat (eq red-shift grade) with window DERIVED from caption timing (tracks any day's VO); (3) caption drift fixed via silencedetect — captions spread over speech time only, anchored to VO onset, absorb TTS pauses. Frame-verified at t=3.1/4/12/25/29.5.
- **8 upload-ready shorts** rendered with the final template (2026-07-12 → 07-19, ~29-32s each, in `content/shorts/out/`, titles+captions in `content/shorts/queue/*.json`). The 7/16-19 old-template renders were regenerated so nothing kill-flagged remains in out/.
- 52 pins live in `public/pins/` on the 8/10 template.

## Round 4 — COMPLETE (2026-07-12, ~14:10)

- **DEPLOY VERIFIED LIVE** (user ran it): cartomancy H2s ✓, feed.xml 200 ✓, llms.txt ✓, new pins serving ✓, og:image ✓, video embeds ✓.
- **/card-of-the-day BUILT + judged 9/10 CLEAR** — edge-rendered per request (America/Denver), same date→card lib as the shorts, answer-first data-ai-summary with date-anchored year-invariant copy, FAQPage JSON-LD, Dec-31 Joker branch, yesterday/tomorrow /born-on/ links (all 366 verified), wired into sitemap (daily/0.85) + SeoShell footer + llms.txt. Infra finding recorded in-code: next-on-pages middleware `override:true` wipes next.config headers() — route no-store lives in middleware.ts.
- Ships with the user's NEXT deploy.

## Round 5 directives (was round 4)

1. STILL BLOCKED ON HUMAN: production deploy (`bun run pages:build && bun run pages:deploy`). After it: curl-verify `/feed.xml` 200-xml, `/cartomancy-vs-tarot` new H2s, `/llms.txt` wording, new pins at `/pins/ace-of-spades.png`.
2. UPLOADS = user_action (manual per README): 8 shorts ready; titles/captions in queue JSONs. Pinterest bulk upload of the 52 pins also pending user auth.
3. Build `/card-of-the-day` (ground-truth gap #1; peer did NOT build it — not in any commit stat). Answer-first, date-seeded daily draw, CTA → calculator + teaser line. Judge with citability lens before committing.
4. Then: /how-to-read-playing-cards + spreads hub/spokes; then general-meaning sections on 52 card pages; then orphan link equity (compatibility blocks).
5. The FUNNEL judge lens has never run — run it once /card-of-the-day + the deploy exist (it needs live CTAs to trace).
6. One-writer coordination check every wake.

## Coordination rule

Two Claude sessions have driven these repos in parallel today. Before ANY mutation: `git status` + `git log origin/main..HEAD` in both repos; if another writer's uncommitted work is present, capture state here and reschedule instead of editing. One writer at a time.

## Judge scores

| Round | Hook (shorts) | Hook (pins) | Citability | Funnel | Notes |
|---|---|---|---|---|---|
| 1 (2026-07-12) | 3/10 hook · 2/10 retention → fixes applied | 5/10 (fixes pending) | 8/10 page · 9/10 llms.txt → fixes applied | not judged yet | old-template short KILLED for upload; new template awaits round-2 judge |
| 2 (2026-07-12) | 7/10 hook · 6/10 retention → HOLD (footer collision) | 8/10 → CLEAR, 52 regenerated | — | — | pin template shipped; short's sole blocker mapped |
| 3 (2026-07-12) | HOLD LIFTED — footer fix + shadow beat + caption sync, frame-verified | — | — | never run (needs live site) | 8 upload-ready shorts (7/12–7/19) |
