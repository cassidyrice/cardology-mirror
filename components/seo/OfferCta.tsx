import Link from "next/link";

// Quiet end-of-page pointer for educational pages. The only paid offers are the
// two readings (lib/readings.ts), shown with the calculator result.
export function OfferCta({ className = "" }: { className?: string }) {
  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        Find your birth card free. Two readings appear with your result.
      </p>
      <div className="mt-5">
        <Link
          href="/birth-card-calculator"
          className="accent-button large-button inline-flex text-center"
        >
          Find your birth card
        </Link>
      </div>
    </aside>
  );
}
