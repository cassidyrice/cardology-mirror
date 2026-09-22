import Link from "next/link";

import { ONE_QUESTION_TURNAROUND } from "@/lib/deep-dive";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
  VIDEO_PATH,
} from "@/lib/site";
import {
  BIRTH_CARD_CALCULATOR_LABEL,
  BIRTH_CARD_CALCULATOR_PATH,
  MONEY_PATHS,
  moneyPathLinkClass,
  ONE_QUESTION_NAV,
  type MoneyPath,
} from "@/lib/site-nav";
import { BrandLogo } from "./BrandLogo";

const FREE_TOOLS = [
  { label: "All 52 Cards", href: "/birth-card" },
  { label: "Compatibility calculator", href: "/birth-card-compatibility-calculator" },
  { label: "52-Day Period Tool", href: "/52-day-period-meaning-tool" },
  { label: "Today's Card", href: "/card-of-the-day" },
  { label: "Birthdays by Date", href: BIRTHDAY_DIRECTORY_PATH, external: true },
  { label: "All Pairings", href: COMPATIBILITY_DIRECTORY_PATH, external: true },
] as const;

const READ = [
  { label: "Blog", href: "/blog" },
  { label: "Videos", href: VIDEO_PATH },
  { label: "Beginners", href: "/cardology-for-beginners" },
  { label: "Cardology vs Tarot", href: "/cardology-vs-tarot" },
  { label: "Karma Cards", href: "/karma-cards" },
  { label: "Spreads", href: "/playing-card-spreads" },
] as const;

const GET = [
  { label: "Free course", href: "/free-course" },
  { label: "My purchases", href: "/my-purchases" },
] as const;

const ABOUT = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Editorial policy", href: "/editorial-policy" },
  { label: "Contact", href: "/contact" },
] as const;

function coreHref(item: MoneyPath): string {
  if (item.id === "reading") return ONE_QUESTION_NAV.href;
  if (item.id === "calculator") return BIRTH_CARD_CALCULATOR_PATH;
  return item.href;
}

function coreLabel(item: MoneyPath): string {
  if (item.id === "calculator") return BIRTH_CARD_CALCULATOR_LABEL;
  if (item.id === "reading") return ONE_QUESTION_NAV.label;
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
    return (
      <a href={href} className="hover:text-brand-ink">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="hover:text-brand-ink">
      {children}
    </Link>
  );
}

export function SiteFooter({ bare = false }: { bare?: boolean }) {
  return (
    <footer
      className={
        bare
          ? "mt-16 border-t border-brand-line pt-10 text-sm leading-relaxed text-brand-ink-soft"
          : "border-t border-brand-line bg-brand-paper text-sm leading-relaxed text-brand-ink-soft"
      }
    >
      <div className={bare ? "" : "mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:px-10"}>
        <p className="mb-10">
          <Link href="/" aria-label={`${SITE_NAME} home`} className="inline-block">
            <BrandLogo compact />
          </Link>
        </p>
        <nav aria-label="Core" className="mb-10">
          <ul className="flex flex-col gap-3 text-base sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            {MONEY_PATHS.map((item) => (
              <li key={item.id} className="flex items-baseline gap-2">
                <Link
                  href={coreHref(item)}
                  data-money-path={item.id}
                  className={moneyPathLinkClass(item.weight)}
                >
                  <strong className="font-semibold">{coreLabel(item)}</strong>
                </Link>
                {item.id === "calculator" ? (
                  <span className="text-xs text-brand-ink-soft">Free</span>
                ) : null}
                {item.id === "reading" ? (
                  <span className="text-xs text-brand-ink-soft">
                    {ONE_QUESTION_TURNAROUND}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="More" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Free tools</p>
            <ul className="space-y-2">
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
            <p className="mb-3 font-serif text-base text-brand-ink">Read</p>
            <ul className="space-y-2">
              {READ.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
              <li>
                <Link href="/explore" className="hover:text-brand-ink">
                  Explore →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Get</p>
            <ul className="space-y-2">
              {GET.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">About</p>
            <ul className="space-y-2">
              {ABOUT.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-line pt-5 text-xs">
          <Link href="/privacy-policy" className="hover:text-brand-ink">
            Privacy
          </Link>
          <Link href="/privacy-policy#privacy-choices" className="hover:text-brand-ink">
            Privacy choices
          </Link>
          <Link href="/terms-of-service" className="hover:text-brand-ink">
            Terms
          </Link>
          <Link href="/refund-policy" className="hover:text-brand-ink">
            Refunds
          </Link>
        </div>
        <p className="mt-4 max-w-[38em] text-xs leading-relaxed">
          Playing cards, not tarot. It&rsquo;s a mirror, not a forecast.
        </p>
      </div>
    </footer>
  );
}
