import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import {
  buildBreadcrumbJsonLd,
  serializeJsonLdForHtml,
} from "@/lib/structured-data";

// Shared content shell for public SEO pages. The legacy `paper-shell` class
// now maps old page utilities into the Season night-sky visual system while
// leaving every page's ranking copy and metadata untouched.
// Header and footer are the shared site chrome (five destinations up top,
// long-tail navigation below).
export function SeoShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: { label: string; href: string }[];
}) {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    crumb?.map(({ label, href }) => ({ name: label, href })) ?? [],
  );

  return (
    <div className="paper-shell season-shell relative min-h-dvh overflow-hidden bg-season-void text-season-ink">
      <div className="season-aurora" aria-hidden="true" />
      <div className="season-stars" aria-hidden="true" />

      <div className="relative z-20">
        <SiteHeader />
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 mx-auto min-h-[calc(100dvh-69px)] w-full max-w-5xl px-5 pt-8 sm:px-8 sm:pt-12 lg:px-10"
      >
        {breadcrumbJsonLd && (
          <script
            type="application/ld+json"
            data-seo-breadcrumb="true"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLdForHtml(breadcrumbJsonLd),
            }}
          />
        )}

        {crumb && crumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-7 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-brand-ink-faint">
            {crumb.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <span aria-hidden="true" className="px-2 text-brand-line-strong">/</span>}
                <Link
                  href={c.href}
                  aria-current={i === crumb.length - 1 ? "page" : undefined}
                  className="transition hover:text-brand-ink"
                >
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        <article className="flex-1">{children}</article>
      </main>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8 lg:px-10">
        <SiteFooter bare />
      </div>
    </div>
  );
}
