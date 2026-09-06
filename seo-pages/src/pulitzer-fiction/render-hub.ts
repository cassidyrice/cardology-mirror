import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { PulitzerProvenance } from "./load";
import type { CardMeaning, HeldPulitzer, PulitzerRow } from "./types";
import { FICTION_WIKI, PULITZER_FICTION, PULITZER_HOME, awardPhrase, pulitzerCheckoutHref, pulitzerPath } from "./urls";

const LAYOUT = {
  kicker: "Pulitzer Prize for Fiction · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderPulitzerHub(
  people: readonly PulitzerRow[],
  meanings: Map<string, CardMeaning>,
  provenance: PulitzerProvenance,
): string {
  const path = "/pulitzer/fiction";
  const title = "Pulitzer Prize for Fiction Birth Cards";
  const description =
    "Birth-card coordinates for Pulitzer Prize for Fiction winners with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Pulitzer Fiction", href: path },
  ];
  const faqs = [
    {
      question: "How many Fiction pages are here?",
      answer: `${people.length} people. Person-scope winners and joint recipients only. Year-only Wikipedia infobox dates, Wikidata day-precision failures, and Wikipedia↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts awards or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikipedia person-page infobox birth-date templates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Winner identity comes from the Wikipedia Fiction list, which cites Pulitzer.org year pages.",
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
          <td><a href="${escapeHtml(pulitzerPath(person.slug))}">${escapeHtml(person.name)}</a></td>
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

  const notAwarded = provenance.not_awarded
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.year)}</strong> — no Fiction award that year. Omitted.
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0 && provenance.not_awarded.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These winners stay off the verified set because the day is missing, year-only, conflicted, or not a person. No date was invented. Dropped, not guessed.</p>
      <ul>
        ${held}
        ${notAwarded}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · Pulitzer Prize for Fiction · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia infobox dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>People by name</h2>
      <table class="president-table" data-pulitzer-fiction-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Pulitzer Fiction</th>
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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a Pulitzer forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(pulitzerCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Pulitzer.org
      (<a href="${escapeHtml(PULITZER_HOME)}">pulitzer.org</a>,
      <a href="${escapeHtml(PULITZER_FICTION)}">Fiction category</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(FICTION_WIKI)}">Fiction winners</a>,
      REST summaries)
      + Wikidata CC0 (P569 day precision).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/pulitzer/fiction/hub.png",
    ogImageAlt: "Pulitzer Prize for Fiction Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldPulitzer): string {
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
    case "not_a_person":
      return "Not a person-scope winner. Institutions are omitted.";
    case "not_awarded":
      return "No Fiction award that year.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
