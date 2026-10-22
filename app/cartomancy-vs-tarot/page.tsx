import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { TableScroll } from "@/components/seo/TableScroll";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cartomancy vs Tarot: Reading With Playing Cards, Explained",
  description:
    "Cartomancy vs tarot: how playing-card suits map to tarot, what replaces the Major Arcana, and why Cardology reads without a shuffle. No luck involved.",
  alternates: { canonical: "/cartomancy-vs-tarot" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cartomancy vs Tarot: Reading With Playing Cards, Explained",
    description:
      "How a 52-card deck maps to tarot's structure, and why Cardology reads playing cards deterministically. No shuffle. No draw. No excuses.",
    url: "/cartomancy-vs-tarot",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function CartomancyVsTarot() {
  const faqs = [
    {
      q: "Can you read tarot with playing cards?",
      a: "Mostly, yes. Each tarot suit has a playing-card equivalent. Cups become Hearts. Wands become Clubs. Pentacles become Diamonds. Swords become Spades. The 56 minor arcana translate to the 52-card deck and lose only four court cards, one per suit, since tarot carries four courts where the playing deck carries three. What a playing-card deck does not have is the 22 Major Arcana. Cartomancy traditions either work without them or, as Cardology does, replace their symbolism with the deck's own calendar structure. The deck in your junk drawer was never the knockoff.",
    },
    {
      q: "Is cartomancy the same as tarot?",
      a: "No. Cartomancy is the umbrella term for reading meaning from cards. Tarot is one branch of cartomancy, and it uses a 78-card deck. Playing-card reading is another branch, using the standard 52-card deck. Cardology is one specific playing-card system inside that. Calling all of it tarot is like calling every drink a latte.",
    },
    {
      q: "What do the playing card suits correspond to in tarot?",
      a: "Hearts correspond to Cups: feelings and relationships. Clubs correspond to Wands: drive, mind and communication. Diamonds correspond to Pentacles: money, values and resources. Spades correspond to Swords: work, will and transformation. Four suits. Four ways to overthink.",
    },
    {
      q: "Does a playing card deck have a Major Arcana?",
      a: "No. The 52-card deck is structurally the minor arcana. Where tarot uses the 22 trumps for the big archetypal themes, Cardology reads the deck's built-in calendar structure instead. 52 cards for 52 weeks. 4 suits for 4 seasons. 13 ranks for the 13 weeks of a season. Timing and life-pattern language come from that math. Not from a dramatic card with a tower on it.",
    },
    {
      q: "Is Cardology a form of cartomancy?",
      a: "Yes. The deterministic branch of it. Most cartomancy shuffles a deck and interprets whatever falls. Cardology never shuffles. Your birthday maps to exactly one card by a fixed formula, and the same birthday returns the same card every time. You cannot reshuffle your way out of it.",
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

      <h1 className="display mb-3 text-3xl text-brand-ink">Cartomancy vs Tarot</h1>
      <div className="mb-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Cartomancy is reading meaning from cards. Tarot is one branch of it,
          with a 78-card deck. Cardology is playing-card cartomancy made
          deterministic: a fixed formula maps a birthday to one of the 52
          cards. No shuffle. No draw. No do-over.
        </p>
      </div>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        You searched &ldquo;cartomancy vs tarot.&rdquo; That is two questions
        wearing one coat. One: what counts as cartomancy. Two: can an ordinary
        deck of playing cards do what a tarot deck does.
        Short version. Cartomancy is the whole practice of reading cards.
        Tarot is its most famous branch, the one with the aesthetic. The
        52-card deck is the older, plainer instrument underneath both.
        Cardology is what happens when you read that plain deck by{" "}
        <strong>structure</strong> instead of chance.
      </p>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What is cartomancy?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Cartomancy is any practice that assigns meaning to cards and reads
          them for insight. It is an umbrella term, not one method. Tarot,
          Lenormand, oracle decks and plain playing-card reading all count.
          In Europe, playing-card reading was around before tarot became the
          default picture of card reading.
          People ask for the &ldquo;playing card tarot equivalent.&rdquo; The
          honest answer: playing cards are not an imitation of tarot.
          Tarot grew out of the same four-suit root and added trumps on top.
          The plain deck was here first. It is not bitter about it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Can you read tarot with playing cards?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Mostly, yes. Each tarot suit has a playing-card equivalent. Cups
          become Hearts. Wands become Clubs. Pentacles become Diamonds. Swords
          become Spades. The 56 minor arcana translate to the 52-card deck,
          minus the four extra court cards. What a playing-card deck does not
          have is the 22 Major Arcana. Cartomancy traditions either work
          without them or, as Cardology does, replace their symbolism with the
          deck&rsquo;s own calendar structure. Less theater. More math.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How the 52-card deck maps to tarot</h2>
        <p className="prose-reading mb-2 text-brand-ink-soft">
          Hearts correspond to Cups, Clubs to Wands, Diamonds to Pentacles,
          and Spades to Swords. Ace through Ten map one to one. Tarot&rsquo;s
          minor arcana are a costume over the deck you already own. The four
          suits translate directly:
        </p>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span> ↔ Cups: feelings, relationships, the reread text</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> ↔ Wands: drive, mind, communication</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> ↔ Pentacles: money, values, resources</li>
          <li><span className="text-[#14110d]">♠ Spades</span> ↔ Swords: work, will, transformation</li>
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Ace through Ten line up one to one. The courts almost do. Tarot
          carries four court cards per suit. The playing deck carries three.
          That is why the minor arcana count 56 cards to the deck&rsquo;s 52.
          That is the entire structural difference on the suit side. A Seven
          of Cups and a Seven of Hearts are the same slot in the same grid,
          wearing different outfits. Like you at work versus you at 1am.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Does a playing card deck have a Major Arcana?</h2>
        <p className="prose-reading text-brand-ink-soft">
          The 22 trumps, the Fool, the Tower, Death, have no playing-card
          equivalent. This is where the two branches of cartomancy actually
          part ways. Tarot uses the Major Arcana to carry the big archetypal
          themes. Cardology does not swap those images for other images.
          It swaps them for <strong>structure</strong>. The deck is built like
          a calendar: 52 cards for 52 weeks, 4 suits for 4 seasons, 13 ranks
          for the 13 weeks of a season, and face values that sum to 364. Add
          the Joker and you have a solar year. Cardology reads that
          architecture for timing and life pattern. Unlike tarot, it does that
          work with arithmetic instead of allegory. Less mood lighting.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Deterministic vs shuffled</h2>
        <p className="prose-reading text-brand-ink-soft">
          The deeper split is not the deck. It is how a card gets chosen.
          A tarot reading starts with a shuffle. The cards fall where they
          fall, and the reader interprets the spread. Ask the same question
          tomorrow and the cards come out different. That is not a flaw. It
          is the method. Tarot is built for open questions. The randomness is
          the doorway. Asking four times until you like the answer is a you
          problem.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Cardology removes the shuffle entirely. Your birthday maps to
          exactly one card, your birth card, through a fixed formula. The same
          math produces your yearly and daily cards. Same input, same output,
          every time, for any reader. Nothing falls. Everything is already in
          place. That makes Cardology the rare corner of cartomancy you can
          check. If a page says March 15 is the 8 of Diamonds, the math either
          holds or it does not. It also sets the claim boundary. A shuffled
          spread invites a forecast. A calculated card can only offer a
          mirror: a standing description of pattern and timing you test
          against a real life. Not a forecast of Tuesday. Tuesday is on you.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Cartomancy vs tarot at a glance</h2>
        <TableScroll label="Cartomancy versus tarot">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm text-brand-ink-soft">
            <caption className="sr-only">Cartomancy playing cards versus tarot</caption>
            <thead>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-serif text-brand-ink" scope="col">Dimension</th>
                <th className="py-2 pr-4 font-serif text-brand-ink" scope="col">Tarot</th>
                <th className="py-2 font-serif text-brand-ink" scope="col">Cardology (playing cards)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">Deck</th>
                <td className="py-2 pr-4">78 cards</td>
                <td className="py-2">52 cards + Joker</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">Suits</th>
                <td className="py-2 pr-4">Cups, Wands, Pentacles, Swords</td>
                <td className="py-2">Hearts, Clubs, Diamonds, Spades</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">Major Arcana</th>
                <td className="py-2 pr-4">22 trumps</td>
                <td className="py-2">None. Calendar structure and timing math instead</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">Court cards</th>
                <td className="py-2 pr-4">4 per suit</td>
                <td className="py-2">3 per suit</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">How a card is chosen</th>
                <td className="py-2 pr-4">Shuffle and draw</td>
                <td className="py-2">Fixed formula on the birthday</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">Same question twice</th>
                <td className="py-2 pr-4">Different spread</td>
                <td className="py-2">Same card, every time</td>
              </tr>
              <tr>
                <th className="py-2 pr-4 font-normal text-brand-ink-soft" scope="row">Built for</th>
                <td className="py-2 pr-4">Open-ended question reading</td>
                <td className="py-2">People, compatibility &amp; timing patterns</td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Which one should you use?</h2>
        <p className="prose-reading text-brand-ink-soft">
          They are not rivals. They are different tools in the same
          cartomancy family. If you want a reflective practice built around a
          question and a moment, tarot&rsquo;s shuffle is the point. If you
          want a stable vocabulary for a specific person, how they operate,
          where two people&rsquo;s friction lives, what a chapter of time
          tends to press on, the deterministic side is stronger. The answer
          does not change out from under you. You do that part yourself.
          The practical starting point costs nothing. Run a birthday through
          the{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            birth card calculator
          </Link>{" "}
          and hold the description up to the actual person. If it clarifies
          nothing real, discard it. No hard feelings. Some, maybe.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Frequently asked questions</h2>
        <div className="space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="prose-reading mb-1 font-serif text-brand-ink">{f.q}</h3>
              <p className="prose-reading text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>


      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Find your card in the 52</p>
        <p className="mt-1 text-sm text-brand-ink-soft">No shuffle required. Your birthday already picked it. Years ago.</p>
        <Link href="/birth-card-calculator" className="ink-button mt-3">
          Birth Card Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">Cardology vs Tarot →</Link>
        {"  ·  "}
        <Link href="/52-card-astrology-explained" className="text-brand-oxblood underline underline-offset-4">52-card astrology explained →</Link>
      </p>
    </SeoShell>
  );
}
