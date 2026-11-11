import Link from "next/link";

import { READINGS_NAV } from "@/lib/readings-nav";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  VIDEO_PATH,
} from "@/lib/site";
import {
  BIRTH_CARD_CALCULATOR_LABEL,
  BIRTH_CARD_CALCULATOR_PATH,
  MONEY_PATHS,
  moneyPathLinkClass,
  type MoneyPath,
} from "@/lib/site-nav";

const FREE_TOOLS = [
  { label: "All 52 cards", href: "/birth-card" },
  { label: "Your year timing spread", href: "/your-year" },
  { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
  { label: "52-day period tool", href: "/52-day-period-meaning-tool" },
  { label: "Today's card", href: "/card-of-the-day" },
  { label: "Birthdays by date", href: BIRTHDAY_DIRECTORY_PATH },
  { label: "All pairings", href: COMPATIBILITY_DIRECTORY_PATH },
] as const;

const READ = [
  { label: "Blog", href: "/blog" },
  { label: "Videos", href: VIDEO_PATH },
  { label: "Beginners", href: "/cardology-for-beginners" },
  { label: "Cardology vs tarot", href: "/cardology-vs-tarot" },
  { label: "Karma cards", href: "/karma-cards" },
  { label: "Spreads", href: "/playing-card-spreads" },
] as const;

const ABOUT = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Editorial policy", href: "/editorial-policy" },
  { label: "Contact", href: "/contact" },
] as const;

function coreHref(item: MoneyPath): string {
  if (item.id === "reading") return "/#readings";
  if (item.id === "calculator") return BIRTH_CARD_CALCULATOR_PATH;
  return item.href;
}

function coreLabel(item: MoneyPath): string {
  if (item.id === "calculator") return BIRTH_CARD_CALCULATOR_LABEL;
  if (item.id === "reading") return "Personal readings";
  return item.label;
}

/**
 * Sleek open-space colophon: primary money paths stay one click away, while the
 * full 4-column reference library is tucked neatly under a semantic <details>
 * dropdown with clear signaling microcopy (preserving 100% SSR crawlability).
 */
export function SiteFooter({ bare = false }: { bare?: boolean }) {
  return (
    <footer className={bare ? "site-footer is-bare" : "site-footer"}>
      <div className="site-footer-inner">
        <Link href="/" aria-label="card blueprints home" className="footer-mast">
          card blueprints
        </Link>
        <nav aria-label="Core">
          <ul className="footer-core">
            {MONEY_PATHS.map((item) => (
              <li key={item.id}>
                <Link
                  href={coreHref(item)}
                  data-money-path={item.id}
                  className={moneyPathLinkClass(item.weight)}
                >
                  {coreLabel(item)}
                </Link>
                {item.id === "calculator" ? <small>Free</small> : null}
                {item.id === "reading" ? <small>$99 · up to 3 questions</small> : null}
              </li>
            ))}
          </ul>
        </nav>

        <details className="footer-library-disclosure">
          <summary className="footer-library-summary">
            <span>
              Browse the full reference library
              <small className="footer-library-microcopy">
                52 card meanings · 366 birthdays · 1,378 pairings · tools &amp; guides
              </small>
            </span>
            <span className="footer-library-caret" aria-hidden="true">▾</span>
          </summary>
          <nav aria-label="More" className="footer-groups">
            <div>
              <p className="footer-group-name">Free tools &amp; library</p>
              <ul>
                {FREE_TOOLS.map((item) => (
                  <li key={item.href}>
                    {item.href.endsWith("/") ? (
                      <a href={item.href}>{item.label}</a>
                    ) : (
                      <Link href={item.href}>{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="footer-group-name">Read</p>
              <ul>
                {READ.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/explore">Explore</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="footer-group-name">Personal readings</p>
              <ul>
                {READINGS_NAV.map((reading) => (
                  <li key={reading.id}>
                    <a
                      href={reading.href}
                      data-open-question-track={reading.id}
                      data-placement="footer-readings"
                    >
                      {reading.title}, {reading.price}
                    </a>
                  </li>
                ))}
                <li>
                  <Link href="/my-purchases" rel="nofollow">
                    My purchases
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="footer-group-name">About</p>
              <ul>
                {ABOUT.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </details>

        <div className="footer-quiet">
          <p>Cards are coordinates. You choose the meaning.</p>
          <div className="footer-quiet-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/privacy-policy#privacy-choices">Privacy choices</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/refund-policy">Refunds</Link>
          </div>
          <p className="footer-quiet-right">
            Playing-card math, traditional interpretations, and room for you to disagree.
          </p>
        </div>
      </div>
    </footer>
  );
}
