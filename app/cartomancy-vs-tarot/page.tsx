import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";

export const metadata: Metadata = {
  title: "Cartomancy vs Tarot: Reading With Playing Cards, Explained",
  description:
    "Cartomancy vs tarot: how a standard 52-card deck maps to tarot's suits, what replaces the Major Arcana, and why Cardology reads playing cards without a shuffle.",
  alternates: { canonical: "/cartomancy-vs-tarot" },
  openGraph: {
    title: "Cartomancy vs Tarot: Reading With Playing Cards, Explained",
    description:
      "How a 52-card deck maps to tarot's structure, and why Cardology reads playing cards deterministically — no shuffle, no draw.",
    url: "/cartomancy-vs-tarot",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function CartomancyVsTarot() {
  const faqs = [
    {
      q: "Can you read tarot with playing cards?",
      a: "Mostly, yes. Each tarot suit has a playing-card equivalent — Cups become Hearts, Wands become Clubs, Pentacles become Diamonds, Swords become Spades — so the 56 minor arcana translate to the 52-card deck with only the four extra court cards lost — one per suit, since tarot carries four courts where the playing deck carries three. What a playing-card deck does not have is the 22 Major Arcana. Cartomancy traditions either work without them or, as Cardology does, replace their symbolism with the deck's own calendar structure.",
    },
    {
      q: "Is cartomancy the same as tarot?",
      a: "No. Cartomancy is the umbrella term for reading meaning from cards. Tarot is one branch of cartomancy that uses a 78-card deck. Playing-card reading is another branch that uses the standard 52-card deck, and Cardology is a specific playing-card system within it.",
    },
    {
      q: "What do the playing card suits correspond to in tarot?",
      a: "Hearts correspond to Cups (emotion and relationships), Clubs to Wands (energy, mind, and communication), Diamonds to Pentacles (money, values, and resources), and Spades to Swords (work, will, and transformation).",
    },
    {
      q: "Does a playing card deck have a Major Arcana?",
      a: "No. The 52-card deck is structurally the minor arcana. Where tarot uses the 22 trumps for the big archetypal themes, Cardology reads the deck's built-in calendar structure instead — 52 cards for 52 weeks, 4 suits for 4 seasons, 13 ranks for the 13 weeks of a season — and derives timing and life-pattern language from that mathematics.",
    },
    {
      q: "Is Cardology a form of cartomancy?",
      a: "Yes — the deterministic branch of it. Most cartomancy shuffles a deck and interprets whatever falls. Cardology never shuffles: your birthday maps to exactly one card by a fixed formula, and the same birthday returns the same card every time.",
    },
  ];

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Cartomancy vs Tarot", href: "/cartomancy-vs-tarot" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">Cartomancy vs Tarot</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Cartomancy is reading meaning from cards; tarot is one branch of it
          that uses a 78-card deck. Cardology is playing-card cartomancy made
          deterministic: a fixed formula maps a birthday to one of the 52
          cards, with no shuffle and no draw.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        If you searched &ldquo;cartomancy vs tarot,&rdquo; you are really asking two
        questions: what counts as cartomancy, and whether an ordinary deck of
        playing cards can do what a tarot deck does. The short version:
        cartomancy is the whole practice of reading cards, tarot is its most
        famous branch, and the 52-card deck is the older, plainer instrument
        underneath both. Cardology is what happens when you read that plain
        deck by <strong>structure</strong> instead of chance.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What cartomancy actually is</h2>
        <p className="prose-reading text-mist">
          Cartomancy is any practice that assigns meaning to cards and reads
          them for insight — an umbrella term, not a single method. Tarot,
          Lenormand, oracle decks, and plain playing-card reading are all
          cartomancy. The playing-card branch is the oldest of these in
          Europe: people were reading the standard deck centuries before
          decorated tarot decks became the default image of card reading.
          When someone asks for the &ldquo;playing card tarot equivalent,&rdquo; the
          honest answer is that playing cards are not an imitation of tarot.
          Tarot grew out of the same four-suit root and added trumps on top.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How the 52-card deck maps to tarot</h2>
        <p className="prose-reading mb-2 text-mist">
          Tarot&rsquo;s minor arcana are a costume over the deck you already own.
          The four suits translate directly:
        </p>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#e0654a]">♥ Hearts</span> ↔ Cups — emotion &amp; relationships</li>
          <li><span className="text-[#7fae8f]">♣ Clubs</span> ↔ Wands — energy, mind &amp; communication</li>
          <li><span className="text-[#d9b26a]">♦ Diamonds</span> ↔ Pentacles — money, values &amp; resources</li>
          <li><span className="text-[#7b6cf0]">♠ Spades</span> ↔ Swords — work, will &amp; transformation</li>
        </ul>
        <p className="prose-reading mt-3 text-mist">
          Ace through Ten line up one to one. The courts almost do: tarot
          carries four court cards per suit where the playing deck carries
          three, which is why the minor arcana count 56 cards to the deck&rsquo;s
          52. That is the entire structural difference on the suit side — a
          Seven of Cups and a Seven of Hearts are the same slot in the same
          grid, wearing different clothes.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What about the Major Arcana?</h2>
        <p className="prose-reading text-mist">
          The 22 trumps — the Fool, the Tower, Death — have no playing-card
          equivalent, and this is where the two branches of cartomancy genuinely
          part ways. Tarot uses the Major Arcana to carry the big archetypal
          themes. Cardology does not try to replace those images with other
          images. It replaces them with <strong>structure</strong>. The deck is
          built like a calendar: 52 cards for 52 weeks, 4 suits for 4 seasons,
          13 ranks for the 13 weeks of a season, and face values that sum to
          364 — a solar year with the Joker. Cardology reads that architecture
          for timing and life pattern, which is the work the trumps do in
          tarot, done with arithmetic instead of allegory.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Deterministic vs shuffled</h2>
        <p className="prose-reading text-mist">
          The deeper split is not the deck — it is how a card gets chosen. A
          tarot reading starts with a shuffle: the cards fall where they fall,
          and the reader interprets the spread. Ask the same question tomorrow
          and you will draw different cards. That is not a flaw; it is the
          method. Tarot is built for open questions, and the randomness is the
          doorway.
        </p>
        <p className="prose-reading mt-3 text-mist">
          Cardology removes the shuffle entirely. Your birthday maps to exactly
          one card — your birth card — through a fixed formula, and the same
          math produces your yearly and daily cards. Same input, same output,
          every time, for any reader. Nothing falls; everything is already in
          place. That makes Cardology the rare corner of cartomancy you can
          check: if a page says March 15 is the 8 of Diamonds, the math either
          holds or it does not. It also sets the claim boundary. A shuffled
          spread invites a prediction. A calculated card can only offer a
          mirror — a standing description of pattern and timing you test
          against a real life, not a forecast of Tuesday.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Cartomancy vs tarot at a glance</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm text-mist">
            <thead>
              <tr className="border-b border-white/15">
                <th className="py-2 pr-4 font-serif text-bone" scope="col"></th>
                <th className="py-2 pr-4 font-serif text-bone" scope="col">Tarot</th>
                <th className="py-2 font-serif text-bone" scope="col">Cardology (playing cards)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-normal text-faint" scope="row">Deck</th>
                <td className="py-2 pr-4">78 cards</td>
                <td className="py-2">52 cards + Joker</td>
              </tr>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-normal text-faint" scope="row">Suits</th>
                <td className="py-2 pr-4">Cups, Wands, Pentacles, Swords</td>
                <td className="py-2">Hearts, Clubs, Diamonds, Spades</td>
              </tr>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-normal text-faint" scope="row">Major Arcana</th>
                <td className="py-2 pr-4">22 trumps</td>
                <td className="py-2">None — calendar structure &amp; timing math instead</td>
              </tr>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-normal text-faint" scope="row">Court cards</th>
                <td className="py-2 pr-4">4 per suit</td>
                <td className="py-2">3 per suit</td>
              </tr>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-normal text-faint" scope="row">How a card is chosen</th>
                <td className="py-2 pr-4">Shuffle and draw</td>
                <td className="py-2">Fixed formula on the birthday</td>
              </tr>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-normal text-faint" scope="row">Same question twice</th>
                <td className="py-2 pr-4">Different spread</td>
                <td className="py-2">Same card, every time</td>
              </tr>
              <tr>
                <th className="py-2 pr-4 font-normal text-faint" scope="row">Built for</th>
                <td className="py-2 pr-4">Open-ended question reading</td>
                <td className="py-2">People, compatibility &amp; timing patterns</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Which one should you use?</h2>
        <p className="prose-reading text-mist">
          They are not competitors so much as different tools inside the same
          cartomancy family. If you want a reflective practice built around a
          question and a moment, tarot&rsquo;s shuffle is the point. If you want a
          stable vocabulary for a specific person — how they operate, where two
          people&rsquo;s friction lives, what a chapter of time tends to press on —
          the deterministic side is stronger, because the answer does not
          change out from under you. The practical starting point costs
          nothing: run a birthday through the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            birth card calculator
          </Link>{" "}
          and compare the card&rsquo;s description to the actual person. If it
          clarifies nothing real, discard it.
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

      <ReadingBridge variant="general" className="mt-10" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Find your card in the 52</p>
        <p className="mt-1 text-sm text-faint">No shuffle required — your birthday already picked it.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Birth Card Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/52-card-astrology-explained" className="text-gold underline underline-offset-4">52-card astrology explained →</Link>
      </p>
    </SeoShell>
  );
}
