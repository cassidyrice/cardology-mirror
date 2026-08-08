import { SITE_NAME } from "@/lib/site";

/**
 * Brand lockup: plexus-network mark (oxblood) + lowercase geometric-sans
 * wordmark "card blueprint" (ink), adapted from the approved logo concept
 * to the warm-paper palette. Used in SiteHeader and SiteFooter.
 */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-logo${compact ? " brand-logo-compact" : ""}`} role="img" aria-label={SITE_NAME}>
      <svg
        className="brand-logo-mark"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <g
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M7 23 12.5 10.5 20.5 16.5 25.5 8" />
          <path d="M7 23 14.5 26.5 20.5 16.5" />
        </g>
        <g fill="currentColor">
          <circle cx="7" cy="23" r="2" />
          <circle cx="12.5" cy="10.5" r="2.3" />
          <circle cx="20.5" cy="16.5" r="2" />
          <circle cx="25.5" cy="8" r="1.7" />
          <circle cx="14.5" cy="26.5" r="1.5" />
        </g>
      </svg>
      <span className="brand-logo-wordmark" aria-hidden="true">
        card blueprint
      </span>
    </span>
  );
}
