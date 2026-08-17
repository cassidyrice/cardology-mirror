import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found | Card Blueprints",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[60vh] w-full max-w-2xl px-5 py-16 text-brand-ink"
    >
      <p className="oracle-eyebrow mb-4">404</p>
      <h1 className="font-serif text-4xl leading-tight">Page not found</h1>
      <p className="mt-4 max-w-[36em] text-base leading-relaxed text-brand-ink-soft">
        That URL is not a live Card Blueprints page. Use a calculator or the
        birth-card index instead of guessing a slug.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        <li>
          <Link href="/birth-card-calculator" className="underline underline-offset-4">
            Find your birth card
          </Link>
        </li>
        <li>
          <Link href="/birth-card" className="underline underline-offset-4">
            Browse all 52 birth cards
          </Link>
        </li>
        <li>
          <Link href="/" className="underline underline-offset-4">
            Card Blueprints home
          </Link>
        </li>
      </ul>
    </main>
  );
}
