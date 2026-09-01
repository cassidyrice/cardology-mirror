import type { Metadata } from "next";
import Link from "next/link";

import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { buildProductJsonLd } from "@/lib/product-schema";
import { DEEP_DIVE_PRODUCT } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Birth Card Deep Dive ($9): Your Card's Written Pattern";
const DESCRIPTION =
  "The $9 Birth Card Deep Dive: a 7-page PDF on your playing card — its seats, stretch and steady, and the seven ~13-year chapters that build the personality — plus the complete System Guide. Instant download.";
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
    a: "A 7-page written PDF on the playing card your birthday maps to: where it sits in the two fixed maps, its stretch and steady cards, its seven lenses read as the ~13-year chapters that build the personality, and the pattern underneath. It ships with the complete System Guide.",
  },
  {
    q: "What do I get for $9?",
    a: "Two PDFs — your card's 7-page Deep Dive and the complete System Guide — plus your seven ~13-year period cards shown on the confirmation page. Instant download links with email backup.",
  },
  {
    q: "Do I need to know my birth card first?",
    a: "No. Enter your birthday below (or in the free calculator) — the same date always resolves to the same card, and the right card-level PDF is matched automatically.",
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
        Your birthday maps to one playing card. The Deep Dive writes that card
        down: where it sits in the two fixed maps, the pressure it is built to
        meet, the support it is built to receive, and the seven ~13-year
        chapters that build the personality around it.
      </p>

      <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-5">
        <p className="eyebrow text-gold">What $9 includes</p>
        <ul className="mb-4 mt-3 space-y-1 text-sm text-mist">
          <li>✓ Your card&rsquo;s 7-page Deep Dive PDF</li>
          <li>✓ The Complete System Guide (PDF)</li>
          <li>✓ Your seven ~13-year period cards, on screen</li>
          <li>✓ Instant download links + email backup</li>
        </ul>
        <DeepDiveCta
          placement="deep-dive-product-page"
          source="birth-card-meaning"
          showFulfillment={false}
        />
        <p className="mt-3 text-xs leading-relaxed text-mist">
          $9 one time · instant access · no subscription
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

      <div className="card-surface mt-10 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">Want the year, not just the card?</p>
        <p className="mt-2 text-sm text-mist">
          The <strong>Personal Card Blueprint ($13)</strong> writes down your
          yearly spread — all seven 52-day cards with the current one
          deep-dived, the yearly signals, and The 90 Spreads PDF.
        </p>
        <Link
          href="/products/personal-card-blueprint"
          className="mt-3 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink"
        >
          See the Year Blueprint — $13 →
        </Link>
      </div>
    </SeoShell>
  );
}
