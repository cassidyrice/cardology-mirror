import { READINGS_NAV } from "@/lib/readings-nav";

/** Always-visible reading names and prices, shared by every page. */
export function HeaderReadingsMenu() {
  return (
    <nav
      aria-label="Readings"
      data-readings-menu
      className="relative z-30 border-b border-brand-line bg-brand-paper text-brand-ink"
    >
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y divide-brand-line px-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-10">
        {READINGS_NAV.map((reading) => (
          <li key={reading.href} className="min-w-0">
            <a
              href={reading.href}
              target="_blank"
              rel="noopener noreferrer"
              data-reading-link
              className="flex min-h-11 items-center justify-between gap-3 px-3 py-3 text-sm font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-ink sm:h-full sm:flex-wrap sm:justify-center"
            >
              <span>{reading.title}</span>
              <span>{reading.price}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
