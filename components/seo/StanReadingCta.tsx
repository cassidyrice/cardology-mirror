import { chemistryCheckUrl } from "@/lib/readings-nav";

export const CALCULATOR_STAN_CTA_HREF = chemistryCheckUrl("calculator", "result_cta");

/** The one paid next step: the $39 Chemistry Check on Stan. */
export function StanReadingCta({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full border-t-2 border-brand-gold pt-4 text-center ${className}`}
      data-testid="calculator-stan-cta"
    >
      <p className="font-serif text-base leading-snug text-brand-ink">
        Your birth card is just the start. See how it meets someone else&rsquo;s.
      </p>
      <a
        href={CALCULATOR_STAN_CTA_HREF}
        className="ink-button large-button mt-3 w-full"
        style={{ borderColor: "#d9b26a", boxShadow: "inset 0 0 0 1px #d9b26a" }}
      >
        Get the Chemistry Check · $39
      </a>
    </div>
  );
}
