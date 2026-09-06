import { solarValue } from "../../birthcard";
import { escapeHtml } from "../../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../../jsonld";
import { jokerLineageSlot, renderLayout } from "../../layout";
import { SITE_NAME } from "../../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../../urls";
import { winterCopy } from "./copy";
import type { CardMeaning, WinterMedalistRow } from "./types";
import {
  cardMeaningPath,
  medalPhrase,
  wikidataPath,
  winterCheckoutHref,
  winterOgSlot,
  winterPath,
} from "./urls";

function layoutFor(person: WinterMedalistRow, meaning: CardMeaning) {
  return {
    kicker: `${person.name} · ${person.sport} · ${meaning.label} coordinate`,
    footer: `${SITE_NAME} · ${person.name} (${person.slug}) · ${person.sport} / ${person.nation} · coordinate only · not deployed`,
  };
}

const SAME_CARD_LIMIT = 12;

export function renderWinterPage(
  person: WinterMedalistRow,
  meaning: CardMeaning,
  sameCard: readonly WinterMedalistRow[],
): string {
  const path = winterPath(person.slug);
  const copy = winterCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const medals = medalPhrase(person);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${person.sport} (${person.nation}), was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Winter Olympic medalists", href: "/olympics/winter" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: winterOgSlot(person.slug),
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
      ? `<li data-placeholder="true">No other 8+ Winter Olympic medalist in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : listed
          .map(
            (other) =>
              `<li><a href="${escapeHtml(winterPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(other.sport)}, ${escapeHtml(medalPhrase(other))}</li>`,
          )
          .join("\n        ") +
        (extra > 0
          ? `\n        <li data-same-card-more="true">${extra} more medalists in this set share this card.</li>`
          : "");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);
  const solar = solarValue(month, day);

  const body = `
    <header class="hero">
      <p class="eyebrow">${escapeHtml(person.slug)} · ${escapeHtml(person.qid)} · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="sport">${escapeHtml(person.sport)} · ${escapeHtml(person.nation)}</p>
      <p class="meta" data-slot="medals">${escapeHtml(medals)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      ${escapeHtml(person.name)} (${escapeHtml(person.qid)}) is pinned to
      ${escapeHtml(person.birth_date)} / ${escapeHtml(meaning.label)}.
      That pin does not predict ${escapeHtml(person.sport)} for
      ${escapeHtml(person.nation)}.
      ${escapeHtml(person.name)}: coordinates, not fortune-telling.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="medals">
      <h2>Winter Olympic medal row</h2>
      <p>${escapeHtml(copy.record)}</p>
      <ul>
        <li>${escapeHtml(person.name)} gold count: ${person.gold}</li>
        <li>${escapeHtml(person.name)} silver count: ${person.silver}</li>
        <li>${escapeHtml(person.name)} bronze count: ${person.bronze}</li>
        <li>${escapeHtml(person.name)} Winter Olympic total: ${person.total}</li>
      </ul>
    </section>

    <section data-slot="coordinate">
      <h2>How ${escapeHtml(formatMonthDay(month, day))} becomes the ${escapeHtml(meaning.label)}</h2>
      <p>${escapeHtml(copy.coordinate)}</p>
      <p data-solar-value="${solar}">Year unused. December 31 is the Joker.</p>
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
      <h2>Other 8+ Winter medalists with this card</h2>
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
      <p>
        The Deep Dive is a written report for the reader’s own birthday.
        It is not a ${escapeHtml(person.sport)} brief on ${escapeHtml(person.name)}
        and it does not reuse ${escapeHtml(person.slug)} as a reading subject.
      </p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(winterCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.wikipedia_list_url)}">List of multiple Winter Olympic medalists</a>;
      <a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a> infobox + REST summary)
      + Wikidata CC0
      (<a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a> P569).
      Birth date ${escapeHtml(person.birth_date)} is the Wikipedia infobox day, verified against Wikidata P569
      (${escapeHtml(person.dob_crosscheck)}).
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: winterOgSlot(person.slug),
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    ...layoutFor(person, meaning),
  });
}
