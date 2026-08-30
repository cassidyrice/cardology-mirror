import layoutJson from "./layout.json";

export type Rect = { x: number; y: number; w: number; h: number };

export type ShareLayout = {
  birthResult: {
    canvas: { w: number; h: number };
    template: string;
    cardSlot: Rect;
    nameBand: Rect;
    watermark: string;
  };
  compatDuel: {
    canvas: { w: number; h: number };
    template: string;
    cardSlots: Rect[];
    labelBand: Rect;
    lifePathBoard: { centerY: number; seats: number };
    watermark: string;
    firstBirthdayOnlyForDeepDive: boolean;
  };
  rules: {
    noPriceOnImage: true;
    bannedWords: string[];
    joker: string;
  };
};

export const SHARE_LAYOUT = layoutJson as ShareLayout;

export const SHARE_TEMPLATE_PATHS = {
  birthResult: `/share-cards/${SHARE_LAYOUT.birthResult.template}`,
  compatDuel: `/share-cards/${SHARE_LAYOUT.compatDuel.template}`,
} as const;

export const SHARE_BANNED_WORDS = SHARE_LAYOUT.rules.bannedWords.map((w) =>
  w.toLowerCase(),
);

/** Classic planetary Life Path seats drawn on the duel template (Moon→Saturn). */
export const SHARE_LIFE_PATH_SEAT_COUNT =
  SHARE_LAYOUT.compatDuel.lifePathBoard.seats;

/**
 * Approximate seat centers along the template's smile-arc of circles.
 * Layout only exposes centerY + seat count; x/y are derived to match art.
 */
export function lifePathSeatCenters(
  canvasW = SHARE_LAYOUT.compatDuel.canvas.w,
  centerY = SHARE_LAYOUT.compatDuel.lifePathBoard.centerY,
  seats = SHARE_LIFE_PATH_SEAT_COUNT,
): Array<{ x: number; y: number; r: number }> {
  const span = 720;
  const depth = 90;
  const r = 42;
  const originX = canvasW / 2 - span / 2;
  return Array.from({ length: seats }, (_, i) => {
    const t = seats === 1 ? 0.5 : i / (seats - 1);
    const x = originX + t * span;
    // Positive y is down — middle seats sit lower (smile).
    const y = centerY + Math.sin(t * Math.PI) * depth;
    return { x, y, r };
  });
}
