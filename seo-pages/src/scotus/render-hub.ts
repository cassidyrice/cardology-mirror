import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { CardMeaning, ScotusRow } from "./types";
import { officePhrase, scotusPath } from "./urls";

const LAYOUT = {
  kicker: "Current SCOTUS justices · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

export function renderScotusHub(
  people: readonly ScotusRow[],
  meanings: Map<string, CardMeaning>,
): string {
  const path = "/scotus";
  const title = "Current SCOTUS Justices’ Birth Cards";
  const description =
    "Birth-card coordinates for the nine sitting justices of the Supreme Court of the United States. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "SCOTUS justices", href: path },
  ];
  const faqs = [
    {
      question: "How many justice pages are here?",
      answer: `${people.length} sitting justices. Retired justices, year-only dates, Wikidata day-precision failures, and SCOTUS.gov↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts appointments, votes, or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "SCOTUS.gov Current Members biographies at day precision, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Hooks and evidence use Wikipedia REST summaries only.",
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
          <td><a href="${escapeHtml(scotusPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(officePhrase(person.role))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} sitting justices · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only dates, retired justices, and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Justices by seniority</h2>
      <table class="president-table" data-scotus-table="true">
        <thead>
          <tr>
            <th scope="col">Justice</th>
            <th scope="col">Office</th>
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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not a Supreme Court forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="/checkout/deep-dive?utm_source=scotus&amp;utm_content=hub">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: SCOTUS.gov Current Members
      (<a href="https://www.supremecourt.gov/about/biographies.aspx">biographies.aspx</a>)
      + Wikidata CC0 (P569)
      + Wikipedia CC BY-SA 4.0 (REST summaries).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Current SCOTUS Justices’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
