import { parseCard, SUIT_COLOR_PAPER, type Suit } from "@/lib/cards";
import {
  SHARE_LAYOUT,
  lifePathSeatCenters,
  type Rect,
} from "./layout";
import {
  assertShareLabelSafe,
  type ShareCardIdentity,
} from "./labels";

const CARD_FACE_BG = "#fbf6ea";
const CARD_FACE_BORDER = "#c4a35a";
const INK = "#14110d";
const BAND_INK = "#2a241c";

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
  return SUIT_COLOR_PAPER[suit];
}

/** Draw a paper-style playing card face into a slot. Joker gets a star — never a silent King of Spades. */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  slot: Rect,
  identity: ShareCardIdentity,
) {
  const { x, y, w, h } = slot;
  const r = Math.min(w, h) * 0.06;

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = CARD_FACE_BG;
  ctx.fill();
  ctx.strokeStyle = CARD_FACE_BORDER;
  ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.stroke();

  if (identity.kind === "joker") {
    ctx.fillStyle = "#8e321f";
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
  const pad = w * 0.08;
  const cornerSize = Math.floor(h * 0.09);
  const glyphSize = Math.floor(h * 0.07);

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${cornerSize}px "Times New Roman", Georgia, serif`;
  ctx.fillText(parsed.rank, x + pad + cornerSize * 0.35, y + pad);
  ctx.font = `${glyphSize}px "Times New Roman", Georgia, serif`;
  ctx.fillText(parsed.glyph, x + pad + cornerSize * 0.35, y + pad + cornerSize);

  // Center pip / monogram
  ctx.textBaseline = "middle";
  if (parsed.rank === "A") {
    ctx.font = `600 ${Math.floor(h * 0.32)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.glyph, x + w / 2, y + h / 2);
  } else if (parsed.rank === "J" || parsed.rank === "Q" || parsed.rank === "K") {
    ctx.font = `600 ${Math.floor(h * 0.28)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.glyph, x + w / 2, y + h * 0.42);
    ctx.font = `600 ${Math.floor(h * 0.14)}px "Times New Roman", Georgia, serif`;
    ctx.fillText(parsed.rank, x + w / 2, y + h * 0.62);
  } else {
    ctx.font = `600 ${Math.floor(h * 0.22)}px "Times New Roman", Georgia, serif`;
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
  ctx.fillText(parsed.glyph, 0, cornerSize);
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

  let size = Math.floor(band.h * 0.48);
  ctx.font = `600 ${size}px "Times New Roman", Georgia, serif`;
  while (size > 22 && ctx.measureText(safe).width > band.w * 0.92) {
    size -= 2;
    ctx.font = `600 ${size}px "Times New Roman", Georgia, serif`;
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
    ctx.fill();
    ctx.strokeStyle = CARD_FACE_BORDER;
    ctx.lineWidth = 2;
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