import type { Metadata } from "next";
import Link from "next/link";

import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { CARDOLOGY_TIMELINE } from "@/lib/cardology-timeline";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { DeckMatrix } from "@/components/cards/DeckMatrix";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/what-is-cardology"];

const TITLE = "What Is Cardology? Birthday → One Playing Card";
const DESCRIPTION =
  "Cardology maps your birthday to one card in a 52-card deck. Same date, same card. Not cardiology, not tarot. Free calculator. Sourced history. No excuses.";
const OG_IMAGE = { url: "/og/what-is-cardology.png", width: 1200, height: 630, alt: "What is Cardology? Three playing cards fanned on paper" };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/what-is-cardology" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/what-is-cardology",
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
    q: "What is Cardology?",
    a: "Cardology is a deterministic system. It maps a birthday to one card in a standard 52-card playing deck, then uses that card as pattern language for personality, relationships, timing, and the dynamics you keep repeating. Same birthday always yields the same card.",
  },
  {
    q: "What is the meaning of cardology?",
    a: "Cardology means reading a standard 52-card playing deck as a calendar. 52 cards for 52 weeks. Four suits for four seasons. 13 ranks for the 13 weeks in each season. 12 court cards for 12 months. Your birthday lands on one of those cards. That card is read as pattern language for personality, relationships, and timing.",
  },
  {
    q: "What is my cardology card?",
    a: "Your cardology card is the single playing card fixed to your month and day. No birth time needed, unlike an astrology chart, so you can stop texting your mom. Enter your birthday in the free calculator on this page to see it, along with your planetary ruling card.",
  },
  {
    q: "How is cartomancy different from tarot?",
    a: "Cartomancy reads a 52-card playing deck. Tarot reads a 78-card deck with 22 Major Arcana that playing cards do not have. Cardology is narrower than either. It is not a shuffled draw at all. Your birthday fixes one card for life, and the same birthday always returns the same card.",
  },
  {
    q: "Is Cardology the same as cardiology?",
    a: "No. Cardiology is heart medicine. Cardology is a birthday-to-playing-card map (52-card deck, not tarot). One extra letter. Same birthday always yields the same card. Free lookup: the birth card calculator on this site.",
  },
  {
    q: "How does Cardology work?",
    a: "Month and day feed a fixed formula. It resolves to one of 52 cards, with December 31 as the Joker boundary. February 29 maps normally to the 9 of Clubs. From there you read suit (life domain), rank (movement), ruling card (expression style), and the optional timing or compatibility layers.",
  },
  {
    q: "What is my birth card in Cardology?",
    a: "Your Cardology birth card is the playing card locked to your birthday. Use the free calculator on this page. Enter month, day, and year. The birth card and planetary ruling card show up instantly. Faster than your situationship replies.",
  },
  {
    q: "What is a birth card?",
    a: "A birth card is the one playing card assigned to a birthday. In Cardology that assignment is fixed. Same date, same card. It is not a tarot birth-card pair and not a government birth-registration card. Full meanings live on the 52 birth-card index.",
  },
  {
    q: "Can I get a free Cardology reading?",
    a: "Yes. Enter a birthday in the free calculator on this page. It returns the fixed birth card and planetary ruling card, then links to the full card meaning: personality, love, money, advice, shadow, and birth dates. No email. No random card draw. Nobody wants your inbox.",
  },
  {
    q: "What are the benefits of Cardology?",
    a: "It gives you a checkable vocabulary for your default patterns, for relationship friction and attraction, and for the “chapter” you are in. Because the math is fixed, two people can verify the same birthday produces the same card. It is for self-awareness and entertainment, not medical, legal, or life-script claims.",
  },
  {
    q: "Is Cardology the same as astrology?",
    a: "Related. Not the same. Astrology reads planetary positions at birth. Cardology maps a birthday to a playing card through deck-and-calendar structure. No chart drawing. Nothing random. No birth time to lie about.",
  },
  {
    q: "Cardology vs tarot: how are they different?",
    a: "Tarot uses 78 cards including Major Arcana and is often shuffled for a reading. Cardology uses 52 playing cards and locks the birth card to the birthday. Spreads can still be shuffled in cartomancy. Birth-card Cardology does not need a shuffle. Your hands can rest.",
  },
  {
    q: "Does Cardology predict the future?",
    a: "No. Timing language describes pressure, focus, and chapter themes. It does not promise events. The better use is spotting patterns you can test in real life. You were going to ask it about Tuesday. Don't.",
  },
  {
    q: "Is Cardology accurate?",
    a: "The mapping is exact. The same birthday always produces the same card, and anyone can verify the calculation. The interpretations are pattern language for self-reflection, not empirically validated prediction. Treat a card as a precise mirror to test against real behavior. It is not proof about your future.",
  },
  {
    q: "What are Cardology card meanings?",
    a: "Each of the 52 playing cards carries a meaning built from its suit (life domain: hearts, diamonds, clubs, spades) and its rank (the movement inside that domain). Card Blueprints publishes a full meaning page for every card, indexed in the card meanings section above. Yes, all of them. Even the ones you skip.",
  },
  {
    q: "Where does Cardology come from?",
    a: "The 52-card solar calendar was first set out in full in Olney H. Richmond’s The Mystic Test Book (Chicago, 1893, Library of Congress BF1878 .R5). Edith Randall and Florence Campbell’s Sacred Symbols of the Ancients (1947) published the birthday chart most sites still use. Arne Lein (1978) and Robert Lee Camp (1992 onward) carried it into modern print. The deck-as-calendar arithmetic itself was in print by 1762. The full dated timeline with sources is on this page. Older than your grandparents. Fewer citations than you would hope.",
  },
];

const toc = [
  { id: "what-it-is", label: "What it is" },
  { id: "how-it-works", label: "How it works" },
  { id: "benefits", label: "Benefits" },
  { id: "suits", label: "Suits" },
  { id: "card-meanings", label: "Card meanings" },
  { id: "layers", label: "Birth vs ruling" },
  { id: "history", label: "History" },
  { id: "faq", label: "FAQ" },
];

function QuietContinue() {
  return (
    <nav aria-label="Continue" className="mt-5 border-t border-brand-line pt-3">
      <p className="text-xs uppercase tracking-[0.14em] text-brand-bronze">Continue</p>
      <ul className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
        <li>
          <Link href="/birth-card-calculator#bd" className="text-brand-oxblood underline underline-offset-4">
            Find your card
          </Link>
        </li>
        <li>
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            Browse 52 meanings
          </Link>
        </li>
        <li>
          <Link href="/#readings" className="text-brand-ink-soft underline underline-offset-4">
            Personal readings, if you insist
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default function WhatIsCardology() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    author: { "@type": "Person", name: "Cassidy Rice" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    dateModified: UPDATED,
    mainEntityOfPage: "https://cardblueprints.com/what-is-cardology",
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "What is Cardology?", href: "/what-is-cardology" }]}>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <SeoHeroFan className="mb-5" />
      <h1 className="display mb-3 text-3xl text-brand-ink">What Is Cardology? Find Your Birth Card from Your Birthday</h1>
      <div className="mb-4 scroll-mt-24 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary id="what-it-is">
        <h2 className="font-serif text-2xl text-brand-ink">What is Cardology?</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Cardology maps your birthday to one card in a standard 52-card playing
          deck. Same date, same card, every time. That card is a mirror for
          personality, compatibility, and timing. It is not cardiology, not tarot,
          and not a forecast. It just knows things.
        </p>
        <p className="prose-reading mt-3 text-sm text-brand-ink-soft">
          The free calculator on this page returns the card. The long version of
          why this is not a tarot thing:{" "}
          <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            Cardology vs tarot
          </Link>
          . If you need your hand held:{" "}
          <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">
            Cardology for beginners
          </Link>
          .
        </p>
      </div>
      <p className="mb-2 text-sm text-brand-ink-soft">
        Free first. Your birth card is below. Optional next: the{" "}
        <Link href="/#readings" className="text-brand-oxblood underline underline-offset-4">
          Chemistry Check ($24)
        </Link>
        . Your card beside one other person’s, personally read by Cass. Yes, that person.
      </p>
      <p className="mb-6">
        <Link href="#find-your-card" className="accent-button inline-block">
          Show me my card. Free →
        </Link>
      </p>

      <p className="mb-2 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <section className="mt-8" id="find-your-card">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What is my birth card in Cardology?</h2>
        <p className="prose-reading mb-4 text-brand-ink-soft">
          Enter any birthday below. Yours first, then theirs. The free calculator
          returns the playing-card birth card and ruling card for the Cardology system.
        </p>
        <BirthCardCalculator />
        <p className="mt-4 text-sm">
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            The calculator has its own page too →
          </Link>
        </p>
      </section>

      <section className="mt-10" id="free-reading">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Your free Cardology reading</h2>
        <p className="prose-reading text-brand-ink-soft">
          The result above is a free Cardology reading. Not just a calculator answer.
          Open the returned birth card. Read its personality pattern, love and
          relationship style, money and work themes, advice, shadow, and exact birth
          dates. The shadow section is the one you screenshot. The planetary ruling
          card adds a second layer for how the core pattern comes out. Nothing is
          randomly drawn, and no email is required.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          For the complete deck, browse{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            all 52 Cardology card meanings
          </Link>
          . Optional next step, for when one card is not enough drama: the{" "}
          <Link href="/#readings" className="text-brand-oxblood underline underline-offset-4">
            Chemistry Check ($24)
          </Link>{" "}
          (two people’s cards, read together, honestly).
        </p>
        <div className="card-surface mt-5 rounded-2xl border !border-brand-line p-5">
          <p className="font-serif text-base text-brand-ink">You looked at your card. Now you want to look at theirs.</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            The Chemistry Check ($24) reads your card beside one other person’s. It is prepared privately and delivered by email. They never have to know you asked.
          </p>
          <Link
            href="/#readings"
            className="accent-button mt-4"
          >
            See the Chemistry Check
          </Link>
        </div>
      </section>

      <nav aria-label="On this page" className="mb-8 mt-10 rounded-2xl border border-brand-line p-4">
        <p className="type-eyebrow mb-3 !text-brand-bronze">On this page</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-ink-soft">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-brand-oxblood underline underline-offset-4">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="prose-reading mb-6 text-brand-ink-soft">
        Cardology maps your birthday to a single playing card, your{" "}
        <strong>birth card</strong>, and uses the 52-card deck as a language for
        personality, timing, and relationships. What makes it not a horoscope app, and
        not a shuffled tarot draw: it is <strong>deterministic</strong>.
        A fixed formula. Not a mood ring. Not your mood either. For a guided path, read{" "}
        <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">
          Cardology for beginners
        </Link>
        . For the short definition of <strong>what is a birth card</strong>, see{" "}
        <Link href="/blog/pillar/birth-card-meanings" className="text-brand-oxblood underline underline-offset-4">
          birth card meanings
        </Link>
        .
      </p>

      <section className="mt-8 scroll-mt-24" id="how-it-works">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How does Cardology work?</h2>
        <p className="prose-reading text-brand-ink-soft">
          A standard deck has 52 cards. The calendar has 52 weeks. Cardology links
          the two by a fixed rule. December 31 is the Joker boundary. The leap
          day, February 29, maps normally to the 9 of Clubs. Your birth card is the
          lifelong significator. It is not going anywhere. Suit names the life domain.
          Rank names the movement inside that domain. Optional layers add a planetary
          ruling card, yearly periods, daily cards, and two-person compatibility.
        </p>
        <ul className="prose-reading mt-3 space-y-1 text-brand-ink-soft" data-ai-summary>
          <li><strong>52 cards</strong>: the 52 weeks of the year.</li>
          <li><strong>4 suits</strong>: the four seasons.</li>
          <li><strong>13 ranks</strong>: the 13 weeks in each season.</li>
          <li><strong>12 court cards</strong>: the 12 months.</li>
          <li><strong>364 + the Joker</strong>: 13 × 28 days, plus the leftover day of a 365-day year.</li>
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          The map keys on month and day alone. So <strong>no birth time is
          needed</strong>. That is the part of an astrology chart most people cannot
          supply and then lie about. Longer layouts built on the same deck, the Life
          Spread and the yearly spreads in Robert Camp&rsquo;s books, extend the reading into cycles.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Full calculation detail, with a worked birthday example, is on the{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            methodology page
          </Link>
          . The deck-to-year mapping behind it is laid out in the{" "}
          <Link href="/52-card-astrology-explained#calendar" className="text-brand-oxblood underline underline-offset-4">
            Cardology calendar
          </Link>
          .
        </p>
        <QuietContinue />
      </section>

      <section className="mt-8 scroll-mt-24" id="benefits">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What are the benefits of Cardology?</h2>
        <ul className="prose-reading space-y-2 text-brand-ink-soft">
          <li>
            <strong>Checkable math.</strong> Two people can verify the same birthday
            produces the same card. Rare among personality systems. Rarer among people.
          </li>
          <li>
            <strong>Shared vocabulary.</strong> Suits and ranks give precise language
            for friction, attraction, overreach, and gift. Nobody has to be the villain.
          </li>
          <li>
            <strong>Relationship maps.</strong> Comparing two birth cards surfaces
            dynamics you can test against real partnerships and teams. And the group chat.
          </li>
          <li>
            <strong>Timing as chapter, not prophecy.</strong> Period and daily cards
            describe focus and pressure. Useful for reflection. Useless for picking lottery numbers.
          </li>
        </ul>
      </section>

      <section className="mt-10 scroll-mt-24" id="suits">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The four suits</h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span>: relationships &amp; emotion. You know.</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span>: values &amp; resources. What you guard.</li>
          <li><span className="text-[#14110d]">♣ Clubs</span>: mind &amp; communication. What keeps you up.</li>
          <li><span className="text-[#14110d]">♠ Spades</span>: work, will &amp; transformation. What you keep postponing.</li>
        </ul>
      </section>

      <section className="mt-10 scroll-mt-24" id="card-meanings">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Cardology card meanings: all 52 cards</h2>
        <p className="prose-reading mb-5 text-brand-ink-soft">
          Every card in the deck has its own Cardology card meaning page. The drawn-card
          reading, the birth-card personality, love, money, shadow, and the exact birth
          dates that carry it. Pick a card. Pick theirs after. We both know.
        </p>
        <DeckMatrix />
        <QuietContinue />
      </section>

      <section className="mt-8 scroll-mt-24" id="layers">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Two layers: birth card and ruling card</h2>
        <p className="prose-reading text-brand-ink-soft">
          Most people have two key cards. The birth card. And a planetary ruling card
          that colors how it comes out. The difference is broken down in{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-brand-oxblood underline underline-offset-4">
            birth card vs ruling card
          </Link>
          , and the second layer gets its own explainer at{" "}
          <Link href="/planetary-ruling-card" className="text-brand-oxblood underline underline-offset-4">
            planetary ruling card
          </Link>
          .
        </p>
      </section>

      <section className="mt-8" id="which-layer">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Which layer am I reading?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Before you look up a meaning, check what the card actually is. A birth
          card is lifelong. A ruling card colors how it comes out. A card in a
          yearly period only describes a 52-day stretch. Same card. Different
          job. Keep the label on it, or you panic about the wrong thing.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Where the cards sit and how they move is the board:{" "}
          <Link href="/playing-card-spreads" className="text-brand-oxblood underline underline-offset-4">
            playing card spreads
          </Link>
          . To see one card read through each of the seven period filters, put it
          through the{" "}
          <Link href="/52-day-period-meaning-tool" className="text-brand-oxblood underline underline-offset-4">
            52-day period meaning tool
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Why it works best on real people</h2>
        <p className="prose-reading text-brand-ink-soft">
          The cards get useful when you point them at actual lives. Your own
          patterns. The people closest to you. Public figures. Family roles.
          Attraction, friction, work chemistry, and the exact place a strength tips into
          too much. Nothing here is a script. It is a vocabulary for seeing behavior
          more precisely, including the behavior you call &ldquo;being fine.&rdquo;
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How the calculation actually works</h2>
        <p className="prose-reading text-brand-ink-soft">
          There is no chart to draw and no judgment call to make. Every card carries a
          fixed numeric value based on its position. A short equation on birth month
          and day resolves to exactly one value. That value is your card. Run it a
          thousand times. Same answer a thousand times. Unlike you at 2am.
        </p>
      </section>

      <section className="mt-8 scroll-mt-24" id="lineage">
        <h2 id="history" className="type-eyebrow mb-2 scroll-mt-24 !text-brand-bronze">Where it comes from: a dated, sourced history</h2>
        <p className="prose-reading text-brand-ink-soft">
          Most Cardology sites tell the origin story without a single citation. Bold choice.
          Here is what the library records and the surviving books actually show. Every entry
          links to the source it rests on. Anything that rests only on one author&rsquo;s word is marked.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Book by book, with publisher and catalogue record:{" "}
          <Link href="/cardology-books" className="text-brand-oxblood underline underline-offset-4">
            the Cardology books &amp; decks directory
          </Link>
          .
        </p>
        <ol className="mt-4 space-y-3 border-l border-brand-line pl-4">
          {CARDOLOGY_TIMELINE.map((t) => (
            <li key={t.year + t.sourceLabel} className="relative pl-2">
              <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-brand-gold-soft" aria-hidden="true" />
              <p className="text-sm text-brand-ink-soft">
                <strong className="font-serif text-base text-brand-ink">{t.year}</strong>
                {" \u00b7 "}
                {t.what}{" "}
                <a href={t.source} rel="noopener" className="text-brand-oxblood underline underline-offset-4">
                  [{t.sourceLabel}]
                </a>
              </p>
            </li>
          ))}
        </ol>
        <h3 className="mt-6 font-serif text-xl text-brand-ink">Claims floating around elsewhere that the sources do not support</h3>
        <ul className="prose-reading mt-2 space-y-2 text-sm text-brand-ink-soft">
          <li>
            <strong>Atlantis, Egypt, and a 20,000-year-old Order of the Magi.</strong> Every version of
            this traces to Richmond&rsquo;s own 1892 and 1893 books, which lean on a speculative book titled
            <em> Atlantis</em>. Richmond himself quotes the <em>Encyclopaedia Britannica</em> saying the
            origin of playing cards is disputed. There is no independent evidence. Sorry about Atlantis.
          </li>
          <li>
            <strong>An unbroken secret order from 1864.</strong> The 1864 Nashville initiation and the
            1889 &ldquo;first modern temple&rdquo; are Richmond&rsquo;s testimony, reprinted from his own
            interviews with a Grand Rapids newspaper. A man vouching for himself. Membership figures repeated online are uncited.
          </li>
          <li>
            <strong>&ldquo;Cardology&rdquo; was coined in 1934.</strong> Asserted by one modern site citing a
            1939 copyright catalog entry for an &ldquo;Astro-Cardology&rdquo; booklet. We could not verify
            it. So we do not repeat it as fact. Try it sometime.
          </li>
          <li>
            <strong>The deck-as-calendar was a hidden revelation.</strong> The arithmetic (52 cards, 4 suits,
            13 ranks, 364 spots plus the Joker) was already circulating in print as the
            &ldquo;Perpetual Almanack&rdquo; card story by 1762. More than a century before Richmond. Not hidden. Just unread.
          </li>
        </ul>
        <h3 className="mt-6 font-serif text-xl text-brand-ink">Cardology, cardiology, cartomancy, tarot</h3>
        <p className="prose-reading mt-2 text-sm text-brand-ink-soft">
          <strong>Cardiology</strong> is the medicine of the heart. The words share four letters and nothing
          else. <strong>Cartomancy</strong> is reading shuffled cards for an answer. Cardology does not
          do that. The card is fixed by your birthday. Unlike Cardology, <strong>tarot</strong> uses a 78-card deck with a different
          numerology. <strong>Love Cards</strong>, <strong>Science of the
          Cards</strong>, and Robert Camp&rsquo;s titles are book and brand names for this same 52-card birthday system. The word
          &ldquo;Cardology&rdquo; itself is a registered US trademark (Reg. 5703102, 2019) for playing cards and
          merchandise. It does not cover the practice, or the word in writing.
        </p>
        <p className="prose-reading mt-3 text-sm text-brand-ink-soft">
          Our position: the books are documentation. The deck is the system. The calculation on this site
          reproduces the 1947 birthday chart exactly. It is published on the{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">methodology page</Link>
          {" "}so you can check it against the primary texts yourself. Please do.
        </p>
      </section>

      <section className="mt-8" id="not">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What Cardology is not</h2>
        <p className="prose-reading text-brand-ink-soft">
          It is not a random draw, not medical or financial advice, and not a costume.
          A card cannot tell you how Tuesday goes. Stop asking it. What it can do is name a
          recurring pattern so precisely that you start catching it in yourself.
          Card Blueprints frames the whole practice as self-awareness and entertainment.
          Tendencies. Not a script. It is also not a separate system from{" "}
          <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
            Robert Camp&rsquo;s version
          </Link>
          . That is the same birthday-to-card map under the name his
          books made popular.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          For a side-by-side, cards vs tarot language, see{" "}
          <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          . For 52-card astrology framing, see{" "}
          <Link href="/52-card-astrology-explained" className="text-brand-oxblood underline underline-offset-4">
            52-card astrology explained
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How people actually use it</h2>
        <p className="prose-reading text-brand-ink-soft">
          Birth card as baseline. Other people&rsquo;s cards for comparison, and
          for evidence. Compatibility between two birthdays. Timing cards for the chapter
          you are in. When you want the pattern written out by a person, start with the{" "}
          <Link href="/#readings" className="text-brand-oxblood underline underline-offset-4">
            the Chemistry Check ($24)
          </Link>
          . Your card beside one other person&rsquo;s, read together. The thing you have been
          pretending not to wonder about.
        </p>
      </section>

      <QuietContinue />

      <section className="mt-10 scroll-mt-24" id="faq">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Cardology FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">You are still here. Keep going.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/#readings" className="ink-button">
            the Chemistry Check, $24 →
          </Link>
          <Link href="/birth-card-calculator" className="inline-block rounded-full border border-brand-line px-5 py-2 font-serif text-sm text-brand-oxblood">
            Calculator page →
          </Link>
          <Link href="/cardology-for-beginners" className="inline-block rounded-full border border-brand-line px-5 py-2 font-serif text-sm text-brand-oxblood">
            Beginners path →
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="inline-block rounded-full border border-brand-line px-5 py-2 font-serif text-sm text-brand-oxblood">
            Birthdays by date →
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="inline-block rounded-full border border-brand-line px-5 py-2 font-serif text-sm text-brand-oxblood">
            All pairings →
          </a>
        </div>
      </div>
    </SeoShell>
  );
}
