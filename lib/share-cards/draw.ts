import { parseCard, type Suit } from "@/lib/cards";
import { cardSlugFromCode } from "@/lib/blueprint";
import {
  SHARE_LAYOUT,
  lifePathSeatCenters,
  type BrandStack,
  type Rect,
} from "./layout";
import {
  assertShareLabelSafe,
  type ShareCardIdentity,
} from "./labels";

/** Soft stock fill under shadow when face PNG has transparent corners. */
const CARD_FACE_BG = "#fffef9";
const CARD_EDGE = "#2c2a28";
/** Muted charcoal — quiet label type under cards. */
const BAND_INK = "#6a645c";
/** Quiet premium brand mark. */
const BRAND_INK = "#2a2622";
/** Soft CTA / purpose-cue ink — readable, not loud. */
const CTA_INK = "#8a847c";
const RED = "#c41e3a";
const BLACK = "#1a1a1a";

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
  if (!suit) return BLACK;
  return suit === "hearts" || suit === "diamonds" ? RED : BLACK;
}

/** SEO slug for a share identity — matches public/share-cards/faces/<slug>.png */
export function faceSlugFromIdentity(identity: ShareCardIdentity): string {
  if (identity.kind === "joker") return "joker";
  return cardSlugFromCode(identity.code);
}

/** Public path for a photo-real face PNG (52 + joker). */
export function shareFacePath(identity: ShareCardIdentity): string {
  return `/share-cards/faces/${faceSlugFromIdentity(identity)}.png`;
}

/** SEO slug from an engine card code ("Q♦" → "queen-of-diamonds"). Joker → "joker". */
export function faceSlugFromCode(code: string): string | null {
  if (!code) return null;
  if (code === "Joker") return "joker";
  if (!parseCard(code)) return null;
  return cardSlugFromCode(code);
}

export function shareFacePathFromCode(code: string): string | null {
  const slug = faceSlugFromCode(code);
  return slug ? `/share-cards/faces/${slug}.png` : null;
}

/**
 * Slot a photo-real face PNG into the card slot.
 * Soft drop shadow + rounded clip — NO canvas pip/monogram face drawing.
 * Joker uses /share-cards/faces/joker.png (jester art) — never a silent King of Spades.
 */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  slot: Rect,
  identity: ShareCardIdentity,
  face: CanvasImageSource,
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

  // Clear shadow; clip to rounded rect and draw the face PNG
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(face, x, y, w, h);

  // Thin dark edge on top of the image
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = CARD_EDGE;
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.stroke();

  ctx.restore();
}

/** Face-down card in the share slot. Empty hero only. Never a silent K♠. */
export function drawCardBack(ctx: CanvasRenderingContext2D, slot: Rect) {
  const { x, y, w, h } = slot;
  const r = Math.min(w, h) * 0.055;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "#1c1914";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  roundRect(ctx, x + w * 0.07, y + h * 0.07, w * 0.86, h * 0.86, r * 0.7);
  ctx.strokeStyle = "#c4a36a";
  ctx.lineWidth = Math.max(2, w * 0.01);
  ctx.stroke();
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

/**
 * Cass-locked brand stack near top — quiet premium mark + tagline.
 * Drawn in canvas so templates stay a flat field.
 * Brand mark "Card Blueprints"; tagline "Coordinates not Prophecy" (intentional Cass copy — keep Prophecy).
 */
export function drawBrandStack(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  stack: BrandStack,
) {
  const { mark, tagline } = SHARE_LAYOUT.brand;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0.06em";
  }
  ctx.fillStyle = BRAND_INK;
  ctx.font = `500 36px "Times New Roman", Georgia, serif`;
  ctx.fillText(mark, canvasW / 2, stack.markY);

  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0.05em";
  }
  ctx.fillStyle = BAND_INK;
  ctx.font = `400 22px "Times New Roman", Georgia, serif`;
  ctx.fillText(tagline, canvasW / 2, stack.taglineY);
  ctx.restore();
}

/**
 * Single clear CTA — replaces the old tiny watermark URL.
 * Do not double-stack the same URL.
 */
export function drawShareCta(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  ctaY: number,
) {
  const { cta } = SHARE_LAYOUT.brand;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0.03em";
  }
  ctx.fillStyle = CTA_INK;
  ctx.font = `400 22px "Times New Roman", Georgia, serif`;
  ctx.fillText(cta, canvasW / 2, ctaY);
  ctx.restore();
}

/** Quiet birth-only purpose cue near the card name — never fights the brand stack. */
export function drawPurposeCue(
  ctx: CanvasRenderingContext2D,
  band: Rect,
  text: string,
) {
  ctx.save();
  ctx.fillStyle = CTA_INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0.16em";
  }
  const size = Math.floor(band.h * 0.5);
  ctx.font = `400 ${size}px "Times New Roman", Georgia, serif`;
  ctx.fillText(text, band.x + band.w / 2, band.y + band.h / 2, band.w * 0.96);
  ctx.restore();
}

/**
 * Fill the duel template's 7 Life Path seats with photo-real face chips
 * (circular clip of the face PNG). Never paint a silent K♠ into a Joker seat.
 */
export function drawLifePathSeats(
  ctx: CanvasRenderingContext2D,
  seatCodes: string[],
  faces: Array<CanvasImageSource | null>,
) {
  const centers = lifePathSeatCenters();
  const count = Math.min(centers.length, seatCodes.length, faces.length);
  for (let i = 0; i < count; i++) {
    const { x, y, r } = centers[i];
    const code = seatCodes[i];
    const face = faces[i];
    // Never paint a silent K♠ into a Joker seat — skip empty/unknown.
    if (code === "Joker" || !parseCard(code) || !face) continue;

    const rr = r * 0.78;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fillStyle = CARD_FACE_BG;
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.clip();
    // Cover the circle with the face art (centered crop)
    const side = rr * 2;
    ctx.drawImage(face, x - rr, y - rr, side, side);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.strokeStyle = CARD_EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
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

/** Load a photo-real face PNG for a share identity. */
export async function loadFaceImage(
  identity: ShareCardIdentity,
): Promise<HTMLImageElement> {
  return loadTemplateImage(shareFacePath(identity));
}

/** Load a photo-real face PNG from an engine card code. */
export async function loadFaceImageFromCode(
  code: string,
): Promise<HTMLImageElement | null> {
  const path = shareFacePathFromCode(code);
  if (!path) return null;
  try {
    return await loadTemplateImage(path);
  } catch {
    return null;
  }
}

export { SHARE_LAYOUT, suitColor };
