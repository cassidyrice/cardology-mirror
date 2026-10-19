import { READINGS_NAV } from "@/lib/readings-nav";

export function HeaderReadingsMenu() {
  return <details data-readings-menu className="blueprint-readings-menu" suppressHydrationWarning>
    <summary>Personal readings <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" /></svg></summary>
    <nav aria-label="Readings">
      {READINGS_NAV.map(reading => <a href={reading.href} key={reading.id} data-reading-link><span>{reading.title}</span><strong>{reading.price}</strong></a>)}
    </nav>
  </details>;
}
