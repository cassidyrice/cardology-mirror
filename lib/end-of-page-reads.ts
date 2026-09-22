import { compatForCard } from "./compat-pairs";
import type { CardSeo } from "./seo-cards";

export type EndOfPageRead = {
  href: string;
  label: string;
  note: string;
  external: boolean;
};

function suitWord(card: CardSeo): string {
  return card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
}

function compatHubHref(card: CardSeo): string {
  return compatForCard(card.slug)?.hub ?? "/compatibility/";
}

// GSC Pages 2026-09-22: the source card's average position is under 8, and the
// target is a same-suit meaning page stuck between 8 and 15. One extra related
// read, same suit only, so the link stays on-topic.
const AHEAD_OF_BAND: Record<string, string> = {
  "king-of-hearts": "5-of-hearts",
  "6-of-diamonds": "8-of-diamonds",
  "8-of-hearts": "queen-of-hearts",
};

function meaningRead(card: CardSeo, linked: CardSeo): EndOfPageRead {
  return {
    href: `/birth-card/${linked.slug}`,
    label: `${linked.label} meaning`,
    note: `same ${suitWord(card).toLowerCase()} suit`,
    external: false,
  };
}

// Lives outside the birth-card Page module. Next.js rejects extra named
// exports from app/**/page.tsx, and the dwell-wave test imports this helper.
export function endOfPageReads(card: CardSeo, siblings: CardSeo[]): EndOfPageRead[] {
  const sameSuit = siblings.filter((c) => c.suit === card.suit && c.slug !== card.slug).slice(0, 2);
  const aheadSlug = AHEAD_OF_BAND[card.slug];
  const ahead = aheadSlug ? siblings.find((c) => c.slug === aheadSlug) : undefined;
  const suitReads = sameSuit.map((c) => meaningRead(card, c));
  if (ahead && !sameSuit.some((c) => c.slug === ahead.slug)) {
    suitReads.push(meaningRead(card, ahead));
  }
  return [
    ...suitReads,
    {
      href: "/planetary-ruling-card",
      label: "Planetary ruling card",
      note: "the second layer on this birth card",
      external: false,
    },
    {
      href: compatHubHref(card),
      label: `${card.label} compatibility`,
      note: "how this card pairs",
      external: true,
    },
    {
      href: "/what-is-cardology",
      label: "What is Cardology",
      note: "the birthday-to-card map",
      external: false,
    },
  ];
}
