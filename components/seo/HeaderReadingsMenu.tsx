import { READINGS_NAV } from "@/lib/readings-nav";

export function HeaderReadingsMenu() {
  return (
    <details data-readings-menu className="blueprint-readings-menu" suppressHydrationWarning>
      <summary>
        <span>Personal readings</span>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </summary>
      <nav aria-label="Readings">
        <p className="blueprint-dropdown-microcopy">
          Ask one real question · Email or text · 48h window, almost all under 24h
        </p>
        {READINGS_NAV.map((reading) => (
          <a
            href={reading.href}
            key={reading.id}
            data-reading-link
            data-open-question-track={reading.id}
            data-placement="header-readings-menu"
          >
            <span>
              <span className="blueprint-reading-item-title">{reading.title}</span>
              <small className="blueprint-reading-item-who">{reading.who}</small>
            </span>
            <strong>{reading.price}</strong>
          </a>
        ))}
      </nav>
    </details>
  );
}
