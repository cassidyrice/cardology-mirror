import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { RockHallProvenance } from "./load";
import type { CardMeaning, HeldRockHall, RockHallRow } from "./types";
import { inductionPhrase, rockHallCheckoutHref, rockHallPath } from "./urls";

const LAYOUT = {
  kicker: "Rock & Roll Hall of Fame · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderRockHallHub(
  people: readonly RockHallRow[],
  meanings: Map<string, CardMeaning>,
  provenance: RockHallProvenance,
): string {
  const path = "/rock-hall";
  const title = "Rock & Roll Hall of Fame Inductees’ Birth Cards";
  const description =
    "Birth-card coordinates for Rock & Roll Hall of Fame Performers inductees with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Rock Hall", href: path },
  ];
  const faqs = [
    {
      question: "How many Rock Hall pages are here?",
      answer: `${people.length} people (${provenance.kept_solo} solo inductees and ${provenance.kept_member} listed band members). Performers category only. Year-only Wikipedia infobox dates, Wikidata day-precision failures, and Wikipedia↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts awards or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikipedia person-page infobox birth-date templates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Inductee identity comes from the Wikipedia Performers list, which cites RockHall.com. Bands are expanded only when the list names inducted members with public day-precision dates.",
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
          <td><a href="${escapeHtml(rockHallPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(inductionPhrase(person.inductions))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const heldByReason = new Map<string, HeldRockHall[]>();
  for (const row of provenance.exclusions) {
    const list = heldByReason.get(row.reason) ?? [];
    list.push(row);
    heldByReason.set(row.reason, list);
  }
  const heldGroups = [...heldByReason.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([reason, items]) => {
      const names = items
        .slice(0, 40)
        .map((row) => escapeHtml(row.name))
        .join(", ");
      const extra = items.length > 40 ? ` (+${items.length - 40} more)` : "";
      return `<li data-reason="${escapeHtml(reason)}"><strong>${escapeHtml(exclusionPhrase(items[0]!))}</strong> — ${items.length}: ${names}${extra}</li>`;
    })
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These inductees stay off the verified set because the day is missing, year-only, conflicted, or the row is not a person. No date was invented. Dropped, not guessed.</p>
      <ul>
        ${heldGroups}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · ${provenance.catalog_acts} Performers acts · ${provenance.catalog_solo_acts} solo / ${provenance.catalog_group_acts} groups · ${provenance.catalog_listed_members} listed members · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia infobox dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Inductees by name</h2>
      <table class="president-table" data-rock-hall-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Rock Hall</th>
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
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a Rock Hall forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(rockHallCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: RockHall.com
      (<a href="https://www.rockhall.com/inductees">rockhall.com/inductees</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="https://en.wikipedia.org/wiki/List_of_Rock_and_Roll_Hall_of_Fame_inductees">Performers list</a>,
      REST summaries)
      + Wikidata CC0 (P569 day precision).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Rock & Roll Hall of Fame Inductees’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldRockHall): string {
  switch (row.reason) {
    case "dob_conflict":
      return "Wikipedia infobox day conflicts with Wikidata P569. Dropped, not guessed.";
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
    case "band_no_listed_members":
      return "Band with no listed inducted members. Not expanded.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
