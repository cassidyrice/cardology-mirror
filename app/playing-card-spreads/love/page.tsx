import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SITE_URL } from "@/lib/site";
import { getCardSeo, type CardSeo } from "@/lib/seo-cards";
import { compatForCard } from "@/lib/compat-pairs";
import { rankTheme, relationshipTheme, suitWord, SPREADS, SPREADS_HUB_PATH } from "@/lib/spreads";

export const metadata: Metadata = {
  title: "Love Spread With Playing Cards: You, Them, the Connection",
  description:
    "A playing card love spread for real relationships: the you-them-connection layout, a five-card variant, a worked example, and the birth-card compatibility layer underneath.",
  alternates: { canonical: "/playing-card-spreads/love" },
  openGraph: {
    title: "Love Spread With Playing Cards: You, Them, the Connection",
    description:
      "Three cards for one relationship — you, them, the connection — plus a five-card variant and the deterministic compatibility layer underneath it.",
    url: "/playing-card-spreads/love",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

// Worked-example cards, pulled from the site's own data layer at build time —
// the example's meanings are the same strings the full card pages publish.
function mustCard(code: string): CardSeo {
  const card = getCardSeo(code);
  if (!card) throw new Error(`Missing card data for ${code}`);
  return card;
}

export default function LoveSpread() {
  const you = mustCard("Q♥");
  const them = mustCard("K♠");
  const bond = mustCard("2♥");

  // Pair-page link comes from the generated compat index (pre-canonicalized
  // hrefs), never hand-built — same rule as the card pages.
  const pairHref =
    compatForCard(you.slug)?.pairs.find((p) => p.label === them.label)?.href ??
    compatForCard(you.slug)?.hub ??
    "/compatibility/";

  const faqs = [
    {
      q: "What is the best playing card spread for love?",
      a: "A three-card layout: one card for you, one for them, one for the connection itself. It works because it separates the two people from the bond between them — most relationship confusion is about which of those three is actually struggling. A five-card variant adds the friction and the direction.",
    },
    {
      q: "Can playing cards tell you if someone loves you?",
      a: "No — and this site won't pretend otherwise. Cards are pattern language, not surveillance or prediction: a drawn card cannot report another person's feelings. What a love spread can do is name how each of you tends to love — the suit shows the arena, the rank shows the move — so the real conversation gets clearer.",
    },
    {
      q: "What is the difference between a love spread and birth card compatibility?",
      a: "A love spread is shuffled, so it reads the moment and changes with every draw. Birth-card compatibility is deterministic: each person's birthday maps to one fixed card, so the comparison describes the two people's standing patterns and returns the same result every time. Use the spread for today's weather, the birth cards for the climate.",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Playing Card Spreads", item: `${SITE_URL}${SPREADS_HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: "Love Spread", item: `${SITE_URL}/playing-card-spreads/love` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const siblings = SPREADS.filter((s) => s.slug !== "love");

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Playing Card Spreads", href: SPREADS_HUB_PATH },
        { label: "Love Spread", href: "/playing-card-spreads/love" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="display mb-3 text-3xl text-bone">The Love Spread</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Draw three cards for one relationship: you, them, and the connection
          itself. Each card&rsquo;s suit shows the arena a person is loving
          from; the rank shows the move. A five-card variant adds the friction
          and the direction. The spread describes the dynamic — it does not
          report anyone&rsquo;s feelings.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Relationship questions tangle because three different things get asked
        as one: what is wrong with me, what is wrong with them, and what is
        wrong with <em>us</em>. This layout forces them apart — one card each.
        New to the suit-and-rank vocabulary? Start with{" "}
        <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">
          how to read playing cards
        </Link>
        , then come back for the layout.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How does the you–them–connection layout work?</h2>
        <p className="prose-reading text-mist">
          Shuffle with the relationship in mind and deal three cards left to
          right. <strong>You</strong> — how you are showing up in this bond
          right now, not your whole personality. <strong>Them</strong> — how
          they are showing up, read the same way. <strong>The connection</strong>{" "}
          — the thing you build between you, which has its own weather and is
          often the position that explains the other two. In relationships the
          suits speak plainly: Hearts cards show up through{" "}
          {relationshipTheme("hearts")}; Clubs through {relationshipTheme("clubs")};
          Diamonds through {relationshipTheme("diamonds")}; Spades through{" "}
          {relationshipTheme("spades")}.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What does the five-card variant add?</h2>
        <p className="prose-reading text-mist">
          Two positions after the core three. <strong>The friction</strong> —
          where the bond grinds: read its suit as the arena the two of you keep
          fighting in, whatever you think the fights are about. <strong>The
          direction</strong> — where the dynamic leans if nothing changes. Deal
          them fourth and fifth, and read the friction card&rsquo;s
          over-expressed range with special honesty; that is usually where the
          argument actually lives.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">A worked example</h2>
        <p className="prose-reading text-mist">
          Question: &ldquo;What is actually happening between us?&rdquo; The
          draw: the {you.label} for you, the {them.label} for them, the{" "}
          {bond.label} for the connection. Read with the same meanings their
          full pages carry:
        </p>
        <div className="mt-4 flex gap-3">
          {[you, them, bond].map((c) => (
            <img
              key={c.slug}
              src={`/pins/${c.slug}.png`}
              alt={`${c.label} playing card`}
              width={1000}
              height={1500}
              loading="lazy"
              decoding="async"
              className="w-24 rounded-2xl border border-white/10 sm:w-28"
            />
          ))}
        </div>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow mb-1 text-gold">
              You — {you.label}{you.title ? ` · ${you.title}` : ""}
            </p>
            <p className="prose-reading mb-0 text-mist">
              A {suitWord(you.suit)} card in the You position: you are loving
              from the arena of {you.suitDomain.toLowerCase()}, with the
              Queen&rsquo;s move of {rankTheme(you.rank)}. In balance:{" "}
              {you.sweetSpot} The under-expressed range is the flag — {you.under}{" "}
              <Link href={`/birth-card/${you.slug}`} className="text-gold underline underline-offset-4">
                Full {you.label} meaning →
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow mb-1 text-gold">
              Them — {them.label}{them.title ? ` · ${them.title}` : ""}
            </p>
            <p className="prose-reading mb-0 text-mist">
              A {suitWord(them.suit)} card: they are showing up from{" "}
              {them.suitDomain.toLowerCase()}, with the King&rsquo;s move of{" "}
              {rankTheme(them.rank)}. In balance: {them.sweetSpot} Their
              under-expressed range: {them.under}{" "}
              <Link href={`/birth-card/${them.slug}`} className="text-gold underline underline-offset-4">
                Full {them.label} meaning →
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow mb-1 text-gold">
              The connection — {bond.label}{bond.title ? ` · ${bond.title}` : ""}
            </p>
            <p className="prose-reading mb-0 text-mist">
              A {suitWord(bond.suit)} card carrying {rankTheme(bond.rank)}: the
              bond itself is asking for a real two-way exchange in the arena of{" "}
              {bond.suitDomain.toLowerCase()}. In balance: {bond.sweetSpot}{" "}
              <Link href={`/birth-card/${bond.slug}`} className="text-gold underline underline-offset-4">
                Full {bond.label} meaning →
              </Link>
            </p>
          </div>
        </div>
        <p className="prose-reading mt-4 text-mist">
          Read together: a carer with real emotional authority who may be
          reading the room at her own expense, a commander who can go quiet
          rather than vulnerable, and a connection card asking both to trade
          honestly instead of managing each other. Notice the spread never says
          who is right — it names the pattern each side is running.
        </p>
        <p className="mt-3 text-sm text-faint">
          A mirror, not a forecast: the spread describes a dynamic in play, not
          anyone&rsquo;s verdict on the relationship. If it clarifies nothing
          real, discard it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">From the drawn moment to the two actual people</h2>
        <p className="prose-reading text-mist">
          A shuffled love spread reads today&rsquo;s weather. The deterministic
          layer underneath reads the climate: each person&rsquo;s birthday maps
          to one fixed birth card, and the pairing of those two cards is a
          standing description of how the two of you tend to mesh — same
          birthdays, same answer, every time. If the example above were a real
          couple&rsquo;s birth cards, their pairing is already written:{" "}
          {/* /compatibility/ is edge-rendered by the cardology-unlock Worker,
              not this Next app — plain <a>, href from the generated index. */}
          <a href={pairHref} className="text-gold underline underline-offset-4">
            {you.label} + {them.label} compatibility
          </a>
          . For your own relationship, run both birthdays through the{" "}
          <Link href="/birth-card-compatibility-calculator" className="text-gold underline underline-offset-4">
            compatibility calculator
          </Link>
          , browse the{" "}
          <a href="/compatibility/" className="text-gold underline underline-offset-4">
            compatibility pair library
          </a>{" "}
          — every pairing of the 52 cards has a page — or read how the system
          scores relationships in the{" "}
          <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">
            Cardology compatibility guide
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Frequently asked questions</h2>
        <div className="space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="prose-reading mb-1 font-serif text-bone">{f.q}</h3>
              <p className="prose-reading text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <ReadingBridge variant="relationship" className="mt-10" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Two birthdays, one answer</p>
        <p className="mt-1 text-sm text-faint">
          Skip the shuffle: compare your birth cards free — the deterministic
          version of this spread&rsquo;s question.
        </p>
        <Link href="/birth-card-compatibility-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Compatibility Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href={SPREADS_HUB_PATH} className="text-gold underline underline-offset-4">All playing card spreads →</Link>
        {"  ·  "}
        {siblings.map((s) => (
          <span key={s.slug}>
            <Link href={s.path} className="text-gold underline underline-offset-4">{s.name} →</Link>
            {"  ·  "}
          </span>
        ))}
        <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">Cardology compatibility →</Link>
      </p>
    </SeoShell>
  );
}
