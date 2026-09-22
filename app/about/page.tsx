import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ONE_QUESTION_TURNAROUND } from "@/lib/deep-dive";
import { SITE_NAME, SITE_URL, VIDEO_PATH, CONTACT_EMAIL, CONTACT_RESPONSE } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/about"];

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Card Blueprints & Cassidy Rice",
  description:
    "About Card Blueprints and founder Cassidy Rice: how we calculate birth cards, publish free Cardology tools, and write the $13 One Question Reading — one decision, read from your card and your year.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Card Blueprints",
    url: `${SITE_URL}/about`,
    dateModified: UPDATED,
    about: {
      "@type": "Thing",
      name: "Cardology",
      description:
        "A 52-card birth-date system used by Card Blueprints to read people, relationships, timing, and recurring patterns.",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    author: {
      "@type": "Person",
      name: "Cassidy Rice",
      jobTitle: "Founder",
      url: `${SITE_URL}/about`,
      worksFor: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
  };

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Cassidy Rice",
    jobTitle: "Founder",
    url: `${SITE_URL}/about`,
    email: CONTACT_EMAIL,
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    knowsAbout: ["Cardology", "Playing card astrology", "Birth card systems", "Cartomancy"],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">About the reference</p>
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          Card Blueprints reads birth cards, timing, and compatibility through the 52-card system.
        </h1>
        <p className="mt-3 text-sm text-brand-ink-soft">Updated {updatedLabel(UPDATED)}</p>
        <div className="mt-6 border border-brand-line bg-brand-paper-deep p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-brand-ink">
            {SITE_NAME} starts with a birth date, calculates the card with a deterministic
            engine, and turns the card into language for people, relationships, timing,
            and repeated dynamics. Free tools come first; the paid product is the $13
            One Question Reading, one question written up from your card and your year — not a phone reading.
          </p>
        </div>
      </header>

      <section className="space-y-5 font-serif text-lg leading-relaxed text-brand-ink">
        
        <p>
          I&apos;m Cass. I was told at five I was the Eight of Diamonds. Card
          Blueprints is the site I built so you can look up your card, read the
          library, and check the math yourself.
        </p>
        <p>
          The paid product is the $13 One Question Reading: you bring one question,
          I read it from your birth card, this year's cards, and the card you owe,
          and it lands in your inbox within {ONE_QUESTION_TURNAROUND}.
        </p>
        <p>
          Start with the card your birthday maps to. Then compare it with the cards
          of the people around you: partners, parents, friends, coworkers, public
          figures, and the relationships that keep teaching you the same lesson.
        </p>
        <p>
          The birthday mapping is fixed. The interpretation is where the system comes
          alive: the suit shows the life domain, the rank shows the movement, and the
          card shows the pattern that keeps trying to express through real behavior.
        </p>
        <p>
          One card is not the whole person. It is the repeating shape: how someone
          loves, thinks, values, works, avoids, reaches, gives, withholds, or takes
          command when pressure rises.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-5">
        <h2 className="font-serif text-3xl text-brand-ink">Who runs Card Blueprints</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints is built and maintained by <strong>Cassidy Rice</strong>, its
          founder. Cassidy built the deterministic calculation engine behind every page
          on this site — the same birthday always produces the same card, the same
          spread, and the same timing math, so every reading can be checked by hand.
          The interpretation layer is curated from the published cardology tradition
          and labeled as interpretation, not fact.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Experience on this site means shipping the tools people actually use: the free
          birth card calculator, the birthday and compatibility directories, the 52 card
          meanings, and the One Question Reading pipeline. Expertise means
          publishing the method in public — see{" "}
          <Link href="/methodology" className="underline">
            methodology
          </Link>{" "}
          — and refusing fortune-telling claims that the math cannot support.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Corrections and questions are welcome at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>{" "}
          or through the{" "}
          <Link href="/contact" className="underline">
            contact page
          </Link>
          . Purchase support is answered within {CONTACT_RESPONSE}. Cardology is
          a lens for self-awareness — it describes patterns, not fate.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-5">
        <h2 className="font-serif text-3xl text-brand-ink">Business identity</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints is an online publisher of Cardology tools and written
          reports at {SITE_URL.replace("https://", "")}. It is not a clinic,
          church, licensed counseling practice, or accredited school. Cassidy
          Rice is the founder and the named author of the public method. There
          is no staff of readers behind the calculator.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Public mail is{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          . Expect a reply within {CONTACT_RESPONSE} for purchase, refund, and
          delivery issues. Editorial corrections are logged on the{" "}
          <Link href="/editorial-policy" className="underline">
            editorial policy
          </Link>{" "}
          page when a page changes.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-5">
        <h2 className="font-serif text-3xl text-brand-ink">Named sources</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints did not invent the deck-to-calendar idea. The lineage
          we name in public is Olney Richmond&rsquo;s{" "}
          <em>The Mystic Test Book</em> (1893), later work by Florence Campbell
          and Edith Randall, and contemporary Destiny Cards / Love Cards /
          Science of the Cards teaching associated with Robert Lee Camp. Chart
          footnotes can differ by teacher. When two tools disagree, use the{" "}
          <Link href="/methodology" className="underline">
            published formula
          </Link>{" "}
          and the 366-row map.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          See the synonym map on{" "}
          <Link href="/destiny-cards" className="underline">
            Destiny Cards
          </Link>{" "}
          and the history note on{" "}
          <Link href="/what-is-cardology" className="underline">
            What is Cardology
          </Link>
          .
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-serif text-3xl text-brand-ink">Why a written reading</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          The free calculator answers “what is my card?” The reading answers “what does
          my card say about this one decision?” The One Question Reading is a one-time
          $13 purchase: your birth card, this year's Long Range and Pluto cards, and the
          card you owe, read against the question you bring, written for you within{" "}
          {ONE_QUESTION_TURNAROUND}. Read it once, then watch the next few weeks. Historical phone
          fulfillment still works for people who already purchased access; new public
          SEO pages point to the reading.
        </p>
        <Link
          href="/products/one-question-reading"
          className="inline-block rounded-full border border-brand-ink bg-brand-ink px-5 py-2.5 text-sm font-semibold text-brand-on-dark"
        >
          One Question Reading — $13
        </Link>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-serif text-3xl text-brand-ink">Research and data</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints publishes the calculation layer so readers can inspect the
          work instead of trusting a black-box result. The complete birthday map covers
          all 366 month-and-day combinations, including leap day and the December 31
          Joker boundary.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/methodology#birthday-map-dataset"
            className="inline-block rounded-full border border-brand-line-strong px-5 py-2.5 text-sm font-semibold text-brand-oxblood"
          >
            Methodology and CSV
          </Link>
          <a
            href="https://buttondown.com/cardblueprint/archive/i-published-the-full-366-date-cardology-map/"
            className="inline-block rounded-full border border-brand-line-strong px-5 py-2.5 text-sm font-semibold text-brand-oxblood"
          >
            Read the 366-date publication note
          </a>
        </div>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-serif text-3xl text-brand-ink">Trust &amp; policies</h2>
        <ul className="space-y-2 font-serif text-lg leading-relaxed text-brand-ink">
          <li>
            <Link href="/editorial-policy" className="underline">
              Editorial policy
            </Link>{" "}
            — how pages are maintained and labeled.
          </li>
          <li>
            <Link href="/methodology" className="underline">
              Methodology
            </Link>{" "}
            — how calculation works, with a worked example.
          </li>
          <li>
            <Link href="/privacy-policy" className="underline">
              Privacy
            </Link>
            ,{" "}
            <Link href="/refund-policy" className="underline">
              refunds
            </Link>
            ,{" "}
            <Link href="/terms-of-service" className="underline">
              terms
            </Link>
            .
          </li>
        </ul>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link href="/methodology" className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Methodology</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            How fixed birthday math becomes a card reading.
          </p>
        </Link>
        <Link href="/cardology-for-beginners" className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Beginners path</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            Ten-minute path from first card to first comparison.
          </p>
        </Link>
        <Link href={VIDEO_PATH} className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Videos</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            Watch the multimedia companion to the written Cardology guide.
          </p>
        </Link>
        <Link href="/contact" className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Contact</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            Send corrections, questions, or partnership requests.
          </p>
        </Link>
      </section>
    </SeoShell>
  );
}
