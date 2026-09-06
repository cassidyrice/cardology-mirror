import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { oscarCopy } from "./copy";
import type { CardMeaning, OscarRow } from "./types";
import {
  awardPhrase,
  cardMeaningPath,
  categoryLabel,
  oscarCheckoutHref,
  oscarOgSlot,
  oscarPath,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "Academy Awards · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

const SAME_CARD_LIMIT = 12;

export function renderOscarPage(
  person: OscarRow,
  meaning: CardMeaning,
  sameCard: readonly OscarRow[],
): string {
  const path = oscarPath(person.slug);
  const copy = oscarCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const awards = awardPhrase(person.awards);
  const category = categoryLabel(person.awards);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${awards}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Oscars", href: "/oscars" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: oscarOgSlot(person.slug),
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
      ? `<li data-placeholder="true">No other winner in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : listed
          .map(
            (other) =>
              `<li><a href="${escapeHtml(oscarPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(awardPhrase(other.awards))}</li>`,
          )
          .join("\n        ") +
        (extra > 0
          ? `\n        <li data-same-card-more="true">${extra} more winners share this card.</li>`
          : "");

  const awardList = person.awards
    .map((award) => {
      return `<li><a href="${escapeHtml(award.oscars_url)}">${escapeHtml(award.year)} ${escapeHtml(award.category)}</a> — ${escapeHtml(award.film)}</li>`;
    })
    .join("\n        ");

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);

  const body = `
    <header class="hero">
      <p class="eyebrow">Academy Award ${escapeHtml(category)} · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="award">${escapeHtml(awards)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict an Academy Award.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="awards">
      <h2>Academy Award record</h2>
      <ul>
        ${awardList}
      </ul>
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
      <h2>Other winners with this card</h2>
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
      <p>The Deep Dive is a written card report for your own birthday — not an Oscar reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(oscarCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      Oscars.org
      (<a href="${escapeHtml(person.oscars_url)}">AMPAS ceremony record</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actor">Best Actor list</a>,
      <a href="https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actress">Best Actress list</a>,
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
    ogImage: oscarOgSlot(person.slug),
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
