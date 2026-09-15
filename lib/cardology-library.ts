// The cardology bibliography: every book and deck we can point at a real
// catalogue record. Each `source` was resolved against Library of Congress,
// archive.org, Google Books or the Open Library search API on 2026-09-15 —
// nothing here is listed from memory. Entries whose only authority is the
// author's own word carry "(self-reported)", the same rule the timeline uses
// in lib/cardology-timeline.ts. If a title cannot be verified, it stays off
// this list rather than getting a guessed year or publisher.
export type LibraryEntry = {
  title: string;
  author: string;
  year: string;
  publisher?: string;
  /** What the book actually contains — not a blurb. */
  covers: string;
  source: string;
  sourceLabel: string;
  /** Set for decks so the page can group them. */
  kind: "book" | "deck" | "ephemera";
};

export const CARDOLOGY_LIBRARY: LibraryEntry[] = [
  {
    title: "The Perpetual Almanack, or Gentleman Soldier's Prayer Book",
    author: "Anonymous chapbook; the tale is recorded earlier in Mary Bacon's commonplace book",
    year: "1762",
    covers:
      "The deck-as-almanac story in its earliest known telling: 52 cards for 52 weeks, 4 suits for the seasons, 13 ranks, 365 spots. No birthday map and no readings — but the arithmetic every later book builds on, in print 130 years before the first Cardology text.",
    source:
      "https://campuspress.yale.edu/lewiswalpole/the-perpetual-almanack-or-gentleman-soldiers-prayer-book/",
    sourceLabel: "Yale, Lewis Walpole Library",
    kind: "ephemera",
  },
  {
    title: "Temple Lectures of the Order of the Magi",
    author: "Olney H. Richmond",
    year: "1892",
    publisher: "Temple Publishing, Chicago",
    covers:
      "270 pages of lectures on the Order of the Magi, reissued in 1893 as Religion of the Stars. Context for the Mystic Test Book rather than a card manual: the cosmology, the order's founding account (self-reported), and the claim of a Nashville initiation in 1864.",
    source: "https://archive.org/details/1893-richmond-religion-of-the-stars",
    sourceLabel: "archive.org",
    kind: "book",
  },
  {
    title: "The Mystic Test Book, or the Magic of the Cards",
    author: "Olney H. Richmond",
    year: "1893",
    publisher: "Temple Publishing, Chicago",
    covers:
      "The first full statement of the 52-card solar calendar: 52 cards for 52 weeks, 13 ranks for the Sun and the twelve signs, 4 suits for the seasons, spot values summing to 364 plus the Joker. Everything the modern systems do to a birthday starts here. Copyright entered 23 January 1893; an 1896 Supplement adds the grand spreads, quadration, and the hour and minute cards. Later editions in 1919 and 1946.",
    source: "https://www.loc.gov/item/11014327/",
    sourceLabel: "Library of Congress, BF1878 .R5",
    kind: "book",
  },
  {
    title: "Sacred Symbols of the Ancients",
    author: "Edith L. Randall and Florence Evylinn Campbell",
    year: "1947",
    publisher: "Tora Inc., Hollywood",
    covers:
      "The birthday chart and the Life Spread layout that most cardology sites still reproduce, including this one's ancestor charts. Credits Richmond's text and names a surviving student of the Order as Randall's teacher. This is the book that turned the calendar into a per-birthday lookup.",
    source: "https://archive.org/details/sacred-symbols-of-the-ancients",
    sourceLabel: "archive.org",
    kind: "book",
  },
  {
    title: "What's Your Card?",
    author: "Arne Lein",
    year: "1978",
    publisher: "Meta-Card",
    covers:
      "521 pages that rename the practice \"metasymbology\" and work through each birth card at length. The bridge between the 1947 chart and the 1990s trade paperbacks, and the source most often paraphrased without credit.",
    source: "https://openlibrary.org/works/OL7091791W",
    sourceLabel: "Open Library",
    kind: "book",
  },
  {
    title: "The Cards of Your Destiny",
    author: "Robert Lee Camp",
    year: "1992",
    publisher: "Seven Thunders",
    covers:
      "The yearly-spread system — planetary periods, displacement, karma cards — that made the practice popular under the name Destiny Cards. Camp reports finding the system in 1988 (self-reported). Reissued 2014.",
    source: "https://openlibrary.org/works/OL2622482W",
    sourceLabel: "Open Library",
    kind: "book",
  },
  {
    title: "Love Cards",
    author: "Robert Lee Camp",
    year: "1997",
    publisher: "Sourcebooks",
    covers:
      "Two-person compatibility worked card by card: connection types, mutual and one-way readings, and the relationship index most compatibility calculators still mirror. Reissued 2004.",
    source: "https://books.google.com/books/about/Love_Cards.html?id=xpSQYpyCwSAC",
    sourceLabel: "Google Books",
    kind: "book",
  },
  {
    title: "Destiny Cards",
    author: "Robert Lee Camp",
    year: "1997",
    publisher: "Sourcebooks",
    covers:
      "The trade edition that put \"Destiny Cards\" into bookstores and, effectively, named the modern practice for a generation of readers.",
    source: "https://openlibrary.org/works/OL2622483W",
    sourceLabel: "Open Library",
    kind: "book",
  },
  {
    title: "Cards of Destiny",
    author: "Sharon Jeffers",
    year: "2006",
    covers:
      "A later treatment of the birthday-card system with its own spread and card-meaning material; earlier annual edition in 2001.",
    source: "https://openlibrary.org/works/OL5838206W",
    sourceLabel: "Open Library",
    kind: "book",
  },
  {
    title: "The Playing Card Oracles",
    author: "Ana Cortez",
    year: "2002",
    covers:
      "Adjacent, not cardology: a 52-card divination deck and guidebook read by shuffled draw rather than by birthday. Listed because it is the title most often confused with birth-card work in bookshops. Deck edition 2006.",
    source: "https://openlibrary.org/works/OL8921479W",
    sourceLabel: "Open Library",
    kind: "deck",
  },
  {
    title: "Fortune Telling with Playing Cards",
    author: "Jonathan Dee",
    year: "2004",
    covers:
      "Adjacent, not cardology: standard cartomancy — meanings for a drawn 52-card deck, with spreads. Useful for seeing exactly where cartomancy and birth-card work part ways. An earlier book of the same title by Sophia appeared in 1996.",
    source: "https://openlibrary.org/works/OL3749396W",
    sourceLabel: "Open Library",
    kind: "book",
  },
];

export const LIBRARY_VERIFIED_ON = "2026-09-15";
