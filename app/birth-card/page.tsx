import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { cardsBySuit } from "@/lib/seo-cards";

export const metadata: Metadata = {
  title: "All 52 Cardology Birth Cards — Meanings & Personality",
  description:
    "Browse all 52 Cardology birth cards. Find any card's meaning, personality, strengths, and shadow — grouped by suit. Don't know yours? Use the free calculator.",
  alternates: { canonical: "/birth-card" },
};

const SUIT_GLYPHS: Record<string, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};

export default function BirthCardIndex() {
  const groups = cardsBySuit();
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth Cards", href: "/birth-card" }]}>
      <h1 className="display mb-3 text-3xl text-bone">The 52 Birth Cards</h1>
      <p className="prose-reading mb-6 text-mist">
        Every birthday maps to exactly one of the 52 playing cards — your{" "}
        <strong>birth card</strong>. It&rsquo;s a fixed starting vocabulary for how you
        tend to operate. Pick a card below, or{" "}
        <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
          calculate yours
        </Link>
        .
      </p>

      <nav className="mb-10 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wider2">
        {groups.map((g) => (
          <a
            key={g.suit}
            href={`#${g.suit}`}
            className="rounded-full border border-white/10 px-3 py-1 text-faint transition hover:border-gold hover:text-gold"
          >
            {SUIT_GLYPHS[g.suit]} {g.suit}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.suit} id={g.suit} className="scroll-mt-10">
            <h2 className="eyebrow mb-4 text-gold">
              {SUIT_GLYPHS[g.suit]} {cap(g.suit)} · {g.domain}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {g.cards.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/birth-card/${c.slug}`}
                    className="card-surface group relative flex aspect-[2.5/3.5] flex-col items-center justify-center overflow-hidden p-4 text-center transition-all hover:border-gold/50 hover:shadow-[0_0_20px_-5px_rgba(217,178,106,0.3)]"
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${c.color}, transparent 70%)`,
                      }}
                    />
                    <span className="font-serif text-4xl leading-none" style={{ color: c.color }}>
                      {c.code}
                    </span>
                    <span className="mt-2 block font-serif text-sm text-bone">
                      {c.label}
                    </span>
                    {c.title && (
                      <span className="mt-0.5 block text-[0.6rem] uppercase tracking-wider text-faint">
                        {c.title}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SeoShell>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
