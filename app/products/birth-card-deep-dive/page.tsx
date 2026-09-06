import type { Metadata } from "next";
import Link from "next/link";

import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { DeepDiveSample } from "@/components/seo/DeepDiveSample";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { buildProductJsonLd } from "@/lib/product-schema";
import { DEEP_DIVE_PRODUCT } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";
import { testimonialByline, testimonialsFor } from "@/lib/testimonials";

const TITLE = "Birth Card Deep Dive ($9): Your Card's Written Pattern";
const DESCRIPTION =
  "The $9 Birth Card Deep Dive: a 7-page PDF written for the one playing card your birthday maps to, plus the complete System Guide. See page 1 before you buy. Instant download, email backup, refund if the file is wrong.";
const OG_IMAGE = "/og/products/birth-card-deep-dive.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "birth card deep dive",
    "cardology deep dive",
    "birth card report pdf",
    "playing card birth card pdf",
  ],
  alternates: { canonical: "/products/birth-card-deep-dive" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/products/birth-card-deep-dive",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "The Birth Card Deep Dive — a playing card on paper, $9" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const faqs = [
  {
    q: "What is the Birth Card Deep Dive?",
    a: "A 7-page PDF written for one card: the card your birthday maps to. Page 1 shows where the card sits and which birthdays share it. The rest reads the card's pattern: what it does well, where it slips, and the seven chapters of roughly 13 years each that build a personality around it. You can see page 1 on this page before you buy.",
  },
  {
    q: "What exactly arrives for $9?",
    a: "Two PDFs: your card's 7-page Deep Dive and the complete System Guide. Download links appear on the confirmation page the moment payment clears, with a copy sent by email. The confirmation page also lists your seven period cards.",
  },
  {
    q: "Do I need to know my card first?",
    a: "No. The button asks for your birthday and matches the right PDF. The same date always gives the same card, so there is nothing to look up.",
  },
  {
    q: "What if the file is wrong or broken?",
    a: "We replace it or refund you. Wrong card, wrong date, a file that will not open, or a double charge: reply to the confirmation email. The download itself is final once it works.",
  },
];

export default function BirthCardDeepDivePage() {
  const jsonLd = [
    buildProductJsonLd(DEEP_DIVE_PRODUCT),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Card Deep Dive", href: "/products/birth-card-deep-dive" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoHeroFan codes={["8♦", "Q♥", "A♠"]} className="mb-5" />
      <p className="eyebrow mb-3 text-gold">Instant download · $9 one time</p>
      <h1 className="display mb-3 text-3xl text-bone">The Birth Card Deep Dive</h1>
      <p className="prose-reading mb-5 max-w-[38em] text-mist">
        Your birthday maps to one playing card. The Deep Dive is seven written
        pages about that one card: where it sits, what it does well, where it
        slips, and the seven chapters of roughly 13 years each that build a
        personality around it. This is page 1.
      </p>

      <DeepDiveSample placement="deep-dive-product-page" className="mb-6" />

      <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-5">
        <p className="eyebrow text-gold">What $9 sends</p>
        <ul className="mb-4 mt-3 space-y-1 text-sm text-mist">
          <li>✓ Your card&rsquo;s 7-page Deep Dive (PDF)</li>
          <li>✓ The complete System Guide (PDF)</li>
          <li>✓ Download links on the confirmation page, plus an email copy</li>
          <li>✓ Your seven period cards, listed on the confirmation page</li>
        </ul>
        <DeepDiveCta
          placement="deep-dive-product-page"
          source="birth-card-meaning"
          showFulfillment={false}
        />
        <p className="mt-3 text-xs leading-relaxed text-mist">
          $9 one time · no subscription · wrong card or broken file: we replace or refund
        </p>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Not sure of your card?</h2>
        <p className="prose-reading text-mist">
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            Find your birth card free
          </Link>{" "}
          — the same date always returns the same card, and the Deep Dive
          matches your card automatically from your birthday.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">What buyers say</h2>
        <div className="space-y-4">
          {testimonialsFor("deep-dive").map((t) => (
            <figure key={t.author} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <blockquote className="prose-reading text-sm text-mist">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                <span aria-label={`${t.rating} out of 5 stars`} className="mr-2 tracking-normal">
                  {"★".repeat(t.rating)}
                </span>
                {testimonialByline(t)}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          Real customer words, shared with permission. Individual reflections,
          not typical-results claims.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">Deep Dive FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

          </SeoShell>
  );
}
