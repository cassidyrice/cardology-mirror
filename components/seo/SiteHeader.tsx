import Link from "next/link";

import { READER_PHONE_TEL } from "@/lib/offers";
import { READINGS_PATH, SITE_NAME } from "@/lib/site";

// One header for every marketing/editorial surface. Five conceptual
// destinations, no more: Free Call (the compact action), Readings,
// Calculator, Card Meanings, Learn. Long-tail navigation lives in the footer.
const NAV_LINKS = [
  { label: "Readings", href: READINGS_PATH },
  { label: "Calculator", href: "/birth-card-calculator" },
  { label: "Card Meanings", href: "/birth-card" },
  { label: "Learn", href: "/what-is-cardology" },
];

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-brand-line bg-brand-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="brand-mark text-brand-ink" aria-label={`${SITE_NAME} home`}>
          {SITE_NAME}
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-brand-ink-soft md:flex lg:gap-6"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition hover:text-brand-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {/* shrink-0: between md and ~860px the row is tight enough that flex
            compresses this button below its text width, which broke "Free
            Call" onto two lines. */}
        <a href={READER_PHONE_TEL} className="ink-button small-button shrink-0 whitespace-nowrap">
          Free Call
        </a>
      </div>
    </header>
  );
}
