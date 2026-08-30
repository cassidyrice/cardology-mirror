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
 * Measured seat centers from 02-compat-duel-template.png (circle-ness Hough).
 * Returns the layout coords only — never a procedural smile-arc.
 */
export function lifePathSeatCenters(): SeatCenter[] {
  const board = SHARE_LAYOUT.compatDuel.lifePathBoard;
  if (board.seatCenters.length !== board.seats) {
    throw new Error(
      `lifePathBoard.seatCenters length ${board.seatCenters.length} !== seats ${board.seats}`,
    );
  }
  return board.seatCenters;
}
