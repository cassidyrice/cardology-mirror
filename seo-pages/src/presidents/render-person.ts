import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { presidentCopy } from "./copy";
import type { CardMeaning, PresidentRow } from "./types";
import {
  cardMeaningPath,
  presidencyPhrase,
  presidentCheckoutHref,
  presidentOgSlot,
  presidentPath,
} from "./urls";

const LAYOUT = {
  kicker: "US presidents · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderPresidentPage(
  person: PresidentRow,
  meaning: CardMeaning,
  sameCard: readonly PresidentRow[],
): string {
  const path = presidentPath(person.slug);
  const copy = presidentCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const ordinals = person.terms.map((term) => term.ordinal);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${presidencyPhrase(ordinals)}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Presidents", href: "/presidents" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: presidentOgSlot(person.slug),
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(copy.faqs),
  ]);

  const deathLine = person.death_date
    ? `<p class="meta" data-slot="death">Died ${escapeHtml(formatDisplayDate(person.death_date))}</p>`
    : "";

  const sameCardList =
    sameCard.length === 0
      ? `<li data-placeholder="true">No other U.S. president in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(presidentPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(meaning.label)}</li>`,
          )
          .join("\n        ");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);

  const body = `
    <header class="hero">
      <p class="eyebrow">President · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="office">${escapeHtml(presidencyPhrase(ordinals))}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict a presidency.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="card-meaning">
      <h2>The ${escapeHtml(meaning.label)} coordinate</h2>
      <p>${escapeHtml(copy.card_meaning)}</p>
      <p><a href="${escapeHtml(cardMeaningPath(meaning.slug))}">Live ${escapeHtml(meaning.label)} meaning page</a></p>
    </section>

    <section data-slot="evidence">
      <h2>From the Wikipedia summary</h2>
      <ol>
        ${copy.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n        ")}
      </ol>
    </section>

    <section data-slot="same-card">
      <h2>Other presidents with this card</h2>
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
      <h2>Get the $47 Blueprint Breakdown</h2>
      <p>The Blueprint Breakdown is a 5-minute video about your own birth card, with the written Deep Dive as a bonus — not a presidential reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(presidentCheckoutHref(person.slug))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      Wikidata CC0 (<a href="https://www.wikidata.org/wiki/${escapeHtml(person.qid)}">${escapeHtml(person.qid)}</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>;
      month/day cross-check:
      <a href="https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States_by_home_state">home-state list</a>,
      ${escapeHtml(person.dob_crosscheck)}).
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: presidentOgSlot(person.slug),
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
