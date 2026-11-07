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
  { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
  { label: "52-day period tool", href: "/52-day-period-meaning-tool" },
  { label: "Today's card", href: "/card-of-the-day" },
  { label: "Birthdays by date", href: BIRTHDAY_DIRECTORY_PATH, external: true },
  { label: "All pairings", href: COMPATIBILITY_DIRECTORY_PATH, external: true },
] as const;

const READ = [
  { label: "Blog", href: "/blog" },
  { label: "Videos", href: VIDEO_PATH },
  { label: "Beginners", href: "/cardology-for-beginners" },
  { label: "Cardology vs tarot", href: "/cardology-vs-tarot" },
  { label: "Karma cards", href: "/karma-cards" },
  { label: "Spreads", href: "/playing-card-spreads" },
] as const;

const GET = [
  { label: "My purchases", href: "/my-purchases" },
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

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return <a href={href}>{children}</a>;
  }
  return <Link href={href}>{children}</Link>;
}

/**
 * The footer is a designed close (docs/design/DIRECTION.md §7): the name
 * returns at full width, then the links the site depends on, then one quiet
 * line. `bare` keeps the same parts on the page's paper inside a reading shell.
 */
export function SiteFooter({ bare = false }: { bare?: boolean }) {
  return (
    <footer className={bare ? "site-footer is-bare" : "site-footer"}>
      <div className="site-footer-inner">
        <Link href="/" aria-label="Card blueprint home" className="footer-mast">
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
                {item.id === "reading" ? <small>From $13, delivered by email</small> : null}
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="More" className="footer-groups">
          <div>
            <p className="footer-group-name">Free tools</p>
            <ul>
              {FREE_TOOLS.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} external={"external" in item && item.external}>
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer-group-name">Read</p>
            <ul>
              {READ.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
              <li>
                <Link href="/explore">Explore</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="footer-group-name">Get</p>
            <ul>
              {READINGS_NAV.map((reading) => (
                <li key={reading.id}>
                  <FooterLink href={reading.href}>{reading.title}, {reading.price}</FooterLink>
                </li>
              ))}
              {GET.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer-group-name">About</p>
            <ul>
              {ABOUT.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="footer-quiet">
          <p>Cards are coordinates. You choose the meaning.</p>
          <div className="footer-quiet-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/privacy-policy#privacy-choices">Privacy choices</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/refund-policy">Refunds</Link>
          </div>
          <p className="footer-quiet-right">Playing-card math, traditional interpretations, and room for you to disagree.</p>
        </div>
      </div>
    </footer>
  );
}
