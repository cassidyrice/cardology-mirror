import Link from "next/link";

/**
 * Everything free, as one giant word and filled bars that open in place
 * (docs/design/DIRECTION.md §5). Every link from the old "Follow the itch" and
 * "From the journal" sections lives here.
 */
const BARS = [
  {
    id: "library",
    name: "All 52 birth cards",
    open: true,
    lead: "Every card, its suit, its rank, its shadow, and the exact birth dates it belongs to.",
    links: [{ href: "/birth-card", label: "Look at all 52 birth cards", internal: true }],
  },
  {
    id: "compare",
    name: "Compare your card with theirs",
    lead: "Two birthdays in. Where the two cards meet, and where they keep snagging.",
    links: [{ href: "/birth-card-compatibility-calculator", label: "Compare two cards", internal: true }],
  },
  {
    id: "period",
    name: "Your 52-day period",
    lead: "Your birthday year runs in chapters, Mercury through Neptune. You are in one right now.",
    links: [
      { href: "/52-day-period-meaning-tool", label: "Find your current period", internal: true },
      { href: "/blog/52-day-periods-in-cardology", label: "How your 52-day chapters work", internal: true },
    ],
  },
  {
    id: "today",
    name: "Today's card",
    lead: "Every date on the calendar has a card. Nobody drew it. It was already there.",
    links: [{ href: "/card-of-the-day", label: "Read today's card", internal: true }],
  },
  {
    id: "birthdays",
    name: "Birthdays by date",
    lead: "All 366 dates, one card each. Pick a birthday and pretend you only looked up your own.",
    links: [{ href: "/born-on/", label: "Browse birthdays by date", internal: false }],
  },
  {
    id: "articles",
    name: "Three articles to start",
    lead: "Read a little. Then put the phone down and catch it happening in your own life.",
    links: [
      { href: "/blog/how-to-read-birth-card-meaning", label: "How to read your Birth Card", note: "Its themes, written as questions. Answer them honestly, for once.", internal: true },
      { href: "/blog/birth-card-vs-ruling-card-how-to-read-both", label: "Birth Card or Ruling Card?", note: "How to read the two together without spiraling.", internal: true },
      { href: "/blog", label: "Browse every article", internal: true },
    ],
  },
  {
    id: "foundations",
    name: "How Cardology actually works",
    lead: "The basics, the method, and where the arithmetic stops and the interpretation starts.",
    links: [
      { href: "/cardology-for-beginners", label: "Learn how Cardology works", internal: true },
      { href: "/methodology", label: "Read the methodology", internal: true },
    ],
  },
] as const;

export function FreeBars() {
  return (
    <>
      <h2 id="home-free-title" className="free-word" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
        free
      </h2>
      <p className="free-lead" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
        One card. One connection. Or the basics. Most of it is free, so stop hovering.
      </p>
      <div className="free-bars" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
        {BARS.map((bar) => (
          <details key={bar.id} className="free-bar" open={"open" in bar && bar.open ? true : undefined}>
            <summary className="free-bar-name">
              <span>{bar.name}</span>
              <span className="free-bar-plus" aria-hidden="true">+</span>
            </summary>
            <div className="free-bar-panel">
              <p>{bar.lead}</p>
              <ul>
                {bar.links.map((link) => (
                  <li key={link.href}>
                    {link.internal ? (
                      <Link href={link.href} className="editorial-link">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="editorial-link">{link.label}</a>
                    )}
                    {"note" in link && link.note ? <span className="free-bar-note"> {link.note}</span> : null}
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
