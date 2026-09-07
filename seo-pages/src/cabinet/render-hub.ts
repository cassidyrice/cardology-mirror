import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { CabinetProvenance } from "./load";
import type { CabinetRow, CardMeaning, HeldCabinet } from "./types";
import { cabinetCheckoutHref, cabinetPath, officePhrase } from "./urls";

const LAYOUT = {
  kicker: "US Cabinet · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

export function renderCabinetHub(
  people: readonly CabinetRow[],
  meanings: Map<string, CardMeaning>,
  provenance: CabinetProvenance,
): string {
  const path = "/cabinet";
  const title = "Current US Cabinet Birth Cards";
  const description =
    "Birth-card coordinates for the sitting U.S. Vice President and 15 executive-department heads. Calendar positions, not fortune-telling. Year-only dates and Wikipedia↔Wikidata conflicts are dropped, not invented.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Cabinet", href: path },
  ];
  const faqs = [
    {
      question: "How many Cabinet pages are here?",
      answer: `${people.length} sitting officers with a day-precision Wikipedia infobox date that matches Wikidata P569. The catalog is the Vice President plus 15 secretaries. Cabinet-level officials outside those departments have no page. Conflicts and year-only dates have no page.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts appointments or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Each officer's Wikipedia infobox birth-date template, verified against Wikidata P569 at day precision. The White House cabinet page confirms who is sitting and does not publish dates of birth. Dates are never invented.",
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
          <td><a href="${escapeHtml(cabinetPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(officePhrase(person.office, person.acting))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

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
      <p>These sitting officers stay off the verified set because the day is missing, year-only, or conflicted. No date was invented.</p>
      <ul>
        ${held}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} verified sitting officers · VP + 15 secretaries</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each known birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
    </p>

    <section data-slot="directory">
      <h2>Cabinet by succession</h2>
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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a Cabinet forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(cabinetCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      <a href="https://www.whitehouse.gov/administration/the-cabinet/">White House cabinet</a>
      + Wikipedia CC BY-SA 4.0
      (<a href="https://en.wikipedia.org/wiki/Cabinet_of_the_United_States">Cabinet of the United States</a>
      + article infoboxes
      + REST summaries)
      + Wikidata CC0 (P569 day precision).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Current US Cabinet Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldCabinet): string {
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
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
