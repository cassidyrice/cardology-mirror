import { GEM_FACETS, type GemSuit } from "./gem-facets";

export type { GemSuit };

const RUBY = ["#f04b63", "#d61a38", "#b30d29", "#7c0719", "#46030d"] as const;
const ONYX = ["#9a9aa3", "#55555e", "#2c2c32", "#17171b", "#050506"] as const;

const SUIT_FROM_GLYPH: Record<string, GemSuit> = {
  "♥": "heart",
  "♦": "diamond",
  "♣": "club",
  "♠": "spade",
};

const SUIT_NAME: Record<GemSuit, string> = {
  heart: "Hearts",
  diamond: "Diamonds",
  club: "Clubs",
  spade: "Spades",
};

/** "8♦" → "diamond". Joker or unknown → null. */
export function gemSuitFromCode(code: string | null | undefined): GemSuit | null {
  if (!code) return null;
  for (const [glyph, suit] of Object.entries(SUIT_FROM_GLYPH)) {
    if (code.includes(glyph)) return suit;
  }
  return null;
}

/**
 * A card suit cut as a gem: rubies for hearts and diamonds, onyx for clubs and
 * spades. Decorative by default; pass `label` when the gem carries meaning on
 * its own (no visible suit name beside it).
 */
export function Gem({
  suit,
  size = 24,
  label,
  className,
}: {
  suit: GemSuit;
  size?: number;
  label?: string;
  className?: string;
}) {
  const palette = suit === "club" || suit === "spade" ? ONYX : RUBY;
  const edge = palette === RUBY ? "rgba(255,190,200,0.55)" : "rgba(220,220,230,0.35)";
  const sparkleX = suit === "club" ? 14 : 0;
  const sparkleY = suit === "club" ? -8 : 0;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className ? `bp-gem ${className}` : "bp-gem"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {GEM_FACETS[suit].map(([points, shade], i) => (
        <polygon
          key={i}
          points={points}
          fill={palette[shade]}
          stroke={edge}
          strokeWidth={0.6}
          strokeLinejoin="round"
        />
      ))}
      {size >= 20 ? (
        <path
          transform={`translate(${sparkleX} ${sparkleY})`}
          d="M30 22 L32 28 L38 30 L32 32 L30 38 L28 32 L22 30 L28 28 Z"
          fill="#ffffff"
          opacity={palette === RUBY ? 0.9 : 0.75}
        />
      ) : null}
    </svg>
  );
}

export function gemSuitName(suit: GemSuit): string {
  return SUIT_NAME[suit];
}
