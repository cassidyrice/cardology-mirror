import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import {
  FREE_PREVIEW_BLURB,
  FREE_PREVIEW_NAME,
  READER_PHONE_DISPLAY,
  READER_PHONE_TEL,
} from "@/lib/offers";
import { READINGS_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const PAGE_TITLE = "Free First-Card Preview: Hear Your Birth Card by Phone";
const PAGE_DESCRIPTION =
  "Call the AI Cardology reader free and hear a 60–90 second introduction to your birth card. No account, no payment, no personal question — just a birthday.";

export const metadata: Metadata = {
  title: { absolute: `${PAGE_TITLE} | Card Blueprints` },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/try" },
  openGraph: {
    siteName: SITE_NAME,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/try",
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function TryPage() {
  const faqs = [
    {
      q: "Is the preview really free?",
      a: `Yes. Calling ${READER_PHONE_DISPLAY} costs nothing and needs no account or card. The AI reader answers, asks your birthday, and introduces your birth card on the spot.`,
    },
    {
      q: "What will I hear?",
      a: "A 60–90 second introduction to your birth card — the fixed card your birthday produces in the deterministic Cardology system. The preview does not answer a personal question or deliver a complete reading; it lets you hear the reader before you buy.",
    },
    {
      q: "What if I want a full reading?",
      a: "Choose one of the three paid readings: a $19 Quick Question for one focused answer, the $39 Complete Reading for the full pattern, or the $199 90-Day Season Pass for a season of return calls. Each is a one-time payment tied to the phone number you use at checkout.",
    },
  ];

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: `${SITE_URL}/try`,
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: FREE_PREVIEW_NAME, href: "/try" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-[38em] pb-10">
        <Kicker className="mb-4">{FREE_PREVIEW_NAME}</Kicker>
        <h1 className="type-display text-brand-ink">Hear your first card free.</h1>
        <p className="type-body-lg mt-6 text-brand-ink-soft">{FREE_PREVIEW_BLURB}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href={READER_PHONE_TEL} variant="accent" size="large">
            Call Free: {READER_PHONE_DISPLAY}
          </LinkButton>
          <LinkButton href={READINGS_PATH} variant="outline" size="large">
            Compare the Readings
          </LinkButton>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-brand-ink-faint">
          AI reader &middot; no account &middot; no payment
        </p>
      </header>

      <section className="border-t border-brand-line pt-8">
        <Kicker>How the preview works</Kicker>
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {[
            {
              label: "01",
              title: "Call the reading line.",
              detail: "The AI Cardology reader answers directly — no menu, no hold.",
            },
            {
              label: "02",
              title: "Say your birthday.",
              detail: "The deterministic calculation finds your fixed birth card.",
            },
            {
              label: "03",
              title: "Hear the introduction.",
              detail: "A 60–90 second first look at your card's pattern, free.",
            },
          ].map((step) => (
            <div key={step.label} className="border-t border-brand-line pt-4">
              <p className="font-serif text-lg text-brand-bronze">{step.label}</p>
              <h2 className="type-h3 mt-2 text-brand-ink">{step.title}</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-brand-line pt-8">
        <h2 className="type-h2 text-brand-ink">Questions</h2>
        <div className="mt-4 divide-y divide-brand-line">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-5">
              <h3 className="type-h3 text-brand-ink">{faq.q}</h3>
              <p className="mt-2 max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-brand-ink-soft">
          Ready for the full pattern?{" "}
          <Link href={READINGS_PATH} className="editorial-link text-brand-ink">
            Choose a reading &rarr;
          </Link>
        </p>
      </section>
    </SeoShell>
  );
}
