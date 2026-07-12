# Card Blueprints — daily short pipeline

One vertical video (1080x1920) per day: "Born on <date>? Your card is the <birth card>."

## One command

```bash
scripts/shorts/run-daily-short.sh              # today
scripts/shorts/run-daily-short.sh 2026-07-12   # any date
```

Outputs (repo-relative):

- `content/shorts/queue/<date>.json` — meta: `vo_text`, `title`, `caption`, `card_slug`, `og_image`
- `content/shorts/out/<date>-vo.wav` — narration (24 kHz mono PCM16)
- `content/shorts/out/<date>-daily-card.mp4` — final short (h264 + AAC, faststart)

## Stages

1. **Script** — `bun scripts/shorts/daily-script.ts --date <date> --out <json>`
   Pulls the birth card from `lib/seo-cards`, composes a 110–150-word VO
   (hook → mirror-not-forecast frame → personality → shadow → CTA), plus title/caption.
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
   Ken Burns zoom (1.00→1.06) over the card's og image, card label in Bone +
   `cardblueprints.com` in Antique Gold (Georgia serif), VO + 0.8 s tail.
   Auto-selects `/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg` (the slim PATH ffmpeg lacks
   `drawtext`); override with `FFMPEG`/`FFPROBE` env vars.

## Still manual

- **Upload** to YouTube/TikTok/IG — use `title` and `caption` from the queue JSON
  (the orchestrator prints both at the end).
- Voicebox backend persistence across reboots (no LaunchAgent yet).
- Git commit of generated assets.
