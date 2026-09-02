import type { Metadata } from "next";
import Link from "next/link";

import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { ReadingDayCta } from "@/components/seo/ReadingDayCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { TableScroll } from "@/components/seo/TableScroll";
import { suitColorOnPaper } from "@/lib/cards";
import { allCardSeo, getCardSeo, type CardSeo } from "@/lib/seo-cards";
import { SITE_URL } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/karma-cards"];

const TITLE =
  "Cardology Karma Cards: Gift and Challenge Card for All 52 Birth Cards";
const DESCRIPTION =
  "Every Cardology birth card's Lifetime Gift (Environment) and Lifetime Challenge (Displacement), in one table. Three Fixed cards have neither — here's why.";
const OG_IMAGE = {
  url: "/og/karma-cards.png",
  width: 1200,
  height: 630,
  alt: "Cardology karma cards — three playing cards fanned on paper",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/karma-cards" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/karma-cards",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const faqs = [
  {
    q: "What are karma cards in Cardology?",
    a: "Each birth card sits in a fixed position in the Life Spread. Reading that position against the next spread returns two related cards: the Lifetime Gift, also called the Environment card, and the Lifetime Challenge, also called the Displacement card. They describe two standing relationships to your own pattern — one that tends to come easily, one that tends to ask for maturity.",
  },
  {
    q: "What is the difference between the Environment and Displacement card?",
    a: "The Lifetime Gift (Environment) is the pattern you tend to have access to without working for it. The Lifetime Challenge (Displacement) is the pattern you tend to grow into by handling it badly first. Neither is a reward or a punishment; both are card relationships that make your own habits easier to notice.",
  },
  {
    q: "Why do the Jack of Hearts, 8 of Clubs and King of Spades have no karma cards?",
    a: "Those three are the Fixed cards. They hold the same position in every spread, so there is no displacement to read and no environment card to return. In practice a Fixed card carries its own lesson rather than trading it with a neighbour.",
  },
  {
    q: "Why do some cards show the same card as both gift and challenge?",
    a: "The 2 of Hearts, 9 of Hearts, Ace of Clubs and 7 of Diamonds are the Semi-Fixed cards. They pair off with one partner in both roles — 2 of Hearts with Ace of Clubs, 9 of Hearts with 7 of Diamonds — so the same card shows up as both the gift and the challenge, in both directions.",
  },
];

type Row = {
  card: CardSeo;
  gift: CardSeo | null;
  challenge: CardSeo | null;
};

function CardCell({ card }: { card: CardSeo | null }) {
  if (!card) {
    return (
      <span className="text-sm text-[#8a8078]" aria-label="No karma card">
        &mdash;
      </span>
    );
  }
  return (
    <Link
      href={`/birth-card/${card.slug}`}
      className="font-serif text-lg underline decoration-[#14110d]/20 underline-offset-4 transition hover:decoration-[#8e321f]"
      style={{ color: suitColorOnPaper(card.suit) }}
    >
      {card.rank}
      {card.glyph}
    </Link>
  );
}

export default function KarmaCardsPage() {
  const rows: Row[] = allCardSeo().map((card) => ({
    card,
    gift: card.karma?.environment ? getCardSeo(card.karma.environment) : null,
    challenge: card.karma?.displacement
      ? getCardSeo(card.karma.displacement)
      : null,
  }));
  const fixed = rows.filter((r) => !r.gift && !r.challenge);
  const semiFixed = rows.filter(
    (r) => r.gift && r.challenge && r.gift.code === r.challenge.code,
  );

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Cardology Karma Cards: Gift and Challenge Card for All 52 Birth Cards",
      description: DESCRIPTION,
      author: { "@type": "Person", name: "Cassidy Rice", url: `${SITE_URL}/about` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: UPDATED,
      url: `${SITE_URL}/karma-cards`,
      mainEntityOfPage: `${SITE_URL}/karma-cards`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Karma Cards", href: "/karma-cards" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Cardology meanings</p>
        <h1 className="display text-4xl leading-none text-[#14110d] sm:text-6xl">
          Cardology Karma Cards: Gift and Challenge Card for All 52 Birth Cards
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5" data-ai-summary>
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Forty-nine of the 52 Cardology birth cards carry two karma cards: a{" "}
            <strong>Lifetime Gift (Environment)</strong> and a{" "}
            <strong>Lifetime Challenge (Displacement)</strong>. Both come from the
            card&rsquo;s fixed position in the Life Spread, so the same birth card
            always returns the same pair. The three Fixed cards carry neither. The
            full table is below.
          </p>
        </div>
        <p className="mt-4 text-xs text-[#5b5148]">
          By{" "}
          <Link href="/about" className="underline underline-offset-4">
            Cassidy Rice
          </Link>{" "}
          · Updated {updatedLabel(UPDATED)} ·{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            Calculation method
          </Link>
        </p>
      </header>

      <section className="max-w-3xl space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <p>
          Your birth card is not read in isolation. It sits at a fixed address in
          the Life Spread, and that address has neighbours. Read your card&rsquo;s
          position against the next spread and two cards come back every time: the
          one sitting in your environment, and the one sitting where your card was
          displaced. Cardology calls the first your <strong>Lifetime Gift</strong>{" "}
          and the second your <strong>Lifetime Challenge</strong>. Older tables
          call them the Environment card and the Displacement card. Same two
          cards, two vocabularies.
        </p>
        <p>
          The <strong>Lifetime Gift (Environment)</strong> is the pattern you tend
          to have on hand without having earned it. It shows up as the thing
          people thank you for that cost you nothing, the room you are comfortable
          in before anyone explains it. Its risk is that untrained ease stays
          untrained: a gift you never examine is a gift you cannot aim.
        </p>
        <p>
          The <strong>Lifetime Challenge (Displacement)</strong> is the opposite
          motion. It is the pattern you tend to meet by handling it badly first,
          then better, then well. It usually arrives through other people who
          embody the card you are still learning to use. Reading it as punishment
          misses the point; it describes where your maturing happens, not a verdict
          on your character.
        </p>
        <p>
          Two structural exceptions are worth knowing before you read the table.
          The three <strong>Fixed cards</strong> &mdash;{" "}
          {fixed.map((r, i) => (
            <span key={r.card.slug}>
              {i > 0 ? (i === fixed.length - 1 ? " and " : ", ") : ""}
              <Link
                href={`/birth-card/${r.card.slug}`}
                className="underline underline-offset-4"
                style={{ color: suitColorOnPaper(r.card.suit) }}
              >
                {r.card.label}
              </Link>
            </span>
          ))}{" "}
          &mdash; hold the same seat in every spread. Nothing displaces them, so
          they return no karma cards at all and carry their own lesson instead. The
          four <strong>Semi-Fixed cards</strong> pair off with a single partner in
          both roles, which is why their gift and challenge are the same card: the
          2 of Hearts and Ace of Clubs trade with each other, and so do the 9 of
          Hearts and 7 of Diamonds.
        </p>
        <p>
          These are card relationships, not forecasts. They describe tendencies you
          can check against your own history &mdash; and the check is the useful
          part. If you want the conceptual background first, read the{" "}
          <Link href="/shadow-karma-guide" className="underline underline-offset-4">
            shadow and karma guide
          </Link>
          ; this page is the lookup table that guide points at.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-4xl leading-none text-[#14110d]">
          Karma cards for all 52 birth cards
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#5b5148]">
          Every card links to its full meaning. Red is Hearts and Diamonds, black
          is Clubs and Spades. A dash means the card is Fixed and has no karma
          card.
        </p>
        <TableScroll
          label="Karma cards for all 52 birth cards"
          className="mt-6 border border-[#14110d]/15 bg-[#f4f0e7]/78"
        >
          <table className="w-full min-w-[30rem] border-collapse text-left">
            <caption className="sr-only">
              Lifetime Gift (Environment) and Lifetime Challenge (Displacement)
              card for each of the 52 Cardology birth cards.
            </caption>
            <thead>
              <tr className="border-b border-[#14110d]/15">
                <th scope="col" className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5b5148]">
                  Birth card
                </th>
                <th scope="col" className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5b5148]">
                  Lifetime Gift <span className="font-normal normal-case tracking-normal">(Environment)</span>
                </th>
                <th scope="col" className="px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5b5148]">
                  Lifetime Challenge <span className="font-normal normal-case tracking-normal">(Displacement)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ card, gift, challenge }) => (
                <tr
                  key={card.slug}
                  id={card.slug}
                  className="scroll-mt-24 border-b border-[#14110d]/10 last:border-b-0"
                >
                  <th scope="row" className="px-4 py-2.5 font-normal">
                    <Link
                      href={`/birth-card/${card.slug}`}
                      className="underline decoration-[#14110d]/20 underline-offset-4 transition hover:decoration-[#8e321f]"
                      style={{ color: suitColorOnPaper(card.suit) }}
                    >
                      {card.label}
                    </Link>
                  </th>
                  <td className="px-4 py-2.5">
                    <CardCell card={gift} />
                  </td>
                  <td className="px-4 py-2.5">
                    <CardCell card={challenge} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">
          {fixed.length} Fixed cards with no karma pair · {semiFixed.length}{" "}
          Semi-Fixed cards whose gift and challenge are the same card.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-serif text-4xl leading-none text-[#14110d]">
          Frequently asked questions
        </h2>
        <div className="mt-5 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-[#14110d]/15 pt-4">
              <h3 className="font-serif text-2xl text-[#14110d]">{faq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-[#5b5148]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 max-w-3xl space-y-4">
        <ReadingDayCta placement="karma-cards" />
        <DeepDiveCta placement="karma-cards" />
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link href="/shadow-karma-guide" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          Shadow &amp; karma guide
        </Link>
        <Link href="/birth-card" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          All 52 card meanings
        </Link>
        <Link href="/birth-card-calculator" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          Find your birth card
        </Link>
      </section>
    </SeoShell>
  );
}
