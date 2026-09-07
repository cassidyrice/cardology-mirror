import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { CardMeaning, TonyRow, TonysProvenance } from "./types";
import { tonyPath, winPhrase } from "./urls";

const LAYOUT = {
  kicker: "Tony Awards · leading acting · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderTonysHub(
  people: readonly TonyRow[],
  meanings: Map<string, CardMeaning>,
  provenance: TonysProvenance = {},
): string {
  const path = "/tonys";
  const title = "Tony Awards Leading Actors’ and Actresses’ Birth Cards";
  const description =
    "Birth-card coordinates for Tony Award Leading Actor and Leading Actress winners (play and musical) with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Tony Awards", href: path },
  ];
  const scopeNote =
    provenance.scope?.note ??
    "Leading Actor and Leading Actress only, play and musical (four categories). Featured acting and non-acting Tonys are omitted.";
  const faqs = [
    {
      question: "How many Tony winner pages are here?",
      answer: `${people.length} people. Year-only dates, Wikidata day-precision failures, Wikipedia↔Wikidata conflicts, minors, and D3 keyword rows are omitted. Dates are never invented.`,
    },
    {
      question: "Which Tony categories are in scope?",
      answer: `${scopeNote} The Wikipedia lists record the Tony Awards through ${provenance.scope?.through || "the latest published ceremony"}.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts awards or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Winner identity comes from Wikipedia Tony Award leading-acting lists (the public Tony Awards record). Birth dates are Wikidata P569 at day precision, checked against Wikipedia person-page birth templates when those templates include a day. Year-only dates and conflicts are dropped.",
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
          <td><a href="${escapeHtml(tonyPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(winPhrase(person.wins))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · leading acting · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Scope: Leading Actor / Leading Actress in a Play and in a Musical. Featured categories are out of scope.
      Year-only dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Winners by name</h2>
      <table class="president-table" data-tony-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Leading Tony wins</th>
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
      <h2>Get the $9 Deep Dive</h2>
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a Tony forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="/checkout/deep-dive?utm_source=tonys&amp;utm_content=hub">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Tony Awards
      (<a href="https://www.tonyawards.com/">tonyawards.com</a>)
      + Wikipedia leading-acting category lists (CC BY-SA 4.0)
      + Wikidata CC0 (P569)
      + Wikipedia REST summaries (CC BY-SA 4.0).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Tony Awards Leading Actors’ and Actresses’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
