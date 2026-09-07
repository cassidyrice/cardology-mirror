import { renderCongruenceSection } from "../congruence-render";
import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { nobelCopy, sourceProse } from "./copy";
import type { CardMeaning, NobelRow } from "./types";
import { cardMeaningPath, nobelCheckoutHref, nobelOgSlot, nobelPath, prizePhrase } from "./urls";

const LAYOUT = {
  kicker: "Nobel laureates · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

const SAME_CARD_LIMIT = 12;

export function renderNobelPage(
  person: NobelRow,
  meaning: CardMeaning,
  sameCard: readonly NobelRow[],
  /** Everyone in the set, so the page can name who shared each prize. */
  everyone: readonly NobelRow[] = [],
): string {
  const path = nobelPath(person.slug);
  const copy = nobelCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const prizes = prizePhrase(person.prizes);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, ${prizes}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Nobel laureates", href: "/nobel" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: nobelOgSlot(person.slug),
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
      ? `<li data-placeholder="true">No other laureate in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : listed
          .map(
            (other) =>
              `<li><a href="${escapeHtml(nobelPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(prizePhrase(other.prizes))}</li>`,
          )
          .join("\n        ") +
        (extra > 0
          ? `\n        <li data-same-card-more="true">${extra} more laureates share this card.</li>`
          : "");

  // Who else in this set holds the same year + category. A shared prize is the
  // most distinguishing fact many laureates have, and it is already in the data.
  const prizeRecord = person.prizes
    .map((prize) => {
      const shared = everyone.filter(
        (other) =>
          other.slug !== person.slug &&
          other.prizes.some((p) => p.year === prize.year && p.category === prize.category),
      );
      const sameCategory = everyone.filter(
        (other) => other.slug !== person.slug && other.prizes.some((p) => p.category === prize.category),
      ).length;
      const sharedLine =
        shared.length === 0
          ? `No one else in this set holds the ${escapeHtml(prize.year)} ${escapeHtml(prize.category)} prize; ${escapeHtml(person.name)} appears here as its sole listed laureate.`
          : `Shared with ${shared
              .map(
                (other) =>
                  `<a href="${escapeHtml(nobelPath(other.slug))}">${escapeHtml(other.name)}</a> (${escapeHtml(other.card)})`,
              )
              .join(", ")}.`;
      const portionLine = prize.portion
        ? ` The award was divided; this laureate's listed portion is ${escapeHtml(prize.portion)}.`
        : "";
      return `<div class="prize-record">
        <h3>${escapeHtml(prize.year)} — ${escapeHtml(prize.category_full)}</h3>
        ${prize.motivation ? `<blockquote><p>&ldquo;${escapeHtml(prize.motivation)}&rdquo;</p><footer>Prize motivation, NobelPrize.org</footer></blockquote>` : ""}
        <p>${sharedLine}${portionLine}</p>
        <p>${sameCategory} other ${escapeHtml(prize.category)} laureate${sameCategory === 1 ? "" : "s"} in this set carry a birth-card coordinate.</p>
      </div>`;
    })
    .join("\n      ");

  const prizeList = person.prizes
    .map((prize) => {
      const motivation = prize.motivation
        ? ` — ${escapeHtml(prize.motivation)}`
        : "";
      return `<li>${escapeHtml(prize.year)} ${escapeHtml(prize.category_full)}${motivation}</li>`;
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
    notAForecastOf: "a Nobel Prize",
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
      <p class="eyebrow">Nobel laureate · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="prize">${escapeHtml(prizes)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict a Nobel Prize.
    </p>

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="prizes">
      <h2>Nobel Prize record</h2>
      <ul>
        ${prizeList}
      </ul>
      ${prizeRecord}
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
      <h2>Other laureates with this card</h2>
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
      <p>The Deep Dive is a written card report for your own birthday — not a Nobel reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(nobelCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      Nobel Prize API v2.1
      (<a href="${escapeHtml(person.nobel_url)}">laureate ${escapeHtml(person.nobel_id)}</a>)
      + Wikidata CC0 (<a href="https://www.wikidata.org/wiki/${escapeHtml(person.qid)}">${escapeHtml(person.qid)}</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>).
      Birth date ${escapeHtml(person.birth_date)} is the Nobel day-precision date, verified against Wikidata P569
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
