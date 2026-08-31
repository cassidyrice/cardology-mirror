import {
  SHARE_LAYOUT,
  SHARE_TEMPLATE_PATHS,
} from "./layout";
import {
  birthShareLabel,
  compatShareLabel,
  shareIdentityFromCode,
  type ShareCardIdentity,
} from "./labels";
import {
  createShareCanvas,
  drawBrandStack,
  drawCardBack,
  drawCardFace,
  drawLabelInBand,
  drawLifePathSeats,
  drawPurposeCue,
  drawShareCta,
  loadFaceImage,
  loadFaceImageFromCode,
  loadTemplateImage,
} from "./draw";

export type BirthShareInput = {
  birthCard: string;
};

export type CompatShareInput = {
  firstBirthCard: string;
  secondBirthCard: string;
  /** First birthday Life Path seat codes (Moon→…); only first 7 are painted. */
  firstLifePathSeatCodes: string[];
};

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas export failed"));
        else resolve(blob);
      },
      "image/png",
      1,
    );
  });
}

export async function renderBirthSharePng(
  input: BirthShareInput,
): Promise<{ blob: Blob; label: string; identity: ShareCardIdentity }> {
  const identity = shareIdentityFromCode(input.birthCard);
  if (!identity) {
    throw new Error("Cannot share: unknown birth card");
  }
  // Honest Joker treatment — never coerce to K♠.
  if (identity.kind === "joker" && identity.code !== "Joker") {
    throw new Error("Joker must not be remapped for share export");
  }

  const layout = SHARE_LAYOUT.birthResult;
  const canvas = createShareCanvas(layout.canvas.w, layout.canvas.h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  const [template, face] = await Promise.all([
    loadTemplateImage(SHARE_TEMPLATE_PATHS.birthResult),
    loadFaceImage(identity),
  ]);
  ctx.drawImage(template, 0, 0, layout.canvas.w, layout.canvas.h);
  // Brand chrome in canvas — templates stay flat field.
  drawBrandStack(ctx, layout.canvas.w, layout.brandStack);
  drawCardFace(ctx, layout.cardSlot, identity, face);
  drawPurposeCue(ctx, layout.purposeCue, layout.purposeCue.text);
  const label = birthShareLabel(identity);
  drawLabelInBand(ctx, layout.nameBand, label);
  drawShareCta(ctx, layout.canvas.w, layout.ctaY);

  const blob = await canvasToPngBlob(canvas);
  return { blob, label, identity };
}

/** Empty landing hero: same frame, face-down card, no personal label. */
export async function renderEmptyBirthSharePng(): Promise<{ blob: Blob }> {
  const layout = SHARE_LAYOUT.birthResult;
  const canvas = createShareCanvas(layout.canvas.w, layout.canvas.h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  const template = await loadTemplateImage(SHARE_TEMPLATE_PATHS.birthResult);
  ctx.drawImage(template, 0, 0, layout.canvas.w, layout.canvas.h);
  drawBrandStack(ctx, layout.canvas.w, layout.brandStack);
  drawCardBack(ctx, layout.cardSlot);
  drawPurposeCue(ctx, layout.purposeCue, layout.purposeCue.text);
  drawShareCta(ctx, layout.canvas.w, layout.ctaY);

  const blob = await canvasToPngBlob(canvas);
  return { blob };
}

export async function renderCompatSharePng(
  input: CompatShareInput,
): Promise<{ blob: Blob; label: string }> {
  const a = shareIdentityFromCode(input.firstBirthCard);
  const b = shareIdentityFromCode(input.secondBirthCard);
  if (!a || !b) {
    throw new Error("Cannot share: missing birth card");
  }
  // Duel share requires two real cards. Joker has no Life Path seats —
  // do not fabricate King of Spades to fill the board.
  if (a.kind === "joker" || b.kind === "joker") {
    throw new Error("Joker has no duel share — Life Path seats are undefined");
  }

  const layout = SHARE_LAYOUT.compatDuel;
  const canvas = createShareCanvas(layout.canvas.w, layout.canvas.h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  const seatCodes = input.firstLifePathSeatCodes.slice(
    0,
    layout.lifePathBoard.seats,
  );

  const [template, faceA, faceB, ...seatFaces] = await Promise.all([
    loadTemplateImage(SHARE_TEMPLATE_PATHS.compatDuel),
    loadFaceImage(a),
    loadFaceImage(b),
    ...seatCodes.map((code) => loadFaceImageFromCode(code)),
  ]);

  ctx.drawImage(template, 0, 0, layout.canvas.w, layout.canvas.h);
  // Same brand stack as birth — templates stay flat (+ seat rings only).
  drawBrandStack(ctx, layout.canvas.w, layout.brandStack);

  const [slotA, slotB] = layout.cardSlots;
  drawCardFace(ctx, slotA, a, faceA);
  drawCardFace(ctx, slotB, b, faceB);

  const label = compatShareLabel(a, b);
  drawLabelInBand(ctx, layout.labelBand, label);

  // First birthday only — seats filled for Deep Dive path relevance; never paint price on the image.
  drawLifePathSeats(ctx, seatCodes, seatFaces);
  drawShareCta(ctx, layout.canvas.w, layout.ctaY);

  const blob = await canvasToPngBlob(canvas);
  return { blob, label };
}

export async function copyPngToClipboard(blob: Blob): Promise<boolean> {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (!nav?.clipboard || typeof ClipboardItem === "undefined") return false;
  try {
    await nav.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function sharePngFile(
  blob: Blob,
  filename: string,
  title: string,
): Promise<"shared" | "copied" | "downloaded" | "dismissed"> {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = typeof navigator !== "undefined" ? navigator : null;

  if (nav && typeof nav.share === "function") {
    const data: ShareData = { title, files: [file] };
    if (!nav.canShare || nav.canShare(data)) {
      try {
        await nav.share(data);
        return "shared";
      } catch (err) {
        // User dismissed the sheet — not an error.
        if (err instanceof DOMException && err.name === "AbortError") {
          return "dismissed";
        }
      }
    }
  }

  const copied = await copyPngToClipboard(blob);
  if (copied) return "copied";

  downloadPng(blob, filename);
  return "downloaded";
}

export function downloadPng(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
