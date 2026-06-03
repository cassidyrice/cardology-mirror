"use client";

import { parseCard, SUIT_DOMAIN } from "@/lib/cards";
import { PlayingCard } from "@/components/PlayingCard";

// Renders the 3 crown cards in a row with card-faithful suit framing only.
export function CrownRow({ crown }: { crown: string[] }) {
  return (
    <div className="flex justify-center gap-4">
      {crown.map((code) => {
        const c = parseCard(code);
        return (
          <PlayingCard
            key={code}
            code={code}
            size="sm"
            subtitle={c?.suit.toUpperCase()}
            title={c?.rank}
          />
        );
      })}
    </div>
  );
}

// One-line, suit-derived framing of where the themes point. No invented meaning
// beyond what the suits literally govern.
export function crownFraming(crown: string[]): string {
  const suits = crown
    .map((c) => parseCard(c)?.suit)
    .filter(Boolean) as (keyof typeof SUIT_DOMAIN)[];
  const domains = Array.from(new Set(suits.map((s) => SUIT_DOMAIN[s].toLowerCase())));
  return `These three keep surfacing as the through-lines of your life — pointing toward ${joinHuman(domains)}.`;
}

function joinHuman(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
