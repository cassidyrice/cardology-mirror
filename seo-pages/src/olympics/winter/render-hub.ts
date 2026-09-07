import { escapeHtml } from "../../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../../jsonld";
import { renderLayout } from "../../layout";
import { SITE_NAME } from "../../types";
import { formatDisplayDate } from "../../urls";
import type { WinterProvenance } from "./load";
import type { CardMeaning, HeldWinterMedalist, WinterMedalistRow } from "./types";
import { medalPhrase, winterCheckoutHref, winterPath } from "./urls";

const LAYOUT = {
  kicker: "Winter Olympic medalists · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderWinterHub(
  people: readonly WinterMedalistRow[],
  meanings: Map<string, CardMeaning>,
  provenance: WinterProvenance,
): string {
  const path = "/olympics/winter";
  const title = "Winter Olympic Medalists’ Birth Cards";
  const description =
    "Birth-card coordinates for Winter Olympic athletes with at least eight medals and a day-precision public date of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Winter Olympic medalists", href: path },
  ];
  const faqs = [
    {
      question: "How many Winter Olympic medalist pages are here?",
      answer: `${people.length} people from Wikipedia’s list of multiple Winter Olympic medalists (primary table: at least eight medals). Year-only Wikipedia infobox dates, Wikidata day-precision failures, and Wikipedia↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts medals or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Each athlete’s Wikipedia infobox birth-date template, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). The 8+ medal list is the catalog, not the date source. Hooks and evidence use Wikipedia REST summaries only.",
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
          <td><a href="${escapeHtml(winterPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(person.sport)}</td>
          <td>${escapeHtml(person.nation)}</td>
          <td>${escapeHtml(medalPhrase(person))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const held = provenance.exclusions
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong>${row.sport ? ` (${escapeHtml(row.sport)})` : ""} — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? `
    <section data-slot="held">
      <h2>Held — no page</h2>
      <p>Every athlete on the current Wikipedia 8+ table had a matching day-precision Wikipedia infobox date and Wikidata P569 claim. Year-only dates and conflicts would be listed here and would not get a page.</p>
    </section>`
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These 8+ medalists stay off the verified set because the day is missing, year-only, or conflicted. No date was invented.</p>
      <ul>
        ${held}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · 8+ Winter Olympic medals · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia infobox dates and source conflicts are dropped.
    </p>

    <section data-slot="method">
      <h2>The public set</h2>
      <p>
        The catalog is
        <a href="https://en.wikipedia.org/wiki/List_of_multiple_Winter_Olympic_medalists">Wikipedia’s list of multiple Winter Olympic medalists</a>,
        primary table only: athletes credited with at least eight medals at the Winter Games.
        That is a coherent public list. It is not every Winter Olympic medalist, and it is not the
        secondary “most medals in one individual event” table on the same page.
      </p>
      <p>
        Birth dates are the athlete’s Wikipedia infobox <code>birth date</code> / <code>birth date and age</code>
        day, verified against Wikidata P569 at precision 11. Both days must match. Dates are never invented.
      </p>
    </section>

    <section data-slot="directory">
      <h2>Medalists by medal count</h2>
      <table class="president-table" data-winter-table="true">
        <thead>
          <tr>
            <th scope="col">Athlete</th>
            <th scope="col">Sport</th>
            <th scope="col">Nation</th>
            <th scope="col">Medals</th>
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
      <h2>Get the $47 Blueprint Breakdown</h2>
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not a Winter Olympic forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(winterCheckoutHref("hub"))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikipedia CC BY-SA 4.0
      (<a href="https://en.wikipedia.org/wiki/List_of_multiple_Winter_Olympic_medalists">List of multiple Winter Olympic medalists</a>
      + article infoboxes + REST summaries)
      + Wikidata CC0 (P569).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Winter Olympic Medalists’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldWinterMedalist): string {
  switch (row.reason) {
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
    case "missing_wikidata":
      return "No Wikidata entity resolved for the Wikipedia title. Dropped.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
