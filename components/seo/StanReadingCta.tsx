import { CHEMISTRY_CHECK_HREF, TIMING_MAP_HREF } from "@/lib/readings-nav";
import type { QuestionTrack } from "@/lib/question-reading-facts";

export const CALCULATOR_QUESTION_CTA_HREF = CHEMISTRY_CHECK_HREF;

/**
 * Zero-leave paid next step: opens the on-page Question Reading drawer right over the
 * current page (never leaves the site, zero Stan Store links).
 */
export function StanReadingCta({
  className = "",
  defaultTrack = "chemistry-check",
}: {
  className?: string;
  defaultTrack?: QuestionTrack;
}) {
  const isTiming = defaultTrack === "timing-map";
  return (
    <div className={`calc-stan ${className}`} data-testid="calculator-stan-cta">
      <p className="calc-stan-line">
        {isTiming
          ? "Have a real timing decision on the table? Ask Cass directly — answered by email or text within 48h (almost all under 24h)."
          : "Have a real question about someone? Ask Cass right on this page — answered by email or text within 48h (almost all under 24h)."}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <a
          href={isTiming ? TIMING_MAP_HREF : CHEMISTRY_CHECK_HREF}
          data-open-question-track={defaultTrack}
          data-placement="calculator-cta-primary"
          className="accent-button large-button flex-1 text-center"
        >
          {isTiming
            ? "Ask a Timing Question · $26"
            : "Get the Chemistry Check · $39"}
        </a>
        <a
          href={isTiming ? CHEMISTRY_CHECK_HREF : TIMING_MAP_HREF}
          data-open-question-track={isTiming ? "chemistry-check" : "timing-map"}
          data-placement="calculator-cta-secondary"
          className="paper-button large-button text-center"
        >
          {isTiming ? "Two birthdays · $39" : "Solo timing · $26"}
        </a>
      </div>
    </div>
  );
}
