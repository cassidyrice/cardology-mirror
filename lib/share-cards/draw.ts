import { parseCard, type Suit } from "@/lib/cards";
import {
  SHARE_LAYOUT,
  lifePathSeatCenters,
  type Rect,
} from "./layout";
import {
  assertShareLabelSafe,
  type ShareCardIdentity,
} from "./labels";

/** Photo-real card stock — white/off-white, not cream-paper marketing tint. */
const CARD_FACE_BG = "#fffef9";
/** Thin dark edge (not gold chrome). */
const CARD_EDGE = "#2c2a28";
const INK = "#1a1a1a";
/** Muted charcoal — quiet label type under cards. */
const BAND_INK = "#6a645c";
/** Standard playing-card red / black. */
const RED = "#c41e3a";
const BLACK = "#1a1a1a";

// Canonical pip layout from components/cards/CardFace.tsx
const COL_X = [0.27, 0.5, 0.73] as const;
const PIPS: Record<string, ReadonlyArray<readonly [number, number]>> = {
  "2": [
    [1, 0.18],
    [1, 0.82],
  ],
  "3": [
    [1, 0.18],
    [1, 0.5],
    [1, 0.82],
  ],
  "4": [
    [0, 0.18],
    [2, 0.18],
    [0, 0.82],
    [2, 0.82],
  ],
  "5": [
    [0, 0.18],
    [2, 0.18],
    [1, 0.5],
    [0, 0.82],
    [2, 0.82],
  ],
  "6": [
    [0, 0.18],
    [2, 0.18],
    [0, 0.5],
    [2, 0.5],
    [0, 0.82],
    [2, 0.82],
  ],
  "7": [
    [0, 0.18],
    [2, 0.18],
    [1, 0.34],
    [0, 0.5],
    [2, 0.5],
    [0, 0.82],
    [2, 0.82],
  ],
  "8": [
    [0, 0.18],
    [2, 0.18],
    [1, 0.34],
    [0, 0.5],
    [2, 0.5],
    [1, 0.66],
    [0, 0.82],
    [2, 0.82],
  ],
  "9": [
    [0, 0.18],
    [2, 0.18],
    [0, 0.39],
    [2, 0.39],
    [1, 0.5],
    [0, 0.61],
    [2, 0.61],
    [0, 0.82],
    [2, 0.82],
  ],
  "10": [
    [0, 0.18],
    [2, 0.18],
    [1, 0.29],
    [0, 0.39],
    [2, 0.39],
    [0, 0.61],
    [2, 0.61],
    [1, 0.71],
    [0, 0.82],
    [2, 0.82],
  ],
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function suitColor(suit: Suit | null): string {
  if (!suit) return INK;
  return suit === "hearts" || suit === "diamonds" ? RED : BLACK;
}

/** Draw a photo-real playing card face into a slot. Joker gets a star — never a silent King of Spades. */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  slot: Rect,
  identity: ShareCardIdentity,
) {
  const { x, y, w, h } = slot;
  const r = Math.min(w, h) * 0.055;

  ctx.save();

  // Soft drop shadow under the card
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 8;

  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = CARD_FACE_BG;
  ctx.fill();

  // Clear shadow for the edge stroke
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = CARD_EDGE;
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.stroke();

  if (identity.kind === "joker") {
    ctx.fillStyle = RED;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.floor(h * 0.28)}px "Times New Roman", Georgia, serif`;
    ctx.fillText("★", x + w / 2, y + h * 0.42);
    ctx.font = `600 ${Math.floor(h * 0.08)}px "Times New Roman", Georgia, serif`;
    ctx.fillStyle = INK;
    ctx.fillText("JOKER", x + w / 2, y + h * 0.68);
    ctx.restore();
    return;
  }

  const parsed = parseCard(identity.code);
  if (!parsed) {
    ctx.restore();
    return;
  }

  const color = suitColor(parsed.suit);
  const pad = w * 0.075;
  const cornerSize = Math.floor(h * 0.085);
  const glyphSize = Math.floor(h * 0.065);

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${cornerSize}px "Times New Roman", Georgia, serif`;
  ctx.fillText(parsed.rank, x + pad + cornerSize * 0.35, y + pad);
  ctx.font = `${glyphSize}px "Times New Roman", Georgia, serif`;
  ctx.fillText(
    parsed.glyph,
    x + pad + cornerSize * 0.35,
    y + pad + cornerSize * 0.95,
  );

  // Center: authentic pip layout / ace / court monogram
  ctx.textBaseline = "middle";
  if (parsed.rank === "A") {
    ctx.font = `600 ${Math.floor(h * 0.3)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.glyph, x + w / 2, y + h / 2);
  } else if (parsed.rank === "J" || parsed.rank === "Q" || parsed.rank === "K") {
    // Face cards: large suit + rank — not cartoon court art
    ctx.font = `600 ${Math.floor(h * 0.26)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.glyph, x + w / 2, y + h * 0.4);
    ctx.font = `600 ${Math.floor(h * 0.13)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.rank, x + w / 2, y + h * 0.6);
  } else if (PIPS[parsed.rank]) {
    const pipSize = Math.floor(h * (parsed.rank === "10" ? 0.085 : 0.095));
    ctx.font = `600 ${pipSize}px "Times New Roman", Georgia, serif`;
    for (const [col, yp] of PIPS[parsed.rank]) {
      const px = x + w * COL_X[col];
      const py = y + h * yp;
      ctx.save();
      ctx.translate(px, py);
      if (yp > 0.5) ctx.rotate(Math.PI);
      ctx.fillText(parsed.glyph, 0, 0);
      ctx.restore();
    }
  } else {
    ctx.font = `600 ${Math.floor(h * 0.2)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.glyph, x + w / 2, y + h / 2);
  }

  // Mirrored bottom-right corner
  ctx.save();
  ctx.translate(x + w - pad - cornerSize * 0.35, y + h - pad);
  ctx.rotate(Math.PI);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${cornerSize}px "Times New Roman", Georgia, serif`;
  ctx.fillText(parsed.rank, 0, 0);
  ctx.font = `${glyphSize}px "Times New Roman", Georgia, serif`;
  ctx.fillText(parsed.glyph, 0, cornerSize * 0.95);
  ctx.restore();

  ctx.restore();
}

export function drawLabelInBand(
  ctx: CanvasRenderingContext2D,
  band: Rect,
  label: string,
) {
  const safe = assertShareLabelSafe(label);
  ctx.save();
  ctx.fillStyle = BAND_INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Quiet premium type: lighter weight, smaller, soft tracking
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0.04em";
  }

  let size = Math.floor(band.h * 0.38);
  ctx.font = `400 ${size}px "Times New Roman", Georgia, serif`;
  while (size > 18 && ctx.measureText(safe).width > band.w * 0.92) {
    size -= 2;
    ctx.font = `400 ${size}px "Times New Roman", Georgia, serif`;
  }
  ctx.fillText(safe, band.x + band.w / 2, band.y + band.h / 2, band.w * 0.96);
  ctx.restore();
}

/** Fill the duel template's 7 Life Path seats with first-birthday card codes. */
export function drawLifePathSeats(
  ctx: CanvasRenderingContext2D,
  seatCodes: string[],
) {
  const centers = lifePathSeatCenters();
  const count = Math.min(centers.length, seatCodes.length);
  for (let i = 0; i < count; i++) {
    const { x, y, r } = centers[i];
    const code = seatCodes[i];
    const parsed = parseCard(code);
    // Never paint a silent K♠ into a Joker seat — skip empty/unknown.
    if (!parsed) continue;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = CARD_FACE_BG;
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = CARD_EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = suitColor(parsed.suit);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.floor(r * 0.7)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(`${parsed.rank}${parsed.glyph}`, x, y);
    ctx.restore();
  }
}

export function createShareCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export async function loadTemplateImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load share template: ${src}`));
    img.src = src;
  });
  return img;
}

export { SHARE_LAYOUT };
