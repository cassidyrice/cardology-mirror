import Link from "next/link";

import {
  FREE_PREVIEW_NAME,
  READER_PHONE_DISPLAY,
  READER_PHONE_TEL,
} from "@/lib/offers";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { READINGS_PATH, SITE_NAME, VIDEO_PATH } from "@/lib/site";

// One footer for every marketing/editorial surface. The header stays at five
// destinations; everything long-tail lands here.
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
        <p className="type-eyebrow mb-6">{SITE_NAME}</p>
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Readings</p>
            <ul className="space-y-2">
              <li>
                <a href={READER_PHONE_TEL} className="hover:text-brand-ink">
                  Free {FREE_PREVIEW_NAME}: {READER_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <Link href="/try" className="editorial-link">
                  How the free preview works →
                </Link>
              </li>
              {READING_OFFERS.map((offer) => (
                <li key={offer.slug}>
                  <Link href={readingOfferHref(offer)} className="hover:text-brand-ink">
                    {offer.priceLabel} {offer.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={READINGS_PATH} className="editorial-link">
                  Compare the readings →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Free tools</p>
            <ul className="space-y-2">
              <li><Link href="/birth-card-calculator" className="hover:text-brand-ink">Birth Card Calculator</Link></li>
              <li><Link href="/birth-card-compatibility-calculator" className="hover:text-brand-ink">Compatibility Calculator</Link></li>
              <li><Link href="/52-day-period-meaning-tool" className="hover:text-brand-ink">52-Day Period Tool</Link></li>
              <li><Link href="/birth-card" className="hover:text-brand-ink">All 52 Card Meanings</Link></li>
              <li><Link href="/card-of-the-day" className="hover:text-brand-ink">Card of the Day</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Learn</p>
            <ul className="space-y-2">
              <li><Link href="/what-is-cardology" className="hover:text-brand-ink">What Is Cardology?</Link></li>
              <li><Link href="/cardology-compatibility" className="hover:text-brand-ink">Compatibility</Link></li>
              <li><Link href="/52-card-astrology-explained" className="hover:text-brand-ink">52-Card Astrology</Link></li>
              <li><Link href="/birth-card-vs-ruling-card" className="hover:text-brand-ink">Birth vs Ruling Card</Link></li>
              <li><Link href="/shadow-karma-guide" className="hover:text-brand-ink">Shadow &amp; Karma Guide</Link></li>
              <li><Link href="/playing-card-spreads" className="hover:text-brand-ink">Playing Card Spreads</Link></li>
              <li><Link href="/blog" className="hover:text-brand-ink">Blog</Link></li>
              <li><Link href={VIDEO_PATH} className="hover:text-brand-ink">Videos</Link></li>
              <li><Link href="/methodology" className="hover:text-brand-ink">Methodology</Link></li>
              <li><Link href="/about" className="hover:text-brand-ink">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-brand-line pt-5 text-xs">
          <Link href="/contact" className="hover:text-brand-ink">Contact</Link>
          <Link href="/privacy-policy" className="hover:text-brand-ink">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-brand-ink">Terms of Service</Link>
          <Link href="/refund-policy" className="hover:text-brand-ink">Refund Policy</Link>
        </div>
        <p className="mt-4 max-w-[38em] text-xs leading-relaxed">
          Readings are delivered by an AI voice reader using the deterministic
          Cardology calculation — the same birthday always produces the same
          card. An esoteric reflection framework, not a forecast.
        </p>
      </div>
    </footer>
  );
}
