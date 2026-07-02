import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Personal Cardology Readings: $29 Report, $99 Question, $199 Deep Dive",
  description:
    "Buy a personal Cardology reading: $29 basic birth card report, $99 one-question reading, or $199 full deep dive. Written from your birth date, delivered by email.",
  alternates: { canonical: "/readings" },
  openGraph: {
    title: "Personal Cardology Readings and Reports",
    description:
      "Choose a Cardology Pro report or personal reading: basic birth card report, one-question reading, or full deep dive.",
    url: "/readings",
    type: "website",
  },
};

const visibleFaqs = [
  {
    q: "Which Cardology reading should I start with?",
    a: "Start with the $29 basic birth card report if you want the core structure for one person. Choose the $99 one-question reading when you have one specific person, relationship, or decision on the table. Choose the $199 deep dive for the fullest personal and relational map.",
  },
  {
    q: "What happens after I pay?",
    a: "Checkout is instant and secure through Stripe. Right after payment you land on a short intake form: the birth date, the person or relationship involved, and your question. The written reading is then prepared for those exact details and delivered by email.",
  },
  {
    q: "Can a reading look at another person or relationship?",
    a: "Yes. Cardology is often most useful when it compares real people: partners, family members, friends, coworkers, creative collaborators, or repeated dynamics. A reading can name the pattern without reducing anyone to one card.",
  },
  {
    q: "What details are needed for a reading?",
    a: "A birth date. The one-question and deep dive readings also need the question or area of focus, and a second birth date if the question is about a relationship.",
  },
  {
    q: "Is this a prediction of the future?",
    a: "No. Cardology is deterministic pattern language — a mirror, not a forecast. The reading names the structure you are working with and what the current timing tends to press on, so you can make the call with clearer eyes.",
  },
  {
    q: "What about refunds?",
    a: "Before work on your reading begins, refunds are simple — just reply to your receipt. Because every reading is custom written for your birth details, refunds are limited once the work is underway. If anything in a delivered reading is unclear, ask and it gets clarified.",
  },
];

export default function ReadingsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Personal Cardology Readings and Reports",
      description: metadata.description,
      url: `${SITE_URL}/readings`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: READING_OFFERS.map((offer, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: offer.name,
          url: `${SITE_URL}/readings#${offer.slug}`,
        })),
      },
    },
    ...READING_OFFERS.map((offer) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: offer.name,
      description: offer.oneLine,
      category: "Cardology reading",
      brand: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/readings#${offer.slug}`,
      offers: {
        "@type": "Offer",
        price: offer.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}${readingOfferHref(offer)}`,
      },
    })),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: visibleFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Readings", href: "/readings" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Personal Cardology readings</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Choose the reading for the person, question, or dynamic you are trying to understand.
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          One clear ladder: a $29 basic birth card report, a $99 one-question
          reading, and a $199 full deep dive. Written for your birth details,
          delivered by email.
        </p>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5" data-ai-summary>
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Start with the $29 report for one person&rsquo;s core birth-card structure.
            Move to the $99 reading when you have one specific question about a
            person, relationship, or situation. Choose the $199 deep dive when you
            want the fullest personal and relational Cardology map.
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {READING_OFFERS.map((offer) => (
          <article
            id={offer.slug}
            key={offer.slug}
            className="flex flex-col border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5"
          >
            <p className="oracle-eyebrow text-[#9e3d24]">{offer.priceLabel}</p>
            <h2 className="mt-3 font-serif text-3xl leading-none text-[#14110d]">
              {offer.name}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5b5148]">{offer.oneLine}</p>
            <dl className="mt-5 space-y-4 text-sm leading-relaxed text-[#5b5148]">
              <div>
                <dt className="font-bold uppercase text-[#14110d]">Best for</dt>
                <dd>{offer.bestFor}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#14110d]">Deliverable</dt>
                <dd>{offer.deliverable}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#14110d]">Turnaround</dt>
                <dd>{offer.turnaround}</dd>
              </div>
            </dl>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-[#3d352d]">
              {offer.includes.map((item) => (
                <li key={item} className="border-t border-[#14110d]/12 pt-2">
                  {item}
                </li>
              ))}
            </ul>
            <Link href={readingOfferHref(offer)} className="ink-button large-button mt-6 text-center">
              {offer.cta}
            </Link>
            <p className="mt-3 text-center text-xs text-[#5b5148]">
              Instant secure checkout · intake right after payment
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-[#14110d]/18 bg-[#f4f0e7]/82 p-6 shadow-[0_1.5rem_4rem_rgba(20,17,13,0.08)] sm:p-7">
          <p className="oracle-eyebrow text-[#9e3d24]">What the writing sounds like</p>
          <h2 className="mt-3 font-serif text-3xl leading-none text-[#14110d]">
            An excerpt, so you know what you are buying.
          </h2>
          <blockquote className="mt-5 border-l-2 border-[#9e3d24]/40 pl-5 font-serif text-lg leading-relaxed text-[#3d352d]">
            <p>
              &ldquo;Your card leads with responsibility and it recruits for it.
              In this relationship that shows up as you carrying the logistics —
              and then resenting that nobody asked you to. Her card does not read
              your effort as love; it reads it as management. The friction you
              described is not a values problem. It is two cards protecting
              themselves in opposite directions, and it has a middle lane…&rdquo;
            </p>
          </blockquote>
          <p className="mt-4 text-sm leading-relaxed text-[#5b5148]">
            Plain language about a real dynamic. No fog, no doom, no flattery.
            Every reading names the pattern, the shadow range, and the next
            clean step.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
            <h2 className="font-serif text-2xl text-[#14110d]">How it works</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#3d352d]">
              <li className="border-t border-[#14110d]/12 pt-3">
                <strong className="text-[#9e3d24]">01</strong> — Pick the reading and check out securely through Stripe.
              </li>
              <li className="border-t border-[#14110d]/12 pt-3">
                <strong className="text-[#9e3d24]">02</strong> — Confirm the birth date, the person or relationship, and your question on the intake form.
              </li>
              <li className="border-t border-[#14110d]/12 pt-3">
                <strong className="text-[#9e3d24]">03</strong> — Receive the written reading by email, built for those exact details.
              </li>
            </ol>
          </div>
          <div className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
            <h2 className="font-serif text-2xl text-[#14110d]">Straight terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3d352d]">
              Every reading is custom written for your birth details — nothing
              is generated in bulk and resold. Refunds are simple before work
              begins; once your reading is underway they are limited, because
              the work cannot be restocked. If anything in a delivered reading
              is unclear, <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">ask</Link> and
              it gets clarified.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
          <h2 className="font-serif text-3xl text-[#14110d]">What every reading can look at</h2>
          <p className="mt-4 text-base leading-relaxed text-[#5b5148]">
            A Cardology Pro reading uses the deterministic birth-card system, then
            turns it into useful language for behavior, compatibility, attraction,
            friction, family roles, creative pressure, money habits, timing, and the
            patterns people keep repeating with each other. It should clarify the
            person or dynamic without flattening anyone into a single card.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#5b5148]">
            The readings are written by Cass — Eight of Diamonds in the Crown
            Line, told so at five years old, with decades inside the symbols and
            years reverse-engineering the structure underneath them.{" "}
            <Link href="/about" className="text-[#9e3d24] underline underline-offset-4">
              About Cardology Pro →
            </Link>
          </p>
        </div>
        <div className="border border-[#14110d]/15 bg-[#14110d] p-5 text-[#f4f0e7]">
          <h2 className="font-serif text-3xl">Start with the calculator if you are unsure.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#d7cdbc]">
            If you do not know the card yet, calculate it first — free. The report and
            readings become stronger when you can name your card, another person&rsquo;s
            card, and the real-life question between them.
          </p>
          <Link href="/birth-card-calculator" className="mt-5 inline-block text-[#d9b26a] underline underline-offset-4">
            Open the Birth Card Calculator →
          </Link>
        </div>
      </section>

      <section className="mt-12 border-t border-[#14110d]/15 pt-8">
        <h2 className="font-serif text-4xl leading-none text-[#14110d]">Frequently asked questions</h2>
        <div className="mt-5 space-y-4">
          {visibleFaqs.map((faq) => (
            <div key={faq.q} className="border-t border-[#14110d]/15 pt-4">
              <h3 className="font-serif text-2xl text-[#14110d]">{faq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-[#5b5148]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </SeoShell>
  );
}
