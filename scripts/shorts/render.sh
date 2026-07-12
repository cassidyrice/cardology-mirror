#!/usr/bin/env bash
#
# render.sh — Card Blueprints shorts renderer (retention template v2)
# Renders a 1080x1920 (9:16) vertical video:
#   0.0-2.5s  "BORN ON <DATE>?" (~120px Antique Gold) over blurred, dimmed card art
#   3.0s      sharp full-frame pin art reveals, Ken Burns 1.00 -> 1.12
#   VO-synced burned-in phrase captions (Bone ~64px, centered in the lower third),
#   timed by word-count proportion of the measured VO duration
#   cardblueprints.com watermark; audio = VO + 0.8s tail.
#
# Usage: render.sh <meta.json> <vo_audio> <out.mp4>
#
# meta.json must contain: card_slug, born_on_label, vo_phrases [{text,words}],
# and pin_image (falls back to <repo>/public/pins/<card_slug>.png).
# The constructed filtergraph is written to <out basename>.filter.log.
#
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $(basename "$0") <meta.json> <vo_audio> <out.mp4>" >&2
  exit 1
fi

META="$1"
VO="$2"
OUT="$3"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Pick an ffmpeg that has drawtext (the slim homebrew-ffmpeg build lacks
# libfreetype; ffmpeg-full has it). $FFMPEG/$FFPROBE env vars override.
if [[ -z "${FFMPEG:-}" ]]; then
  FFMPEG=ffmpeg
  for cand in /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg "$(command -v ffmpeg || true)"; do
    [[ -x "$cand" ]] || continue
    filters="$("$cand" -hide_banner -filters 2>/dev/null || true)"
    if [[ "$filters" == *drawtext* ]]; then
      FFMPEG="$cand"
      break
    fi
  done
fi
if [[ -z "${FFPROBE:-}" ]]; then
  FFPROBE="$(dirname "$FFMPEG")/ffprobe"
  [[ -x "$FFPROBE" ]] || FFPROBE=ffprobe
fi

[[ -f "$META" ]] || { echo "error: meta json not found: $META" >&2; exit 1; }
[[ -f "$VO"   ]] || { echo "error: VO audio not found: $VO" >&2; exit 1; }

# ---- parse meta -------------------------------------------------------------
read_meta() {
  python3 -c 'import json,sys
v = json.load(open(sys.argv[1])).get(sys.argv[2])
print(v if isinstance(v, str) else "")' "$META" "$1"
}
CARD_SLUG="$(read_meta card_slug)"
BORN_LABEL="$(read_meta born_on_label)"
PIN_IMAGE="$(read_meta pin_image)"

[[ -n "$CARD_SLUG"  ]] || { echo "error: card_slug missing in $META" >&2; exit 1; }
[[ -n "$BORN_LABEL" ]] || { echo "error: born_on_label missing in $META (regenerate with daily-script.ts)" >&2; exit 1; }

# Resolve pin art: meta path, path relative to meta dir, site path (/pins/...),
# then the repo default public/pins/<card_slug>.png.
if [[ -n "$PIN_IMAGE" && ! -f "$PIN_IMAGE" ]]; then
  META_DIR="$(cd "$(dirname "$META")" && pwd)"
  if [[ -f "$META_DIR/$PIN_IMAGE" ]]; then
    PIN_IMAGE="$META_DIR/$PIN_IMAGE"
  elif [[ -f "$ROOT/public${PIN_IMAGE}" ]]; then
    PIN_IMAGE="$ROOT/public${PIN_IMAGE}"
  else
    PIN_IMAGE=""
  fi
fi
[[ -n "$PIN_IMAGE" ]] || PIN_IMAGE="$ROOT/public/pins/${CARD_SLUG}.png"
[[ -f "$PIN_IMAGE" ]] || { echo "error: pin art not found: $PIN_IMAGE" >&2; exit 1; }

# ---- font -------------------------------------------------------------------
FONT=""
for f in \
  /System/Library/Fonts/Supplemental/Georgia.ttf \
  /System/Library/Fonts/Supplemental/Times\ New\ Roman.ttf \
  /System/Library/Fonts/Supplemental/Baskerville.ttc; do
  [[ -f "$f" ]] && FONT="$f" && break
done
[[ -n "$FONT" ]] || { echo "error: no serif font found" >&2; exit 1; }

# ---- durations --------------------------------------------------------------
AUDIO_DUR="$("$FFPROBE" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VO")"
FPS=30
# total = audio + 0.8s tail
read -r DUR FRAMES <<< "$(python3 -c "
d = float('$AUDIO_DUR') + 0.8
print(f'{d:.3f}', max(int(round(d * $FPS)), 2))")"

# ---- pin art geometry (cover-fill the 9:16 frame) ----------------------------
read -r IW IH <<< "$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width,height -of default=noprint_wrappers=1:nokey=1 "$PIN_IMAGE" | tr '\n' ' ')"

# ---- build filtergraph -------------------------------------------------------
# Python writes per-phrase caption textfiles + the date textfile into $TMP,
# converts word-count proportions of the measured VO duration into
# enable='between(t,start,end)' windows, and emits the full filter_complex.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

CAPTION_COUNT="$(python3 - "$META" "$TMP" "$FONT" "$AUDIO_DUR" "$FPS" "$FRAMES" "$IW" "$IH" <<'PYEOF'
import json, os, sys

meta_path, tmp, font, aud_s, fps_s, frames_s, iw_s, ih_s = sys.argv[1:9]
meta = json.load(open(meta_path))
aud = float(aud_s)
fps, frames = int(fps_s), int(frames_s)
iw, ih = int(iw_s), int(ih_s)

W, H = 1080, 1920
OVER = 2  # zoompan oversample factor (smooths the zoom)
GOLD, BONE = "0xB8924D", "0xF2EDE3"

# Cover-scale the art to OVER*(W,H), then center-crop to exactly that.
s = max(OVER * W / iw, OVER * H / ih)
prew = int(round(iw * s)) // 2 * 2
preh = int(round(ih * s)) // 2 * 2

# --- date card, 0-2.5s: "BORN ON" / "<MONTH DAY>?" ---
born = (meta.get("born_on_label") or "").strip()
lines = ["BORN ON", born.upper() + "?"]
maxlen = max(len(l) for l in lines)
date_fs = min(120, int(1020 / (0.72 * maxlen)))  # shrink only if a long month would overflow
date_txt = os.path.join(tmp, "date.txt")
open(date_txt, "w").write("\n".join(lines))
date_draw = (
    f"drawtext=fontfile='{font}':textfile='{date_txt}':fontcolor={GOLD}:fontsize={date_fs}"
    f":line_spacing=24:x=(w-text_w)/2:y=(h-text_h)*0.40:enable='lt(t,2.5)'"
)

# --- VO-synced captions: word-count proportions of the measured VO duration ---
phrases = meta.get("vo_phrases") or []
if not phrases:
    sys.exit("error: vo_phrases missing/empty in meta json (regenerate with daily-script.ts)")
total = sum(int(p.get("words") or 0) for p in phrases)
if total <= 0:
    sys.exit("error: vo_phrases word counts are all zero")

caps = []
cum = 0
for i, p in enumerate(phrases):
    text = (p.get("text") or "").strip()
    words = int(p.get("words") or 0)
    start = aud * cum / total
    cum += words
    end = aud if i == len(phrases) - 1 else aud * cum / total
    cap_txt = os.path.join(tmp, f"cap{i:02d}.txt")
    open(cap_txt, "w").write(text)
    fs = max(40, min(64, int(1000 / (0.52 * max(len(text), 1)))))  # ~64px, shrink to fit width
    caps.append(
        f"drawtext=fontfile='{font}':textfile='{cap_txt}':fontcolor={BONE}:fontsize={fs}"
        f":x=(w-text_w)/2:y=1600-text_h/2"
        f":shadowcolor=0x0F0E0D@0.85:shadowx=3:shadowy=3"
        f":enable='between(t,{start:.3f},{end:.3f})'"
    )

# Bottom scrim dims the baked-in pin footer (which drifts with the zoom) so the
# fixed drawtext watermark reads as the single crisp domain line. NOTE: keep this
# heredoc free of unbalanced single quotes — it lives inside a bash $( ).
wm = (
    f"drawbox=x=0:y=1740:w={W}:h={H-1740}:color=black@0.55:t=fill,"
    f"drawtext=fontfile='{font}':text='cardblueprints.com':fontcolor={GOLD}:fontsize=40"
    f":x=(w-text_w)/2:y=1804"
)

filter_complex = ";".join([
    # Full-frame vertical art with Ken Burns 1.00 -> 1.12; split sharp/blur branches.
    f"[0:v]scale={prew}:{preh},crop={OVER*W}:{OVER*H},"
    f"zoompan=z='1+0.12*on/{frames}':d={frames}:"
    f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={fps},split=2[cs][cb0]",
    "[cb0]boxblur=luma_radius=40:luma_power=2:chroma_radius=20:chroma_power=2[cb]",
    # Blurred art until the 3.0s reveal, then the sharp card.
    "[2:v][cb]overlay=enable='lt(t,3)'[b1]",
    "[b1][cs]overlay=enable='gte(t,3)'[b2]",
    # Dark scrim under the date card, then date, captions, watermark.
    "[b2]drawbox=color=black@0.55:t=fill:enable='lt(t,2.5)',"
    + date_draw + "," + ",".join(caps) + "," + wm + "[v]",
])
open(os.path.join(tmp, "filter.txt"), "w").write(filter_complex)
print(len(caps))
PYEOF
)"

FILTER="$(cat "$TMP/filter.txt")"
FILTER_LOG="${OUT%.mp4}.filter.log"
cp "$TMP/filter.txt" "$FILTER_LOG"

BG=0x0F0E0D      # Obsidian

"$FFMPEG" -y -hide_banner -loglevel error \
  -i "$PIN_IMAGE" \
  -i "$VO" \
  -f lavfi -i "color=c=${BG}:s=1080x1920:r=${FPS}" \
  -filter_complex "$FILTER" \
  -map "[v]" -map 1:a \
  -af "apad" \
  -t "$DUR" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r "$FPS" \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$OUT"

echo "rendered: $OUT (${DUR}s, ${FRAMES} frames)"
echo "template: date intro 0-2.5s -> card reveal at 3.0s; ${CAPTION_COUNT} caption windows over ${AUDIO_DUR}s VO"
echo "filtergraph: $FILTER_LOG"
