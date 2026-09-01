// Sourced history of the 52-card birthday system. Every URL was fetched and
// checked on 2026-09-01. Keep the "(self-reported)" tags: they mark claims
// that rest on one author's own word and nothing else.
export type TimelineEntry = {
  year: string;
  what: string;
  source: string;
  sourceLabel: string;
};

export const CARDOLOGY_TIMELINE: TimelineEntry[] = [
  {
    year: "1762",
    what: "Earliest known telling of the “deck of cards as almanac” story (Mary Bacon’s commonplace book), later printed as the Perpetual Almanack chapbooks: 52 cards, 4 suits, 13 ranks, 365 days. The arithmetic was in print 130 years before any Cardology book.",
    source: "https://campuspress.yale.edu/lewiswalpole/the-perpetual-almanack-or-gentleman-soldiers-prayer-book/",
    sourceLabel: "Yale, Lewis Walpole Library",
  },
  {
    year: "1864",
    what: "Olney H. Richmond later wrote that he was initiated in Nashville this year (self-reported; his own books are the only source).",
    source: "https://archive.org/details/1893-richmond-religion-of-the-stars",
    sourceLabel: "Religion of the Stars, 1893",
  },
  {
    year: "1889",
    what: "Richmond opens what he calls the first modern temple of the Order of the Magi in Grand Rapids, Michigan (self-reported, reprinted from his own newspaper interviews).",
    source: "https://archive.org/details/1893-richmond-religion-of-the-stars",
    sourceLabel: "same source",
  },
  {
    year: "1892",
    what: "Temple Lectures of the Order of the Magi printed in Chicago (270 pages); reissued in 1893 as Religion of the Stars.",
    source: "https://books.google.com/books/about/Temple_Lectures_of_the_Order_of_the_Magi.html?id=XDxVAAAAMAAJ",
    sourceLabel: "Google Books",
  },
  {
    year: "1893",
    what: "The Mystic Test Book, or the Magic of the Cards (Temple Publishing, Chicago; copyright entered 23 January 1893). The first full statement of the 52-card solar calendar: 52 cards for 52 weeks, 13 ranks for the Sun and the 12 signs, 4 suits for the seasons, spot values summing to 364 plus the Joker.",
    source: "https://www.loc.gov/item/11014327/",
    sourceLabel: "Library of Congress, BF1878 .R5",
  },
  {
    year: "1896",
    what: "A Supplement adds the grand spreads, quadration, and the hour and minute cards.",
    source: "https://archive.org/details/mystictestbook00rich",
    sourceLabel: "archive.org",
  },
  {
    year: "1920",
    what: "Richmond dies on 30 March. Later editions of the Mystic Test Book appear in 1919 and 1946.",
    source: "https://archive.org/details/mystictestbookor00rich",
    sourceLabel: "1919 edition, archive.org",
  },
  {
    year: "1947",
    what: "Edith L. Randall and Florence Evylinn Campbell publish Sacred Symbols of the Ancients (Tora Inc., Hollywood): the birthday chart and Life Spread layout most modern sites still use. The book credits Richmond’s text and names a surviving student of the Order as Randall’s teacher.",
    source: "https://archive.org/details/sacred-symbols-of-the-ancients",
    sourceLabel: "archive.org",
  },
  {
    year: "1978",
    what: "Arne Lein publishes What’s Your Card? (Meta-Card, 521 pages), calling the practice “metasymbology”.",
    source: "https://archive.org/details/lein-whats-your-card",
    sourceLabel: "archive.org",
  },
  {
    year: "1992",
    what: "Robert Lee Camp publishes The Cards of Your Destiny (Seven Thunders). Camp reports finding the system in 1988 (self-reported).",
    source: "https://openlibrary.org/search?author=camp&title=destiny",
    sourceLabel: "Open Library",
  },
  {
    year: "1997",
    what: "Camp’s trade editions Love Cards and Destiny Cards (Sourcebooks) put the name “Destiny Cards” into bookstores.",
    source: "https://books.google.com/books/about/Love_Cards.html?id=xpSQYpyCwSAC",
    sourceLabel: "Google Books",
  },
  {
    year: "2014",
    what: "The International Association of Cardology is founded as an unincorporated association.",
    source: "https://cardology.com/intl-assoc-of-cardology",
    sourceLabel: "cardology.com",
  },
  {
    year: "2019",
    what: "CARDOLOGY is registered as a US word mark (Reg. 5703102, filed 9 August 2018) for playing cards and merchandise; owner Scene the Light Entertainment, LLC. The mark covers goods, not the practice or the word in writing.",
    source: "https://www.trademarkelite.com/trademark/trademark-detail/88072857/CARDOLOGY",
    sourceLabel: "USPTO record",
  },
];
