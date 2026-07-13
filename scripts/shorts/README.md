# Card Blueprints — daily short pipeline

One vertical video (1080x1920) per day: "Born on <date>? Your card is the <birth card> — and its shadow side explains a lot."

## Local Script Studio

The local Script Studio creates on-brand, timed video scripts without changing or
publishing the public website.

```bash
bun run shorts:studio
```

Open `http://localhost:3588`. The studio includes:

- birthday reveals, card meanings, and compatibility scripts;
- 15-second and 30-second versions;
- free-calculator, $99 AI Voice Reading, and brand-awareness goals;
- timed scenes, on-screen text, voiceover, visual directions, captions, and hashtags;
- copy buttons and a phone preview using the existing vertical card art;
- the real `lib/seo-cards.ts` data, including the December 31 Joker boundary;
- guardrails for reflection-not-fate wording and balanced same-card compatibility.

The studio is deterministic. Apify trend ideas can be pasted as pacing inspiration,
but creator wording is never copied into the output.

Run its focused checks with:

```bash
bun run test:shorts-studio
```

## One command

```bash
scripts/shorts/run-daily-short.sh              # today
scripts/shorts/run-daily-short.sh 2026-07-12   # any date
```

Outputs (repo-relative):

- `content/shorts/queue/<date>.json` — meta: `vo_text`, `vo_phrases` (3–6-word caption
  chunks with word counts), `born_on_label`, `title`, `caption`, `card_slug`,
  `pin_image` (render visual), `og_image` (thumbnails)
- `content/shorts/out/<date>-vo.wav` — narration (24 kHz mono PCM16)
- `content/shorts/out/<date>-daily-card.mp4` — final short (h264 + AAC, faststart)
- `content/shorts/out/<date>-daily-card.filter.log` — the exact ffmpeg filtergraph used

## Stages

1. **Script** — `bun scripts/shorts/daily-script.ts --date <date> --out <json>`
   Pulls the birth card from `lib/seo-cards`, composes an 85–110-word open-loop VO
   targeting ~28–32s (hook that teases the shadow → identity punches → shadow turn
   at ~second 12 → gift punches → growth line → CTA), plus caption phrase chunks,
   title, and social caption. Page-copy tics ("You're diversifying resources
   creatively", "Your curriculum is…", "mirror, not a forecast") are filtered from
   the VO; "a mirror, not a forecast" survives only in the social caption.
   Dec 31 (Joker) and invalid dates throw.

2. **TTS** — voicebox (Kokoro) at `http://127.0.0.1:17493`, profile
   `05c35001-8beb-4ef4-b470-7f41de7a261d` ("Mystic Narrator", preset voice `bm_fable`).
   Async 3-step API:
   ```
   POST /generate   {"profile_id":"05c35001-...","text":"...","engine":"kokoro","language":"en"}  -> {"id": ...}
   GET  /generate/{id}/status   # SSE stream; wait for "status":"completed"
   GET  /audio/{id}             # download RIFF PCM16 mono 24kHz wav
   ```
   Start the backend if down (takes ~30–60 s to boot):
   ```
   cd /Users/clr/voicebox && nohup backend/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 17493 &
   curl -sf http://127.0.0.1:17493/health
   ```
   Only the **kokoro** engine works in this venv (minimal install; other engines need `just setup`).
   **Fallback:** if the API is down/unreachable, the orchestrator uses macOS `say`
   (best available premium/enhanced voice, 170 wpm) and converts AIFF → wav with ffmpeg.
   Fallback audio is clearly noticeable — prefer restarting voicebox.

3. **Render** — `bash scripts/shorts/render.sh <meta.json> <vo.wav> <out.mp4>`
   Retention template v2:
   - **0–2.5s:** "BORN ON <DATE>?" (~120px Antique Gold, two lines) over the pin art
     heavily blurred behind a dark scrim; the sharp card art reveals at 3.0s.
   - **Visual:** vertical pin art `public/pins/<card_slug>.png` (1000x1500) cover-fills
     the 9:16 frame, Ken Burns 1.00→1.12. No card-name overlay (the pin carries it).
   - **Captions:** VO phrase chunks burned in (Bone ~64px, centered in the lower
     third), each windowed by word-count proportion of VO **speech** time via
     drawtext `enable='between(t,start,end)'` — ffmpeg `silencedetect` anchors the
     first caption to the first spoken word, absorbs long TTS pauses, and ends the
     last caption when speech ends (falls back to whole-file proportions if
     detection fails).
   - **Shadow-turn beat:** the art snaps darker + red-shifted (`eq` grade) from the
     caption that opens "The shadow side" until the "Your gift?" caption lands.
   - `cardblueprints.com` watermark (Antique Gold) sits on an opaque bottom band
     (y≥1728, soft ramp above) that hides the domain footer baked into the pin art,
     so exactly one domain line is on screen; VO + 0.8 s tail.
   Auto-selects `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg` (the slim PATH ffmpeg lacks
   `drawtext`); override with `FFMPEG`/`FFPROBE` env vars. Writes the constructed
   filtergraph to `<out>.filter.log` for inspection.

## Still manual

- **Upload** to YouTube/TikTok/IG — use `title` and `caption` from the queue JSON
  (the orchestrator prints both at the end).
- Voicebox backend persistence across reboots (no LaunchAgent yet).
- Git commit of generated assets.
