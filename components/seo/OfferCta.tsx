import Link from "next/link";

/** Shared discovery link. Existing purchase and access routes remain available. */
export function OfferCta({ className = "" }: { className?: string }) {
  return <aside className={`blueprint-next-step ${className}`}>
    <h2>Bring your cards into the conversation.</h2>
    <p>Choose a relationship, your next twelve months, or your family. Cass prepares a personal reading with your cards, the patterns to consider, and questions to make it your own.</p>
    <div className="flex flex-wrap items-center gap-5">
      <Link href="/#readings" className="ink-button large-button">Explore personal readings · from $39</Link>
      <Link href="/birth-card-calculator" className="editorial-link text-sm">Find your card free</Link>
    </div>
  </aside>;
}
