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

// Lives outside the birth-card Page module. Next.js rejects extra named
// exports from app/**/page.tsx, and the dwell-wave test imports this helper.
export function endOfPageReads(card: CardSeo, siblings: CardSeo[]): EndOfPageRead[] {
  const sameSuit = siblings.filter((c) => c.suit === card.suit && c.slug !== card.slug).slice(0, 2);
  return [
    ...sameSuit.map((c) => ({
      href: `/birth-card/${c.slug}`,
      label: `${c.label} meaning`,
      note: `same ${suitWord(card).toLowerCase()} suit`,
      external: false,
    })),
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
