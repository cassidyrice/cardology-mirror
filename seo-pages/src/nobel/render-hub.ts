import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { CardMeaning, NobelRow } from "./types";
import { nobelPath, prizePhrase } from "./urls";

const LAYOUT = {
  kicker: "Nobel laureates · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

export function renderNobelHub(
  people: readonly NobelRow[],
  meanings: Map<string, CardMeaning>,
): string {
  const path = "/nobel";
  const title = "Nobel Laureates’ Birth Cards";
  const description =
    "Birth-card coordinates for Nobel laureates with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Nobel laureates", href: path },
  ];
  const faqs = [
    {
      question: "How many Nobel laureate pages are here?",
      answer: `${people.length} people. Organizations, year-only Nobel dates, Wikidata day-precision failures, and Nobel↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts prizes or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Nobel Prize API v2.1 day-precision birth dates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Hooks and evidence use Wikipedia REST summaries only.",
    },
  ];
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const rows = people
    .map((person) => {
      const meaning = meanings.get(person.card);
      if (!meaning) {
        throw new Error(`Missing card meaning for ${person.slug} (${person.card})`);
      }
      return `<tr>
          <td><a href="${escapeHtml(nobelPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(prizePhrase(person.prizes))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Nobel dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Laureates by name</h2>
      <table class="president-table" data-nobel-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Prize</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
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
      <h2>Get the $47 Blueprint Breakdown</h2>
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not a Nobel forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="/checkout/deep-dive?utm_source=nobel&amp;utm_content=hub">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Nobel Prize API v2.1
      (<a href="https://api.nobelprize.org/2.1/">api.nobelprize.org/2.1</a>)
      + Wikidata CC0 (P569)
      + Wikipedia CC BY-SA 4.0 (REST summaries).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Nobel Laureates’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
