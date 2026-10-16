import { READINGS_NAV } from "@/lib/readings-nav";

/** Centered "Readings" dropdown: title + price only, linking to each Stan listing. */
export function HeaderReadingsMenu() {
  return (
    <details
      data-readings-menu
      className="group absolute left-1/2 top-[38px] z-40 -translate-x-1/2 -translate-y-1/2"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 whitespace-nowrap px-2 text-[0.8rem] font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
        Readings
        <span aria-hidden="true" className="text-[0.65rem] transition group-open:rotate-180">▾</span>
      </summary>
      <nav
        aria-label="Readings"
        className="absolute left-1/2 top-[calc(100%+0.25rem)] w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 border border-brand-line bg-brand-ivory p-2 shadow-[0_8px_30px_rgba(20,17,13,0.12)]"
      >
        <ul className="divide-y divide-brand-line text-sm text-brand-ink">
          {READINGS_NAV.map((reading) => (
            <li key={reading.href}>
              <a
                href={reading.href}
                target="_blank"
                rel="noopener noreferrer"
                data-reading-link
                className="flex min-h-11 items-center justify-between gap-3 px-2 py-2 font-semibold hover:underline"
              >
                <span>{reading.title}</span>
                <span>{reading.price}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
