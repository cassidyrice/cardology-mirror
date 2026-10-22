import Link from "next/link";

/** Shared discovery link. Existing purchase and access routes remain available. */
export function OfferCta({ className = "" }: { className?: string }) {
  return <aside className={`blueprint-next-step ${className}`}>
    <h2>Bring your cards into the conversation.</h2>
    <p>The Chemistry Check reads your card beside one other person’s: shared strengths, recurring friction, and questions to make it your own. Prepared by Cass.</p>
    <div className="flex flex-wrap items-center gap-5">
      <Link href="/#readings" className="ink-button large-button">The Chemistry Check · $24</Link>
      <Link href="/birth-card-calculator" className="editorial-link text-sm">Find your card free</Link>
    </div>
  </aside>;
}
