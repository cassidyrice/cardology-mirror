#!/usr/bin/env bash
#
# render.sh — Card Blueprints shorts renderer
# Renders a 1080x1920 (9:16) vertical video: brand background, Ken Burns
# zoom on the card OG image, card label + site tag, VO audio + 0.8s tail.
#
# Usage: render.sh <meta.json> <vo_audio> <out.mp4>
#
# meta.json must contain: { "card_label": "5 of Clubs", "og_image": "..." }
#
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $(basename "$0") <meta.json> <vo_audio> <out.mp4>" >&2
  exit 1
fi

META="$1"
VO="$2"
OUT="$3"

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
if command -v jq >/dev/null 2>&1; then
  CARD_LABEL="$(jq -r '.card_label // empty' "$META")"
  OG_IMAGE="$(jq -r '.og_image // empty' "$META")"
else
  CARD_LABEL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("card_label",""))' "$META")"
  OG_IMAGE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("og_image",""))' "$META")"
fi

[[ -n "$CARD_LABEL" ]] || { echo "error: card_label missing in $META" >&2; exit 1; }
[[ -n "$OG_IMAGE"   ]] || { echo "error: og_image missing in $META" >&2; exit 1; }

# Resolve og_image: absolute path, relative to meta.json dir, or site path (/og/...)
if [[ ! -f "$OG_IMAGE" ]]; then
  META_DIR="$(cd "$(dirname "$META")" && pwd)"
  if [[ -f "$META_DIR/$OG_IMAGE" ]]; then
    OG_IMAGE="$META_DIR/$OG_IMAGE"
  elif [[ -f "/Users/clr/cardology-mirror/public${OG_IMAGE}" ]]; then
    OG_IMAGE="/Users/clr/cardology-mirror/public${OG_IMAGE}"
  else
    echo "error: og_image not found: $OG_IMAGE" >&2
    exit 1
  fi
fi

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

# ---- card image geometry ----------------------------------------------------
# Card shown at ~90% of frame width; keep aspect; even dimensions.
read -r IW IH <<< "$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=width,height -of default=noprint_wrappers=1:nokey=1 "$OG_IMAGE" | tr '\n' ' ')"
read -r CW CH PREW PREH CX CY <<< "$(python3 -c "
iw, ih = $IW, $IH
cw = 972                                  # ~90% of 1080, even
ch = int(round(cw * ih / iw)) // 2 * 2
prew = cw * 4                             # oversample 4x to smooth zoompan
preh = int(round(prew * ih / iw)) // 2 * 2
cx = (1080 - cw) // 2
cy = int(1920 * 0.40) - ch // 2           # card centered ~40% down the frame
print(cw, ch, prew, preh, cx, cy)")"

# ---- text (escape for drawtext) ----------------------------------------------
esc() { printf '%s' "$1" | sed -e "s/\\\\/\\\\\\\\/g" -e "s/'/\\\\'/g" -e 's/:/\\:/g' -e 's/%/\\%/g'; }
LABEL_ESC="$(esc "$CARD_LABEL")"
SITE_ESC="cardblueprints.com"

# Brand palette
BG=0x0F0E0D      # Obsidian
GOLD=0xB8924D    # Antique Gold
BONE=0xF2EDE3    # Bone

LABEL_Y=1310
SITE_Y=1425

FILTER="\
[0:v]scale=${PREW}:${PREH},\
zoompan=z='1+0.06*on/${FRAMES}':d=${FRAMES}:\
x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${CW}x${CH}:fps=${FPS}[card];\
[2:v][card]overlay=x=${CX}:y=${CY}[base];\
[base]drawtext=fontfile='${FONT}':text='${LABEL_ESC}':fontcolor=${BONE}:fontsize=78:x=(w-text_w)/2:y=${LABEL_Y},\
drawtext=fontfile='${FONT}':text='${SITE_ESC}':fontcolor=${GOLD}:fontsize=40:x=(w-text_w)/2:y=${SITE_Y}[v]"

"$FFMPEG" -y -hide_banner -loglevel error \
  -i "$OG_IMAGE" \
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
