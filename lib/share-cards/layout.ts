import layoutJson from "./layout.json";

export type Rect = { x: number; y: number; w: number; h: number };

export type SeatCenter = { x: number; y: number; r: number };

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
    lifePathBoard: {
      centerY: number;
      seats: number;
      /** Measured circle centers on 02-compat-duel-template.png — not a guessed arc. */
      seatCenters: SeatCenter[];
    };
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
 * Seat centers measured from the shipped duel template art.
 * Canvas draw MUST use these coords — never a procedural smile-arc guess.
 */
export function lifePathSeatCenters(): SeatCenter[] {
  const board = SHARE_LAYOUT.compatDuel.lifePathBoard;
  const seats = board.seatCenters;
  if (!seats || seats.length !== board.seats) {
    throw new Error(
      `lifePathBoard.seatCenters must contain exactly ${board.seats} measured seats`,
    );
  }
  return seats.map((s) => ({ x: s.x, y: s.y, r: s.r }));
}
