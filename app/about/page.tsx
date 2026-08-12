import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME, SITE_URL, VIDEO_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Card Blueprints & Cassidy Rice",
  description:
    "About Card Blueprints and founder Cassidy Rice: how we calculate birth cards, publish free Cardology tools, and deliver the $13 Personal Card Blueprint as an instant written report.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Card Blueprints",
    url: `${SITE_URL}/about`,
    dateModified: "2026-08-07",
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
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Card Blueprints reads birth cards, timing, and compatibility through the 52-card system.
        </h1>
        <p className="mt-3 text-sm text-[#5b5148]">Updated August 7, 2026</p>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            {SITE_NAME} starts with a birth date, calculates the card with a deterministic
            engine, and turns the card into language for people, relationships, timing,
            and repeated dynamics. Free tools come first; the paid product is a written
            Personal Card Blueprint — not a phone reading.
          </p>
        </div>
      </header>

      <section className="space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
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
        <h2 className="font-serif text-3xl text-[#14110d]">Who runs Card Blueprints</h2>
        <p className="font-serif text-lg leading-relaxed text-[#3d352d]">
          Card Blueprints is built and maintained by <strong>Cassidy Rice</strong>, its
          founder. Cassidy built the deterministic calculation engine behind every page
          on this site — the same birthday always produces the same card, the same
          spread, and the same timing math, so every reading can be checked by hand.
          The interpretation layer is curated from the published cardology tradition
          and labeled as interpretation, not fact.
        </p>
        <p className="font-serif text-lg leading-relaxed text-[#3d352d]">
          Experience on this site means shipping the tools people actually use: the free
          birth card calculator, the birthday and compatibility directories, the 52 card
          meanings, and the Personal Card Blueprint report pipeline. Expertise means
          publishing the method in public — see{" "}
          <Link href="/methodology" className="underline">
            methodology
          </Link>{" "}
          — and refusing fortune-telling claims that the math cannot support.
        </p>
        <p className="font-serif text-lg leading-relaxed text-[#3d352d]">
          Corrections and questions are welcome through the{" "}
          <Link href="/contact" className="underline">
            contact page
          </Link>
          . Cardology is a lens for self-awareness — it describes patterns, not fate.
        </p>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-serif text-3xl text-[#14110d]">Why a written Blueprint</h2>
        <p className="font-serif text-lg leading-relaxed text-[#3d352d]">
          The free calculator answers “what is my card?” The Blueprint answers “what
          does the whole pattern look like in writing?” It is a one-time $13 digital
          report delivered after checkout — birth card, ruling layer, and current
          chapter — so you can reread it without booking a call. Historical phone
          fulfillment still works for people who already purchased access; new public
          SEO pages point to the written product.
        </p>
        <Link
          href="/products/personal-card-blueprint"
          className="inline-block rounded-full border border-[#14110d] bg-[#14110d] px-5 py-2.5 text-sm font-semibold text-[#f4f0e7]"
        >
          Personal Card Blueprint — $13
        </Link>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <h2 className="font-serif text-3xl text-[#14110d]">Trust &amp; policies</h2>
        <ul className="space-y-2 font-serif text-lg leading-relaxed text-[#3d352d]">
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
        <Link href="/methodology" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Methodology</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            How fixed birthday math becomes a card reading.
          </p>
        </Link>
        <Link href="/cardology-for-beginners" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Beginners path</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            Ten-minute path from first card to first comparison.
          </p>
        </Link>
        <Link href={VIDEO_PATH} className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Videos</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            Watch the multimedia companion to the written Cardology guide.
          </p>
        </Link>
        <Link href="/contact" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Contact</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            Send corrections, questions, or partnership requests.
          </p>
        </Link>
      </section>
    </SeoShell>
  );
}
