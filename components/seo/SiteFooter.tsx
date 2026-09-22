import Link from "next/link";

import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
  VIDEO_PATH,
} from "@/lib/site";
import {
  BIRTH_CARD_CALCULATOR_LABEL,
  BIRTH_CARD_CALCULATOR_PATH,
  ONE_QUESTION_NAV,
  WHAT_IS_CARDOLOGY_LABEL,
  WHAT_IS_CARDOLOGY_PATH,
} from "@/lib/site-nav";
import { BrandLogo } from "./BrandLogo";

const FREE_TOOLS = [
  { label: BIRTH_CARD_CALCULATOR_LABEL, href: BIRTH_CARD_CALCULATOR_PATH },
  { label: "All 52 Cards", href: "/birth-card" },
  { label: "Compatibility", href: "/birth-card-compatibility-calculator" },
  { label: "52-Day Period Tool", href: "/52-day-period-meaning-tool" },
  { label: "Today's Card", href: "/card-of-the-day" },
  { label: "Birthdays by Date", href: BIRTHDAY_DIRECTORY_PATH, external: true },
  { label: "All Pairings", href: COMPATIBILITY_DIRECTORY_PATH, external: true },
] as const;

const READ = [
  { label: "Blog", href: "/blog" },
  { label: "Videos", href: VIDEO_PATH },
  { label: "Beginners", href: "/cardology-for-beginners" },
  { label: WHAT_IS_CARDOLOGY_LABEL, href: WHAT_IS_CARDOLOGY_PATH },
  { label: "Cardology vs Tarot", href: "/cardology-vs-tarot" },
  { label: "Karma Cards", href: "/karma-cards" },
  { label: "Spreads", href: "/playing-card-spreads" },
] as const;

const GET = [
  { label: "My purchases", href: "/my-purchases" },
  { label: ONE_QUESTION_NAV.label, href: ONE_QUESTION_NAV.href },
  { label: "Free course", href: "/free-course" },
] as const;

const ABOUT = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/methodology" },
  { label: "Editorial policy", href: "/editorial-policy" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

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
        <p className="mb-8 text-sm">
          <Link href="/explore" className="editorial-link text-brand-ink-soft">
            Explore →
          </Link>
        </p>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
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
