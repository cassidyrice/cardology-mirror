import { renderCongruenceSection } from "../congruence-render";
import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { houseChairCopy, sourceProse } from "./copy";
import type { CardMeaning, HouseChairRow } from "./types";
import {
  HISTORY_HOUSE_BIOGUIDE,
  HOUSE_GOV_COMMITTEES,
  HOUSE_GOV_LEADERSHIP,
  cardMeaningPath,
  houseChairCheckoutHref,
  houseChairOgSlot,
  houseChairPath,
  officePhrase,
  roleKindLabel,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "US House leadership and chairs · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderHouseChairPage(
  person: HouseChairRow,
  meaning: CardMeaning,
  sameCard: readonly HouseChairRow[],
): string {
  const path = houseChairPath(person.slug);
  const copy = houseChairCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const office = officePhrase(person);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${office}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "House chairs", href: "/house-chairs" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: houseChairOgSlot(person.slug),
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(copy.faqs),
  ]);

  const deathLine = person.death_date
    ? `<p class="meta" data-slot="death">Died ${escapeHtml(formatDisplayDate(person.death_date))}</p>`
    : "";

  const sameCardList =
    sameCard.length === 0
      ? `<li data-placeholder="true">No other person in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(houseChairPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(other.office)}</li>`,
          )
          .join("\n        ");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);
  const sourceBlock = escapeHtml(person.source_text);

  const congruenceSection = renderCongruenceSection({
    name: person.name,
    prose: sourceProse(person),
    birthSymbol: person.card,
    birthDate: person.birth_date,
    sourceUrl: person.source_url,
    sourceTitle: person.wikipedia_title,
    notAForecastOf: "a chairmanship",
  });

  const recordSection = copy.source_record.length
    ? `<section data-slot="record">
      <h2>${escapeHtml(person.name)} in the public record</h2>
      <p>${escapeHtml(copy.source_record.join(" "))}</p>
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
      <p class="eyebrow">US House · ${escapeHtml(roleKindLabel(person.role_kind))} · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="office">${escapeHtml(office)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict a House leadership post or committee chair.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="office-ledger">
      <h2>Public House office</h2>
      <p data-slot="ledger">${escapeHtml(copy.ledger)}</p>
    </section>

    <section data-slot="card-meaning">
      <h2>The ${escapeHtml(meaning.label)} coordinate</h2>
      <p>${escapeHtml(copy.card_meaning)}</p>
      <p><a href="${escapeHtml(cardMeaningPath(meaning.slug))}">Live ${escapeHtml(meaning.label)} meaning page</a></p>
    </section>

    <section data-slot="source-text">
      <h2>Wikipedia summary used as source_text</h2>
      <p data-slot="source-extract">${sourceBlock}</p>
    </section>

    ${recordSection}

    ${congruenceSection}

    ${evidenceSection}

    <section data-slot="same-card">
      <h2>Other House leaders or chairs with this card</h2>
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
      <p>The Deep Dive is a written card report for your own birthday — not a House reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(houseChairCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      <a href="${escapeHtml(HOUSE_GOV_LEADERSHIP)}">house.gov/leadership</a>
      + <a href="${escapeHtml(HOUSE_GOV_COMMITTEES)}">house.gov/committees</a>
      + congress-legislators
      + House History <a href="${escapeHtml(HISTORY_HOUSE_BIOGUIDE)}">Bioguide</a>
      (<a href="${escapeHtml(person.history_house_url)}">${escapeHtml(person.bioguide)}</a>,
      <a href="${escapeHtml(person.bioguide_url)}">bioguide.congress.gov</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>)
      + Wikidata CC0
      (<a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a>).
      Birth date ${escapeHtml(person.birth_date)} is the Wikipedia infobox day, verified against
      Bioguide and Wikidata P569 (${escapeHtml(person.dob_crosscheck)}).
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: `/og/birth-card/${meaning.slug}.png`,
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
