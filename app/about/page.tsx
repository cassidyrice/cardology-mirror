import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME, SITE_URL, VIDEO_PATH, CONTACT_EMAIL, CONTACT_RESPONSE } from "@/lib/site";
import { READING_RESPONSE_TIME, READING_SUPPORT_EMAIL } from "@/lib/readings-nav";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/about"];

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Card Blueprints & Cassidy Rice",
  description:
    "About Card Blueprints and founder Cassidy Rice: free card tools, a published method you can check, and the Chemistry Check, a reading about two people.",
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
          Cards are a starting point. Your life is the context.
        </h1>
        <p className="mt-3 text-sm text-brand-ink-soft">Updated {updatedLabel(UPDATED)}</p>
        <div className="mt-6 border border-brand-line bg-brand-paper-deep p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-brand-ink">
            {SITE_NAME} is three things. A free birth-card calculator. A library of traditional card meanings. Personal readings prepared by Cass. Use the cards to look at a pattern. Then bring your own life to it. The cards cannot do that part for you.
          </p>
        </div>
      </header>

      <section className="space-y-5 font-serif text-lg leading-relaxed text-brand-ink">
        
        <p>
          I&apos;m Cass. I was told at five I was the Eight of Diamonds. Card
          Blueprints is the site I built so you can look up your card, read the
          library, and check the math yourself. Don&apos;t take my word for it.
          Do the math.
        </p>
        <p>
          I prepare three readings. The 12-Month Timing Map ($19), for one person. The Chemistry Check ($24), for two. The Family Snapshot ($30), for three. The Chemistry Check pairs both people’s calculated cards and dates with interpretation and questions you can come back to. There is also the $13 Birth Card Blueprint: a 7-page PDF of your birth card and ruling card, made from your birth date and emailed to you.
        </p>
        <p>
          Start with the card your birthday maps to. Then compare it with the cards
          of the people around you. Partners. Parents. Friends. Coworkers. Public
          figures. The relationship that keeps teaching you the same lesson,
          because you keep not learning it.
        </p>
        <p>
          The birthday mapping is fixed. The interpretation is where it gets
          uncomfortable. The suit shows the life domain. The rank shows the movement.
          The card offers a traditional pattern. You hold it up against real behavior
          and see what flinches.
        </p>
        <p>
          One card is not the whole person. It can raise questions. How someone loves,
          thinks, values, works. What they avoid. Where they reach. What they give and
          what they withhold. Who takes command when the pressure rises. Sometimes
          it&apos;s you.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-5">
        <h2 className="font-serif text-3xl text-brand-ink">Who runs Card Blueprints</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints is built and maintained by <strong>Cassidy Rice</strong>, its
          founder. Cassidy built the deterministic calculation engine behind every page
          on this site. Same birthday, same card. Same spread. Same timing math. Every
          reading can be checked by hand, and you should. The interpretation layer is
          curated from the published cardology tradition and labeled as
          interpretation, not fact.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Start with the free birth card calculator. Then the birthday directory.
          Compare two people. Read any of the 52 card meanings. The calculations
          and sources are published in the{" "}
          <Link href="/methodology" className="underline">
            methodology
          </Link>{" "}
          so you can see where your cards come from and form your own interpretation.
          You are allowed to disagree.
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
          . General questions, corrections, and support for other purchases receive a reply within {CONTACT_RESPONSE}.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Follow-up questions about a Chemistry Check go to{" "}
          <a href={`mailto:${READING_SUPPORT_EMAIL}`} className="underline">{READING_SUPPORT_EMAIL}</a>. {READING_RESPONSE_TIME} Every response is personally reviewed and approved by Cass.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-5">
        <h2 className="font-serif text-3xl text-brand-ink">Business identity</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints is an online publisher of Cardology tools and written
          reports at {SITE_URL.replace("https://", "")}. It is not a clinic,
          church, licensed counseling practice, or accredited school. Cassidy
          Rice is the founder and the named author of the public method. There
          is no staff of readers behind the calculator. It is math.
        </p>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Public mail is{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
            {CONTACT_EMAIL}
          </a>
          . For general order administration, refunds, and delivery issues, expect a reply within {CONTACT_RESPONSE}. The personal-reading follow-up service above has its own 24-hour response commitment. Editorial corrections are logged on the{" "}
          <Link href="/editorial-policy" className="underline">
            editorial policy
          </Link>{" "}
          page when a page changes.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-5">
        <h2 className="font-serif text-3xl text-brand-ink">Named sources</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints did not invent the deck-to-calendar idea. Nobody here
          is pretending otherwise. The lineage we name in public is
          Olney Richmond&rsquo;s{" "}
          <em>The Mystic Test Book</em> (1893), later work by Florence Campbell
          and Edith Randall, and contemporary Destiny Cards / Love Cards /
          Science of the Cards teaching associated with Robert Lee Camp. Chart
          footnotes can differ by teacher. When two tools disagree, use the{" "}
          <Link href="/methodology" className="underline">
            published formula
          </Link>{" "}
          and the 366-row map. Not whichever answer you liked better.
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
          A written reading gives you something to come back to. Underline what fits. Argue with what does not. Notice what changes in a real conversation. I personally prepare your reading and review every follow-up response.
        </p>
        <Link href="/#readings" className="ink-button large-button">Choose your reading</Link>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-serif text-3xl text-brand-ink">Research and data</h2>
        <p className="font-serif text-lg leading-relaxed text-brand-ink">
          Card Blueprints publishes the calculation layer so you can inspect the work.
          No black box. No trust me. The complete birthday map covers all 366
          month-and-day combinations, including leap day and the December 31 Joker
          boundary.
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
            </Link>
            : how pages are maintained and labeled.
          </li>
          <li>
            <Link href="/methodology" className="underline">
              Methodology
            </Link>
            : how calculation works, with a worked example. Show your work.
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
            How fixed birthday math turns into a card reading. No magic. Arithmetic.
          </p>
        </Link>
        <Link href="/cardology-for-beginners" className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Beginners path</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            Ten minutes from first card to first comparison. You have spent longer on worse.
          </p>
        </Link>
        <Link href={VIDEO_PATH} className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Videos</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            The written Cardology guide, out loud. For when reading feels like homework.
          </p>
        </Link>
        <Link href="/contact" className="border border-brand-line bg-brand-paper-deep p-5 transition hover:bg-brand-ivory">
          <p className="font-serif text-2xl text-brand-ink">Contact</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            Corrections, questions, partnership requests. Be specific.
          </p>
        </Link>
      </section>
    </SeoShell>
  );
}
