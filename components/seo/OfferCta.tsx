import Link from "next/link";

/** Shared on-page Card Blueprint Reading ($99) invitation. Opens inline checkout without leaving the page. */
export function OfferCta({ className = "" }: { className?: string }) {
  return (
    <aside className={`blueprint-next-step ${className}`}>
      <p className="qr-eyebrow">The Card Blueprint Reading · $99 · Email or Text</p>
      <h2>Ask the questions you actually came here with.</h2>
      <p>
        Pay once on this page ($99), get an instant download of Suggested Questions, and take 48 hours after purchase to ask up to 3 questions — solo timing, work, blind spots, or two-person chemistry. Personally reviewed by Cass and delivered within 48 hours (almost all under 24 hours).
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <a
          href="/#readings"
          data-open-question-track="card-blueprint-reading"
          data-placement="offer-cta-primary"
          className="ink-button large-button"
        >
          The Card Blueprint Reading · $99
        </a>
        <Link href="/birth-card-calculator" className="editorial-link">
          Find your card free
        </Link>
      </div>
    </aside>
  );
}
