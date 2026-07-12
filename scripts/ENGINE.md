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

## Next-iteration directives

1. Check push state. If peer pushed → curl-verify live: `/feed.xml`, `/cartomancy-vs-tarot`, sitemap, one card page w/ video embed. If unpushed and stale (>1h) → build-verify and push.
2. Generate the FIRST sample short: `scripts/shorts/run-daily-short.sh` (see its README) + verify with ffprobe. Generate nothing in bulk before one sample passes a judge.
3. Judge round 1: hook lens on the sample short + 3 pins from `public/pins/`; citability lens on `/cartomancy-vs-tarot` + llms.txt. Record scores HERE.
4. Only after judge round 1: apply template improvements to generators, then work the Remainder backlog top-down.

## Coordination rule

Two Claude sessions have driven these repos in parallel today. Before ANY mutation: `git status` + `git log origin/main..HEAD` in both repos; if another writer's uncommitted work is present, capture state here and reschedule instead of editing. One writer at a time.

## Judge scores

| Round | Hook (shorts) | Hook (pins) | Citability | Funnel | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | none yet |
