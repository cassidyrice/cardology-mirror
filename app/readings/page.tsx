import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import {
  READER_PHONE_DISPLAY,
  READER_PHONE_TEL,
  TRIAL_OFFER,
  TRIAL_PATH,
} from "@/lib/offers";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Readings: $29 Report, $99 AI Voice, $199 Deep Dive",
  description:
    "Choose a $29 written birth card report, $99 AI voice reading with 90 days of calls, or $199 human-written deep dive.",
  alternates: { canonical: "/readings" },
  openGraph: {
    title: "Personal Cardology Readings and Reports",
    description:
      "Choose a written Card Blueprints report, 90-day AI voice reading, or human-written deep dive.",
    url: "/readings",
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const visibleFaqs = [
  {
    q: "Can I try it free before paying?",
    a: TRIAL_OFFER.trialAvailable
      ? `Yes. Call ${READER_PHONE_DISPLAY} free — the AI reader answers, asks your birthday, and reads your first card on the spot. For a longer test drive, the $9 Deck Pass trial gives seven days of unlimited AI readings before you commit to the full pass.`
      : `Yes. Call ${READER_PHONE_DISPLAY} free — the AI reader answers, asks your birthday, and reads your first card on the spot. A $9 seven-day trial is opening soon; until then the $99 pass opens unlimited calls for 90 days.`,
  },
  {
    q: "Which Cardology reading should I start with?",
    a: "Start with the $29 written report for one person's core structure. Choose the $99 AI voice reading when you want a full reading now plus return calls for 90 days. Choose the $199 human-written deep dive for the fullest personal and relational map.",
  },
  {
    q: "What happens after I pay?",
    a: "Checkout is secure through Stripe. For the $99 AI voice reading, call from the phone number used at checkout. For written options, confirm the birth details and focus on the intake form, then receive the finished reading by email.",
  },
  {
    q: "Can a reading look at another person or relationship?",
    a: "Yes. Cardology is often most useful when it compares real people: partners, family members, friends, coworkers, creative collaborators, or repeated dynamics. A reading can name the pattern without reducing anyone to one card.",
  },
  {
    q: "What details are needed for a reading?",
    a: "A birth date. Written deep dives also need the question or area of focus. The AI voice guide can ask for a second birth date during the call when you want to discuss a relationship.",
  },
  {
    q: "Is this a prediction of the future?",
    a: "No. Cardology is deterministic pattern language — a mirror, not a forecast. The reading names the structure you are working with and what the current timing tends to press on, so you can make the call with clearer eyes.",
  },
  {
    q: "What about refunds?",
    a: "Written work can be fully refunded before it begins. AI voice access can be fully refunded before the first paid call. After a written reading begins or paid voice access is used, refunds are limited and reviewed fairly. See the refund policy for details.",
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
          One clear ladder: a $29 written birth card report, a $99 AI voice
          reading with 90 days of calls, and a $199 human-written deep dive.
        </p>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5" data-ai-summary>
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Start with the $29 report for one person&rsquo;s core birth-card structure.
            Move to the $99 AI voice guide when you want a full reading now and
            return calls for 90 days. Choose the $199 human-written deep dive when
            you want the fullest personal and relational Cardology map.
          </p>
        </div>
      </header>

      <section className="mb-8 grid gap-5 border border-[#14110d]/18 bg-[#14110d] p-6 text-[#f4f0e7] sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="oracle-eyebrow text-[#c8bca8]">Step zero — free</p>
          <h2 className="mt-3 font-serif text-3xl leading-none sm:text-4xl">
            Hear the AI reader before you buy anything.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#d7cdbc] sm:text-base">
            Call free — the AI reader answers, asks your birthday, and reads
            your first card on the spot. No account, no card. Then decide
            whether the trial or the full pass comes next.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a href={READER_PHONE_TEL} className="paper-button large-button text-center">
            Call {READER_PHONE_DISPLAY}
          </a>
          <Link
            href={TRIAL_PATH}
            className="text-center text-sm font-bold uppercase text-[#d9b26a] underline underline-offset-4"
          >
            About the $9 seven-day Deck Pass trial →
          </Link>
        </div>
      </section>

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
              {offer.checkoutNote}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-[#14110d]/18 bg-[#f4f0e7]/82 p-6 shadow-[0_1.5rem_4rem_rgba(20,17,13,0.08)] sm:p-7">
          <p className="oracle-eyebrow text-[#9e3d24]">What the written options sound like</p>
          <h2 className="mt-3 font-serif text-3xl leading-none text-[#14110d]">
            A written excerpt, so you know what those options feel like.
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
            The written report and deep dive name the pattern, the shadow range,
            and the next clean step.
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
                <strong className="text-[#9e3d24]">02</strong> — For AI voice access, use the phone number from checkout. For written options, confirm the birth details and focus on the intake form.
              </li>
              <li className="border-t border-[#14110d]/12 pt-3">
                <strong className="text-[#9e3d24]">03</strong> — Call the AI guide right away, or receive the written option by email when it is ready.
              </li>
            </ol>
          </div>
          <div className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
            <h2 className="font-serif text-2xl text-[#14110d]">Straight terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3d352d]">
              The $99 phone option is delivered by an AI voice guide. The $29 and
              $199 options are written for your birth details. Refunds are simple
              before written work begins or before the first paid AI call; after
              use begins they are limited. Read the{" "}
              <Link href="/refund-policy" className="text-[#9e3d24] underline underline-offset-4">refund policy</Link>
              {" "}or <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">ask a question</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
          <h2 className="font-serif text-3xl text-[#14110d]">What every reading can look at</h2>
          <p className="mt-4 text-base leading-relaxed text-[#5b5148]">
            A Card Blueprints reading uses the deterministic birth-card system, then
            turns it into useful language for behavior, compatibility, attraction,
            friction, family roles, creative pressure, money habits, timing, and the
            patterns people keep repeating with each other. It should clarify the
            person or dynamic without flattening anyone into a single card.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#5b5148]">
            The $29 and $199 written options are prepared by Cass — Eight of
            Diamonds in the Crown Line, told so at five years old, with decades
            inside the symbols and years reverse-engineering the structure
            underneath them. The $99 phone option is delivered by an AI voice guide.{" "}
            <Link href="/about" className="text-[#9e3d24] underline underline-offset-4">
              About Card Blueprints →
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
