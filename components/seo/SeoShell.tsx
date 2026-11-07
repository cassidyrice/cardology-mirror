import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import {
  buildBreadcrumbJsonLd,
  serializeJsonLdForHtml,
} from "@/lib/structured-data";

/**
 * Shared shell for the public reading pages. The same drafting sheet as the
 * homepage; when a page has a card, `stage` pins it beside the reading on
 * desktop (docs/design/DIRECTION.md, "Composition").
 */
export function SeoShell({
  children,
  crumb,
  stage,
}: {
  children: ReactNode;
  crumb?: { label: string; href: string }[];
  /** The page's card (or pair), pinned in a rail at the right on desktop. */
  stage?: ReactNode;
}) {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    crumb?.map(({ label, href }) => ({ name: label, href })) ?? [],
  );

  return (
    <div className="paper-shell landing-oracle relative min-h-dvh bg-brand-paper text-brand-ink">
      <SiteHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className={`relative mx-auto min-h-[calc(100dvh-69px)] w-full px-5 pt-6 sm:px-8 sm:pt-10 lg:px-12 ${stage ? "max-w-[var(--container)]" : "max-w-5xl"}`}
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
          <nav aria-label="Breadcrumb" className="blueprint-crumb">
            {crumb.map((c, i) => (
              <span key={c.href}>
                {i > 0 && <span aria-hidden="true">/</span>}
                <Link href={c.href} aria-current={i === crumb.length - 1 ? "page" : undefined}>
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}

        {stage ? (
          <div className="shell-with-stage">
            <article className="blueprint-content min-w-0 flex-1">{children}</article>
            <aside className="shell-stage" aria-label="The card">{stage}</aside>
          </div>
        ) : (
          <article className="blueprint-content flex-1">{children}</article>
        )}
      </main>

      <div className={`relative mx-auto w-full px-5 pb-16 sm:px-8 lg:px-12 ${stage ? "max-w-[var(--container)]" : "max-w-5xl"}`}>
        <SiteFooter bare />
      </div>
    </div>
  );
}

/** One card face pinned in the shell's stage. */
export function StageCard({ slug, label }: { slug: string; label: string }) {
  return (
    <img
      src={`/share-cards/faces/${slug}.png`}
      alt={`${label} playing card`}
      width={1000}
      height={1500}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      className="shell-stage-card"
    />
  );
}
