import { Gem } from "@/components/bp/Gem";
import { SITE_NAME } from "@/lib/site";

/**
 * Brand lockup, 2026-11-13 (docs/design/DIRECTION.md, "Blueprint, white"):
 * a ruby-cut diamond beside the tracked wordmark. Plain HTML text, so it needs
 * no image request and inherits the page ink. The parent link carries the
 * accessible name; the text here is the visible name only.
 * Used in SiteHeader and SiteFooter.
 */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-logo brand-logo-compact bp-lockup" : "brand-logo bp-lockup"}>
      <Gem suit="diamond" size={compact ? 28 : 26} />
      <span className="bp-lockup-text">
        <span className="bp-lockup-name">{SITE_NAME.toUpperCase()}</span>
        <span className="bp-lockup-tag">52 cards · 7 planets · 365 days</span>
      </span>
    </span>
  );
}
