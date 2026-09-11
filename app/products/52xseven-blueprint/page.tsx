import type { Metadata } from "next";
import Link from "next/link";

import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { YearPreview } from "@/components/year/YearPreview";
import { DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_PRODUCT_PATH } from "@/lib/deep-dive";
import { buildProductJsonLd } from "@/lib/product-schema";
import { DEEP_DIVE_PRODUCT } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";
import { buildYearBlueprint } from "@/lib/year-blueprint";
import { toYearPreview } from "@/lib/year-preview";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TITLE = "52xSeven Blueprint ($19): Your Whole Cardology Year, One Place";
const DESCRIPTION =
  "The $19 52xSeven Blueprint: your birth card, the 52-day chapter you are in right now, all seven chapters of your year, and the story arc that ties them together. See your own preview before you pay. Instant, 12 months of access, no renewal.";
const OG_IMAGE = "/og/products/52xseven-blueprint.png";

/** Example birthday for the preview when the visitor hasn't entered one. */
const SAMPLE_BIRTHDATE = "1991-02-17";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "52xseven blueprint",
    "cardology year calendar",
    "52 day periods",
    "planetary periods cardology",
    "birth card year",
    "cardology app",
  ],
  alternates: { canonical: DEEP_DIVE_PRODUCT_PATH },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: DEEP_DIVE_PRODUCT_PATH,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "The 52xSeven Blueprint — your whole Cardology year in one place, $19" }],
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
    q: "What is the 52xSeven Blueprint?",
    a: "Your Cardology year, built for your birthday, in a phone-shaped app you keep for 12 months. Four screens: My card (your birth card with the light and the shadow read), Now (the 52-day chapter you are standing in, dated, with how far through it you are), Chapters (all seven 52-day chapters of the year, each with a short light and shadow line), and Story (the yearly arc — Long Range, Pluto, Result, Environment and Displacement — on one map).",
  },
  {
    q: "What exactly do I get for $19?",
    a: "Instant access to your year the moment payment clears, on the confirmation page and by an emailed sign-in link. The link works for 12 months, so the Now screen keeps moving with the calendar. One payment, no subscription, no automatic renewal.",
  },
  {
    q: "Why seven chapters of 52 days?",
    a: "Cardology divides the year from your birthday into seven planetary periods of 52 days each (7 × 52 = 364, plus your birthday). Each period is governed by one card from your yearly spread. The 52xSeven Blueprint dates those seven chapters for you and reads each one plainly.",
  },
  {
    q: "Do I need to know my card first?",
    a: "No. The preview asks for your birthday and shows your card and your current chapter before you pay. The same date always gives the same card, so there is nothing to look up.",
  },
  {
    q: "What if the date is wrong?",
    a: "Reply to the confirmation email with the correct birth date and we unlock the right year, or refund you in full if you would rather. December 31 (the Joker) sits outside the 52-card calendar, so we refund that date in full.",
  },
];

export default async function FiftyTwoBySevenPage() {
  const sample = toYearPreview(await buildYearBlueprint(SAMPLE_BIRTHDATE));

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
        { label: "52xSeven Blueprint", href: DEEP_DIVE_PRODUCT_PATH },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoHeroFan codes={["8♦", "Q♥", "A♠"]} className="mb-5" />
      <p className="eyebrow mb-3 text-gold">Your year in cards · {DEEP_DIVE_PRICE_LABEL} one time</p>
      <h1 className="display mb-3 text-3xl text-bone">The 52xSeven Blueprint</h1>
      <p className="prose-reading mb-6 max-w-[38em] text-mist">
        Your birthday sets the calendar. Seven chapters, fifty-two days each.
        We show you the card you were born under, the chapter you&rsquo;re
        standing in today, and the six still coming &mdash; each with the light
        read and the shadow read. No planetary jargon to decode first.
      </p>

      <YearPreview sample={sample} includes={DEEP_DIVE_PRODUCT.includes} />

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">A calendar you come back to, not a PDF you read once.</h2>
        <p className="prose-reading text-mist">
          The date changes, the chapter changes, and the shadow read gets more
          pointed as the year goes on. Save it to your phone and open it when
          something feels off &mdash; the answer is usually the chapter.
          A mirror, not a forecast: nothing here predicts events, lucky days,
          or other people&rsquo;s choices.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Not sure of your card?</h2>
        <p className="prose-reading text-mist">
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            Find your birth card free
          </Link>{" "}
          — the same date always returns the same card, and the 52xSeven
          Blueprint builds your year from that birthday automatically.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">52xSeven Blueprint FAQ</h2>
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
