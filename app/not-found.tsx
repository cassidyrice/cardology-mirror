import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

export const metadata: Metadata = {
  title: "Page not found | Card Blueprints",
  robots: { index: false, follow: true },
};

/** The one address outside the map gets the one card outside the 52. */
export default function NotFound() {
  return (
    <div className="paper-shell min-h-dvh bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="not-found">
        <div className="not-found-text">
          <h1>Page not found</h1>
          <p>
            That URL is not a live Card Blueprints page. Use a calculator or the
            birth-card index instead of guessing a slug.
          </p>
          <ul className="not-found-links">
            <li><Link href="/birth-card-calculator" className="accent-button large-button">Find your birth card</Link></li>
            <li><Link href="/birth-card" className="paper-button large-button">Browse all 52 birth cards</Link></li>
            <li><Link href="/" className="paper-button large-button">Card Blueprints home</Link></li>
          </ul>
        </div>
        <div className="not-found-stage" aria-hidden="true">
          <img src="/share-cards/faces/joker.png" alt="" width={1000} height={1500} className="shell-stage-card" loading="eager" decoding="async" />
        </div>
      </main>
      <div className="mx-auto w-full max-w-[var(--container)] px-5 pb-16 sm:px-8 lg:px-12">
        <SiteFooter bare />
      </div>
    </div>
  );
}
