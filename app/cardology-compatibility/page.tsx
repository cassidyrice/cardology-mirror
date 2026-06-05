import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "Cardology Compatibility: How Two Birth Cards Connect",
  description:
    "How Cardology compatibility works — read the connection between two birth cards as the meeting of two operating systems. Compare any two birthdays free.",
  alternates: { canonical: "/cardology-compatibility" },
  openGraph: {
    title: "Cardology Compatibility: How Two Birth Cards Connect",
    description: "Read the connection between two birth cards as the meeting of two operating systems.",
    url: "/cardology-compatibility",
  },
};

export default function CompatibilityPage() {
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Compatibility", href: "/cardology-compatibility" }]}>
      <h1 className="display mb-3 text-3xl text-bone">Cardology Compatibility</h1>
      <p className="prose-reading mb-6 text-mist">
        Cardology reads compatibility as the meeting of two{" "}
        <strong>operating systems</strong> — not a score out of ten. Each
        person&rsquo;s birth card describes how they tend to move; putting two
        cards side by side shows where they speak the same language and where
        they pull in different directions.
      </p>

      <div className="card-surface rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Compare two birthdays</p>
        <p className="mt-1 text-sm text-faint">See both birth cards and how they connect.</p>
        <Link
          href="/birth-card-compatibility-calculator"
          className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink"
        >
          Open the compatibility calculator →
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">What a connection actually means</h2>
        <p className="prose-reading text-mist">
          Two cards in the same suit tend to share a first instinct — both lead
          from relationships, or values, or mind, or will. Cards in different
          suits lead from different places, which can be friction or balance
          depending on how aware each person is of the difference. The point
          isn&rsquo;t to predict the relationship — it&rsquo;s to name the dynamic so
          two people can work with it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The four suits, four instincts</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#e0654a]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#d9b26a]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#7fae8f]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#7b6cf0]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Start with yourself</h2>
        <p className="prose-reading text-mist">
          Compatibility makes more sense once you understand your own card first.
          {" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            Find your birth card
          </Link>
          , then read{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            how the birth card and ruling card differ
          </Link>
          .
        </p>
      </section>
    </SeoShell>
  );
}
