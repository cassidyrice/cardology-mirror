import { renderCongruenceSection } from "../congruence-render";
import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { rockHallCopy, sourceProse } from "./copy";
import type { CardMeaning, RockHallRow } from "./types";
import {
  cardMeaningPath,
  inductionPhrase,
  rockHallCheckoutHref,
  rockHallOgSlot,
  rockHallPath,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "Rock & Roll Hall of Fame · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

const SAME_CARD_LIMIT = 12;

export function renderRockHallPage(
  person: RockHallRow,
  meaning: CardMeaning,
  sameCard: readonly RockHallRow[],
): string {
  const path = rockHallPath(person.slug);
  const copy = rockHallCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const awards = inductionPhrase(person.inductions);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${awards}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Rock Hall", href: "/rock-hall" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: rockHallOgSlot(person.slug),
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
              `<li><a href="${escapeHtml(rockHallPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(inductionPhrase(other.inductions))}</li>`,
          )
          .join("\n        ") +
        (extra > 0
          ? `\n        <li data-same-card-more="true">${extra} more inductees share this card.</li>`
          : "");

  const inductionList = person.inductions
    .map((item) => {
      const role = item.role === "member" ? ` — inducted member of ${item.act}` : ` — ${item.act}`;
      return `<li><a href="${escapeHtml(item.rockhall_url)}">${escapeHtml(item.year)} ${escapeHtml(item.category)}</a>${escapeHtml(role)}</li>`;
    })
    .join("\n        ");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);

  const congruenceSection = renderCongruenceSection({
    name: person.name,
    prose: sourceProse(person),
    birthSymbol: person.card,
    birthDate: person.birth_date,
    sourceUrl: person.source_url,
    sourceTitle: person.wikipedia_title,
    notAForecastOf: "induction",
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
      <p class="eyebrow">Rock &amp; Roll Hall of Fame Performers · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="award">${escapeHtml(awards)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict a Rock &amp; Roll Hall of Fame induction.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="awards">
      <h2>Rock Hall record</h2>
      <ul>
        ${inductionList}
      </ul>
    </section>

    <section data-slot="card-meaning">
      <h2>The ${escapeHtml(meaning.label)} coordinate</h2>
      <p>${escapeHtml(copy.card_meaning)}</p>
      <p><a href="${escapeHtml(cardMeaningPath(meaning.slug))}">Live ${escapeHtml(meaning.label)} meaning page</a></p>
    </section>

    ${recordSection}

    ${congruenceSection}

    ${evidenceSection}

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
      <h2>Get the $47 Blueprint Breakdown</h2>
      <p>The Blueprint Breakdown is a 5-minute video about your own birth card, with the written Deep Dive as a bonus — not a Rock Hall reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(rockHallCheckoutHref(person.slug))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      RockHall.com
      (<a href="${escapeHtml(person.rockhall_url)}">induction record</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.wikipedia_list_url)}">Performers list</a>,
      <a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>)
      + Wikidata CC0 (<a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a>).
      Birth date ${escapeHtml(person.birth_date)} is the Wikipedia infobox day, verified against Wikidata P569
      (${escapeHtml(person.dob_crosscheck)}).
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
