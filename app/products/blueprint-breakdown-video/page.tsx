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

const TITLE = "Blueprint Breakdown Video ($47): Your Birth Card, Explained in 5 Minutes";
const DESCRIPTION =
  "The $47 Blueprint Breakdown Video: a 5-minute video walkthrough of the one playing card your birthday maps to. Bonuses: the $9 Birth Card Deep Dive (7-page PDF + complete System Guide, instant download) and your Yearly Timing Map. Wrong card or broken file: we replace or refund.";
const OG_IMAGE = "/og/products/blueprint-breakdown-video.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "blueprint breakdown video",
    "cardology video reading",
    "birth card deep dive",
    "cardology deep dive",
    "birth card report pdf",
    "yearly timing map",
  ],
  alternates: { canonical: "/products/blueprint-breakdown-video" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/products/blueprint-breakdown-video",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "The Blueprint Breakdown Video — your birth card explained in 5 minutes, $47" }],
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
    q: "What is the Blueprint Breakdown Video?",
    a: "A 5-minute video made for one card: the card your birthday maps to. It walks through where the card sits, what it does well, where it slips, and the seven chapters of roughly 13 years each that build a personality around it — the same pattern the written Deep Dive covers, talked through so you can hear how the pieces connect.",
  },
  {
    q: "What exactly arrives for $47?",
    a: "Three things. The 5-minute Blueprint Breakdown Video for your card arrives by email within 2 business days. Two bonuses are ready the moment payment clears, on the confirmation page and by email: your Yearly Timing Map and the $9 Birth Card Deep Dive — your card's 7-page PDF plus the complete System Guide. The confirmation page also lists your seven period cards.",
  },
  {
    q: "What is the Yearly Timing Map?",
    a: "A blueprint-style diagram of your current Cardology year, drawn for your birthday. The year runs from your birthday to the day before your next one as a ring of seven 52-day periods, each with the card that governs it, a marker for where you are today, and the year's fixed signals (Long Range, Pluto, Result, Environment, Displacement) on the side. It opens in your browser; save it or print it.",
  },
  {
    q: "Do I need to know my card first?",
    a: "No. The button asks for your birthday and matches the right card. The same date always gives the same card, so there is nothing to look up.",
  },
  {
    q: "What if the file is wrong or broken?",
    a: "We replace it or refund you. Wrong card, wrong date, a file that will not open, or a double charge: reply to the confirmation email. Refunds in full are available until the video is delivered; after that, we fix or replace any wrong or broken file.",
  },
];

export default function BlueprintBreakdownVideoPage() {
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
        { label: "Blueprint Breakdown Video", href: "/products/blueprint-breakdown-video" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoHeroFan codes={["8♦", "Q♥", "A♠"]} className="mb-5" />
      <p className="eyebrow mb-3 text-gold">5-minute video · $47 one time</p>
      <h1 className="display mb-3 text-3xl text-bone">The Blueprint Breakdown Video</h1>
      <p className="prose-reading mb-5 max-w-[38em] text-mist">
        Your birthday maps to one playing card. The Blueprint Breakdown is a
        5-minute video about that one card: where it sits, what it does well,
        where it slips, and the seven chapters of roughly 13 years each that
        build a personality around it. Two bonuses come with it: the $9 Birth
        Card Deep Dive (seven written pages) and your Yearly Timing Map, a
        blueprint diagram of your year — both instant. This is page 1 of the
        bonus Deep Dive.
      </p>

      <DeepDiveSample placement="deep-dive-product-page" className="mb-6" />

      <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-5">
        <p className="eyebrow text-gold">What $47 sends</p>
        <ul className="mb-4 mt-3 space-y-1 text-sm text-mist">
          <li>✓ Your card&rsquo;s 5-minute Blueprint Breakdown Video (by email within 2 business days)</li>
          <li>✓ Bonus: the $9 Birth Card Deep Dive — 7-page PDF + the complete System Guide (instant download)</li>
          <li>✓ Bonus: your Yearly Timing Map — a blueprint diagram of your year (instant)</li>
          <li>✓ Download links on the confirmation page, plus an email copy</li>
          <li>✓ Your seven period cards, listed on the confirmation page</li>
        </ul>
        <DeepDiveCta
          placement="deep-dive-product-page"
          source="birth-card-meaning"
          showFulfillment={false}
        />
        <p className="mt-3 text-xs leading-relaxed text-mist">
          $47 one time · no subscription · wrong card or broken file: we replace or refund
        </p>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Not sure of your card?</h2>
        <p className="prose-reading text-mist">
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            Find your birth card free
          </Link>{" "}
          — the same date always returns the same card, and the Blueprint
          Breakdown matches your card automatically from your birthday.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">What buyers of the Deep Dive say</h2>
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
          Real customer words about the written Deep Dive, which is included
          here as a bonus. Shared with permission. Individual reflections,
          not typical-results claims.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">Blueprint Breakdown FAQ</h2>
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
