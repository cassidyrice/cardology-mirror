import Link from "next/link";
import type { ReactNode } from "react";

import {
  READER_PHONE_DISPLAY,
  READER_PHONE_TEL,
  TRIAL_NAME,
  TRIAL_PATH,
} from "@/lib/offers";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { READINGS_PATH, SITE_NAME, VIDEO_PATH } from "@/lib/site";

// Shared content shell for public SEO pages. It borrows the homepage's
// editorial paper/ink visual system while keeping article pages readable.
// The chrome is product-first: readings lead the nav, the header CTA sells,
// and the footer opens with the offer ladder before the free library.
export function SeoShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: { label: string; href: string }[];
}) {
  return (
    <main className="paper-shell landing-oracle relative min-h-dvh overflow-hidden bg-[#f4f0e7] text-[#14110d]">
      <div className="oracle-grid" aria-hidden="true" />
      <div className="oracle-noise" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-[#14110d]/15 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="brand-mark" aria-label="Card Blueprints home">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-4 text-[0.68rem] font-bold uppercase text-[#14110d]/70 lg:flex xl:gap-5 xl:text-[0.72rem]">
          <Link href={READINGS_PATH} className="text-[#9e3d24] transition hover:text-[#14110d]">
            Readings
          </Link>
          <Link href="/birth-card-calculator" className="transition hover:text-[#14110d]">
            Calculator
          </Link>
          <Link href="/birth-card" className="transition hover:text-[#14110d]">
            Card Meanings
          </Link>
          <Link href="/cardology-compatibility" className="transition hover:text-[#14110d]">
            Compatibility
          </Link>
          <Link href="/52-day-period-meaning-tool" className="transition hover:text-[#14110d]">
            Timing
          </Link>
          <Link href="/blog" className="transition hover:text-[#14110d]">
            Blog
          </Link>
          <Link href="/what-is-cardology" className="transition hover:text-[#14110d]">
            The Method
          </Link>
        </nav>
        <Link href={READINGS_PATH} className="ink-button small-button">
          Get a Reading
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-5xl flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-10">
        {crumb && crumb.length > 0 && (
          <nav className="mb-7 text-[0.72rem] font-bold uppercase text-[#14110d]/55">
            {crumb.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <span className="px-2 text-[#14110d]/30">/</span>}
                <Link href={c.href} className="transition hover:text-[#14110d]">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <article className="flex-1">{children}</article>

        <SeoFooter />
      </div>
    </main>
  );
}

function SeoFooter() {
  return (
    <footer className="mt-16 border-t border-[#14110d]/15 pt-8 text-sm leading-relaxed text-[#3d352d]">
      <p className="oracle-eyebrow mb-5 text-[#14110d]/60">Card Blueprints</p>
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <p className="mb-2 font-serif text-base text-[#14110d]">Personal readings</p>
          <ul className="space-y-1.5">
            <li>
              <a href={READER_PHONE_TEL} className="hover:text-[#14110d]">
                <span className="text-[#9e3d24]">Free</span> teaser call: {READER_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <Link href={TRIAL_PATH} className="hover:text-[#14110d]">
                <span className="text-[#9e3d24]">$9</span> {TRIAL_NAME}
              </Link>
            </li>
            {READING_OFFERS.map((offer) => (
              <li key={offer.slug}>
                <Link href={readingOfferHref(offer)} className="hover:text-[#14110d]">
                  <span className="text-[#9e3d24]">{offer.priceLabel}</span> {offer.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={READINGS_PATH} className="font-bold text-[#9e3d24] hover:text-[#14110d]">
                Compare all readings →
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-serif text-base text-[#14110d]">Free tools</p>
          <ul className="space-y-1.5">
            <li><Link href="/birth-card-calculator" className="hover:text-[#14110d]">Birth Card Calculator</Link></li>
            {/* /born-on/ and /compatibility/ are edge-rendered by the
                cardology-unlock Worker, not this Next app — plain <a>. */}
            <li><a href="/born-on/" className="hover:text-[#14110d]">Birthday Card Lookup</a></li>
            <li><Link href="/birth-card-compatibility-calculator" className="hover:text-[#14110d]">Compatibility Calculator</Link></li>
            <li><a href="/compatibility/" className="hover:text-[#14110d]">Compatibility Pair Library</a></li>
            <li><Link href="/52-day-period-meaning-tool" className="hover:text-[#14110d]">52-Day Period Tool</Link></li>
            <li><Link href="/birth-card" className="hover:text-[#14110d]">All 52 Birth Cards</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-serif text-base text-[#14110d]">Learn the system</p>
          <ul className="space-y-1.5">
            <li><Link href="/what-is-cardology" className="hover:text-[#14110d]">What Is Cardology?</Link></li>
            <li><Link href="/52-card-astrology-explained" className="hover:text-[#14110d]">52-Card Astrology</Link></li>
            <li><Link href="/birth-card-vs-ruling-card" className="hover:text-[#14110d]">Birth vs Ruling Card</Link></li>
            <li><Link href="/cardology-compatibility" className="hover:text-[#14110d]">Compatibility</Link></li>
            <li><Link href="/shadow-karma-guide" className="hover:text-[#14110d]">Shadow &amp; Karma Guide</Link></li>
            <li><Link href="/blog" className="hover:text-[#14110d]">Cardology Blog</Link></li>
            <li><Link href={VIDEO_PATH} className="hover:text-[#14110d]">Cardology Videos</Link></li>
            <li><Link href="/about" className="hover:text-[#14110d]">About Card Blueprints</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 text-xs text-[#5b5148]">
        <Link href="/privacy-policy" className="hover:text-[#14110d]">Privacy Policy</Link>
        <Link href="/refund-policy" className="hover:text-[#14110d]">Refund Policy</Link>
        <Link href="/terms-of-service" className="hover:text-[#14110d]">Terms of Service</Link>
        <Link href="/contact" className="hover:text-[#14110d]">Contact</Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[#5b5148]">
        Calculated from the deterministic Cardology system. Same birthday, same
        card, every time. A mirror for noticing patterns, not a forecast.
      </p>
    </footer>
  );
}
