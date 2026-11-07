import { chemistryCheckUrl } from "@/lib/readings-nav";

export const CALCULATOR_STAN_CTA_HREF = chemistryCheckUrl("calculator", "result_cta");

/** Paid next step: the $24 Chemistry Check on Stan. No heading here on purpose. */
export function StanReadingCta({ className = "" }: { className?: string }) {
  return (
    <div className={`calc-stan ${className}`} data-testid="calculator-stan-cta">
      <p className="calc-stan-line">
        That&rsquo;s just you. Now see what happens when you meet someone else.
      </p>
      <a href={CALCULATOR_STAN_CTA_HREF} className="accent-button large-button w-full">
        Get the Chemistry Check · $24
      </a>
    </div>
  );
}
