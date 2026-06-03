"use client";

import type { ParsedCard } from "@/lib/cards";
import { FoilSheen } from "./FoilSheen";

type SizeKey = "sm" | "md" | "lg";

// Per-size scale tokens so every size stays balanced.
const SCALE: Record<
  SizeKey,
  { corner: string; cornerGlyph: string; ace: string; pip: string; court: string; courtLetter: string; pad: string }
> = {
  sm: { corner: "text-[10px]", cornerGlyph: "text-[8px]", ace: "text-2xl", pip: "text-[8px]", court: "text-2xl", courtLetter: "text-[10px]", pad: "p-1" },
  md: { corner: "text-sm", cornerGlyph: "text-[11px]", ace: "text-4xl", pip: "text-xs", court: "text-4xl", courtLetter: "text-sm", pad: "p-1.5" },
  lg: { corner: "text-lg", cornerGlyph: "text-sm", ace: "text-6xl", pip: "text-base", court: "text-6xl", courtLetter: "text-lg", pad: "p-2.5" },
};

const COURT = new Set(["J", "Q", "K"]);

// Canonical playing-card pip positions, [colIndex, yPercent].
// col: 0 = left (x 27%), 1 = center (x 50%), 2 = right (x 73%).
// Any pip below the vertical midline (y > 50) is rotated 180°, exactly like a real deck.
const COL_X = [27, 50, 73] as const;
const PIPS: Record<string, ReadonlyArray<readonly [number, number]>> = {
  "2": [[1, 18], [1, 82]],
  "3": [[1, 18], [1, 50], [1, 82]],
  "4": [[0, 18], [2, 18], [0, 82], [2, 82]],
  "5": [[0, 18], [2, 18], [1, 50], [0, 82], [2, 82]],
  "6": [[0, 18], [2, 18], [0, 50], [2, 50], [0, 82], [2, 82]],
  "7": [[0, 18], [2, 18], [1, 34], [0, 50], [2, 50], [0, 82], [2, 82]],
  "8": [[0, 18], [2, 18], [1, 34], [0, 50], [2, 50], [1, 66], [0, 82], [2, 82]],
  "9": [[0, 18], [2, 18], [0, 39], [2, 39], [1, 50], [0, 61], [2, 61], [0, 82], [2, 82]],
  "10": [[0, 18], [2, 18], [1, 29], [0, 39], [2, 39], [0, 61], [2, 61], [1, 71], [0, 82], [2, 82]],
};

function Corner({ rank, glyph, cls, glyphCls, rotated }: { rank: string; glyph: string; cls: string; glyphCls: string; rotated?: boolean }) {
  return (
    <div className={`flex flex-col items-center leading-none ${rotated ? "rotate-180" : ""}`}>
      <span className={`${cls} font-serif font-medium tracking-tight`}>{rank}</span>
      <span className={`${glyphCls} -mt-px`}>{glyph}</span>
    </div>
  );
}

// Court cards are vertically mirror-symmetric in a real deck — two rotated halves
// of the same face. We honor that with a framed monogram split top/bottom.
function CourtFace({ card, s }: { card: ParsedCard; s: (typeof SCALE)[SizeKey] }) {
  const half = (rotated: boolean) => (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${rotated ? "rotate-180" : ""}`}
    >
      <span className={`${s.court} leading-none`}>{card.glyph}</span>
      <span className={`${s.courtLetter} foil-text font-serif font-semibold leading-none`}>
        {card.rank}
      </span>
    </div>
  );
  return (
    <div
      className="relative flex h-full w-full flex-col items-stretch rounded-[6px]"
      style={{ boxShadow: `inset 0 0 0 1px ${card.color}40` }}
    >
      {half(false)}
      <div className="h-px w-full" style={{ background: `${card.color}33` }} />
      {half(true)}
    </div>
  );
}

export function CardFace({ card, size }: { card: ParsedCard; size: SizeKey }) {
  const s = SCALE[size];
  const isCourt = COURT.has(card.rank);
  const isAce = card.rank === "A";
  const pips = !isCourt && !isAce ? PIPS[card.rank] : null;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[inherit]"
      style={{ color: card.color }}
    >
      {/* suit-tinted radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-60"
        style={{ background: `radial-gradient(75% 60% at 50% 45%, ${card.color}22, transparent 70%)` }}
      />

      {/* top-left rank+suit */}
      <div className={`absolute left-0 top-0 z-10 ${s.pad}`}>
        <Corner rank={card.rank} glyph={card.glyph} cls={s.corner} glyphCls={s.cornerGlyph} />
      </div>

      {/* centerpiece */}
      {pips ? (
        // Number cards: authentic absolute pip positions, lower half rotated.
        <div className="absolute inset-0 z-[5]">
          {pips.map(([col, y], i) => (
            <span
              key={i}
              className={`${s.pip} absolute leading-none`}
              style={{
                left: `${COL_X[col]}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%)${y > 50 ? " rotate(180deg)" : ""}`,
              }}
            >
              {card.glyph}
            </span>
          ))}
        </div>
      ) : isAce ? (
        // Ace: one large ornamental center pip.
        <div className="absolute inset-0 z-[5] flex items-center justify-center">
          <span
            className={`${s.ace} leading-none`}
            style={{ filter: `drop-shadow(0 0 14px ${card.color}88)` }}
          >
            {card.glyph}
          </span>
        </div>
      ) : (
        // Court: framed, vertically mirrored monogram.
        <div className={`absolute inset-0 z-[5] flex ${s.pad}`}>
          <div className={`flex-1 ${size === "sm" ? "mx-1.5 my-3" : size === "md" ? "mx-3 my-5" : "mx-4 my-7"}`}>
            <CourtFace card={card} s={s} />
          </div>
        </div>
      )}

      {/* bottom-right rank+suit (mirrored) */}
      <div className={`absolute bottom-0 right-0 z-10 ${s.pad}`}>
        <Corner rank={card.rank} glyph={card.glyph} cls={s.corner} glyphCls={s.cornerGlyph} rotated />
      </div>

      {/* foil sheen — full sweep for face cards, edge sheen for numbers */}
      <FoilSheen variant={isCourt || isAce ? "full" : "border"} />
    </div>
  );
}
