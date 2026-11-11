import Link from "next/link";

/** Shared on-page question reading invitation. Opens inline checkout without leaving the page. */
export function OfferCta({ className = "" }: { className?: string }) {
  return (
    <aside className={`blueprint-next-step ${className}`}>
      <p className="qr-eyebrow">Personal Reading · Email or Text Delivery</p>
      <h2>Ask the question you actually came here with.</h2>
      <p>
        Bring one birthday for a 12-month timing read ($26) or two birthdays for a Chemistry Check ($39).
        Drafted from your exact spread, personally approved by Cass, and sent to your inbox or texts within 48 hours — almost all in under 24 hours.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <a
          href="/#chemistry-check"
          data-open-question-track="chemistry-check"
          data-placement="offer-cta-chemistry"
          className="ink-button large-button"
        >
          The Chemistry Check · $39
        </a>
        <a
          href="/#timing-map"
          data-open-question-track="timing-map"
          data-placement="offer-cta-timing"
          className="paper-button large-button"
        >
          12-Month Timing Question · $26
        </a>
        <Link href="/birth-card-calculator" className="editorial-link">
          Find your card free
        </Link>
      </div>
    </aside>
  );
}
