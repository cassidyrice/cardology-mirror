import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { buildFaqPageJsonLd, FAQ_PATH, FAQ_SECTIONS } from "@/lib/faq";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import { SITE_NAME } from "@/lib/site";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

const UPDATED = PAGE_UPDATED_DATES[FAQ_PATH];

const TITLE = "Cardology FAQ";
const DESCRIPTION =
  "Cardology FAQ: birth cards, free calculators, readings with Cass, follow-up support. What the math says, and what you keep reading into it.";
const OG_IMAGE = { url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" };

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: FAQ_PATH },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: FAQ_PATH,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function FaqPage() {
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "FAQ", href: FAQ_PATH }]}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(buildFaqPageJsonLd()) }}
      />

      <h1 className="display mb-3 text-3xl text-brand-ink">Cardology FAQ</h1>
      <div className="mb-4 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Start with your birthday. Look at the card it maps to. Then decide what the interpretation has to do with your actual life. Probably more than you wanted. Below: the tools, the personal readings, support, and where the system stops.
        </p>
      </div>
      <p className="mb-8 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <div className="space-y-10">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id} className="type-eyebrow mb-4 !text-brand-bronze">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <article
                  key={item.id}
                  id={item.id}
                  className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4"
                >
                  <h3 className="font-serif text-lg text-brand-ink">{item.question}</h3>
                  <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{item.answer}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {item.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-brand-oxblood underline underline-offset-4"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SeoShell>
  );
}
