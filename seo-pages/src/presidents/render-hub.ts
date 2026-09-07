import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { CardMeaning, PresidentRow } from "./types";
import { presidencyPhrase, presidentPath } from "./urls";

const LAYOUT = {
  kicker: "US presidents · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderPresidentsHub(
  people: readonly PresidentRow[],
  meanings: Map<string, CardMeaning>,
): string {
  const path = "/presidents";
  const title = "US Presidents’ Birth Cards";
  const description =
    "Birth-card coordinates for the people who have been President of the United States. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Presidents", href: path },
  ];
  const faqs = [
    {
      question: "How many president pages are here?",
      answer: `${people.length} people. Grover Cleveland and Donald Trump each have one person page covering two non-consecutive presidencies (47 presidencies, 45 people).`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts elections or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikidata P569 at day precision (CC0), Gregorian preferred, cross-checked against the Wikipedia list of presidents by home state (month/day). Hooks and evidence use Wikipedia REST summaries only.",
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
      const ordinals = person.terms.map((term) => term.ordinal);
      return `<tr>
          <td><a href="${escapeHtml(presidentPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(presidencyPhrase(ordinals))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · 45 people · 47 presidencies</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
    </p>

    <section data-slot="directory">
      <h2>Presidents by first term</h2>
      <table class="president-table">
        <thead>
          <tr>
            <th scope="col">Person</th>
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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not a presidential forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="/checkout/deep-dive?utm_source=presidents&amp;utm_content=hub">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikidata CC0 (P569 / P570 / P39) + Wikipedia CC BY-SA 4.0
      (REST summaries and
      <a href="https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States_by_home_state">list of presidents by home state</a>).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/presidents/hub.png",
    ogImageAlt: "US Presidents’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
