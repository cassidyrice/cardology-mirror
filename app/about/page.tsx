import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME, SITE_URL, VIDEO_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Card Blueprints",
  description:
    "Learn how Card Blueprints calculates birth cards and reads people, relationships, timing, and recurring dynamics through the 52-card system.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Card Blueprints",
    url: `${SITE_URL}/about`,
    about: {
      "@type": "Thing",
      name: "Cardology",
      description:
        "A 52-card birth-date system used by Card Blueprints to read people, relationships, timing, and recurring patterns.",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    author: { "@type": "Person", name: "Cassidy Rice", jobTitle: "Founder", url: `${SITE_URL}/about` },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">About the reference</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Card Blueprints reads birth cards, timing, and compatibility through the 52-card system.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            {SITE_NAME} starts with a birth date, calculates the card, and turns the
            card into language for people, relationships, timing, and repeated
            dynamics.
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
          Corrections and questions are welcome through the{" "}
          <Link href="/contact" className="underline">contact page</Link>. Cardology is
          a lens for self-awareness — it describes patterns, not fate.
        </p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link href="/methodology" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Methodology</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            How fixed birthday math becomes a card reading.
          </p>
        </Link>
        <Link href="/editorial-policy" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Editorial policy</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            How the reference is maintained.
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
            Send corrections, questions, or partnership requests through the public contact page.
          </p>
        </Link>
      </section>
    </SeoShell>
  );
}
