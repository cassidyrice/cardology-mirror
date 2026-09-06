import { escapeHtml } from "../escape";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  jsonLdGraph,
} from "../jsonld";
import { renderLayout } from "../layout";
import { MONTH_SLUGS, SITE_NAME, type FaqItem } from "../types";
import type { BornOnDayPage, BornOnProvenance, CardMeaning } from "./types";
import { bornOnCheckoutHref, bornOnDayPath, bornOnHubPath } from "./urls";

const LAYOUT = {
  kicker: "Born-on days · notable-people grounding",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderBornOnHub(
  days: readonly BornOnDayPage[],
  meanings: Map<string, CardMeaning>,
  provenance: BornOnProvenance,
): string {
  const path = bornOnHubPath();
  const title = "Born-On Birth Cards";
  const description =
    "366 birthday pages on the live /born-on path, each mapped to a Card Blueprints coordinate and grounded with Wikidata notables who share that day-precision public date of birth. Not a new niche. Not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Born on", href: path },
  ];
  const faqs = hubFaqs(provenance);
  const monthItems = MONTH_SLUGS.map((month) => ({
    name: capitalize(month),
    urlPath: `${path}#${month}`,
  }));
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
    itemListJsonLd(monthItems),
  ]);

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">Live /born-on path · 366 days</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p data-slot="method">
        These pages ground the existing birthday directory. Each date is a month
        and day. The birth card is that coordinate. Famous-people blocks use
        Wikidata P569 at day precision and Wikipedia summaries. Dates are not invented.
      </p>
    </header>

    <section data-slot="scope">
      <h2>What this catalog keeps</h2>
      <p>
        ${provenance.kept} notables from the verified Wikidata catalog sit on
        ${provenance.days_with_people} of ${provenance.days} calendar days.
        ${provenance.days_empty} days have no verified notable and stay empty.
        ${provenance.excluded} catalog rows were already excluded upstream
        (year-only or missing day, conflicts, minors, D3 keywords, unresolved titles).
      </p>
    </section>

    <section data-slot="exclusions">
      <h2>What was dropped</h2>
      <p>
        Year-only and year-month dates, Wikidata P569 precision below 11,
        conflicting days, people under 18, and D3 sensitive Wikipedia/Wikidata
        descriptions (serial killer, murderer, terrorist, dictator) have no block.
        Pre-1900 celebrity-catalog rows stay out of this grounding set.
      </p>
      <ul data-slot="exclusion-counts">
        <li>Description keyword (D3): ${provenance.catalog_by_reason.description_keyword ?? 0}</li>
        <li>Year before 1900: ${provenance.catalog_by_reason.year_before_1900 ?? 0}</li>
        <li>Minor: ${provenance.catalog_by_reason.minor ?? 0}</li>
        <li>Missing QID: ${provenance.catalog_by_reason.missing_qid ?? 0}</li>
      </ul>
    </section>

    <section data-slot="calendar">
      <h2>All 366 birthdays</h2>
      ${monthGrids(days, meanings)}
    </section>

    <section data-slot="empty-days">
      <h2>Days with no verified notable</h2>
      <p>
        These dates still have a page. The coordinate and sources stay.
        Famous-people lists are omitted instead of guessed:
        ${provenance.empty_slugs.map((slug) => `<a href="${escapeHtml(bornOnDayPath(slug))}">${escapeHtml(slug)}</a>`).join(", ")}.
      </p>
    </section>

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${faqs
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
      <h2>Read your own date</h2>
      <p>
        <a class="cta" data-checkout-link="true" href="${escapeHtml(bornOnCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${sourcesBlock()}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: "Born-on birth-card coordinates",
    jsonLd,
    crumbs,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
    body,
  });
}

function monthGrids(days: readonly BornOnDayPage[], meanings: Map<string, CardMeaning>): string {
  return MONTH_SLUGS.map((monthSlug, index) => {
    const month = index + 1;
    const rows = days
      .filter((day) => day.month === month)
      .map((day) => {
        const meaning = meanings.get(day.card);
        if (!meaning) {
          throw new Error(`Missing meaning for ${day.slug} (${day.card})`);
        }
        return `<tr>
          <td><a href="${escapeHtml(bornOnDayPath(day.slug))}">${escapeHtml(day.label)}</a></td>
          <td>${escapeHtml(meaning.label)}</td>
          <td data-people-count="${day.people_count}">${day.people_count}</td>
        </tr>`;
      })
      .join("\n          ");
    return `<section id="${monthSlug}" data-month="${monthSlug}">
      <h3>${escapeHtml(capitalize(monthSlug))}</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Birth card</th>
            <th>Verified notables</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>`;
  }).join("\n    ");
}

function hubFaqs(provenance: BornOnProvenance): FaqItem[] {
  return [
    {
      question: "How many born-on pages are here?",
      answer: `${provenance.days} day pages plus this directory. That is the live /born-on calendar, including February 29 and December 31. It is not a new URL niche.`,
    },
    {
      question: "Who counts as a notable on these pages?",
      answer: `${provenance.kept} people from the verified Wikidata catalog with a public day-precision P569 date. Year-only dates, conflicts, minors, and D3 sensitive descriptions are omitted. ${provenance.days_empty} days have no listed notable.`,
    },
    {
      question: "Is a birth card a prediction?",
      answer:
        "No. The card is a calendar coordinate for the month and day. Famous people are cited because they share that public date. The $9 Deep Dive is a written report for a birthday you enter.",
    },
  ];
}

function coordinateBanner(): string {
  return `<p class="method-banner" data-brand="coordinates" role="note">Coordinates, not fortune-telling. Each /born-on page maps a calendar month and day to a birth card, then cites Wikidata notables with day-precision public dates of birth. Empty days stay empty.</p>`;
}

function sourcesBlock(): string {
  return `<p class="sources" data-slot="sources">
      Sources: Wikidata P569 day-precision dates
      (<a href="https://www.wikidata.org/wiki/Property:P569">P569</a>, CC0)
      + Wikipedia REST summaries (CC BY-SA 4.0).
      Birth cards from the public Card Blueprints formula
      (December 31 = Joker). Year unused.
    </p>`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
