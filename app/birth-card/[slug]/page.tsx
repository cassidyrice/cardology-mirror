import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";
import {
  allBirthdateSlugs,
  allCardSeo,
  birthdateBySlug,
  birthDatesForCard,
  cardBySlug,
  cardMeta,
  dateMeta,
  neighborDates,
  sameCardDates,
  zodiacFor,
  type BirthdateSeo,
  type CardSeo,
} from "@/lib/seo-cards";

export function generateStaticParams() {
  return [
    ...allCardSeo().map((c) => ({ slug: c.slug })),
    ...allBirthdateSlugs().map((slug) => ({ slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (card) {
    const { title, description } = cardMeta(card);
    return {
      title,
      description,
      alternates: { canonical: `/birth-card/${card.slug}` },
      openGraph: {
        title,
        description,
        url: `/birth-card/${card.slug}`,
        type: "article",
        images: [{ url: `/og/${card.slug}.png`, width: 1200, height: 630, alt: `${card.label} birth card` }],
      },
      twitter: { card: "summary_large_image", title, description, images: [`/og/${card.slug}.png`] },
    };
  }

  const date = birthdateBySlug(slug);
  if (date) {
    const { title, description } = dateMeta(date);
    return {
      title,
      description,
      alternates: { canonical: `/birth-card/${date.slug}` },
      openGraph: {
        title,
        description,
        url: `/birth-card/${date.slug}`,
        type: "article",
        images: [{ url: `/og/${date.card.slug}.png`, width: 1200, height: 630, alt: `${date.label} birth card: ${date.card.label}` }],
      },
      twitter: { card: "summary_large_image", title, description, images: [`/og/${date.card.slug}.png`] },
    };
  }

  return {};
}

export default async function BirthCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = cardBySlug(slug);
  if (card) return <CardMeaningPage card={card} />;

  const date = birthdateBySlug(slug);
  if (date) return <BirthdatePage date={date} />;

  notFound();
}

function CardMeaningPage({ card }: { card: CardSeo }) {
  const siblings = allCardSeo().filter((c) => c.suit === card.suit && c.slug !== card.slug);
  const dates = birthDatesForCard(card);
  const related = relatedCards(card);
  const faqs = cardFaqs(card, dates);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", item: SITE_URL },
      { name: "Birth Cards", item: `${SITE_URL}/birth-card` },
      { name: `${card.label}`, item: `${SITE_URL}/birth-card/${card.slug}` },
    ]),
    faqJsonLd(faqs),
    articleJsonLd({
      headline: `${card.label} Birth Card Meaning`,
      description: card.coreIdentity || card.sweetSpot,
      url: `${SITE_URL}/birth-card/${card.slug}`,
    }),
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Cards", href: "/birth-card" },
        { label: card.label, href: `/birth-card/${card.slug}` },
      ]}
    >
      <JsonLd data={jsonLd} />

      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-serif text-5xl" style={{ color: card.color }}>{card.code}</span>
        <span className="eyebrow text-faint">{card.suitDomain}</span>
      </div>
      <h1 className="display mb-2 text-3xl text-bone">
        {card.label} Birth Card Meaning{" "}
        {card.title && <span className="block text-lg text-gold">{card.title}</span>}
      </h1>
      <p className="prose-reading mt-3 text-mist">
        The {card.label} is a Cardology birth card in the {suitWord(card)} suit. It describes a core life pattern: how you tend to move when centered, what you naturally notice, and where you may overreach or hold back. Use this page as a plain-language guide to the {card.label} personality, strengths, shadow, relationships, career themes, and birth dates.
      </p>

      <Section title="Quick meaning">
        <p>{card.coreIdentity || `The ${card.label} expresses ${card.suitDomain.toLowerCase()} through the lens of ${rankTheme(card.rank).toLowerCase()}.`}</p>
        <p>
          In practical terms, this card is not a fixed fate or prediction. It is a mirror for recurring choices. When the {card.label} is balanced, the person tends to express the best of {suitWord(card).toLowerCase()} energy: {card.sweetSpot}
        </p>
      </Section>

      <Section title={`${card.label} personality`}>
        <p>
          People with the {card.label} birth card often learn through {suitDomainPlain(card)}. The rank adds the tone of {rankTheme(card.rank).toLowerCase()}, while the {suitWord(card)} suit points the pattern toward {card.suitDomain.toLowerCase()}. That combination can feel natural from the inside but very visible to others: the card tends to show up in decisions, attractions, work style, emotional rhythm, and the kind of problems a person repeatedly tries to solve.
        </p>
        <p>
          The healthiest expression is not about becoming more intense or more mystical. It is about noticing the card&rsquo;s middle lane. For the {card.label}, the middle lane is: {card.sweetSpot} When this is active, the card reads less like a label and more like a useful compass.
        </p>
      </Section>

      <Section title="The pattern, in three positions">
        <div className="space-y-4">
          <Lens label="Balanced" tone="#7fae8f" text={card.sweetSpot} />
          <Lens label="Under-expressed" tone="#d9b26a" text={card.under} />
          <Lens label="Over-expressed" tone="#e0654a" text={card.over} />
        </div>
        <p className="mt-4 text-sm text-faint">
          These three positions are useful for self-reflection because they turn the birth card into a range, not a box. The question is not “am I this card?” but “where am I sitting in the range today?”
        </p>
      </Section>

      <Section title="Strengths">
        {card.gifts.length > 0 ? (
          <ul className="space-y-1.5">
            {card.gifts.map((g, i) => <li key={i} className="flex gap-2 text-mist"><span className="text-gold">·</span><span>{g}</span></li>)}
          </ul>
        ) : (
          <p>
            The {card.label}&rsquo;s strength is its ability to bring {rankTheme(card.rank).toLowerCase()} into {suitDomainPlain(card)}. Others may experience this as a distinctive way of loving, thinking, building value, or carrying responsibility, depending on how centered the card is in the moment.
          </p>
        )}
      </Section>

      <Section title="Shadow and growth edge">
        <p>{card.shadow || card.over}</p>
        <p>
          The growth edge is usually a return to proportion. If the card is under-expressed, the medicine is participation: say the true thing, make the choice, ask for what matters, or take the next clean step. If the card is over-expressed, the medicine is restraint: listen longer, soften control, simplify the agenda, and let the pattern breathe.
        </p>
      </Section>

      <Section title="Love and relationships">
        <p>
          In relationships, the {card.label} tends to reveal itself through {relationshipTheme(card)}. It can be deeply compelling when the person is centered, because the card brings a recognizable emotional signature. The shadow usually appears when the card tries to get safety through its over-expressed pattern instead of direct honesty.
        </p>
        <p>
          For compatibility, compare the {card.label} with a partner&rsquo;s birth card and ruling card. The birth card shows the core pattern; the ruling card can show how the person expresses that pattern through personality, attraction, and day-to-day choices.
        </p>
      </Section>

      <Section title="Career, work, and purpose">
        <p>
          At work, the {card.label} often wants roles where {workTheme(card)}. The best fit depends on the whole chart, but the birth card alone can show what kind of contribution feels meaningful and what kind of pressure creates distortion. If this card is repeatedly burned out, scattered, or controlling, the work may be asking for a cleaner expression of its suit and rank.
        </p>
        {card.lifeDirection && <p>{card.lifeDirection}</p>}
      </Section>

      {card.karma && (
        <Section title="Karma connections">
          <p className="mb-4">
            In the Life Spread, the {card.label} has two primary karma connections. These are cards that represent shared energy, past-life patterns, or lessons the {card.label} is here to integrate.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {card.karma.environment && (
              <KarmaLink label="Lifetime Gift" code={card.karma.environment} />
            )}
            {card.karma.displacement && (
              <KarmaLink label="Lifetime Challenge" code={card.karma.displacement} />
            )}
          </div>
          <p className="mt-4 text-sm text-faint">
            The <strong>Lifetime Gift (Environment)</strong> represents a natural blessing or ease you bring into this life. The <strong>Lifetime Challenge (Displacement)</strong> represents a lesson or energy you are here to mature and integrate.
          </p>
        </Section>
      )}

      {dates.length > 0 && (
        <Section title={`${card.label} birth dates`}>
          <p>The {card.label} appears for these birthdays in this deterministic Cardology system:</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {dates.map((d) => (
              <li key={d.slug}>
                <Link href={`/birth-card/${d.slug}`} className="text-gold underline underline-offset-4">{d.label}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Related cards to compare">
        <ul className="grid grid-cols-1 gap-2 text-sm">
          {related.map((c) => (
            <li key={c.slug}>
              <Link href={`/birth-card/${c.slug}`} className="text-gold underline underline-offset-4">{c.code} {c.label}</Link>
              <span className="text-faint"> — compare another {suitWord(c).toLowerCase()} expression</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Frequently asked questions">
        <FaqList faqs={faqs} />
      </Section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Not sure this is your card?</p>
        <p className="mt-1 text-sm text-faint">Your birth card is fixed by your birthday. Find yours in seconds, then use the app for today&rsquo;s timing, compatibility, and reflection prompts.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">Birth Card Calculator →</Link>
      </div>

      <nav className="mt-10">
        <h2 className="eyebrow mb-3 text-gold">More {suitWord(card)} cards</h2>
        <ul className="flex flex-wrap gap-2">
          {siblings.map((c) => (
            <li key={c.slug}>
              <Link href={`/birth-card/${c.slug}`} className="rounded-full border border-white/12 px-3 py-1 text-sm text-mist transition hover:border-gold/40 hover:text-bone">
                {c.code} {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">See how {card.label} pairs with other cards →</Link>
        </p>
      </nav>
    </SeoShell>
  );
}

function BirthdatePage({ date }: { date: BirthdateSeo }) {
  const card = date.card;
  const ruling = date.rulingCard;
  const zodiac = zodiacFor(date.month, date.day);
  const { prev, next } = neighborDates(date);
  const shared = sameCardDates(date);

  const faqs = [
    { q: `What is the birth card for ${date.label}?`, a: `The birth card for ${date.label} is ${card.label}${card.title ? `, known as ${card.title}` : ""}.` },
    { q: `What is the ruling card for ${date.label}?`, a: ruling
        ? `The planetary ruling card for ${date.label} is ${ruling.label}. ${date.label} falls in ${zodiac.sign}, ruled by ${zodiac.planet}, and that planetary position is what selects ${ruling.label} as the ruling card for this birthday.`
        : `${date.label} births carry the ${card.label} as both birth card and primary expression. Use the calculator for the complete context.` },
    { q: `What does ${card.label} mean for a ${date.label} birthday?`, a: `${card.label} points to ${card.suitDomain.toLowerCase()} and the pattern of ${rankTheme(card.rank).toLowerCase()}. Its balanced expression is: ${card.sweetSpot}` },
    { q: `Is the ${date.label} birth card the same every year?`, a: `Yes. The birth card is calculated from month and day only, so ${date.label} maps to ${card.label} every year, for every birth year.` },
    { q: `What zodiac sign is ${date.label}?`, a: `${date.label} falls in ${zodiac.sign}. In Cardology, the sign matters because its ruling planet, ${zodiac.planet}, determines which card in the ${card.label}'s life spread becomes the planetary ruling card.` },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", item: SITE_URL },
      { name: "Birth Cards", item: `${SITE_URL}/birth-card` },
      { name: date.label, item: `${SITE_URL}/birth-card/${date.slug}` },
    ]),
    faqJsonLd(faqs),
    articleJsonLd({
      headline: `${date.label} Birth Card: ${card.label}`,
      description: `${date.label} birth card meaning in Cardology.`,
      url: `${SITE_URL}/birth-card/${date.slug}`,
    }),
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Cards", href: "/birth-card" },
        { label: date.label, href: `/birth-card/${date.slug}` },
      ]}
    >
      <JsonLd data={jsonLd} />
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-serif text-5xl" style={{ color: card.color }}>{card.code}</span>
        <span className="eyebrow text-faint">{date.label} birth card</span>
      </div>
      <h1 className="display mb-2 text-3xl text-bone">{date.label} Birth Card: {card.label}</h1>
      <p className="prose-reading mt-3 text-mist">
        If your birthday is {date.label}, your Cardology birth card is the {card.label}
        {card.title ? `, ${card.title}` : ""}. {date.label} sits in {zodiac.sign}, so this birthday
        carries a second layer: {zodiac.planet} selects {ruling ? `the ${ruling.label}` : "a planetary ruling card"} as
        the lens the {card.label} expresses through. This page covers both layers and what makes a {date.label} birthday
        distinct from the other {card.label} dates.
      </p>

      <Section title="Birthday card meaning">
        <p>
          The {date.label} birth card is {card.label}, a {suitWord(card)} card connected with {card.suitDomain.toLowerCase()}. The rank adds the theme of {rankTheme(card.rank).toLowerCase()}, so this birthday often learns through the way those two forces meet.
        </p>
        <p>{card.coreIdentity || card.sweetSpot}</p>
      </Section>

      <Section title="Balanced, under-expressed, and over-expressed">
        <div className="space-y-4">
          <Lens label="Balanced" tone="#7fae8f" text={card.sweetSpot} />
          <Lens label="Under-expressed" tone="#d9b26a" text={card.under} />
          <Lens label="Over-expressed" tone="#e0654a" text={card.over} />
        </div>
      </Section>

      <Section title={`The ${zodiac.sign} layer: why ${date.label} differs from other ${card.label} birthdays`}>
        <p>
          Several birthdays share the {card.label} birth card, but they do not share a ruling card. The ruling card
          is selected by the birthday&rsquo;s zodiac position: {date.label} falls in {zodiac.sign}, ruled by {zodiac.planet},
          the planet of {zodiac.planetMeaning}. That planetary position in the {card.label}&rsquo;s life spread is what
          singles out this birthday&rsquo;s expression.
        </p>
        {ruling && (
          <p>
            For {date.label}, that makes <Link href={`/birth-card/${ruling.slug}`} className="text-gold underline underline-offset-4">{ruling.label}</Link>{ruling.title ? ` (${ruling.title})` : ""} the primary ruling card. The birth card is the engine; the ruling card is the steering. A {date.label} {card.label} tends to express the core pattern through {ruling.suitDomain.toLowerCase()} and the tone of {rankTheme(ruling.rank).toLowerCase()}.
          </p>
        )}
      </Section>

      {ruling && (
        <Section title={`How the ${ruling.label} ruling card shows up`}>
          <p>
            When this birthday is centered, the ruling card adds: {ruling.sweetSpot}
          </p>
          <p>
            Under pressure, the same lens can slide toward its over-expression: {ruling.over} If you were born {date.label} and the {card.label} description feels almost right but not quite, the {ruling.label} layer is usually the missing piece.
          </p>
        </Section>
      )}

      <Section title="How to read this birthday pattern">
        <p>
          Start with the birth card as the anchor, not a verdict. Ask where the {card.label} is centered in your life right now, where it is under-used, and where it becomes too loud. Then check whether the {ruling ? ruling.label : "ruling card"} layer explains the style you bring to that pattern. The two cards together are a more honest mirror than either one alone.
        </p>
      </Section>

      {shared.length > 0 && (
        <Section title={`Other ${card.label} birthdays`}>
          <p>These birthdays share the {card.label} birth card, each with its own ruling-card layer:</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {shared.map((d) => (
              <li key={d.slug}>
                <Link href={`/birth-card/${d.slug}`} className="text-gold underline underline-offset-4">{d.label}</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Frequently asked questions">
        <FaqList faqs={faqs} />
      </Section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Want the full reading?</p>
        <p className="mt-1 text-sm text-faint">Use the calculator to save your birth card and open the app experience.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">Open the Birth Card Calculator →</Link>
      </div>

      <nav className="mt-8 flex items-center justify-between text-sm">
        <Link href={`/birth-card/${prev.slug}`} className="text-gold underline underline-offset-4">← {prev.label}</Link>
        <Link href={`/birth-card/${card.slug}`} className="text-faint hover:text-mist">{card.label} guide</Link>
        <Link href={`/birth-card/${next.slug}`} className="text-gold underline underline-offset-4">{next.label} →</Link>
      </nav>
    </SeoShell>
  );
}

function KarmaLink({ label, code }: { label: string; code: string }) {
  const seo = allCardSeo().find((c) => c.code === code);
  if (!seo) return null;
  return (
    <Link
      href={`/birth-card/${seo.slug}`}
      className="card-surface flex items-center gap-4 px-4 py-3 transition hover:border-gold/40"
    >
      <span className="font-serif text-3xl" style={{ color: seo.color }}>
        {seo.code}
      </span>
      <div className="flex flex-col">
        <span className="eyebrow text-[0.6rem] text-gold">{label}</span>
        <span className="font-serif text-base text-bone">{seo.label}</span>
      </div>
      <span className="ml-auto text-gold/50">→</span>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-8"><h2 className="eyebrow mb-2 text-gold">{title}</h2><div className="prose-reading text-mist">{children}</div></section>;
}

function Lens({ label, tone, text }: { label: string; tone: string; text: string }) {
  return <div className="rounded-2xl border p-4" style={{ borderColor: `${tone}33`, background: `${tone}0d` }}><p className="eyebrow mb-1" style={{ color: tone }}>{label}</p><p className="mb-0 text-mist">{text}</p></div>;
}

function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return <div className="space-y-4">{faqs.map((f) => <div key={f.q}><h3 className="font-serif text-base text-bone">{f.q}</h3><p>{f.a}</p></div>)}</div>;
}

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function breadcrumbJsonLd(items: { name: string; item: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })) };
}

function faqJsonLd(faqs: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

function articleJsonLd({ headline, description, url }: { headline: string; description: string; url: string }) {
  return { "@context": "https://schema.org", "@type": "Article", headline, description, url, author: { "@type": "Organization", name: "Cardology Pro" }, publisher: { "@type": "Organization", name: "Cardology Pro" } };
}

function cardFaqs(card: CardSeo, dates: BirthdateSeo[]) {
  const dateText = dates.length ? dates.map((d) => d.label).join(", ") : "the birthdays returned by the calculator";
  return [
    { q: `What does ${card.label} mean in Cardology?`, a: `${card.label} is a birth-card pattern connected with ${card.suitDomain.toLowerCase()}. Its balanced expression is: ${card.sweetSpot}` },
    { q: `What are ${card.label} birth dates?`, a: `${card.label} birth dates in this system are: ${dateText}.` },
    { q: `What is the shadow of ${card.label}?`, a: card.shadow || card.over },
    { q: `Is ${card.label} compatible with other birth cards?`, a: `Yes. Compatibility depends on the relationship between both people's birth cards, ruling cards, and timing. Use the compatibility calculator to compare ${card.label} with another card.` },
  ];
}

function relatedCards(card: CardSeo): CardSeo[] {
  const all = allCardSeo();
  const sameRank = all.filter((c) => c.rank === card.rank && c.slug !== card.slug).slice(0, 3);
  const sameSuit = all.filter((c) => c.suit === card.suit && c.slug !== card.slug).slice(0, 3);
  return [...sameRank, ...sameSuit].slice(0, 6);
}

function suitWord(card: CardSeo): string {
  return card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
}

function suitDomainPlain(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "relationship, emotional truth, belonging, and the courage to stay open";
    case "clubs": return "ideas, language, learning, communication, and the stories that shape perception";
    case "diamonds": return "money, values, resources, self-worth, and the choices that create stability";
    case "spades": return "work, discipline, health, responsibility, transformation, and spiritual maturity";
  }
}

function relationshipTheme(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "emotional presence, affection, trust, and the need to feel genuinely connected";
    case "clubs": return "conversation, shared ideas, mental stimulation, and the stories each person believes";
    case "diamonds": return "values, generosity, security, desire, and the way love is supported in real life";
    case "spades": return "commitment, endurance, repair, boundaries, and the willingness to grow through pressure";
  }
}

function workTheme(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "care, culture, connection, service, taste, hospitality, or human relationships matter";
    case "clubs": return "communication, teaching, strategy, writing, analysis, advising, or pattern recognition matters";
    case "diamonds": return "value, business, pricing, design, resources, money, or practical exchange matters";
    case "spades": return "craft, leadership, systems, health, operations, discipline, or deep transformation matters";
  }
}

function rankTheme(rank: string): string {
  const themes: Record<string, string> = {
    A: "initiation and pure impulse",
    "2": "partnership and exchange",
    "3": "creativity and choice",
    "4": "foundation and structure",
    "5": "freedom and change",
    "6": "responsibility and recalibration",
    "7": "faith, refinement, and inner testing",
    "8": "power, influence, and mastery",
    "9": "completion and release",
    "10": "public expression and full-cycle manifestation",
    J: "youthful mastery, experimentation, and cleverness",
    Q: "inner authority, nurturance, and magnetic intelligence",
    K: "leadership, command, and mature stewardship",
  };
  return themes[rank] ?? "card expression";
}
