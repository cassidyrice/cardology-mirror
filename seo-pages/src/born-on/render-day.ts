import { solarValue } from "../birthcard";
import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import { bornOnDayCopy, notableLead, splitSourceSentences } from "./copy";
import type { BornOnDayPage, BornOnPerson, CardMeaning } from "./types";
import {
  adjacentDay,
  bornOnCheckoutHref,
  bornOnDayPath,
  bornOnHubPath,
  bornOnOgSlot,
  cardMeaningPath,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "Born-on day · notable-people grounding",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

const SAME_CARD_LIMIT = 12;

export function renderBornOnDay(
  day: BornOnDayPage,
  meaning: CardMeaning,
  allDays: readonly BornOnDayPage[],
): string {
  const path = bornOnDayPath(day.slug);
  const copy = bornOnDayCopy(day, meaning);
  const h1 = `${day.label} Birth Card: ${meaning.label}`;
  const description =
    day.people.length === 0
      ? `Born on ${day.label}? The Cardology birth card is the ${meaning.label}. This catalog has no verified notable with a day-precision public DOB on this date. Coordinates, not fortune-telling.`
      : `Born on ${day.label}? The Cardology birth card is the ${meaning.label}. Verified Wikidata notables who share this public date of birth are cited below. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Born on", href: bornOnHubPath() },
    { name: day.label, href: path },
  ];
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: h1, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(copy.faqs),
  ]);

  const prev = adjacentDay(allDays, day.slug, -1);
  const next = adjacentDay(allDays, day.slug, 1);
  const sameCard = allDays.filter(
    (other) => other.slug !== day.slug && other.card === day.card,
  );
  const listed = sameCard.slice(0, SAME_CARD_LIMIT);
  const extra = sameCard.length - listed.length;
  const sameCardList =
    sameCard.length === 0
      ? `<li data-placeholder="true">No other calendar day maps to the ${escapeHtml(meaning.label)}.</li>`
      : listed
          .map(
            (other) =>
              `<li><a href="${escapeHtml(bornOnDayPath(other.slug))}">${escapeHtml(other.label)}</a></li>`,
          )
          .join("\n        ") +
        (extra > 0 ? `\n        <li data-same-card-more="true">${extra} more dates share this card.</li>` : "");

  const showJoker = day.card === "Joker" || (day.month === 12 && day.day === 31);
  const solar = solarValue(day.month, day.day);

  const body = `
    ${coordinateBanner(day.label)}
    <header class="hero">
      <p class="eyebrow">Born on ${escapeHtml(day.label)}</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date" data-date="${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}">
        Calendar day ${escapeHtml(day.label)} · solar value ${solar}
      </p>
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <section data-slot="hook">
      <h2>The ${escapeHtml(day.label)} coordinate</h2>
      <p>${escapeHtml(copy.hook)}</p>
      <p data-slot="mapping">${escapeHtml(copy.mapping)}</p>
    </section>

    <section data-slot="card-meaning">
      <h2>The ${escapeHtml(meaning.label)}</h2>
      <p>${escapeHtml(copy.card_meaning)}</p>
      <p><a href="${escapeHtml(cardMeaningPath(meaning.slug))}">Live ${escapeHtml(meaning.label)} meaning page</a></p>
    </section>

    <section data-slot="notables" data-people-count="${day.people_count}">
      <h2>Famous people born on ${escapeHtml(day.label)}</h2>
      <p>${escapeHtml(copy.notables_intro)}</p>
      ${copy.empty_note ? `<p data-slot="empty-catalog">${escapeHtml(copy.empty_note)}</p>` : ""}
      ${notablesList(day.people)}
    </section>

    <section data-slot="same-card">
      <h2>Other dates on the ${escapeHtml(meaning.label)}</h2>
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

    <nav data-slot="adjacent" aria-label="Adjacent birthdays">
      <a href="${escapeHtml(bornOnDayPath(prev.slug))}">← ${escapeHtml(prevLabel(prev))}</a>
      <a href="${escapeHtml(bornOnHubPath())}">All birthdays</a>
      <a href="${escapeHtml(bornOnDayPath(next.slug))}">${escapeHtml(nextLabel(next))} →</a>
    </nav>

    <section data-slot="cta">
      <h2>Get the $47 Blueprint Breakdown</h2>
      <p>The Blueprint Breakdown is a 5-minute video about your own birth card, with the written Deep Dive as a bonus — not a reading of ${escapeHtml(day.label)}.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(bornOnCheckoutHref(day.slug))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    ${sourcesBlock(day)}
    ${showJoker ? jokerLineageNote() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: bornOnOgSlot(day.slug),
    ogImageAlt: `${day.label} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function notablesList(people: readonly BornOnPerson[]): string {
  if (people.length === 0) {
    return `<p data-slot="no-notables">No famous-people block is invented for this date.</p>`;
  }
  return `<ol>
      ${people
        .map((person) => {
          const extra = splitSourceSentences(person.source_text).slice(1, 3);
          return `<li data-qid="${escapeHtml(person.qid)}">
          <h3>${escapeHtml(person.name)}</h3>
          <p>${escapeHtml(notableLead(person))}</p>
          ${extra.map((sentence) => `<p>${escapeHtml(sentence)}</p>`).join("\n          ")}
          <p class="cite">
            <a href="${escapeHtml(wikidataPath(person.qid))}">Wikidata ${escapeHtml(person.qid)}</a>
            ·
            <a href="${escapeHtml(person.source_url)}">Wikipedia: ${escapeHtml(person.wikipedia_title)}</a>
            · born ${escapeHtml(formatDisplayDate(person.birth_date))}
          </p>
        </li>`;
        })
        .join("\n      ")}
    </ol>`;
}

function sourcesBlock(day: BornOnDayPage): string {
  const peopleCites =
    day.people.length === 0
      ? "No person biographies were written for this empty day."
      : day.people
          .map(
            (person) =>
              `<a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a> / <a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>`,
          )
          .join("; ");
  return `<p class="sources" data-slot="sources">
      Sources: Wikidata P569
      (<a href="https://www.wikidata.org/wiki/Property:P569">CC0, day precision</a>)
      + Wikipedia CC BY-SA 4.0.
      ${peopleCites}
      Birth card for ${escapeHtml(day.label)} is the public formula; year unused.
    </p>`;
}

function coordinateBanner(label: string): string {
  return `<p class="method-banner" data-brand="coordinates" role="note">Coordinates, not fortune-telling. ${escapeHtml(label)} is a calendar position. Famous people appear only when Wikidata publishes a matching day-precision date of birth.</p>`;
}

function jokerLineageNote(): string {
  return `<aside class="joker-lineage" data-slot="joker-lineage" data-cass-lock="D1">
  <h2>December 31 / Joker lineage</h2>
  <p>
    December 31 maps to solar value 0. Public Card Blueprints pages treat that
    as the Joker, outside the 1–52 deck. The engine spread grid wraps solar 0
    to 52 (King of Spades) so layouts stay 52-wide. This page follows the
    public Joker rule. Year is unused. Notables on this date are cited for the
    public day, not given a 52-card fortune.
  </p>
</aside>`;
}

function prevLabel(day: { label: string }): string {
  return day.label;
}

function nextLabel(day: { label: string }): string {
  return day.label;
}
