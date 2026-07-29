import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

// Shared content shell for public SEO pages. It borrows the homepage's
// editorial paper/ink visual system while keeping article pages readable.
// Header and footer are the shared site chrome (five destinations up top,
// long-tail navigation below).
export function SeoShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: { label: string; href: string }[];
}) {
  return (
    <main className="paper-shell landing-oracle relative min-h-dvh overflow-hidden bg-brand-paper text-brand-ink">
      <div className="oracle-grid" aria-hidden="true" />
      <div className="oracle-noise" aria-hidden="true" />

      <div className="relative z-10">
        <SiteHeader />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-5xl flex-col px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-10">
        {crumb && crumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-7 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-ink-faint">
            {crumb.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <span aria-hidden="true" className="px-2 text-brand-line-strong">/</span>}
                <Link href={c.href} className="transition hover:text-brand-ink">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <article className="flex-1">{children}</article>

        <SiteFooter bare />
      </div>
    </main>
  );
}
