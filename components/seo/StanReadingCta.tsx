import { CARD_BLUEPRINT_READING_HREF } from "@/lib/readings-nav";
import type { QuestionTrack } from "@/lib/question-reading-facts";

export const CALCULATOR_QUESTION_CTA_HREF = CARD_BLUEPRINT_READING_HREF;

/**
 * Zero-leave paid next step: opens the on-page Card Blueprint Reading ($99) drawer
 * right over the current page (never leaves the site, zero Stan Store links).
 */
export function StanReadingCta({
  className = "",
  defaultTrack = "card-blueprint-reading",
}: {
  className?: string;
  defaultTrack?: QuestionTrack;
}) {
  const withPartner = defaultTrack === "chemistry-check";
  return (
    <div className={`calc-stan ${className}`} data-testid="calculator-stan-cta">
      <p className="calc-stan-line">
        {withPartner
          ? "Want Cass on both spreads? Book The Card Blueprint Reading ($99) — get the Suggested Questions download immediately plus 48 hours to ask up to 3 questions by email or text."
          : "Want Cass on your spread? Book The Card Blueprint Reading ($99) — get the Suggested Questions download immediately plus 48 hours to ask up to 3 questions by email or text."}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <a
          href={CARD_BLUEPRINT_READING_HREF}
          data-open-question-track={withPartner ? "chemistry-check" : "card-blueprint-reading"}
          data-placement="calculator-cta-primary"
          className="accent-button large-button flex-1 text-center"
        >
          Book The Card Blueprint Reading · $99
        </a>
      </div>
    </div>
  );
}
