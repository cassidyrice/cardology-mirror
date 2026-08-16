import Link from "next/link";

import { instantReportBySlug } from "@/lib/products";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
  VIDEO_PATH,
} from "@/lib/site";
import { BrandLogo } from "./BrandLogo";
import { NewsletterSignupForm } from "./NewsletterSignupForm";

// One footer for every marketing/editorial surface. The header stays at five
// destinations; everything long-tail lands here.
export function SiteFooter({ bare = false }: { bare?: boolean }) {
  const blueprintOffer = instantReportBySlug("personal-card-blueprint");
  const blueprintPrice = blueprintOffer?.priceLabel ?? "$13";
  return (
    <footer
      className={
        bare
          ? "mt-16 border-t border-brand-line pt-10 text-sm leading-relaxed text-brand-ink-soft"
          : "border-t border-brand-line bg-brand-paper text-sm leading-relaxed text-brand-ink-soft"
      }
    >
      <div className={bare ? "" : "mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 lg:px-10"}>
        <p className="mb-6">
          <Link href="/" aria-label={`${SITE_NAME} home`} className="inline-block">
            <BrandLogo compact />
          </Link>
        </p>
        <div className="mb-10">
          <NewsletterSignupForm source="site-footer" />
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Paid products</p>
            <ul className="space-y-2">
              <li>
                <Link href="/products/personal-card-blueprint" className="font-semibold text-brand-ink hover:underline">
                  Personal Card Blueprint — {blueprintPrice}
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
              <li><a href={BIRTHDAY_DIRECTORY_PATH} className="hover:text-brand-ink">Birthdays by Date</a></li>
              <li><a href={COMPATIBILITY_DIRECTORY_PATH} className="hover:text-brand-ink">All Card Pairings</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-serif text-base text-brand-ink">Learn</p>
            <ul className="space-y-2">
              <li><Link href="/products/analog-algorithm" className="hover:text-brand-ink">The Analog Algorithm — $17 e-book</Link></li>
              <li><Link href="/what-is-cardology" className="hover:text-brand-ink">What Is Cardology?</Link></li>
              <li><Link href="/cardology-for-beginners" className="hover:text-brand-ink">Cardology for Beginners</Link></li>
              <li><Link href="/cardology-vs-tarot" className="hover:text-brand-ink">Cardology vs Tarot</Link></li>
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
          The Personal Card Blueprint is an instant written report built from
          the same deterministic birth-card calculation used across the free
          tools. An esoteric reflection framework, not a forecast.
        </p>
      </div>
    </footer>
  );
}
