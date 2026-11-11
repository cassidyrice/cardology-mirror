import Link from "next/link";

/**
 * Reference library tucked cleanly under closed disclosures on `/`, with
 * quiet signaling microcopy so the page keeps generous open space while
 * preserving 100% SSR crawlable links to every hub.
 */
const BARS = [
  {
    id: "library",
    name: "All 52 birth cards",
    meta: "52 profiles",
    lead: "Every card, its suit, its rank, its shadow, and the exact birth dates it belongs to.",
    links: [{ href: "/birth-card", label: "Look at all 52 birth cards" }],
  },
  {
    id: "compare",
    name: "Compatibility matrix & calculator",
    meta: "1,378 pairings",
    lead: "Two birthdays in. Where the two cards meet, and where they keep snagging.",
    links: [
      { href: "/birth-card-compatibility-calculator", label: "Compare two cards" },
      { href: "/compatibility/", label: "Browse all 1,378 compatibility pairings" },
    ],
  },
  {
    id: "period",
    name: "Your year & 52-day timing periods",
    meta: "7 planetary chapters",
    lead: "Your birthday year runs in chapters, Mercury through Neptune. You are in one right now.",
    links: [
      { href: "/your-year", label: "Open your annual timing spread" },
      { href: "/52-day-period-meaning-tool", label: "Find your current period" },
      { href: "/blog/52-day-periods-in-cardology", label: "How your 52-day chapters work" },
    ],
  },
  {
    id: "today",
    name: "Today's calendar card",
    meta: "Updated daily",
    lead: "Every date on the calendar has a card. Nobody drew it. It was already there.",
    links: [{ href: "/card-of-the-day", label: "Read today's card" }],
  },
  {
    id: "birthdays",
    name: "Birthdays by date",
    meta: "366 dates",
    lead: "All 366 dates, one card each. Pick a birthday and pretend you only looked up your own.",
    links: [{ href: "/born-on/", label: "Browse birthdays by date" }],
  },
  {
    id: "articles",
    name: "Essays & public-figure profiles",
    meta: "Guides",
    lead: "Read a little. Then put the phone down and catch it happening in your own life.",
    links: [
      {
        href: "/blog/how-to-read-birth-card-meaning",
        label: "How to read your Birth Card",
        note: "Its themes, written as questions. Answer them honestly, for once.",
      },
      {
        href: "/blog/birth-card-vs-ruling-card-how-to-read-both",
        label: "Birth Card or Ruling Card?",
        note: "How to read the two together without spiraling.",
      },
      { href: "/blog", label: "Browse every article" },
    ],
  },
  {
    id: "foundations",
    name: "How Cardology actually works",
    meta: "Method & lineage",
    lead: "The basics, the method, and where the arithmetic stops and the interpretation starts.",
    links: [
      { href: "/cardology-for-beginners", label: "Learn how Cardology works" },
      { href: "/methodology", label: "Read the methodology" },
    ],
  },
] as const;

export function FreeBars() {
  return (
    <>
      <p className="free-eyebrow" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
        The Reference Library · Free
      </p>
      <h2 id="home-free-title" className="free-heading" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
        Everything in the deck, tucked neatly out of your way.
      </h2>
      <p className="free-lead" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
        52 card meanings · 366 calendar birthdays · 1,378 two-card pairings · free timing tools. Open whichever drawer you want, or jump anywhere from <strong>The Library</strong> menu at the top.
      </p>
      <div className="free-bars" data-rise style={{ "--rise-i": 3 } as React.CSSProperties}>
        {BARS.map((bar) => (
          <details key={bar.id} className="free-bar">
            <summary className="free-bar-name">
              <span className="free-bar-title-group">
                <span>{bar.name}</span>
                <small className="free-bar-meta">{bar.meta}</small>
              </span>
              <span className="free-bar-plus" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="free-bar-panel">
              <p>{bar.lead}</p>
              <ul>
                {bar.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="editorial-link">
                      {link.label}
                    </Link>
                    {"note" in link && link.note ? (
                      <span className="free-bar-note"> {link.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
