import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { MICROTRUST_LINE } from "@/lib/offers";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { READINGS_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const videoOffer = READING_OFFERS[0];

const PAGE_TITLE = "How the Video Reading Works | Card Blueprints";
const PAGE_DESCRIPTION =
  "One offer: check out with a birth date, and a personally-made Cardology video reading arrives by email within 48 hours. No calls, no appointments, no account.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
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
      q: "What is the video reading?",
      a: "A personally-made Cardology reading delivered as a private video link. Your birth card and ruling card are read as one pattern, with your question or focus woven through it — at least five minutes of reading you can keep and rewatch.",
    },
    {
      q: "What do I need to give?",
      a: "A birth date, entered at Stripe Checkout — yours, or the person the reading is for. You can also add the question or focus you want the reading to speak to. Stripe collects your email and payment details; no site account is required.",
    },
    {
      q: "How is it made?",
      a: "Each video is written and voiced with AI and produced individually for the person who ordered it, then reviewed before delivery. The birth-card calculation underneath is deterministic — the same birthday always produces the same card. Cardology is a symbolic reflection framework, not prediction, advice, or diagnosis.",
    },
    {
      q: "What if it never arrives?",
      a: "Every video is delivered within 48 hours to the email used at checkout. If that window passes, check spam and promotions, then reply to your receipt or contact us — undelivered videos are refunded in full.",
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
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "How it works", href: "/try" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-[38em] pb-10">
        <Kicker className="mb-4">How it works</Kicker>
        <h1 className="type-display text-brand-ink">A reading that comes to you.</h1>
        <p className="type-body-lg mt-6 text-brand-ink-soft">
          No calls, no appointments, no account. Check out with a birth date —
          a personally-made video reading lands in your inbox within 48 hours.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href={readingOfferHref(videoOffer)} variant="accent" size="large">
            {videoOffer.cta}
          </LinkButton>
          <LinkButton href="/birth-card-calculator" variant="outline" size="large">
            Find Your Birth Card Free
          </LinkButton>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-brand-ink-faint">
          Made for you &middot; no account &middot; delivered by email
        </p>
      </header>

      <section className="border-t border-brand-line pt-8">
        <Kicker>The three steps</Kicker>
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {[
            {
              label: "01",
              title: "Check out with a birth date.",
              detail:
                "Stripe handles the payment and collects the birth date the reading is for — plus your question, if you have one.",
            },
            {
              label: "02",
              title: "Your video is made.",
              detail:
                "Written, voiced, and produced individually from that birth date — birth card, ruling card, and your focus as one pattern.",
            },
            {
              label: "03",
              title: "Watch your inbox.",
              detail:
                "A private video link arrives by email within 48 hours. Rewatch it anytime — it is yours to keep.",
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
          {MICROTRUST_LINE}{" "}
          <Link href={READINGS_PATH} className="editorial-link text-brand-ink">
            See the reading &rarr;
          </Link>
        </p>
      </section>
    </SeoShell>
  );
}
