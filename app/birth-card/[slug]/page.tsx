import type { Metadata } from "next";
import Link from "next/link";
import { OfferCta } from "@/components/seo/OfferCta";
import { notFound } from "next/navigation";
import { SeoShell } from "@/components/seo/SeoShell";
import { ShadowLayer, ShadowPrompts } from "@/components/seo/ShadowLayer";
import { FamousPeopleBlock } from "@/components/seo/FamousPeopleBlock";
import { VideoEmbed } from "@/components/seo/VideoEmbed";
import { SITE_NAME, SITE_URL, VIDEO_PATH } from "@/lib/site";
import {
  BIRTHDAY_REVEAL_VIDEOS,
  videosForCard,
  youtubeEmbed,
  youtubeId,
  youtubeThumbnail,
  type CardologyVideo,
} from "@/lib/videos";
import {
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
import { SUIT_COLOR_PAPER, type Suit } from "@/lib/cards";
import { compatForCard } from "@/lib/compat-pairs";
import { endOfPageReads } from "@/lib/end-of-page-reads";
import { famousForCard } from "@/lib/famous-birthdays";
import { readingNotesFor } from "@/lib/card-reading-notes";
import { CARD_MEANING_PAGES_UPDATED } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import { TableScroll } from "@/components/seo/TableScroll";

const SEO_UPDATED = CARD_MEANING_PAGES_UPDATED;

// Only the 52 card-meaning pages are prerendered here. The 366 birthday slugs
// are deliberately NOT built: the cardology-unlock Worker in front of Pages
// 301s /birth-card/[month]-[day] to its own /born-on/[month]-[day] pages
// (curl-verified in production 2026-07-12), so building them shipped 366
// unreachable shadow pages per deploy. The date-rendering branch below is kept
// only as a fallback in case that Worker redirect is ever removed.
export function generateStaticParams() {
  return allCardSeo().map((c) => ({ slug: c.slug }));
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
        siteName: SITE_NAME,
        title,
        description,
        url: `/birth-card/${card.slug}`,
        type: "article",
        images: [{ url: `/og/birth-card/${card.slug}.png`, width: 1200, height: 630, alt: `${card.label} Meaning: Cardology Birth Card` }],
      },
      twitter: { card: "summary_large_image", title, description, images: [{ url: `/og/birth-card/${card.slug}.png`, width: 1200, height: 630, alt: `${card.label} Meaning: Cardology Birth Card` }] },
    };
  }

  const date = birthdateBySlug(slug);
  if (date) {
    const { title, description } = dateMeta(date);
    return {
      title,
      description,
      alternates: { canonical: `/born-on/${date.slug}` },
      openGraph: {
        siteName: SITE_NAME,
        title,
        description,
        url: `/born-on/${date.slug}`,
        type: "article",
        images: [{ url: `/og/birth-card/${date.card.slug}.png`, width: 1200, height: 630, alt: `${date.card.label} Meaning: Cardology Birth Card` }],
      },
      twitter: { card: "summary_large_image", title, description, images: [{ url: `/og/birth-card/${date.card.slug}.png`, width: 1200, height: 630, alt: `${date.card.label} Meaning: Cardology Birth Card` }] },
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

function dedupeAgainstPrior(text: string, priorTexts: string[]): string {
  const priorSentences = new Set(
    priorTexts
      .flatMap((block) => block.match(/[^.!?]+[.!?]+/g) ?? [block])
      .map((sentence) => sentence.trim().toLowerCase())
      .filter(Boolean),
  );
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const kept = sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !priorSentences.has(sentence.toLowerCase()));
  return kept.join(" ").trim() || text.trim();
}

function CardMeaningPage({ card }: { card: CardSeo }) {
  const siblings = allCardSeo().filter((c) => c.suit === card.suit && c.slug !== card.slug);
  const dates = birthDatesForCard(card);
  const related = relatedCards(card);
  const faqs = cardFaqs(card, dates);
  const angles = interpretiveAngles(card);
  const videos = videosForCard(card.slug);
  const birthdayVideo = BIRTHDAY_REVEAL_VIDEOS[card.slug];
  const famous = famousForCard(card.code);
  const readingNotes = readingNotesFor(card.slug);
  const priorReadingText = [
    card.sweetSpot,
    card.over,
    card.shadow || "",
    generalReadingText(card),
    readingNotes?.reading ?? "",
  ].filter(Boolean);

  const jsonLd = [
    faqJsonLd(faqs),
    articleJsonLd({
      headline: `${card.label} Meaning: Cardology Birth Card`,
      description: card.coreIdentity || card.sweetSpot,
      url: `${SITE_URL}/birth-card/${card.slug}`,
      image: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og/birth-card/${card.slug}.png`,
        width: 1200,
        height: 630,
        caption: `${card.label} Meaning: Cardology Birth Card`,
      },
    }),
    ...videos.map(videoJsonLd),
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

      <div className="mb-4 flex items-center gap-5">
        <img
          src={`/share-cards/faces/${card.slug}.png`}
          alt={`${card.label} playing card`}
          width={1000}
          height={1500}
          loading="eager"
          decoding="async"
          className="w-24 shrink-0 rounded-xl border border-brand-line shadow-[0_6px_18px_rgba(20,17,13,0.18)]"
        />
        <div>
          <span className="type-eyebrow !font-bold !text-brand-ink-soft">{card.suitDomain}</span>
          <h1 className="display mb-0 mt-1 text-3xl text-brand-ink">
            {card.label} Meaning{" "}
            {card.title && <span className="block text-lg text-brand-bronze">{card.title}</span>}
          </h1>
          <span className="font-serif text-2xl" style={{ color: SUIT_COLOR_PAPER[card.suit] }}>{card.code}</span>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">The short answer</p>
        <p className="prose-reading text-brand-ink-soft">{cardQuickAnswer(card, dates)}</p>
      </div>
      <p className="mt-3 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(SEO_UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
      <ShadowLayer code={card.code} />
      <OfferCta className="mt-8" />

      <Section title="When it shows up in a reading">
        <p>{generalReadingText(card)}</p>
        {readingNotes ? (
          <>
            <h3 className="mt-4 font-serif text-base text-brand-ink">In a reading</h3>
            <p>{readingNotes.reading}</p>
            <h3 className="mt-4 font-serif text-base text-brand-ink">In love</h3>
            <p>
              {dedupeAgainstPrior(readingNotes.love, priorReadingText)}{" "}
              {/* /compatibility/ is edge-rendered by the cardology-unlock Worker,
                  not this Next app: plain <a>, hub href from the generated index. */}
              <a href={compatHubHref(card)} className="text-brand-oxblood underline underline-offset-4">
                See {card.label} compatibility with all 52 cards, if you must →
              </a>
            </p>
            <h3 className="mt-4 font-serif text-base text-brand-ink">In money and work</h3>
            <p>{dedupeAgainstPrior(readingNotes.work, [...priorReadingText, readingNotes.love])}</p>
            <h3 className="mt-4 font-serif text-base text-brand-ink">As a 52-day period card</h3>
            <p>{readingNotes.timing}</p>
          </>
        ) : null}
        <h3 className="mt-4 font-serif text-base text-brand-ink">As advice, if you take advice</h3>
        <p>{adviceReadingText(card)}</p>
      </Section>

      <Section title={`What does the ${card.label} mean as your birth card?`}>
        <p>
          In Cardology, your birthday maps to one fixed card. It did not ask how you feel about that. The {card.label} belongs to the {suitWord(card)} suit. Its traditional meanings are a way to look at your strengths, your habits, your relationships and your work. Read the patterns below as things to hold up against your actual life. They are not a full account of who you are. Nobody gets one of those.
        </p>
      </Section>

      <Section title="The receipts">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label="Card" value={card.label} />
          <InfoItem label="Suit domain" value={card.suitDomain} />
          <InfoItem label="Rank theme" value={rankTheme(card.rank)} />
          <InfoItem label="On a good day" value={card.sweetSpot} />
          <InfoItem label="On a bad day" value={card.shadow || card.over} />
          <InfoItem label="Birth dates" value={dates.map((d) => d.label).join(", ")} />
        </dl>
      </Section>

      <Section title="The card, minus the small talk">
        <p>{card.coreIdentity || `The ${card.label} expresses ${card.suitDomain.toLowerCase()} through the lens of ${rankTheme(card.rank).toLowerCase()}.`}</p>
        <p>
          This card is not a prediction. It is a mirror for the choices you keep making on repeat, like an app you swear you deleted. When the {card.label} is balanced, you get the best of what {suitWord(card)} has to offer: {card.sweetSpot}
        </p>
      </Section>

      <Section title={`If you are getting it tattooed`}>
        <p>
          The pip field of the {card.label}, on skin. No card rectangle. No corner index.
          If you ink this card, ink the layout a real deck uses. Then check it is actually yours.
          People skip that part.
        </p>
        <p className="mt-3">
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            Find your birth card free
          </Link>
          {" "}before you sit down.
        </p>
      </Section>

      <Section title="Four ways to read the same card">
        <p>
          Different Cardology readers lean on different parts of the same card.
          These four lenses widen the {card.label} meaning. None of them turns the card
          into a personality label you get to hide behind.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {angles.map((angle) => (
            <div key={angle.label} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-base text-brand-ink">{angle.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{angle.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`${card.label} personality`}>
        <p>
          People with the {card.label} birth card tend to learn through {suitDomainPlain(card)}. The rank adds the tone of {rankTheme(card.rank).toLowerCase()}. The {suitWord(card)} suit points the whole pattern at {card.suitDomain.toLowerCase()}. From the inside it feels normal. From the outside it is extremely visible. It shows up in your decisions, your attractions, your work style, your emotional rhythm, and the one problem you keep solving in a new font.
        </p>
        <p>
          The healthy version is not about getting more intense or more mystical. It is about finding the card&rsquo;s middle lane and staying in it. For the {card.label}, the middle lane is: {card.sweetSpot} When that is running, the card stops being a label. It turns into a compass you actually use.
        </p>
      </Section>

      <Section title="The pattern, at three volumes">
        <div className="space-y-4">
          <Lens label="Balanced" position="balanced" text={card.sweetSpot} />
          <Lens label="Under-expressed" position="under" text={card.under} />
          <Lens label="Over-expressed" position="over" text={card.over} />
        </div>
        <p className="mt-4 text-sm text-brand-ink-soft">
          Three positions. Not a verdict. The birth card is a range, not a box. So the honest question is not &ldquo;am I this card?&rdquo; It is &ldquo;which end of the range am I parked at today?&rdquo; You already know.
        </p>
      </Section>

      <ShadowPrompts code={card.code} />

      <Section title="What you are actually good at">
        {card.gifts.length > 0 ? (
          <ul className="space-y-1.5">
            {card.gifts.map((g, i) => <li key={i} className="flex gap-2 text-brand-ink-soft"><span className="text-brand-bronze">·</span><span>{g}</span></li>)}
          </ul>
        ) : (
          <p>
            The {card.label}&rsquo;s strength is bringing {rankTheme(card.rank).toLowerCase()} into {suitDomainPlain(card)}. Other people feel it as a specific way of loving, thinking, building value, or carrying weight. How well it lands depends on how centered you are that day.
          </p>
        )}
      </Section>

      <Section title="The shadow, and the way out">
        <p>{card.shadow || card.over}</p>
        <p>
          The way out is almost always a return to proportion. Unglamorous. Works anyway. Under-expressed? The fix is participation: say the true thing, make the choice, ask for what matters, take the next clean step. Over-expressed? The fix is restraint: listen longer, loosen the grip, drop half the agenda, and let the pattern breathe instead of running the room.
        </p>
      </Section>

      <Section title="Love and relationships, honestly">
        <p>
          In relationships, the {card.label} gives itself away through {relationshipTheme(card)}. Centered, it is magnetic. People clock the emotional signature from across the room. The shadow shows up when the card tries to buy safety with its over-expressed pattern instead of just being honest. You know the move. You did it recently.
        </p>
        <p>
          For compatibility, put the {card.label} next to a partner&rsquo;s birth card and ruling card. The birth card shows the core pattern. The ruling card shows how that person runs it: personality, attraction, and the small daily choices that quietly add up.
        </p>
      </Section>

      <CompatPairsSection card={card} />

      <Section title="Work, and what you think it is for">
        <p>
          At work, the {card.label} wants roles where {workTheme(card)}. The full fit depends on the whole chart. The birth card alone still shows which kind of contribution feels meaningful, and which kind of pressure bends you out of shape. If this card keeps ending up burned out, scattered, or controlling, the work is asking for a cleaner version of its suit and rank. Not a new planner.
        </p>
        {card.lifeDirection && <p>{card.lifeDirection}</p>}
      </Section>

      {card.karma && (
        <Section title="Your karma cards">
          <p className="mb-4">
            In the Life Spread, the {card.label} has two primary karma connections. These cards stand for past-life patterns and the lessons the {card.label} is here to finally integrate. You probably know someone carrying one already.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {card.karma.environment && (
              <KarmaLink label="Lifetime Gift" code={card.karma.environment} />
            )}
            {card.karma.displacement && (
              <KarmaLink label="Lifetime Challenge" code={card.karma.displacement} />
            )}
          </div>
          <p className="mt-4 text-sm text-brand-ink-soft">
            The <strong>Lifetime Gift (Environment)</strong> is a natural blessing, an ease you brought into this life. The <strong>Lifetime Challenge (Displacement)</strong> is a lesson you are here to grow up into and integrate. Slowly. Probably with complaints.
          </p>
        </Section>
      )}

      {dates.length > 0 && (
        <Section title={`${card.label} birth dates and ruling cards by zodiac sign`}>
          <p>
            The {card.label} shows up for {dates.length === 1 ? "one birthday" : `${dates.length} of the 365 calendar dates`}.
            Every one of them shares the birth card. The zodiac sign of the date picks a different
            planetary ruling card. That is why two people with the same {card.label} birth card can feel nothing alike in person. Same card. Different problems.
          </p>
          <TableScroll className="mt-3" label={`${card.label} birthdays with zodiac sign and ruling card`}>
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <caption className="sr-only">Birthdays that map to the {card.label}, with zodiac sign and planetary ruling card</caption>
              <thead>
                <tr className="border-b border-brand-line text-brand-ink">
                  <th scope="col" className="py-2 pr-3">Birthday</th>
                  <th scope="col" className="py-2 pr-3">Zodiac sign</th>
                  <th scope="col" className="py-2 pr-3">Ruling planet</th>
                  <th scope="col" className="py-2">Ruling card</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((d) => {
                  const z = zodiacFor(d.month, d.day);
                  return (
                    <tr key={d.slug} className="border-b border-brand-line">
                      <th scope="row" className="py-2 pr-3 font-medium text-brand-ink">
                        {/* Plain <a> to /born-on/: birthday pages live on the Worker-served surface. */}
                        <a href={`/born-on/${d.slug}`} className="text-brand-oxblood underline underline-offset-4">{d.label}</a>
                      </th>
                      <td className="py-2 pr-3">{z.sign}</td>
                      <td className="py-2 pr-3">{z.planet}</td>
                      <td className="py-2">
                        {d.rulingCards.length > 0
                          ? d.rulingCards.map((r, i) => (
                              <span key={r.slug}>
                                {i > 0 ? " or " : ""}
                                <Link href={`/birth-card/${r.slug}`} className="text-brand-oxblood underline underline-offset-4">{r.label}</Link>
                              </span>
                            ))
                          : "·"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
          <p className="mt-3 text-sm text-brand-ink-soft">
            Read the ruling card as the style the {card.label} pattern runs through. Same engine, different steering. Different bad habits.
          </p>
        </Section>
      )}

      <FamousPeopleBlock cardLabel={card.label} people={famous} />

      {/* The diagonal is the system's most legible proof that this is a
          structure and not a lookup table, so it is derived here rather than
          authored per card: value = 55 minus 2M minus D, so holding the value fixed
          drops the day by exactly 2 for every month advanced. */}
      {dates.length > 1 && (
        <Section title="The calendar walk (it is just math)">
          <p>
            Every date runs through one formula: <strong>Solar Value = 55 − (2 × Month + Day)</strong>.
            Each card holds one fixed value. Move forward one month and 2 × Month grows by two, so the day
            has to drop by two to keep that value. That makes this card&rsquo;s birthdays a straight diagonal
            across the calendar. Not a scatter. Not a vibe:
          </p>
          <p className="mt-3 font-mono text-sm text-brand-ink">
            {dates.map((d) => d.label).join(" → ")}
          </p>
          <p className="mt-3">
            The walk runs {dates.length} step{dates.length === 1 ? "" : "s"} and then stops, because the next
            month would need a day number the calendar does not have. Every card in the deck draws its own
            diagonal like this. That is why the cards cover between 1 and 12 dates each instead of an even share. Math does not do fairness.
          </p>
        </Section>
      )}

      <Section title="Other cards to compare yourself to">
        <ul className="grid grid-cols-1 gap-2 text-sm">
          {related.map((c) => (
            <li key={c.slug}>
              <Link href={`/birth-card/${c.slug}`} className="text-brand-oxblood underline underline-offset-4">{c.code} {c.label}</Link>
              <span className="text-brand-ink-soft">: another {suitWord(c).toLowerCase()} version of the same story</span>
            </li>
          ))}
        </ul>
      </Section>

      {videos.length > 0 ? (
        <Section title={`Watch: ${card.label} shadow reading`}>
          <p>
            The same {card.label} pattern, read out loud. The gift, the distortion, and the
            behavior it produces. The video sits next to this page. It does not replace it.
            A mirror, not a forecast.
          </p>
          <div className="mt-4 space-y-4">
            {videos.map((v) => (
              <VideoEmbed key={v.url} videoId={youtubeId(v.url)} title={v.title} />
            ))}
          </div>
          <p className="mt-3 text-sm">
            <Link href={VIDEO_PATH} className="text-brand-oxblood underline underline-offset-4">
              Browse all Cardology videos →
            </Link>
          </p>
        </Section>
      ) : birthdayVideo ? (
        <Section title={`Birthday reveal: ${card.label}`}>
          <p>{birthdayVideo.description}</p>
          <div className="mt-4">
            <VideoEmbed videoId={youtubeId(birthdayVideo.url)} title={birthdayVideo.title} />
          </div>
          <a href={birthdayVideo.url} className="mt-3 inline-block text-brand-oxblood underline underline-offset-4">
            Watch {birthdayVideo.title} on YouTube →
          </a>
        </Section>
      ) : (
        <Section title="Related videos">
          <p>
            Watch the Card Blueprints shadow readings and explainers in the video library.
            Then come back to this {card.label} meaning page for the written version. It holds still while you reread it.
          </p>
          <Link href={VIDEO_PATH} className="mt-3 inline-block text-brand-oxblood underline underline-offset-4">
            Open Cardology videos →
          </Link>
        </Section>
      )}

      <ReadNextSection card={card} />

      <Section title="Frequently asked questions">
        <FaqList faqs={faqs} />
      </Section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Not sure this is even your card?</p>
        <p className="mt-1 text-sm text-brand-ink-soft">Your birthday picks one card off the calendar. Find yours. Read its traditional meaning. Keep the questions that sting and ignore the rest, like your inbox.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block text-sm text-brand-oxblood underline underline-offset-4">Need the calculator to identify your card first →</Link>
      </div>

      <nav aria-label={`More ${suitWord(card)} cards`} className="mt-10">
        <h2 className="type-eyebrow mb-3 !text-brand-bronze">More {suitWord(card)} cards</h2>
        <ul className="flex flex-wrap gap-2">
          {siblings.map((c) => (
            <li key={c.slug}>
              <Link href={`/birth-card/${c.slug}`} className="rounded-full border border-brand-line px-3 py-1 text-sm text-brand-ink-soft transition hover:text-brand-ink">
                {c.code} {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/cardology-compatibility" className="text-brand-oxblood underline underline-offset-4">See how {card.label} pairs with other cards →</Link>
        </p>
      </nav>

      <EndOfPageReads card={card} siblings={siblings} />
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
        : `${date.label} births carry the ${card.label} as both birth card and primary expression. Use the calculator for the full picture.` },
    { q: `What does ${card.label} mean for a ${date.label} birthday?`, a: `${card.label} points at ${card.suitDomain.toLowerCase()} and the pattern of ${rankTheme(card.rank).toLowerCase()}. On a good day it looks like this: ${card.sweetSpot}` },
    { q: `Is the ${date.label} birth card the same every year?`, a: `Yes. The birth card is calculated from month and day only, so ${date.label} maps to ${card.label} every year, for every birth year. It does not care what kind of year you had.` },
    { q: `What zodiac sign is ${date.label}?`, a: `${date.label} falls in ${zodiac.sign}. In Cardology, the sign matters because its ruling planet, ${zodiac.planet}, determines which card in the ${card.label}'s life spread becomes the planetary ruling card.` },
  ];

  const jsonLd = [
    faqJsonLd(faqs),
    articleJsonLd({
      headline: `${date.label} Birth Card: ${card.label}`,
      description: `${date.label} birth card meaning in Cardology.`,
      url: `${SITE_URL}/born-on/${date.slug}`,
    }),
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Cards", href: "/birth-card" },
        { label: date.label, href: `/born-on/${date.slug}` },
      ]}
    >
      <JsonLd data={jsonLd} />
      <div className="mb-4 flex items-center gap-5">
        <img
          src={`/share-cards/faces/${card.slug}.png`}
          alt={`${card.label} playing card, the ${date.label} birth card`}
          width={1000}
          height={1500}
          loading="eager"
          decoding="async"
          className="w-24 shrink-0 rounded-xl border border-brand-line shadow-[0_6px_18px_rgba(20,17,13,0.18)]"
        />
        <div>
          <span className="type-eyebrow !font-bold !text-brand-ink-soft">{date.label} birth card</span>
          <h1 className="display mb-0 mt-1 text-3xl text-brand-ink">{date.label} Birth Card: {card.label}</h1>
          <span className="font-serif text-2xl" style={{ color: SUIT_COLOR_PAPER[card.suit] }}>{card.code}</span>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">The short answer</p>
        <p className="prose-reading text-brand-ink-soft">{dateQuickAnswer(date)}</p>
      </div>
      <p className="mt-3 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(SEO_UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
      <p className="prose-reading mt-3 text-brand-ink-soft">
        Born on {date.label}? Your Cardology birth card is the {card.label}
        {card.title ? `, ${card.title}` : ""}. Same answer every year. No negotiation. {date.label} sits in {zodiac.sign}, so
        this birthday carries a second layer: {zodiac.planet} selects {ruling ? `the ${ruling.label}` : "a planetary ruling card"}
        as the lens the {card.label} runs through. This page takes apart both layers, and what makes a {date.label}
        birthday different from the other {card.label} dates. Spoiler: it is the second layer.
      </p>

      <Section title="The receipts">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoItem label="Birthday" value={date.label} />
          <InfoItem label="Birth card" value={card.label} />
          <InfoItem label="Suit domain" value={card.suitDomain} />
          <InfoItem label="Rank theme" value={rankTheme(card.rank)} />
          <InfoItem label="Ruling card" value={ruling ? ruling.label : "Use the calculator for the full picture"} />
          <InfoItem label="Zodiac layer" value={`${zodiac.sign}, ruled by ${zodiac.planet}`} />
        </dl>
      </Section>

      <Section title="What this birthday card means">
        <p>
          The {date.label} birth card is {card.label}, a {suitWord(card)} card tied to {card.suitDomain.toLowerCase()}. The rank adds the theme of {rankTheme(card.rank).toLowerCase()}. This birthday tends to learn wherever those two collide.
        </p>
        <p>{card.coreIdentity || card.sweetSpot}</p>
      </Section>

      <Section title="Balanced, under-expressed, and over-expressed">
        <div className="space-y-4">
          <Lens label="Balanced" position="balanced" text={card.sweetSpot} />
          <Lens label="Under-expressed" position="under" text={card.under} />
          <Lens label="Over-expressed" position="over" text={card.over} />
        </div>
      </Section>

      <Section title={`The ${zodiac.sign} layer: why ${date.label} differs from other ${card.label} birthdays`}>
        <p>
          Several birthdays share the {card.label} birth card. They do not share a ruling card. The ruling card
          is picked by the birthday&rsquo;s zodiac position: {date.label} falls in {zodiac.sign}, ruled by {zodiac.planet},
          the planet of {zodiac.planetMeaning}. That planetary position in the {card.label}&rsquo;s life spread is what
          singles this birthday out.
        </p>
        {ruling && (
          <p>
            For {date.label}, that makes <Link href={`/birth-card/${ruling.slug}`} className="text-brand-oxblood underline underline-offset-4">{ruling.label}</Link>{ruling.title ? ` (${ruling.title})` : ""} the primary ruling card. The birth card is the engine. The ruling card is the steering. A {date.label} {card.label} tends to run the core pattern through {ruling.suitDomain.toLowerCase()} and the tone of {rankTheme(ruling.rank).toLowerCase()}.
          </p>
        )}
      </Section>

      {ruling && (
        <Section title={`How the ${ruling.label} ruling card shows up`}>
          <p>
            When this birthday is centered, the ruling card adds: {ruling.sweetSpot}
          </p>
          <p>
            Under pressure, the same lens slides toward its over-expression: {ruling.over} If you were born {date.label} and the {card.label} description feels almost right but not quite, the {ruling.label} layer is usually the missing piece. That itch has a name.
          </p>
        </Section>
      )}

      <Section title="How to read this birthday without spiraling">
        <p>
          Start with the birth card as the anchor. Not a verdict. Ask where the {card.label} is centered in your life right now, where it is under-used, and where it gets too loud. Then check whether the {ruling ? ruling.label : "ruling card"} layer explains the style you bring to that pattern. The two cards together make a more honest mirror than either one alone. Brighter lighting, too.
        </p>
      </Section>

      {shared.length > 0 && (
        <Section title={`Other ${card.label} birthdays`}>
          <p>These birthdays share the {card.label} birth card. Each one gets its own ruling-card layer:</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {shared.map((d) => (
              <li key={d.slug}>
                {/* Plain <a> to /born-on/: birthday pages live on the
                    Worker-served surface (the Worker 301s /birth-card/[date]
                    there; link direct to skip the redirect hop). */}
                <a href={`/born-on/${d.slug}`} className="text-brand-oxblood underline underline-offset-4">{d.label}</a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Frequently asked questions">
        <FaqList faqs={faqs} />
      </Section>

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Just browsing other people&rsquo;s birthdays?</p>
        <p className="mt-1 text-sm text-brand-ink-soft">Run any birth date through the calculator to get the birth card and ruling card free. Same answer every time. It is math, not a mood.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block text-sm text-brand-oxblood underline underline-offset-4">Need the calculator to identify your card first →</Link>
      </div>

      <nav aria-label="Nearby birthdays" className="mt-8 flex items-center justify-between text-sm">
        {/* Prev/next birthdays live on the Worker-served /born-on/ surface;
            link direct instead of /birth-card/[date], which 301s there. */}
        <a href={`/born-on/${prev.slug}`} className="text-brand-oxblood underline underline-offset-4">← {prev.label}</a>
        <Link href={`/birth-card/${card.slug}`} className="text-brand-ink-soft hover:text-brand-ink-soft">{card.label} guide</Link>
        <a href={`/born-on/${next.slug}`} className="text-brand-oxblood underline underline-offset-4">{next.label} →</a>
      </nav>
    </SeoShell>
  );
}

// Fixed life-path connections rendered as links into the Worker-served
// /compatibility/ pair library (1,378 pages + 52 per-card hubs, edge-rendered
// by cardology-unlock). Pair selection is deterministic per card: its six
// planetary life-path cards (Venus/Moon/Mars/Jupiter/Saturn/Mercury) plus the
// two karma cards (Lifetime Gift/Challenge) plus its mirror pair: 7-9 links,
// no editorial picks. Data comes from lib/compat-pairs.json, generated from
// the Worker's own report_data.json, so every href is the canonical pair URL
// (wrong-order slugs 301). Plain <a> instead of next/link: these routes are
// not part of this Next app.
const PAIR_NOTES: Record<string, string> = {
  Venus: "the Venus bond: attraction that feels pre-arranged, which is suspicious",
  Moon: "the Moon bond: support, intimacy, and an emotional home base",
  Mars: "the Mars bond: sparks, stimulation, and productive friction. Mostly friction",
  Jupiter: "the Jupiter bond: the pairing that makes your life bigger",
  Saturn: "the Saturn bond: the teacher, with the resistance to match",
  Mercury: "the Mercury bond: matched minds, and conversations that run past 2am",
  "Lifetime Gift": "your karmic gift card: ease you did not have to earn",
  "Lifetime Challenge": "your karmic challenge card: the lesson that makes you grow up",
  Mirror: "two of the same card: a mirror, for better and worse",
};

function CompatPairsSection({ card }: { card: CardSeo }) {
  const compat = compatForCard(card.slug);
  if (!compat) return null;
  return (
    <Section title="Compatibility, or who keeps showing up">
      <p>
        Some pairings are structural. A fixed set of cards sits in the {card.label}&rsquo;s
        life path, and the people carrying them tend to show up as the loves, teachers,
        and mirrors of a lifetime. Sometimes all three at once. Each link opens the full two-card reading: suit
        dynamics, number dynamics, and what the connection is actually for.
      </p>
      <ul className="mt-4 space-y-2">
        {compat.pairs.map((p) => (
          <li key={p.href} className="flex gap-2 text-sm text-brand-ink-soft">
            <span className="text-brand-bronze">·</span>
            <span>
              <a href={p.href} className="text-brand-oxblood underline underline-offset-4">
                {card.label} + {p.label}
              </a>
              <span className="text-brand-ink-soft">: {PAIR_NOTES[p.pos] ?? "a fixed connection in the life path"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <a href={compat.hub} className="text-brand-oxblood underline underline-offset-4">
          See how {card.label} pairs with all 52 cards →
        </a>
      </p>
    </Section>
  );
}

function EndOfPageReads({ card, siblings }: { card: CardSeo; siblings: CardSeo[] }) {
  const reads = endOfPageReads(card, siblings);
  return (
    <section className="mt-10" aria-labelledby="related-reads">
      <h2 id="related-reads" className="type-eyebrow mb-3 !text-brand-bronze">More to read instead of sleeping</h2>
      <ul className="space-y-2 text-sm">
        {reads.map((read) => (
          <li key={read.href}>
            {read.external ? (
              <a href={read.href} className="text-brand-oxblood underline underline-offset-4">
                {read.label}
              </a>
            ) : (
              <Link href={read.href} className="text-brand-oxblood underline underline-offset-4">
                {read.label}
              </Link>
            )}
            <span className="text-brand-ink-soft">: {read.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft">
        One relationship living in your head rent-free? Cass prepares the Chemistry Check from both people’s cards.{" "}
        <Link href="/#readings" className="font-medium text-brand-ink underline underline-offset-4">
          The Chemistry Check, $24 →
        </Link>
      </p>
    </section>
  );
}

// Cross-links for crawl depth: karma row, top three life-path pairs (Venus /
// Moon / Mars, first three from compatForCard), and the first three calendar
// dates that resolve to this card. Worker routes use plain <a>.
function ReadNextSection({ card }: { card: CardSeo }) {
  const bestPairs = (compatForCard(card.slug)?.pairs ?? []).slice(0, 3);
  const dates = birthDatesForCard(card).slice(0, 3);
  return (
    <Section title="Read this next">
      <ul className="mt-4 space-y-2">
        <li className="flex gap-2 text-sm text-brand-ink-soft">
          <span className="text-brand-bronze">·</span>
          <Link
            href={`/karma-cards#${card.slug}`}
            className="text-brand-oxblood underline underline-offset-4"
          >
            Karma cards for the {card.label}
          </Link>
        </li>
        {bestPairs.map((p) => (
          <li key={p.href} className="flex gap-2 text-sm text-brand-ink-soft">
            <span className="text-brand-bronze">·</span>
            <a href={p.href} className="text-brand-oxblood underline underline-offset-4">
              {card.label} + {p.label} compatibility
            </a>
          </li>
        ))}
        {dates.map((d) => (
          <li key={d.slug} className="flex gap-2 text-sm text-brand-ink-soft">
            <span className="text-brand-bronze">·</span>
            <a
              href={`/born-on/${d.slug}`}
              className="text-brand-oxblood underline underline-offset-4"
            >
              Born on {d.label}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function KarmaLink({ label, code }: { label: string; code: string }) {
  const seo = allCardSeo().find((c) => c.code === code);
  if (!seo) return null;
  return (
    <Link
      href={`/birth-card/${seo.slug}`}
      className="card-surface flex items-center gap-4 px-4 py-3 transition !border-brand-line"
    >
      <span className="font-serif text-3xl" style={{ color: SUIT_COLOR_PAPER[seo.suit] }}>
        {seo.code}
      </span>
      <div className="flex flex-col">
        <span className="type-eyebrow text-[0.6rem] !text-brand-bronze">{label}</span>
        <span className="font-serif text-base text-brand-ink">{seo.label}</span>
      </div>
      <span className="ml-auto text-brand-bronze">→</span>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-8"><h2 className="type-eyebrow mb-2 !text-brand-bronze">{title}</h2><div className="prose-reading text-brand-ink-soft">{children}</div></section>;
}

// Position label colors. Inline styles outrank the .paper-shell class remaps,
// so these hexes are what actually paint on cream: the dark palette's sage,
// gold, and ember read at 1.7 to 3:1 there. These pass AA on paper (7.3 / 5.3 /
// 7.1) while keeping the three positions distinguishable by hue.
const LENS_TONES = {
  balanced: { label: "#2c5740", tint: "#7fae8f" },
  under: { label: "#7e5f29", tint: "#d9b26a" },
  over: { label: "#8e321f", tint: "#e0654a" },
} as const;

function Lens({
  label,
  position,
  text,
}: {
  label: string;
  position: keyof typeof LENS_TONES;
  text: string;
}) {
  const { label: labelColor, tint } = LENS_TONES[position];
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${tint}33`, background: `${tint}0d` }}>
      <p className="type-eyebrow mb-1" style={{ color: labelColor }}>{label}</p>
      <p className="mb-0 text-brand-ink-soft">{text}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
      <dt className="type-eyebrow mb-1 !text-brand-bronze">{label}</dt>
      <dd className="text-brand-ink-soft">{value}</dd>
    </div>
  );
}

function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return <div className="space-y-4">{faqs.map((f) => <div key={f.q}><h3 className="font-serif text-base text-brand-ink">{f.q}</h3><p>{f.a}</p></div>)}</div>;
}

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function faqJsonLd(faqs: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

function articleJsonLd({
  headline,
  description,
  url,
  image,
}: {
  headline: string;
  description: string;
  url: string;
  image?: string | Record<string, unknown>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline,
    description,
    url,
    image: image || `${SITE_URL}/og/default.png`,
    datePublished: SEO_UPDATED,
    dateModified: SEO_UPDATED,
    articleSection: "Cardology birth card meanings",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og/default.png` },
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-ai-summary]", ".prose-reading"],
    },
  };
}

function videoJsonLd(video: CardologyVideo) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [youtubeThumbnail(video.url)],
    uploadDate: video.uploadDate,
    embedUrl: youtubeEmbed(video.url),
    url: video.url,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

// First sentence answers the general "{card} meaning" query; the birth-card
// layer is named second, mirroring the page's new section order.
function cardQuickAnswer(card: CardSeo, dates: BirthdateSeo[]) {
  const dateText = dates.length ? dates.map((d) => d.label).join(", ") : "the birthdays returned by the calculator";
  return `The ${card.label} means ${card.suitDomain.toLowerCase().replace(/\s*&\s*/g, " and ")} expressed through ${rankTheme(card.rank).toLowerCase()}. Pull it in a reading and the balanced version says: ${lensClause(card.sweetSpot)} The shadow version: ${lensClause(card.over)} In Cardology it is also the birth card of people born on ${dateText}.`;
}

// --- Drawn-card copy (the general "{card} meaning" intent) ---
// Both helpers compose ONLY existing data-layer strings (the card's title,
// suit domain, rank theme, and three-lens meanings) reframed as drawn-card
// language. No card meaning is authored here (same discipline as
// lib/spreads.ts, which carries verbatim copies of this file's vocabulary).

function generalReadingText(card: CardSeo): string {
  const epithet = card.title ? `, ${card.title},` : "";
  return (
    `Pulled in a general reading, the ${card.label}${epithet} drags the question toward ${suitDomainPlain(card)}. The tone is ${rankTheme(card.rank).toLowerCase()}. ` +
    `At its best, the draw marks a moment where ${lensClause(card.sweetSpot)} ` +
    `If the reading feels off, check the over-expression first. It is usually this: ${lensClause(card.over)}`
  );
}

function loveReadingText(card: CardSeo): string {
  return `In a love reading, the ${card.label} points at ${relationshipTheme(card)}. Usually the part you have been avoiding.`;
}

function moneyReadingText(card: CardSeo): string {
  return (
    `In a money or career reading, the ${card.label} points at ${moneyTheme(card)}, tinted by ${rankTheme(card.rank).toLowerCase()}. ` +
    `At its best, the work and the reward finally line up. When it reads strained, check the shadow first: ${lensClause(card.over)}`
  );
}

function adviceReadingText(card: CardSeo): string {
  return (
    `As advice, the ${card.label} asks you to ${adviceTheme(card)}. ` +
    `As an obstacle, it is the same pattern turned up too loud. The gift becomes the thing standing in your way. You already knew that.`
  );
}

// Standard cartomancy suit correspondence, used only to disambiguate this
// playing-card system from the 78-card deck for "in tarot" queries (not a source).
// Cardology meanings on this page come from the 52-card system, not the tarot deck.
const TAROT_SUIT: Record<Suit, string> = {
  hearts: "Cups",
  clubs: "Wands",
  diamonds: "Pentacles",
  spades: "Swords",
};

const TAROT_COURT: Record<string, string> = { J: "Page", Q: "Queen", K: "King" };

function tarotAnalogue(card: CardSeo): string {
  const rankWord = TAROT_COURT[card.rank] ?? (card.rank === "A" ? "Ace" : card.rank);
  return `${rankWord} of ${TAROT_SUIT[card.suit]}`;
}

function spiritualReadingText(card: CardSeo): string {
  // GSC 2026-09: "{card} spiritual meaning" is ~30/mo per card. Answered from
  // lifeDirection (the card's curriculum) so nothing here is invented.
  const curriculum = card.lifeDirection || card.coreIdentity || card.sweetSpot;
  return (
    `Read spiritually, the ${card.label} is a curriculum, not an omen: ${lensClause(curriculum)} ` +
    `Cardology fixes the card to a birthday, so it never shows up as a message about what is coming. The same date returns the same card every year. ` +
    `The card is a coordinate. What you do with the pattern is the work. Sorry.`
  );
}

function reversedFaqText(card: CardSeo): string {
  return (
    `No. Reversals are a tarot thing, not a Cardology thing: in tarot a card can land upside down in a spread. ` +
    `A Cardology birth card is fixed by a birthday, so the ${card.label} is never reversed, however upside down your week feels. ` +
    `The equivalent here is expression, not direction. Under-expressed, ${lensClause(card.under)} Over-expressed, ${lensClause(card.over)}`
  );
}

function tarotFaqText(card: CardSeo): string {
  return (
    `No. The ${card.label} is a playing card, not a tarot card. ` +
    `People who read tarot sometimes map it to the ${TAROT_SUIT[card.suit]} suit (the rough analogue is the ${tarotAnalogue(card)}), but that is not how this works. ` +
    `Cardology reads the standard 52-card deck as its own birthday-and-pattern system. Everything on this page comes from that playing-card system. Nothing is borrowed.`
  );
}

// The card's /compatibility/ hub on the Worker-served surface; falls back to
// the pair-library index if the generated entry is ever missing.
function compatHubHref(card: CardSeo): string {
  return compatForCard(card.slug)?.hub ?? "/compatibility/";
}

// The three-lens strings are complete second-person sentences ("You're …").
// Re-seat each one on an explicit "you're" so the splice stays grammatical for
// every complement shape in the data (gerund, adjective, or noun phrase).
function lensClause(text: string) {
  // Engine lens texts are full sentences with their own subject ("You run...",
  // "You're overcommitted..."). Just lowercase the lead-in.
  const t = text.trim();
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function dateQuickAnswer(date: BirthdateSeo) {
  return `${date.label}'s birth card is ${date.card.label}. The birth card is fixed by month and day;${date.rulingCard ? ` the ruling card is ${date.rulingCard.label}, which adds the birthday's planetary expression.` : " use the calculator for the full ruling-card context."}`;
}

function cardFaqs(card: CardSeo, dates: BirthdateSeo[]) {
  const dateText = dates.length ? dates.map((d) => d.label).join(", ") : "the birthdays returned by the calculator";
  return [
    // The first two mirror the visible general-reading / "In love"
    // sections: same helper output, so page copy and FAQ never drift.
    { q: `What does the ${card.label} mean in a reading?`, a: generalReadingText(card) },
    { q: `What does the ${card.label} mean in love?`, a: `${loveReadingText(card)} For two specific people, compatibility depends on both birth cards. The ${card.label} compatibility hub compares it with all 52 cards.` },
    { q: `What does the ${card.label} mean spiritually?`, a: spiritualReadingText(card) },
    { q: `What does the ${card.label} mean for money and career?`, a: moneyReadingText(card) },
    { q: `Is the ${card.label} a tarot card or not?`, a: tarotFaqText(card) },
    { q: `Does the ${card.label} have a reversed meaning?`, a: reversedFaqText(card) },
    { q: `What does ${card.label} mean in Cardology?`, a: `${card.label} is a birth-card pattern tied to ${card.suitDomain.toLowerCase()}. On a good day it looks like this: ${card.sweetSpot}` },
    { q: `What are ${card.label} birth dates?`, a: `${card.label} birth dates in this system, no exceptions: ${dateText}.` },
    { q: `What is the shadow of ${card.label}?`, a: card.shadow || card.over },
    { q: `Is ${card.label} compatible with other birth cards?`, a: `Yes. Compatibility depends on both people's birth cards, ruling cards, and timing. Not on how fast they text back. Use the compatibility calculator to compare ${card.label} with another card.` },
    { q: `What would a ${card.label} tattoo look like?`, a: `A ${card.label} tattoo in this system is the pip field only. Same layout as a French-suited playing card, no border, no index. Court cards use a single suit pip. It marks the card. It is not a prediction. See all 52 pip references on the playing-card tattoo meaning hub.` },
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

function moneyTheme(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "income that moves through people: care, hospitality, taste, trust, and the relationships that quietly carry opportunity";
    case "clubs": return "income that moves through the mind: writing, teaching, analysis, communication, and ideas packaged clearly enough to sell";
    case "diamonds": return "the direct mechanics of value: pricing, earning, spending, assets, and whether you have confused self-worth with net worth again";
    case "spades": return "income that moves through discipline: systems, craft, health, operations, and the unglamorous work that compounds";
  }
}

function adviceTheme(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "lead with the honest feeling and stay open one beat longer than feels survivable";
    case "clubs": return "say the true thing plainly, study before you speak, and let the idea get poked without sulking";
    case "diamonds": return "name the real price, stop discounting yourself, and keep the exchange clean";
    case "spades": return "do the disciplined thing first, tend the body and the system, and let pressure sharpen you instead of setting you like concrete";
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
    "10": "public expression and full-cycle achievement",
    J: "youthful mastery, experimentation, and cleverness",
    Q: "inner authority, nurturance, and magnetic intelligence",
    K: "leadership, command, and mature stewardship",
  };
  return themes[rank] ?? "card expression";
}

function interpretiveAngles(card: CardSeo): { label: string; body: string }[] {
  const special = specialCardAngle(card);
  return [
    {
      label: "Traditional birth-card lens",
      body:
        special ||
        `Read the ${card.label} as ${rankTheme(card.rank).toLowerCase()} moving through ${card.suitDomain.toLowerCase()}. This is the stable, birth-date layer. It does not change with your mood, your age, or a random card draw. It was here before your opinions about it.`,
    },
    {
      label: "Modern personality lens",
      body:
        `In plain language, the ${card.label} is a repeatable operating pattern. It is how you go looking for safety, power, connection, value, or meaning through ${suitDomainPlain(card)}. You run it on autopilot. Everyone else can see it running.`,
    },
    {
      label: "Relationship and work lens",
      body:
        `In relationships, this card shows up as ${relationshipTheme(card)}. At work, it wants rooms where ${workTheme(card)}. The same pattern is magnetic when you are centered. It is exhausting when you lean on it for everything.`,
    },
    {
      label: "Shadow-integration lens",
      body:
        `The shadow is not a flaw to dramatize. It is the card losing proportion. For the ${card.label}, integration means catching the moment the gift goes too quiet, too loud, or too hungry for control. Usually around 2am.`,
    },
  ];
}

function specialCardAngle(card: CardSeo): string | null {
  const special: Record<string, string> = {
    "ace-of-spades":
      "The Ace of Spades gets treated as a threshold card: identity, transformation, mystery, ambition, and the pressure to make meaning out of intensity. Read it as initiation into deeper responsibility, not automatic heaviness. Stop wearing it like a cape.",
    "queen-of-hearts":
      "The Queen of Hearts gets read through emotional authority: care, devotion, charisma, family feeling, and the skill of holding people without owning them. The mature version nurtures without building dependency. Nobody needs to need you that much.",
    "king-of-diamonds":
      "The King of Diamonds gets read as mastery of value: business judgment, resource stewardship, pricing power. The test is using authority without turning people into rows on a spreadsheet.",
    "8-of-diamonds":
      "The Eight of Diamonds gets read as concentrated value power: ambition, financial visibility, brand magnetism. The lesson is using influence without letting status hold the leash.",
    "jack-of-diamonds":
      "The Jack of Diamonds gets read as the messenger of value: sales, taste, charm, opportunity. The work is growing out of the clever trade and into honest worth. The pitch is not the product.",
    "queen-of-spades":
      "The Queen of Spades gets read as inner discipline and self-mastery: spiritual labor, restraint, precision, and the ability to turn pressure into wisdom you actually live in. Not wisdom you just quote.",
    "king-of-clubs":
      "The King of Clubs gets read as command of thought: teaching, strategy, mental authority. The responsibility is using certainty to serve the truth, not to win the argument.",
    "10-of-hearts":
      "The Ten of Hearts gets read as social and emotional visibility: family, audience, belonging, celebration, and the pressure to carry the mood of the whole room. The room did not ask you to.",
  };
  return special[card.slug] ?? null;
}
