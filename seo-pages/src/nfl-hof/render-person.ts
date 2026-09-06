import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { hofCopy } from "./copy";
import type { CardMeaning, HofRow } from "./types";
import {
  cardMeaningPath,
  hofCheckoutHref,
  hofOgSlot,
  hofPath,
  inducteePhrase,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "NFL Hall of Fame · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

const SAME_CARD_LIMIT = 12;

export function renderHofPage(
  person: HofRow,
  meaning: CardMeaning,
  sameCard: readonly HofRow[],
): string {
  const path = hofPath(person.slug);
  const copy = hofCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const record = inducteePhrase(person);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${record}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "NFL Hall of Fame", href: "/nfl-hof" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: hofOgSlot(person.slug),
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(copy.faqs),
  ]);

  const deathLine = person.death_date
    ? `<p class="meta" data-slot="death">Died ${escapeHtml(formatDisplayDate(person.death_date))}</p>`
    : "";

  const listed = sameCard.slice(0, SAME_CARD_LIMIT);
  const extra = sameCard.length - listed.length;
  const sameCardList =
    sameCard.length === 0
      ? `<li data-placeholder="true">No other inductee in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : listed
          .map(
            (other) =>
              `<li><a href="${escapeHtml(hofPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(inducteePhrase(other))}</li>`,
          )
          .join("\n        ") +
        (extra > 0
          ? `\n        <li data-same-card-more="true">${extra} more inductees share this card.</li>`
          : "");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);

  const body = `
    <header class="hero">
      <p class="eyebrow">Pro Football Hall of Fame · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="record">${escapeHtml(record)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict a Hall of Fame induction.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="summary">
      <h2>Wikipedia summary</h2>
      <p data-slot="source-text">${escapeHtml(person.source_text)}</p>
    </section>

    <section data-slot="card-meaning">
      <h2>The ${escapeHtml(meaning.label)} coordinate</h2>
      <p>${escapeHtml(copy.card_meaning)}</p>
      <p data-slot="method">
        The public formula uses only month and day. Solar value equals fifty-five minus twice the month minus the day.
        Values one through fifty-two map onto the deck from the Ace of Hearts through the King of Spades.
        Solar value zero is December 31, published here as the Joker. Card Blueprints does not remap that boundary
        to the King of Spades on these pages. Leap-day February 29 is computed directly and is not folded onto February 28.
        The year of birth is unused. No reading is generated and nothing here forecasts a roster, a vote, a championship,
        or a career. Evidence sentences are copied from the Wikipedia extract without paraphrase. If a Hall of Fame
        biography or an infobox day disagrees with Wikidata, the person is omitted instead of reconciled by guesswork.
        Attribution stays on Wikidata, Wikipedia, and the Hall of Fame record. Gregorian day precision is required; Wikidata claims are CC0.
        Sitelinks and wbgetentities are the identity crosswalk. Conflicts stay uninvented. Remainder dates are not disambiguated by hand.
      </p>
      <p><a href="${escapeHtml(cardMeaningPath(meaning.slug))}">Live ${escapeHtml(meaning.label)} meaning page</a></p>
    </section>

    <section data-slot="evidence">
      <h2>From the Wikipedia summary</h2>
      <ol>
        ${copy.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n        ")}
      </ol>
    </section>

    <section data-slot="same-card">
      <h2>Other inductees with this card</h2>
      <ul>
        ${sameCardList}
      </ul>
    </section>

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${copy.faqs
          .map(
            (faq) => `<div>
          <dt>${escapeHtml(faq.question)}</dt>
          <dd>${escapeHtml(faq.answer)}</dd>
        </div>`,
          )
          .join("\n        ")}
      </dl>
    </section>

    <section data-slot="cta">
      <h2>Get the $9 Deep Dive</h2>
      <p>The Deep Dive is a written card report for your own birthday — not a Hall of Fame reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(hofCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      Wikidata CC0
      (<a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a>, P6930 + P569)
      + Pro Football Hall of Fame
      (<a href="${escapeHtml(person.hof_url)}">${escapeHtml(person.hof_id)}</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>).
      Birth date ${escapeHtml(person.birth_date)} is the Wikidata day-precision date
      (${escapeHtml(person.dob_crosscheck)}).
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: hofOgSlot(person.slug),
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
