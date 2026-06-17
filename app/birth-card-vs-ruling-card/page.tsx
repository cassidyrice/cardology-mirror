import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "Birth Card vs Ruling Card: What's the Difference?",
  description:
    "Birth card vs ruling card in Cardology: what each one is, how they differ, and how the planetary ruling card colors the way your birth card expresses.",
  alternates: { canonical: "/birth-card-vs-ruling-card" },
  openGraph: {
    title: "Birth Card vs Ruling Card: What's the Difference?",
    description: "What each card is, how they differ, and how the ruling card colors your birth card.",
    url: "/birth-card-vs-ruling-card",
  },
};

export default function BirthVsRuling() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the difference between a birth card and a ruling card?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your birth card is your core, lifelong significator, set by your birthday. Your planetary ruling card is a second card — tied to your astrological sign — that colors how the birth card expresses itself.",
        },
      },
      {
        "@type": "Question",
        name: "Can you have two ruling cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Some birthdays produce two ruling cards. Both add nuance to how the birth card shows up.",
        },
      },
    ],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth vs Ruling Card", href: "/birth-card-vs-ruling-card" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">Birth Card vs Ruling Card</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          In Cardology, the birth card is the fixed core card assigned to a
          birthday. The ruling card is a second layer selected through the birthday&rsquo;s
          planetary/zodiac context, and it colors how the birth card expresses.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        In Cardology you run on two cards, not one. Your <strong>birth card</strong>{" "}
        is the core — who you are when no one&rsquo;s watching. Your{" "}
        <strong>planetary ruling card</strong> is the second layer that colors how
        that core actually comes out in public. Birth card is the engine; ruling
        card is the paint job everyone meets first.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The birth card — your core</h2>
        <p className="prose-reading text-mist">
          Set purely by your birthday, the birth card is your clearest lifelong
          significator. It describes your fundamental temperament — the way you
          tend to operate before anything else shapes it. It never changes.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The ruling card — your tuning</h2>
        <p className="prose-reading text-mist">
          Your planetary ruling card is tied to your astrological sign. It acts
          like a lens over the birth card: same core, but expressed with a
          different flavor. Two people can share a birth card yet come across
          differently because their ruling cards differ. Some birthdays carry two
          ruling cards, adding even more nuance.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How to read them together</h2>
        <p className="prose-reading text-mist">
          Start with the birth card to understand your base pattern, then read
          the ruling card as the &ldquo;how&rdquo; — the style in which that pattern shows
          up day to day. When the two are clear, most of the picture is in place.
        </p>
      </section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Find both of your cards</p>
        <p className="mt-1 text-sm text-faint">The calculator returns your birth card and ruling card.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Birth Card Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">Compatibility →</Link>
      </p>
    </SeoShell>
  );
}
