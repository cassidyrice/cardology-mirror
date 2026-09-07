import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { OscarsProvenance } from "./load";
import type { CardMeaning, HeldOscar, OscarRow } from "./types";
import { awardPhrase, oscarCheckoutHref, oscarPath } from "./urls";

const LAYOUT = {
  kicker: "Academy Awards · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderOscarsHub(
  people: readonly OscarRow[],
  meanings: Map<string, CardMeaning>,
  provenance: OscarsProvenance,
): string {
  const path = "/oscars";
  const title = "Academy Award Winners’ Birth Cards";
  const description =
    "Birth-card coordinates for Academy Award Best Actor and Best Actress winners with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Oscars", href: path },
  ];
  const faqs = [
    {
      question: "How many Oscar winner pages are here?",
      answer: `${people.length} people. Best Actor and Best Actress winners only. Year-only Wikipedia infobox dates, Wikidata day-precision failures, and Wikipedia↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts awards or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikipedia person-page infobox birth-date templates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Winner identity comes from the Wikipedia Best Actor and Best Actress lists, which cite Oscars.org ceremony pages.",
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
          <td><a href="${escapeHtml(oscarPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(awardPhrase(person.awards))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const held = provenance.exclusions
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These winners stay off the verified set because the day is missing, year-only, or conflicted. No date was invented.</p>
      <ul>
        ${held}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · Best Actor and Best Actress · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia infobox dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Winners by name</h2>
      <table class="president-table" data-oscars-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Academy Award</th>
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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not an Oscar forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(oscarCheckoutHref("hub"))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Oscars.org
      (<a href="https://www.oscars.org/">oscars.org</a>,
      <a href="https://awardsdatabase.oscars.org/">Awards Database</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actor">Best Actor</a>,
      <a href="https://en.wikipedia.org/wiki/Academy_Award_for_Best_Actress">Best Actress</a>,
      REST summaries)
      + Wikidata CC0 (P569 day precision).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Academy Award Winners’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldOscar): string {
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
