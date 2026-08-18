import Link from "next/link";

import { SITE_NAME } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";

// Season is the public front door. The complete SEO library remains in the
// footer, so the header can stay focused without orphaning ranked routes.
const NAV_LINKS = [
  { label: "Your Season", href: "/season" },
  { label: "Calculator", href: "/birth-card-calculator" },
  { label: "The Cards", href: "/birth-card" },
  { label: "The System", href: "/what-is-cardology" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="relative z-10 border-b border-brand-line bg-[rgba(7,6,14,0.9)] backdrop-blur-xl">
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
                className="whitespace-nowrap transition duration-200 hover:text-brand-ink"
              >
                {link.label}
              </Link>
              ))}
          </nav>
          <details className="relative ml-auto lg:hidden">
            <summary className="season-outline-button cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Mobile primary"
              className="glass absolute right-0 top-[calc(100%+0.5rem)] z-30 w-64 rounded-2xl p-4 shadow-[0_18px_50px_rgba(7,6,14,0.55)]"
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
              <Link href="/season" className="season-primary-button mt-4 w-full">
                Reveal My Cards
              </Link>
            </nav>
          </details>
          {/* Wait until lg to show the full desktop row so its five destinations
              and birthday CTA retain their natural widths. */}
          <div className="hidden lg:block">
            <Link href="/season" className="season-primary-button shrink-0 whitespace-nowrap">
              Reveal My Cards
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
