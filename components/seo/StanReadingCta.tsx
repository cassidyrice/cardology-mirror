import { STAN_STORE_URL } from "@/lib/readings-nav";

export const CALCULATOR_STAN_CTA_HREF = `${STAN_STORE_URL}?utm_source=cardblueprints&utm_medium=calculator&utm_campaign=result_cta`;

/** Shown directly under the calculator result: sends the visitor to the Stan store. */
export function StanReadingCta({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full border-t-2 border-brand-gold pt-4 text-center ${className}`}
      data-testid="calculator-stan-cta"
    >
      <p className="font-serif text-base leading-snug text-brand-ink">
        Your birth card is just the start. See your full Card Blueprint.
      </p>
      <a
        href={CALCULATOR_STAN_CTA_HREF}
        className="ink-button large-button mt-3 w-full"
        style={{ borderColor: "#d9b26a", boxShadow: "inset 0 0 0 1px #d9b26a" }}
      >
        Get your full reading
      </a>
    </div>
  );
}
