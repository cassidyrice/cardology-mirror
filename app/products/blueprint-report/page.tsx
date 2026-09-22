import type { Metadata } from "next";
import Link from "next/link";

import { ReportCheckoutButton } from "@/components/checkout/ReportCheckoutButton";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import {
  BLUEPRINT_REPORT_NAME,
  BLUEPRINT_REPORT_PAGE_COUNT,
  BLUEPRINT_REPORT_PRICE_LABEL,
  BLUEPRINT_REPORT_PRODUCT_PATH,
  BLUEPRINT_REPORT_SLUG,
  CONSULT_BOOKING_COPY,
  CONSULT_MINUTES,
  CONSULT_PRICE_LABEL,
  CONSULT_SLUG,
} from "@/lib/blueprint-report";
import { DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_PRODUCT_PATH } from "@/lib/deep-dive";
import { buildProductJsonLd } from "@/lib/product-schema";
import { publicProductBySlug } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

const report = publicProductBySlug(BLUEPRINT_REPORT_SLUG);
const consult = publicProductBySlug(CONSULT_SLUG);
if (!report || !consult) throw new Error("Blueprint Report tiers are missing from PUBLIC_PRODUCTS");

const title = `${BLUEPRINT_REPORT_NAME}: your whole year in cards, the math shown`;
const description = `A personal Cardology report computed from your birthday and purchase date: this year's periods, the seven-year cycle, the full boards, the derivation of your card, and how to deal every board by hand. No model writes it. ${BLUEPRINT_REPORT_PRICE_LABEL} for the report, ${CONSULT_PRICE_LABEL} with ${CONSULT_MINUTES} minutes live with Cass.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: BLUEPRINT_REPORT_PRODUCT_PATH },
  openGraph: { title, description, url: BLUEPRINT_REPORT_PRODUCT_PATH, siteName: SITE_NAME, type: "website" },
};

/** The two pages the offer leads with, rasterized from a real render (public/brand/). */
const leadPages = [
  {
    src: "/brand/report-page-20.png",
    n: "20",
    t: "Where your card comes from",
    alt: "Page 20 of the Blueprint Report, Where your card comes from: the solar value formula S = 55 minus (2M + D), worked for one birthday to seat 34, the 8 of diamonds, above the solar order of all 52 seats.",
  },
  {
    src: "/brand/report-page-21.png",
    n: "21",
    t: "Deal it yourself",
    alt: "Page 21 of the Blueprint Report, Deal it yourself: eight numbered steps to reproduce every board with a real deck, a checkpoint naming the top and bottom card after step seven, and the three cards the shuffle never moves.",
  },
];

const faqs = [
  {
    q: "Is any of this written by AI?",
    a: "No model writes it. Every card on every page comes out of a fixed lookup table and five lines of arithmetic, and the interpretation copy is a fixed library. The same birthday and reading date produce the same cards. Your purchased report stays pinned to the purchase date.",
  },
  {
    q: "What happens on the call?",
    a: `${CONSULT_MINUTES} minutes, live, with Cass. You bring the report and your questions. Cass brings a deck, deals your boards in front of you, and walks the year with you seat by seat. It is a conversation about coordinates, not a forecast.`,
  },
  {
    q: "How do I book the call?",
    a: `${CONSULT_BOOKING_COPY} No calendar to fight with; the time is set around you.`,
  },
  {
    q: "How is this different from the free year page?",
    a: "The free page shows the seven periods for your birth card. The report adds the ruling-card walk, the seven-year Long Range cycle, the Environment and Displacement seats, every exact repeat across roles, the full boards, the calculation record, and two pages that show the derivation and how to deal every board by hand.",
  },
  {
    q: "Is it a PDF?",
    a: "It is a printable web document with print rules built in, so Save as PDF from your browser produces a clean A4 file. Your link works for 12 months. Save a PDF to keep it.",
  },
  {
    q: "Does it predict anything?",
    a: "No. FIXED means reproducible inside this symbolic system. PATTERN is a possible tendency, never a verdict. YOURS is space for your own experience. Keep what fits and leave what does not.",
  },
  {
    q: "What if my birthday is December 31?",
    a: "December 31 is the Joker, the one date outside the 52-card map, so the report cannot be generated for it. Checkout will say so before you pay.",
  },
];

const samplePages = [
  { n: "02", t: "Birth Card", d: "Your card, its name, and the three expressions: balanced, under, over." },
  { n: "04", t: "Annual walk", d: "The seven dated periods of your birthday year, with the one you are in now marked." },
  { n: "06", t: "Long Range", d: "Seven years, one cycle. Each age and its card, active year blocked out." },
  { n: "17", t: "Full board", d: "The 7 x 7 spread your year is drawn from, every one of your seats outlined." },
  { n: "20", t: "Where your card comes from", d: "The formula, worked for your birthday, and all 52 seats." },
  { n: "21", t: "Deal it yourself", d: "Eight steps to reproduce every board with a real deck. A checkpoint tells you if you slipped." },
];

export default function BlueprintReportPage() {
  // One Product, two Offers: both tiers sell the same document on this URL.
  const reportLd = buildProductJsonLd(report!);
  const consultLd = buildProductJsonLd(consult!);
  const jsonLd = [
    {
      ...reportLd,
      offers: [
        { ...consultLd.offers, name: consult!.name, description: consult!.oneLine },
        { ...reportLd.offers, name: report!.name, description: report!.oneLine },
      ],
    },
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
        { label: BLUEPRINT_REPORT_NAME, href: BLUEPRINT_REPORT_PRODUCT_PATH },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SeoHeroFan codes={["8♦", "Q♠", "5♣"]} className="mb-5" />
      <p className="eyebrow mb-3 text-gold">
        Personal report · from {BLUEPRINT_REPORT_PRICE_LABEL} · ready the moment you pay
      </p>
      <h1 className="display mb-3 text-3xl text-brand-ink">The math shown. Deal it yourself. Then talk it through.</h1>
      <p className="prose-reading mb-6 max-w-[38em] text-mist">
        Your birth card is one seat on a board. This report is the board: every 52-day period of
        your year, the seven-year cycle you are inside, the two seats that describe your
        surroundings, and every exact repeat. Two teaching pages near the end are the point. One works the
        formula for your own birthday. The other shows you how to deal every board with a real
        deck, so nothing here asks for your trust. Then, if you want, {CONSULT_MINUTES} minutes
        with Cass to walk the year together.
      </p>

      <section aria-label="The two pages the report is built around" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {leadPages.map((p) => (
            <figure key={p.n} className="m-0">
              <img
                src={p.src}
                alt={p.alt}
                width={850}
                height={1054}
                loading="eager"
                className="w-full rounded-[3px] border border-white/10 bg-[#eef3f8]"
              />
              <figcaption className="mt-2 text-xs uppercase tracking-[0.16em] text-faint">
                Sample page {p.n} · {p.t}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <p className="mb-6 text-sm text-mist">The sample has {BLUEPRINT_REPORT_PAGE_COUNT} pages. Your page count varies with your ruling cards and the boards for your year.</p>

      <section aria-label="Choose a tier" className="mb-10 grid gap-4 md:grid-cols-[1.15fr_1fr]">
        <article className="rounded-[3px] border-2 border-gold p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">{consult!.badge}</p>
          <h2 className="mt-1 font-serif text-2xl text-brand-ink">
            Report + consultation · {consult!.priceLabel}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">{consult!.oneLine}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
            {consult!.includes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="mt-4 max-w-md">
            <ReportCheckoutButton slug={CONSULT_SLUG} placement="product-page-consult" />
          </div>
        </article>
        <article className="rounded-[3px] border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-faint">Report only</p>
          <h2 className="mt-1 font-serif text-2xl text-brand-ink">
            The report · {report!.priceLabel}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            Your full report, the derivation and the dealing procedure
            included. No call.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
            <li>Where your card comes from, worked for your birthday</li>
            <li>Deal it yourself, every board with a real deck</li>
            <li>Every period, cycle and board, with the calculation record</li>
          </ul>
          <div className="mt-4 max-w-md">
            <ReportCheckoutButton placement="product-page-report" />
          </div>
        </article>
      </section>
      <p className="mb-10 text-sm text-mist">
        Either way, enter your birthday on the next page. A cover name is optional. Wrong date:
        reply to the receipt and it is regenerated.
      </p>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">No model writes this document</h2>
        <p className="prose-reading text-mist">
          Every card on every page came out of a fixed lookup table and five lines of arithmetic.
          Your report stays pinned to your purchase date. The same birthday and reading date give the same cards
          each time. The report ends with the calculation record, the
          derivation of your card worked for your own birthday, and the exact procedure for dealing
          every board with a $3 deck. Nobody is asking you to trust it.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Inside the report</h2>
        <ul className="prose-reading list-disc space-y-1.5 pl-5 text-mist">
          {report!.includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Six of the pages</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {samplePages.map((p) => (
            <div key={p.n} className="rounded-[3px] border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-faint">Sample page {p.n}</p>
              <p className="mt-1 font-serif text-lg text-brand-ink">{p.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-mist">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">How it reads</h2>
        <p className="prose-reading text-mist">
          Three labels run through the whole document. <strong className="text-brand-ink">FIXED</strong> is
          the reproducible calculation. <strong className="text-brand-ink">PATTERN</strong> is sourced
          interpretation: a possible tendency, never a verdict.{" "}
          <strong className="text-brand-ink">YOURS</strong> is ruled space to compare the language with
          your own experience. Cards are coordinates. You choose the meaning.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Questions</h2>
        <dl className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-serif text-lg text-brand-ink">{f.q}</dt>
              <dd className="prose-reading mt-1 text-mist">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-white/10 pt-8">
        <div className="flex max-w-md flex-col gap-3">
          <ReportCheckoutButton slug={CONSULT_SLUG} placement="product-page-bottom-consult" />
          <p className="text-sm text-mist">
            Just the report, no call?{" "}
            <ReportCheckoutButton variant="link" placement="product-page-bottom-report" className="text-gold" />
          </p>
        </div>
        <p className="mt-4 text-sm text-mist">
          Have one specific decision instead of a whole year?{" "}
          <Link href={DEEP_DIVE_PRODUCT_PATH} className="text-gold underline underline-offset-4">
            Ask one question, {DEEP_DIVE_PRICE_LABEL} →
          </Link>
        </p>
      </section>
    </SeoShell>
  );
}
