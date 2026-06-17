import Link from "next/link";
import type { ReactNode } from "react";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME, abs } from "@/lib/site";

export function AppFeaturePage({
  title,
  description,
  canonicalPath,
  eyebrow,
  points,
  children,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  points: string[];
  children: ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: abs(canonicalPath),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: abs("/"),
    },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: title, href: canonicalPath }]}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">{eyebrow}</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          {description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/birth-card-calculator"
            className="ink-button large-button"
          >
            Find your birth card
          </Link>
          <Link
            href="/onboarding"
            className="paper-button large-button"
          >
            Create your profile
          </Link>
        </div>
      </header>

      <section className="card-surface p-5 sm:p-6">
        <h2 className="oracle-eyebrow mb-4">On this page</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-[#3d352d] sm:text-base">
          {points.map((point) => (
            <li key={point} className="border-t border-[#14110d]/12 pt-3 first:border-t-0 first:pt-0">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="app-paper-stage mt-10 border-y border-[#14110d]/15 bg-[#eadfcd]/55">
        {children}
      </section>
    </SeoShell>
  );
}
