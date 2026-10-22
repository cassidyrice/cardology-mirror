import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Birth Card vs Ruling Card: What's the Difference?",
  description:
    "Birth card vs ruling card in Cardology. One is who you are alone. One is how it leaks out in public. How the ruling card colors your birth card.",
  alternates: { canonical: "/birth-card-vs-ruling-card" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Birth Card vs Ruling Card: What's the Difference?",
    description: "One card for who you are. One for how it comes out. How the ruling card colors your birth card.",
    url: "/birth-card-vs-ruling-card",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
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
          text: "Your birth card is your core, lifelong significator, set by your birthday. Your planetary ruling card is a second card, tied to your astrological sign. It colors how the birth card expresses itself.",
        },
      },
      {
        "@type": "Question",
        name: "Can you have two ruling cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Some birthdays produce two ruling cards. Both add nuance to how the birth card shows up. More layers, same you.",
        },
      },
    ],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth vs Ruling Card", href: "/birth-card-vs-ruling-card" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-brand-ink">Birth Card vs Ruling Card</h1>
      <div className="mb-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          In Cardology, the birth card is the fixed core card assigned to a
          birthday. The ruling card is a second layer selected through the birthday&rsquo;s
          planetary/zodiac context. It colors how the birth card expresses.
        </p>
      </div>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        In Cardology you run on two cards, not one. Your <strong>birth card</strong>{" "}
        is the core. Who you are when no one&rsquo;s watching. Your{" "}
        <strong>planetary ruling card</strong> is the second layer that colors how
        that core actually comes out in public. Birth card is the engine. Ruling
        card is the paint job everyone meets first and judges you on.
      </p>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The birth card: your core</h2>
        <p className="prose-reading text-brand-ink-soft">
          Set purely by your birthday, the birth card is your clearest lifelong
          significator. It describes your fundamental temperament. The way you
          operate before anything else gets a vote. It never changes. You have
          tried.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The ruling card: your tuning</h2>
        <p className="prose-reading text-brand-ink-soft">
          Your planetary ruling card is tied to your astrological sign. It acts
          like a lens over the birth card. Same core, different flavor. Two
          people can share a birth card and still come across nothing alike,
          because their ruling cards differ. Some birthdays carry two ruling
          cards. Even more nuance. Even more to explain at parties.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How to read them together</h2>
        <p className="prose-reading text-brand-ink-soft">
          Start with the birth card. That is your base pattern. Then read the
          ruling card as the &ldquo;how&rdquo;: the style that pattern wears day to
          day. When the two are clear, most of the picture is in place. The rest
          is you pretending it isn&rsquo;t.
        </p>
      </section>


      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Find both of your cards</p>
        <p className="mt-1 text-sm text-brand-ink-soft">The calculator returns your birth card and ruling card. Free. Takes less time than this paragraph.</p>
        <Link href="/birth-card-calculator" className="ink-button mt-3">
          Birth Card Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/planetary-ruling-card" className="text-brand-oxblood underline underline-offset-4">Planetary ruling card chart: all 366 birthdays →</Link>
        {"  ·  "}
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cardology-compatibility" className="text-brand-oxblood underline underline-offset-4">Compatibility →</Link>
      </p>
    </SeoShell>
  );
}
