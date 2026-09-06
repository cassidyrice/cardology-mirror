import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { SenatorsProvenance } from "./load";
import type { CardMeaning, HeldSenator, SenatorRow } from "./types";
import { officePhrase, senatorCheckoutHref, senatorPath } from "./urls";

const LAYOUT = {
  kicker: "US senators · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderSenatorsHub(
  people: readonly SenatorRow[],
  meanings: Map<string, CardMeaning>,
  provenance: SenatorsProvenance,
): string {
  const path = "/senators";
  const title = "Current US Senators’ Birth Cards";
  const description =
    "Birth-card coordinates for the sitting United States senators. Calendar positions, not fortune-telling. Year-only dates and Bioguide↔Wikipedia↔Wikidata conflicts are dropped, not invented.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Senators", href: path },
  ];
  const faqs = [
    {
      question: "How many senator pages are here?",
      answer: `${people.length} sitting senators with a day-precision Wikipedia list date that matches Bioguide / congress.gov and Wikidata P569. The catalog is 100 seats. Conflicts and year-only dates have no page.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts elections or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Bioguide / congress.gov compiled birthdays, Wikipedia's list of current United States senators (birth-date template), and Wikidata P569 at day precision. All three must match. Dates are never invented.",
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
          <td><a href="${escapeHtml(senatorPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(person.state)}</td>
          <td>${escapeHtml(officePhrase(person.state, person.senate_class))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const held = provenance.exclusions
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> (${escapeHtml(row.state)}) — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These sitting senators stay off the verified set because the day is missing, year-only, or conflicted. No date was invented.</p>
      <ul>
        ${held}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} verified sitting senators · 100 seats</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each known birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
    </p>

    <section data-slot="directory">
      <h2>Senators by state</h2>
      <table class="president-table">
        <thead>
          <tr>
            <th scope="col">Senator</th>
            <th scope="col">State</th>
            <th scope="col">Seat</th>
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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a Senate forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(senatorCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikipedia CC BY-SA 4.0
      (<a href="https://en.wikipedia.org/wiki/List_of_current_United_States_senators">list of current United States senators</a>
      + REST summaries)
      + Wikidata CC0 (P569 day precision)
      + <a href="https://bioguide.congress.gov/">Bioguide</a>
      / <a href="https://www.congress.gov/members?q=%7B%22congress%22%3A119%2C%22chamber%22%3A%22Senate%22%7D">congress.gov</a>
      via <a href="https://github.com/unitedstates/congress-legislators">congress-legislators</a>
      + <a href="https://www.senate.gov/senators/index.htm">Senate.gov</a>.
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/senators/hub.png",
    ogImageAlt: "Current US Senators’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldSenator): string {
  switch (row.reason) {
    case "dob_conflict":
      return (
        `Wikipedia list ${row.wikipedia_list_date ?? "unknown"} / Bioguide ${row.bioguide_birth_date ?? "unknown"}` +
        ` conflicts with Wikidata P569` +
        (row.wikidata_birth_date ? ` ${row.wikidata_birth_date}` : "") +
        ". Dropped, not guessed."
      );
    case "year_only":
      return "A listed source has a year without a day. Dropped, not guessed.";
    case "wikidata_precision":
      return "Wikidata P569 is not day-precision. Dropped, not guessed.";
    case "missing_birth":
      return "No day-precision birth date on the Wikipedia list. Dropped.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
