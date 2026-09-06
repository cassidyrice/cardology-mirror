import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { HouseChairsProvenance } from "./load";
import type { CardMeaning, HeldHouseChair, HouseChairRow } from "./types";
import {
  HISTORY_HOUSE_BIOGUIDE,
  HOUSE_GOV_COMMITTEES,
  HOUSE_GOV_LEADERSHIP,
  houseChairCheckoutHref,
  houseChairPath,
} from "./urls";

const LAYOUT = {
  kicker: "US House leadership and chairs · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderHouseChairsHub(
  people: readonly HouseChairRow[],
  meanings: Map<string, CardMeaning>,
  provenance: HouseChairsProvenance,
): string {
  const path = "/house-chairs";
  const title = "US House Leadership and Standing Committee Chair Birth Cards";
  const description =
    "Birth-card coordinates for current U.S. House leadership on house.gov and standing committee chairs. Calendar positions, not fortune-telling. Year-only dates and Wikipedia↔Bioguide↔Wikidata conflicts are dropped, not invented. Select and campaign committees are out of scope.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "House chairs", href: path },
  ];
  const leadership = people.filter((person) => person.role_kind === "leadership");
  const chairs = people.filter((person) => person.role_kind === "chair");
  const faqs = [
    {
      question: "How many House pages are here?",
      answer: `${people.length} people with a day-precision Wikipedia infobox date that matches Bioguide / congress-legislators and Wikidata P569. The catalog is house.gov/leadership plus the 20 standing committee chairs. Select and campaign committees have no page. Conflicts and year-only dates have no page.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts elections, gavels, or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Each person's Wikipedia infobox birth-date template, the congress-legislators / Bioguide compiled birthday, and Wikidata P569 at day precision. All three must match. house.gov/leadership confirms who sits in elected leadership and does not publish dates of birth. Dates are never invented.",
    },
  ];
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const leadershipRows = renderTable(leadership, meanings);
  const chairRows = renderTable(chairs, meanings);

  const held = provenance.exclusions
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> (${escapeHtml(row.office)}) — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These cataloged officers stay off the verified set because the day is missing, year-only, or conflicted. No date was invented.</p>
      <ul>
        ${held}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} verified people · ${leadership.length} leadership · ${chairs.length} standing chairs</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each known birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented. Select and campaign committees are out of scope.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
    </p>

    <section data-slot="leadership">
      <h2>House leadership</h2>
      <table class="president-table">
        <thead>
          <tr>
            <th scope="col">Officer</th>
            <th scope="col">Office</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${leadershipRows}
        </tbody>
      </table>
    </section>

    <section data-slot="directory">
      <h2>Standing committee chairs</h2>
      <table class="president-table">
        <thead>
          <tr>
            <th scope="col">Officer</th>
            <th scope="col">Office</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${chairRows}
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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a House forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(houseChairCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      <a href="${escapeHtml(HOUSE_GOV_LEADERSHIP)}">house.gov/leadership</a>
      + <a href="${escapeHtml(HOUSE_GOV_COMMITTEES)}">house.gov/committees</a>
      + congress-legislators
      + House History <a href="${escapeHtml(HISTORY_HOUSE_BIOGUIDE)}">Bioguide</a>
      + Wikipedia CC BY-SA 4.0 (article infoboxes + REST summaries)
      + Wikidata CC0 (P569 day precision).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/house-chairs/hub.png",
    ogImageAlt: "US House leadership and standing chair birth cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function renderTable(people: readonly HouseChairRow[], meanings: Map<string, CardMeaning>): string {
  return people
    .map((person) => {
      const meaning = meanings.get(person.card);
      if (!meaning) {
        throw new Error(`Missing card meaning for ${person.slug} (${person.card})`);
      }
      return `<tr>
          <td><a href="${escapeHtml(houseChairPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(person.office)}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");
}

function exclusionPhrase(row: HeldHouseChair): string {
  switch (row.reason) {
    case "dob_conflict":
      return (
        `Wikipedia infobox date ${row.wikipedia_infobox_date ?? "unknown"} conflicts with Bioguide` +
        (row.bioguide_birth_date ? ` ${row.bioguide_birth_date}` : "") +
        (row.wikidata_birth_date ? ` / Wikidata P569 ${row.wikidata_birth_date}` : "") +
        ". Dropped, not guessed."
      );
    case "year_only":
      return "Wikipedia infobox or Bioguide has a year without a day. Dropped, not guessed.";
    case "wikidata_precision":
      return "Wikidata P569 is not day-precision. Dropped, not guessed.";
    case "missing_birth":
      return "No day-precision birth date on the Wikipedia infobox. Dropped.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
