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
  return (
    <span className="deck-face">
      <img
        src={`/share-cards/faces/${card.slug}.png`}
        alt=""
        width={1000}
        height={1500}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function DeckMatrix() {
  const groups = cardsBySuit();
  return (
    <section aria-labelledby="deck-matrix-heading" className="card-section">
      <h2 id="deck-matrix-heading" className="card-h2">
        The whole deck on one screen
      </h2>
      <p className="prose-reading mb-5 max-w-2xl">
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
                className="deck-rank"
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
              <span className="deck-suit" style={{ color: SUIT_COLOR_PAPER[g.suit] }} aria-hidden>
                {g.suit.charAt(0).toUpperCase()}
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
