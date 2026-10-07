/** Real engine output for a made-up birthday (March 14, 1988), read on 2026-10-07.
 *  Pinned against lib/year-blueprint.ts by scripts/year-ahead-offer.test.ts. */
export const YEAR_AHEAD_SAMPLE = {
  birthdate: "1988-03-14",
  targetDate: "2026-10-07",
  birthCard: "Nine of Diamonds",
  yearRange: "Mar 14, 2026 to Mar 13, 2027",
  longRange: "Nine of Hearts",
  yearInCycle: 4,
  pluto: "Three of Clubs",
  result: "Four of Clubs",
  periods: [
    { planet: "Mercury", card: "Queen of Diamonds", range: "Mar 14 – May 4" },
    { planet: "Venus", card: "Seven of Diamonds", range: "May 5 – Jun 25" },
    { planet: "Mars", card: "Queen of Hearts", range: "Jun 26 – Aug 16" },
    { planet: "Jupiter", card: "Jack of Hearts", range: "Aug 17 – Oct 7" },
    { planet: "Saturn", card: "Seven of Clubs", range: "Oct 8 – Nov 28" },
    { planet: "Uranus", card: "King of Diamonds", range: "Nov 29 – Jan 19" },
    { planet: "Neptune", card: "Two of Hearts", range: "Jan 20 – Mar 13" },
  ],
} as const;
