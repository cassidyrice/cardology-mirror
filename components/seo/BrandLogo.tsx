import { SITE_NAME } from "@/lib/site";

/**
 * Brand lockup: the Life Spread drawn empty — a grid of card outlines with one
 * position in gold — plus the lowercase wordmark "card blueprint" (ink).
 *
 * The mark is the deck's own structure with nothing written in it: the spread
 * exists before any birthday does, and a reading only says which position you
 * occupy. Nine cards rather than the full 7x7, so it still reads at 16px.
 * Used in SiteHeader and SiteFooter.
 */
const COLUMNS = [3.5, 12.5, 21.5];
const ROWS = [2, 12, 22];
const HIGHLIGHT = { x: 12.5, y: 12 };

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-logo${compact ? " brand-logo-compact" : ""}`} role="img" aria-label={SITE_NAME}>
      <svg
        className="brand-logo-mark"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" strokeWidth="1.1">
          {ROWS.map((y) =>
            COLUMNS.map((x) => {
              const lit = x === HIGHLIGHT.x && y === HIGHLIGHT.y;
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="7"
                  height="8"
                  rx="1"
                  stroke={lit ? "var(--gold)" : "currentColor"}
                  strokeOpacity={lit ? 1 : 0.45}
                />
              );
            }),
          )}
        </g>
      </svg>
      <span className="brand-logo-wordmark" aria-hidden="true">
        card blueprint
      </span>
    </span>
  );
}
