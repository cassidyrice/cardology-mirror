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

      <header className="pb-8">
        <p className="eyebrow mb-3 text-gold">{eyebrow}</p>
        <h1 className="display text-4xl text-bone">{title}</h1>
        <p className="prose-reading mt-4 text-mist">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="rounded-full bg-foil px-6 py-3 text-center font-serif text-base text-ink transition active:scale-[0.99]"
          >
            Create your profile
          </Link>
          <Link
            href="/birth-card-calculator"
            className="rounded-full border border-white/15 px-6 py-3 text-center text-sm text-mist transition hover:border-gold hover:text-bone"
          >
            Find your birth card
          </Link>
        </div>
      </header>

      <section className="card-surface rounded-2xl p-5">
        <h2 className="eyebrow mb-4 text-gold">On this page</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-mist">
          {points.map((point) => (
            <li key={point} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="-mx-5 mt-10 border-y border-white/10 bg-void/40">
        {children}
      </section>
    </SeoShell>
  );
}
