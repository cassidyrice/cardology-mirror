import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { renderCongruenceSection } from "../congruence-render";
import { senatorCopy, sourceProse } from "./copy";
import type { CardMeaning, SenatorRow } from "./types";
import {
  cardMeaningPath,
  officePhrase,
  partyLabel,
  senatorCheckoutHref,
  senatorOgSlot,
  senatorPath,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "US senators · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

export function renderSenatorPage(
  person: SenatorRow,
  meaning: CardMeaning,
  sameCard: readonly SenatorRow[],
): string {
  const path = senatorPath(person.slug);
  const copy = senatorCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const office = officePhrase(person.state, person.senate_class);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${office}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Senators", href: "/senators" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: senatorOgSlot(person.slug),
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(copy.faqs),
  ]);

  const deathLine = person.death_date
    ? `<p class="meta" data-slot="death">Died ${escapeHtml(formatDisplayDate(person.death_date))}</p>`
    : "";

  const sameCardList =
    sameCard.length === 0
      ? `<li data-placeholder="true">No other sitting senator in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(senatorPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(other.state)}</li>`,
          )
          .join("\n        ");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);

  const solarValue = 55 - (2 * month + day);

  // Vary the same-card lead-in by count so pages that share a card do not also
  // share this sentence verbatim.
  const sameCardIntro =
    sameCard.length === 0
      ? `${person.name} holds the ${meaning.label} alone in this set of 99 verified sitting senators.`
      : sameCard.length === 1
        ? `One other sitting senator shares the ${meaning.label} with ${person.name} — a different birthday that lands on the same calendar coordinate.`
        : `${sameCard.length} other sitting senators share the ${meaning.label} with ${person.name}. Their birthdays differ; the month-and-day coordinate is what matches.`;

  const congruenceSection = renderCongruenceSection({
    name: person.name,
    prose: sourceProse(person),
    birthSymbol: person.card,
    birthDate: person.birth_date,
    sourceUrl: person.source_url,
    sourceTitle: person.wikipedia_title,
    notAForecastOf: "a Senate seat",
  });

  const recordSection = copy.record.length
    ? `<section data-slot="record">
      <h2>${escapeHtml(person.name)} in the public record</h2>
      <p>${escapeHtml(copy.record.join(" "))}</p>
      <p class="attribution">Summarised from the lead section of the Wikipedia article
        <a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>
        (CC BY-SA 4.0). No biographical facts were written for this page beyond that article.</p>
    </section>`
    : "";

  const evidenceSection = copy.evidence.length
    ? `<section data-slot="evidence">
      <h2>Also on the record</h2>
      <ol>
        ${copy.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n        ")}
      </ol>
    </section>`
    : "";

  const body = `
    <header class="hero">
      <p class="eyebrow">Senator · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="office">${escapeHtml(office)}</p>
      <p class="meta" data-slot="party">${escapeHtml(partyLabel(person.party))}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict a Senate seat.
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

    ${recordSection}

    ${congruenceSection}

    ${evidenceSection}

    <section data-slot="coordinate-facts">
      <h2>${escapeHtml(person.name)}'s coordinate at a glance</h2>
      <dl class="facts">
        <div><dt>Seat</dt><dd>${escapeHtml(office)}</dd></div>
        <div><dt>Party</dt><dd>${escapeHtml(partyLabel(person.party))}</dd></div>
        <div><dt>Date of birth</dt><dd>${escapeHtml(dateLabel)}</dd></div>
        <div><dt>Month and day used</dt><dd>${escapeHtml(formatMonthDay(month, day))} (year unused)</dd></div>
        <div><dt>Solar value</dt><dd>55 − (2 × ${month} + ${day}) = ${solarValue}</dd></div>
        <div><dt>Birth card</dt><dd>${escapeHtml(meaning.label)} — ${escapeHtml(meaning.title)}</dd></div>
        <div><dt>Sitting senators on this card</dt><dd>${sameCard.length + 1} of 99 verified</dd></div>
        <div><dt>Date agreement</dt><dd>Wikipedia list, Bioguide and Wikidata P569 all read ${escapeHtml(person.birth_date)}</dd></div>
      </dl>
    </section>

    <section data-slot="same-card">
      <h2>Other sitting senators with this card</h2>
      <p>${escapeHtml(sameCardIntro)}</p>
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
      <p>The Deep Dive is a written card report for your own birthday — not a Senate reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(senatorCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>;
      <a href="https://en.wikipedia.org/wiki/List_of_current_United_States_senators">current senators list</a>,
      ${escapeHtml(person.dob_crosscheck)})
      + Wikidata CC0
      (<a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a>)
      + Bioguide
      (<a href="${escapeHtml(person.bioguide_url)}">${escapeHtml(person.bioguide)}</a>)
      + <a href="${escapeHtml(person.congress_url)}">congress.gov</a>.
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: senatorOgSlot(person.slug),
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
