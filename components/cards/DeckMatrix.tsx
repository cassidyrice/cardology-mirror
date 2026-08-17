import Link from "next/link";
import { cardsBySuit, type CardSeo } from "@/lib/seo-cards";
import { SUIT_COLOR_PAPER } from "@/lib/cards";
import { TableScroll } from "@/components/seo/TableScroll";

// The 52-card system rendered as one visual object: suit rows x rank columns.
// Pure server component (no client JS) — mini faces are presentational JSX.
// Additive navigation layer; the detailed suit sections below carry the prose.

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const RANK_INDEX = new Map<string, number>(RANKS.map((r, i) => [r, i]));

function byRank(a: CardSeo, b: CardSeo): number {
  return (RANK_INDEX.get(a.rank) ?? 99) - (RANK_INDEX.get(b.rank) ?? 99);
}

function MiniFace({ card }: { card: CardSeo }) {
  const color = SUIT_COLOR_PAPER[card.suit];
  return (
    <span
      className="relative block aspect-[2.5/3.5] overflow-hidden rounded-[4px] border border-brand-line bg-brand-ivory transition-all duration-200 group-hover:-translate-y-1 group-hover:border-gold/70 group-hover:shadow-[0_8px_18px_-10px_rgba(20,17,13,0.45)]"
      style={{ color }}
    >
      <span className="absolute left-[3px] top-[2px] flex flex-col items-center leading-none">
        <span className="font-serif text-[9px] font-semibold tracking-tight">{card.rank}</span>
        <span className="text-[7px] leading-none">{card.glyph}</span>
      </span>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center text-sm leading-none">
        {card.glyph}
      </span>
      <span
        aria-hidden
        className="absolute bottom-[2px] right-[3px] flex rotate-180 flex-col items-center leading-none"
      >
        <span className="font-serif text-[9px] font-semibold tracking-tight">{card.rank}</span>
        <span className="text-[7px] leading-none">{card.glyph}</span>
      </span>
    </span>
  );
}

export function DeckMatrix() {
  const groups = cardsBySuit();
  return (
    <section aria-labelledby="deck-matrix-heading" className="mb-12">
      <h2 id="deck-matrix-heading" className="eyebrow mb-3 text-gold">
        The whole deck on one screen
      </h2>
      <p className="prose-reading mb-5 max-w-2xl text-mist">
        Rows are suits, columns are ranks. Every birthday resolves to one
        intersection. (December 31 stands apart as the Joker.)
      </p>
      <TableScroll className="pb-2" label="52-card deck by suit and rank">
        <div className="min-w-[640px]">
          <div className="mb-1 grid grid-cols-[1.5rem_repeat(13,minmax(0,1fr))] items-end gap-1.5">
            <span />
            {RANKS.map((r) => (
              <span
                key={r}
                aria-hidden
                className="text-center text-[9px] font-semibold uppercase tracking-wider text-faint"
              >
                {r}
              </span>
            ))}
          </div>
          {groups.map((g) => (
            <div
              key={g.suit}
              className="mb-1.5 grid grid-cols-[1.5rem_repeat(13,minmax(0,1fr))] items-center gap-1.5"
            >
              <span
                className="text-center text-sm leading-none"
                style={{ color: SUIT_COLOR_PAPER[g.suit] }}
                aria-hidden
              >
                {g.cards[0]?.glyph}
              </span>
              {g.cards.slice().sort(byRank).map((c) => (
                <Link
                  key={c.slug}
                  href={`/birth-card/${c.slug}`}
                  title={c.title ? `${c.label} — ${c.title}` : c.label}
                  aria-label={`${c.label} birth card meaning`}
                  className="group block"
                >
                  <MiniFace card={c} />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </TableScroll>
    </section>
  );
}
