import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { OlympicsProvenance } from "./load";
import type { CardMeaning, HeldOlympian, OlympicRow } from "./types";
import { medalPhrase, olympicsCheckoutHref, olympicsPath } from "./urls";

const LAYOUT = {
  kicker: "Summer Olympians · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderOlympicsHub(
  people: readonly OlympicRow[],
  meanings: Map<string, CardMeaning>,
  provenance: OlympicsProvenance,
): string {
  const path = "/olympics/summer";
  const title = "Summer Olympians’ Birth Cards";
  const description =
    "Birth-card coordinates for Summer Olympic gold medalists with at least two Summer golds and a day-precision public date of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Summer Olympians", href: path },
  ];
  const faqs = [
    {
      question: "How many Summer Olympian pages are here?",
      answer: `${people.length} people. The catalog is Wikidata athletes with two or more Summer Olympic gold medals and an English Wikipedia article. Year-only Wikipedia infobox dates, Wikidata day-precision failures, Wikipedia↔Wikidata conflicts, minors, and D3 keywords are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts medals or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Each athlete's Wikipedia infobox birth-date template, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Medal counts come from Wikidata P1344 events with P166 Olympic gold, limited to Summer Games. Hooks and evidence use Wikipedia REST summaries only.",
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
          <td><a href="${escapeHtml(olympicsPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(medalPhrase(person))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const reasonLines = Object.entries(provenance.by_reason)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([reason, count]) => `<li>${escapeHtml(reason.replaceAll("_", " "))}: ${count}</li>`)
    .join("\n        ");

  const sampleHeld = provenance.exclusions.slice(0, 12);
  const extraHeld = provenance.exclusions.length - sampleHeld.length;
  const heldList = sampleHeld
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong>${row.qid ? ` (${escapeHtml(row.qid)})` : ""} — ${escapeHtml(exclusionPhrase(row))}
        </li>`,
    )
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>${provenance.excluded} catalog rows stay off the verified set. Days that are year-only or conflicted were not invented. Sample:</p>
      <ul>
        ${heldList}
        ${extraHeld > 0 ? `<li>${extraHeld} more exclusions are listed in harvest provenance.</li>` : ""}
      </ul>
      <ul data-slot="exclusion-counts">
        ${reasonLines}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · two or more Summer golds · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Olympians by gold count, then name</h2>
      <table class="president-table" data-olympics-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Summer golds</th>
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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not an Olympic forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(olympicsCheckoutHref("hub"))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikidata CC0 (P1344 / P166 Olympic gold; P569)
      + Wikipedia CC BY-SA 4.0 (infobox birth-date templates + REST summaries).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Summer Olympians’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldOlympian): string {
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
    case "missing_wikipedia_infobox":
      return "No day-precision birth date on the Wikipedia infobox. Dropped.";
    case "insufficient_summer_golds":
      return "Fewer than two Summer Olympic gold medals on Wikidata. Out of scope.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
