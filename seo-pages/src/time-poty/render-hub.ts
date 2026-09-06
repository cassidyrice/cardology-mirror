import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { TimePotyProvenance } from "./load";
import type { CardMeaning, HeldTimePoty, TimePotyRow } from "./types";
import { POTY_WIKI, TIME_HOME, TIME_VAULT, honorPhrase, timePotyCheckoutHref, timePotyPath } from "./urls";

const LAYOUT = {
  kicker: "TIME Person of the Year · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderTimePotyHub(
  people: readonly TimePotyRow[],
  meanings: Map<string, CardMeaning>,
  provenance: TimePotyProvenance,
): string {
  const path = "/time-person-of-the-year";
  const title = "TIME Person of the Year Birth Cards";
  const description =
    "Birth-card coordinates for named TIME Person of the Year humans with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "TIME Person of the Year", href: path },
  ];
  const faqs = [
    {
      question: "How many TIME Person of the Year pages are here?",
      answer: `${people.length} named humans. Duals and joint years are split per person. Abstractions, machines, and groups-as-concepts are omitted. Year-only Wikipedia infobox dates, Wikidata day-precision failures, and Wikipedia↔Wikidata conflicts are dropped. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts a magazine cover or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikipedia person-page infobox birth-date templates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Honoree identity comes from the Wikipedia TIME Person of the Year list. TIME vault is context only and is not a date source.",
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
          <td><a href="${escapeHtml(timePotyPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(honorPhrase(person.honors))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const held = provenance.exclusions
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong>${row.year ? ` (${escapeHtml(row.year)})` : ""} — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These choices stay off the verified set because they are not a named human with a matching day-precision date. No date was invented. Dropped, not guessed.</p>
      <ul>
        ${held}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · TIME Person of the Year · named humans only · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia infobox dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>People by name</h2>
      <table class="president-table" data-time-poty-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">TIME Person of the Year</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </section>
    ${heldSection}

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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a TIME forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(timePotyCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(POTY_WIKI)}">TIME Person of the Year list</a>,
      REST summaries)
      + Wikidata CC0 (P569 day precision).
      TIME magazine / vault
      (<a href="${escapeHtml(TIME_HOME)}">time.com</a>,
      <a href="${escapeHtml(TIME_VAULT)}">time.com/vault</a>)
      is context only and is not a date source.
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/time-person-of-the-year/hub.png",
    ogImageAlt: "TIME Person of the Year Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldTimePoty): string {
  switch (row.reason) {
    case "concept":
      return "Abstraction, machine, or group-as-concept. Not a named-human page.";
    case "dob_conflict":
      return (
        `Wikipedia infobox date ${row.wikipedia_infobox_date ?? "unknown"} conflicts with Wikidata P569` +
        (row.wikidata_birth_date ? ` ${row.wikidata_birth_date}` : "") +
        ". Dropped, not guessed."
      );
    case "year_only":
      return "Wikipedia infobox has a year without a day. Dropped, not guessed.";
    case "wikidata_precision":
      return "Wikidata P569 is not day-precision. Dropped, not guessed.";
    case "missing_birth":
      return "No day-precision birth date on the Wikipedia infobox. Dropped.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    case "not_a_person":
      return "Wikidata is not a human. No person page.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
