import Link from "next/link";
import type { ReactNode } from "react";

import { SITE_NAME, SITE_URL } from "@/lib/site";

// Shared content shell for public SEO pages: cosmic theme, top bar, readable
// prose column, and an internal-link footer. Server component (no client JS).
export function SeoShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: { label: string; href: string }[];
}) {
  return (
    <main className="starfield relative min-h-dvh overflow-hidden bg-cosmic">
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-16 pt-6">
        <header className="mb-6 flex items-center justify-between">
          <a href={SITE_URL} className="eyebrow text-gold">
            {SITE_NAME}
          </a>
          <div className="flex items-center gap-2">
            <Link
              href="/birth-card-calculator"
              className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] uppercase tracking-widest text-mist transition hover:border-gold hover:text-gold"
            >
              Search
            </Link>
            <Link
              href="/today"
              className="rounded-full bg-gold px-3 py-1 text-[0.6rem] uppercase tracking-widest text-ink transition active:scale-[0.98]"
            >
              Daily
            </Link>
          </div>
        </header>

        {crumb && crumb.length > 0 && (
          <nav className="mb-4 text-[0.65rem] uppercase tracking-wider2 text-faint">
            {crumb.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <span className="px-1.5 text-faint/50">/</span>}
                <Link href={c.href} className="transition hover:text-mist">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <article className="flex-1">{children}</article>

        <SeoFooter />
      </div>
    </main>
  );
}

function SeoFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 pt-6 text-sm text-faint">
      <p className="mb-3 eyebrow text-gold">Explore</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
        <li><Link href="/birth-card-calculator" className="hover:text-mist">Birth Card Calculator</Link></li>
        <li><Link href="/birth-card" className="hover:text-mist">All 52 Birth Cards</Link></li>
        <li><Link href="/cardology-compatibility" className="hover:text-mist">Compatibility</Link></li>
        <li><Link href="/birth-card-compatibility-calculator" className="hover:text-mist">Compatibility Calculator</Link></li>
        <li><Link href="/what-is-cardology" className="hover:text-mist">What is Cardology?</Link></li>
        <li><Link href="/52-card-astrology-explained" className="hover:text-mist">52-Card Astrology</Link></li>
        <li><Link href="/birth-card-vs-ruling-card" className="hover:text-mist">Birth vs Ruling Card</Link></li>
        <li><Link href="/cardology-agent-instructions" className="hover:text-mist">Shadow & Karma Guide</Link></li>
        <li><Link href="/today" className="hover:text-mist">Daily Card Reading</Link></li>
        <li><Link href="/self" className="hover:text-mist">Cardology Blueprint</Link></li>
        <li><Link href="/timing" className="hover:text-mist">Yearly Spread</Link></li>
        <li><Link href="/bonds" className="hover:text-mist">Bonds</Link></li>
        <li><Link href="/reading" className="hover:text-mist">Deep Reading</Link></li>
        <li><Link href="/story" className="hover:text-mist">Story Arc</Link></li>
        <li><Link href="/journal" className="hover:text-mist">Journal</Link></li>
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-faint/80">
        Calculated from the deterministic Cardology system. Same birthday, same
        card — every time. A mirror for noticing patterns, not a forecast.
      </p>
    </footer>
  );
}
