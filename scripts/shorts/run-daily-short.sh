#!/usr/bin/env bash
# run-daily-short.sh — one-command Card Blueprints daily-short pipeline.
#
# Usage: scripts/shorts/run-daily-short.sh [YYYY-MM-DD]
#   (default: today)
#
# Chain: daily-script.ts (meta JSON) -> TTS (voicebox Kokoro, fallback: macOS `say`)
#        -> render.sh (1080x1920 mp4). Upload remains manual.
#
# Env overrides:
#   VOICEBOX_API   (default http://127.0.0.1:17493)
#   VOICEBOX_PROFILE (default 05c35001-8beb-4ef4-b470-7f41de7a261d = "Mystic Narrator", kokoro bm_fable)
#   FFMPEG         (passed through to conversions; render.sh has its own auto-detect)

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATE="${1:-$(date +%F)}"
VOICEBOX_API="${VOICEBOX_API:-http://127.0.0.1:17493}"
VOICEBOX_PROFILE="${VOICEBOX_PROFILE:-05c35001-8beb-4ef4-b470-7f41de7a261d}"

META="$REPO/content/shorts/queue/$DATE.json"
OUT_DIR="$REPO/content/shorts/out"
VO_WAV="$OUT_DIR/$DATE-vo.wav"
MP4="$OUT_DIR/$DATE-daily-card.mp4"
mkdir -p "$OUT_DIR"

# Prefer the full ffmpeg build (drawtext/zoompan) if present, for the say-fallback conversion.
FFMPEG_BIN="${FFMPEG:-}"
if [[ -z "$FFMPEG_BIN" ]]; then
  if [[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ]]; then
    FFMPEG_BIN=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg
  else
    FFMPEG_BIN=ffmpeg
  fi
fi

echo "==> [1/3] Script/meta for $DATE"
(cd "$REPO" && bun scripts/shorts/daily-script.ts --date "$DATE" --out "$META")
echo "    meta: $META"

echo "==> [2/3] TTS"
tts_voicebox() {
  python3 - "$META" "$VO_WAV" "$VOICEBOX_API" "$VOICEBOX_PROFILE" <<'PYEOF'
import json, sys, time, urllib.request

meta_path, out_wav, api, profile = sys.argv[1:5]
vo_text = json.load(open(meta_path))["vo_text"]

# health check
urllib.request.urlopen(f"{api}/health", timeout=5)

# 1) submit
payload = json.dumps({"profile_id": profile, "text": vo_text,
                      "engine": "kokoro", "language": "en"}).encode()
req = urllib.request.Request(f"{api}/generate", data=payload,
                             headers={"Content-Type": "application/json"})
gen = json.load(urllib.request.urlopen(req, timeout=30))
gid = gen["id"]

# 2) poll SSE status stream until completed/failed
status = None
with urllib.request.urlopen(f"{api}/generate/{gid}/status", timeout=300) as r:
    for raw in r:
        line = raw.decode().strip()
        if not line.startswith("data: "):
            continue
        ev = json.loads(line[6:])
        status = ev.get("status")
        if status in ("completed", "failed"):
            if status == "failed":
                sys.exit(f"voicebox generation failed: {ev.get('error')}")
            print(f"    voicebox generation {gid}: {ev.get('duration')}s")
            break

if status != "completed":
    sys.exit("voicebox generation did not complete")

# 3) download wav bytes
urllib.request.urlretrieve(f"{api}/audio/{gid}", out_wav)
PYEOF
}

tts_say_fallback() {
  echo "    voicebox unavailable — FALLBACK to macOS 'say' (mark this render as fallback audio)"
  local voice="" v
  for v in "Ava (Premium)" "Zoe (Premium)" "Evan (Enhanced)" "Tom (Enhanced)" "Samantha (Enhanced)" "Samantha"; do
    if say -v '?' | grep -qF "$v "; then voice="$v"; break; fi
  done
  [[ -n "$voice" ]] || voice="Samantha"
  echo "    say voice: $voice @ 170 wpm"
  local aiff="${VO_WAV%.wav}.aiff"
  python3 -c "import json,sys; sys.stdout.write(json.load(open('$META'))['vo_text'])" \
    | say -v "$voice" -r 170 -o "$aiff" -f -
  "$FFMPEG_BIN" -y -v error -i "$aiff" -ar 24000 -ac 1 -c:a pcm_s16le "$VO_WAV"
  rm -f "$aiff"
}

if curl -sf --max-time 5 "$VOICEBOX_API/health" >/dev/null 2>&1 && tts_voicebox; then
  echo "    vo: $VO_WAV (voicebox/kokoro)"
else
  tts_say_fallback
  echo "    vo: $VO_WAV (macOS say FALLBACK)"
fi

echo "==> [3/3] Render"
bash "$REPO/scripts/shorts/render.sh" "$META" "$VO_WAV" "$MP4"

echo "==> Done"
echo "    mp4:   $MP4"
python3 - "$META" <<'PYEOF'
import json, sys
m = json.load(open(sys.argv[1]))
print(f"    title: {m['title']}")
print("    caption:")
for line in m["caption"].splitlines():
    print(f"      {line}")
print("    NEXT (manual): upload the mp4 with the title + caption above.")
PYEOF
