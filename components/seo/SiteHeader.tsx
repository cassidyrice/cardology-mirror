import Link from "next/link";

import { SITE_NAME } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";
import { HeaderDeepDiveCta } from "./HeaderDeepDiveCta";

// One header for every marketing/editorial surface. Four destinations, no
// more: Calculator, Compatibility, Card Meanings, Learn. Paid Deep Dive
// checkout lives in HeaderDeepDiveCta, not a calculator link.
const NAV_LINKS = [
  { label: "Calculator", href: "/birth-card-calculator" },
  { label: "Compatibility", href: "/birth-card-compatibility-calculator" },
  { label: "Card Meanings", href: "/birth-card" },
  { label: "Learn", href: "/what-is-cardology" },
];

export function SiteHeader() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="relative z-10 border-b border-brand-line bg-brand-paper">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="text-brand-ink" aria-label={`${SITE_NAME} home`}>
            <BrandLogo />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-brand-ink-soft lg:flex lg:gap-6"
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
          <details className="relative ml-auto lg:hidden">
            <summary className="paper-button small-button cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Mobile primary"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 border border-brand-line bg-brand-ivory p-4 shadow-[0_8px_30px_rgba(20,17,13,0.12)]"
            >
              <ul className="divide-y divide-brand-line text-sm text-brand-ink">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="block min-h-11 py-3">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 w-full">
                <HeaderDeepDiveCta />
              </div>
            </nav>
          </details>
          {/* Wait until lg to show the full desktop row so destinations
              and paid CTA retain their natural widths. */}
          <div className="hidden lg:block">
            <HeaderDeepDiveCta />
          </div>
        </div>
      </header>
    </>
  );
}
