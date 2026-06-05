import Link from "next/link";
import type { Metadata } from "next";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { ReturningUserRedirect } from "@/components/seo/ReturningUserRedirect";

export const metadata: Metadata = {
  title: { absolute: "Cardology Pro: Find Your Birth Card & Read It as a Mirror" },
  description:
    "Find your Cardology birth card from your birthday, then read what it means — strengths, shadow, and pattern. Free calculator, all 52 cards, and compatibility.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <ReturningUserRedirect />
      <SeoShell>
        {/* Hero */}
        <section className="pt-2">
          <span className="eyebrow text-gold">Cardology</span>
          <h1 className="display mt-2 text-balance text-4xl leading-[1.05] text-bone">
            Find your birth card. Read it as a mirror, not a forecast.
          </h1>
          <p className="prose-reading mt-4 text-mist">
            Your birthday maps to exactly one of the 52 playing cards. It&rsquo;s
            deterministic — same birthday, same card, every time. Not a
            prediction; a vocabulary for noticing how you already tend to
            operate.
          </p>
        </section>

        {/* Calculator front-and-center */}
        <section className="mt-7">
          <BirthCardCalculator />
        </section>

        {/* Value props */}
        <section className="mt-12">
          <h2 className="eyebrow mb-3 text-gold">What you get</h2>
          <ul className="space-y-3">
            <Feature title="Your birth card, decoded">
              Strengths, the shadow to watch, and the pattern in three positions —
              balanced, under-expressed, and over-expressed.
            </Feature>
            <Feature title="No vibes, just math">
              A deterministic system. The same birthday always returns the same
              card — there&rsquo;s nothing to interpret in the calculation itself.
            </Feature>
            <Feature title="A mirror, not a forecast">
              We don&rsquo;t predict events. We name the patterns you can examine,
              work with, or set down.
            </Feature>
          </ul>
        </section>

        {/* Explore the system */}
        <section className="mt-12">
          <h2 className="eyebrow mb-3 text-gold">Explore the 52-card system</h2>
          <div className="grid grid-cols-1 gap-2">
            <Tile href="/birth-card-calculator" label="Birth Card Calculator" sub="Find your card from your birthday" />
            <Tile href="/birth-card" label="All 52 Birth Cards" sub="Browse every card and its meaning" />
            <Tile href="/cardology-compatibility" label="Compatibility" sub="How two birth cards connect" />
            <Tile href="/what-is-cardology" label="What is Cardology?" sub="The 52-card system, explained" />
            <Tile href="/birth-card-vs-ruling-card" label="Birth Card vs Ruling Card" sub="The two cards that define you" />
          </div>
        </section>

        {/* Suits */}
        <section className="mt-12">
          <h2 className="eyebrow mb-3 text-gold">Four suits, four instincts</h2>
          <ul className="prose-reading space-y-1.5 text-mist">
            <li><span className="text-[#e0654a]">♥ Hearts</span> — relationships &amp; emotion</li>
            <li><span className="text-[#d9b26a]">♦ Diamonds</span> — values &amp; resources</li>
            <li><span className="text-[#7fae8f]">♣ Clubs</span> — mind &amp; communication</li>
            <li><span className="text-[#7b6cf0]">♠ Spades</span> — work, will &amp; transformation</li>
          </ul>
        </section>

        {/* App CTA */}
        <section className="card-surface mt-12 rounded-2xl p-6 text-center">
          <p className="font-serif text-lg text-bone">Want a daily reading?</p>
          <p className="mt-1 text-sm text-faint">
            Mirror turns your cards into a reflection you can return to each day.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-block rounded-full bg-foil px-6 py-3 font-serif text-base text-ink transition active:scale-[0.99]"
          >
            Start with Mirror →
          </Link>
        </section>
      </SeoShell>
    </>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="card-surface rounded-2xl p-4">
      <p className="font-serif text-base text-bone">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-mist">{children}</p>
    </li>
  );
}

function Tile({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="card-surface flex items-center justify-between rounded-xl px-4 py-3 transition hover:border-gold/40"
    >
      <span>
        <span className="block font-serif text-base text-bone">{label}</span>
        <span className="block text-xs text-faint">{sub}</span>
      </span>
      <span className="text-gold">→</span>
    </Link>
  );
}
