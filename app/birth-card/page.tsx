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
      <p className="prose-reading mb-8 text-mist">
        Every birthday maps to exactly one of the 52 playing cards — your{" "}
        <strong>birth card</strong>. It&rsquo;s a fixed starting vocabulary for how you
        tend to operate. Pick a card below, or{" "}
        <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
          calculate yours
        </Link>
        .
      </p>

      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.suit}>
            <h2 className="eyebrow mb-3 text-gold">
              {SUIT_GLYPHS[g.suit]} {cap(g.suit)} · {g.domain}
            </h2>
            <ul className="grid grid-cols-1 gap-2">
              {g.cards.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/birth-card/${c.slug}`}
                    className="card-surface flex items-baseline justify-between rounded-xl px-4 py-3 transition hover:border-gold/40"
                  >
                    <span className="font-serif text-base text-bone">
                      <span style={{ color: c.color }}>{c.code}</span> {c.label}
                    </span>
                    {c.title && (
                      <span className="text-xs text-faint">{c.title}</span>
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
