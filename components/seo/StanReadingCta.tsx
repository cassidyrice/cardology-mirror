import { chemistryCheckUrl } from "@/lib/readings-nav";

export const CALCULATOR_STAN_CTA_HREF = chemistryCheckUrl("calculator", "result_cta");

/** Paid next step: the $24 Chemistry Check on Stan. */
export function StanReadingCta({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full border-t-2 border-brand-gold pt-4 text-center ${className}`}
      data-testid="calculator-stan-cta"
    >
      <p className="font-serif text-base leading-snug text-brand-ink">
        That&rsquo;s just you. Now see what happens when you meet someone else.
      </p>
      <a
        href={CALCULATOR_STAN_CTA_HREF}
        className="ink-button large-button mt-3 w-full"
        style={{ borderColor: "#d9b26a", boxShadow: "inset 0 0 0 1px #d9b26a" }}
      >
        Get the Chemistry Check · $24
      </a>
    </div>
  );
}
