import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { AstronautsProvenance } from "./load";
import type { AstronautRow, CardMeaning, HeldAstronaut } from "./types";
import { astronautCheckoutHref, astronautPath, corpsPhrase } from "./urls";

const LAYOUT = {
  kicker: "NASA astronauts · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderAstronautsHub(
  people: readonly AstronautRow[],
  meanings: Map<string, CardMeaning>,
  provenance: AstronautsProvenance,
): string {
  const path = "/astronauts";
  const title = "NASA Astronauts’ Birth Cards";
  const description =
    "Birth-card coordinates for NASA astronauts (flown and selected corps) with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "NASA astronauts", href: path },
  ];
  const faqs = [
    {
      question: "How many NASA astronaut pages are here?",
      answer: `${people.length} people from a public catalog of ${provenance.catalog_count}. Year-only NASA dates, Wikidata day-precision failures, and NASA↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts missions or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "NASA astronaut biography day-precision birth dates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). The Fact Book list is the flown/selected catalog. Hooks and evidence use Wikipedia REST summaries only.",
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
          <td><a href="${escapeHtml(astronautPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(corpsPhrase(person))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const heldItems = provenance.exclusions
    .slice(0, 40)
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> (${escapeHtml(row.status)}) — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");
  const extraHeld = provenance.exclusions.length - 40;
  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These catalog names stay off the verified set because the NASA day is missing, year-only, or conflicted with Wikidata. No date was invented.</p>
      <ul>
        ${heldItems}
        ${extraHeld > 0 ? `<li data-held-more="true">${extraHeld} more catalog names are held for the same rules.</li>` : ""}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only NASA dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Astronauts by name</h2>
      <table class="president-table" data-astronauts-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Corps</th>
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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not an astronaut forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(astronautCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: NASA astronaut biographies
      (<a href="https://www.nasa.gov/astronauts">nasa.gov/astronauts</a>)
      + NASA Astronaut Fact Book
      (<a href="https://www.nasa.gov/reference/astronaut-fact-book/">list of U.S. astronauts</a>)
      + Wikidata CC0 (P569)
      + Wikipedia CC BY-SA 4.0 (REST summaries).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/astronauts/hub.png",
    ogImageAlt: "NASA Astronauts’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldAstronaut): string {
  switch (row.reason) {
    case "dob_conflict":
      return (
        `NASA bio date ${row.nasa_birth ?? "unknown"} conflicts with Wikidata P569` +
        (row.wikidata_birth_date ? ` ${row.wikidata_birth_date}` : "") +
        ". Dropped, not guessed."
      );
    case "year_only":
      return "NASA bio has a year without a day. Dropped, not guessed.";
    case "wikidata_precision":
      return "Wikidata P569 is not day-precision. Dropped, not guessed.";
    case "missing_birth":
      return "No day-precision birth date on the NASA biography. Dropped.";
    case "missing_nasa_bio":
      return "No matching NASA biography page. Dropped.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
