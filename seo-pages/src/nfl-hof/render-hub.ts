import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { HofProvenance } from "./load";
import type { CardMeaning, HeldHof, HofRow } from "./types";
import { hofCheckoutHref, hofPath, inducteePhrase } from "./urls";

const LAYOUT = {
  kicker: "NFL Hall of Fame · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderHofHub(
  people: readonly HofRow[],
  meanings: Map<string, CardMeaning>,
  provenance: HofProvenance,
): string {
  const path = "/nfl-hof";
  const title = "NFL Hall of Fame Inductee Birth Cards";
  const description =
    "Birth-card coordinates for Pro Football Hall of Fame inductees with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "NFL Hall of Fame", href: path },
  ];
  const faqs = [
    {
      question: "How many Hall of Fame pages are here?",
      answer: `${people.length} people from a Wikidata P6930 catalog of ${provenance.catalog_count}. Year-only dates, Wikidata day-precision failures, and Wikipedia or HOF.com day conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts induction or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikidata P569 at day precision (CC0, Gregorian preferred) for people with a Pro Football Hall of Fame ID (P6930). ProFootballHOF.com bios and Wikipedia infobox days are a conflict check when they publish a day. Hooks and evidence use Wikipedia REST summaries only.",
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
          <td><a href="${escapeHtml(hofPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(inducteePhrase(person))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const heldItems = provenance.exclusions
    .slice(0, 40)
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> — ${escapeHtml(exclusionPhrase(row))}
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
      <p>These P6930 catalog names stay off the verified set because the Wikidata day is missing, year-only, or conflicted with Wikipedia or a Hall of Fame bio. No date was invented.</p>
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
      Year-only dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>Inductees by name</h2>
      <table class="president-table" data-nfl-hof-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Hall of Fame</th>
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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not a Hall of Fame forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(hofCheckoutHref("hub"))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Wikidata CC0 (P6930 Pro Football Hall of Fame ID + P569)
      + Pro Football Hall of Fame bios
      (<a href="https://www.profootballhof.com/">profootballhof.com</a>)
      + Wikipedia CC BY-SA 4.0 (REST summaries and infobox days).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "NFL Hall of Fame Inductee Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldHof): string {
  switch (row.reason) {
    case "dob_conflict":
      return (
        `A published day conflicts with Wikidata P569` +
        (row.wikidata_birth_date ? ` ${row.wikidata_birth_date}` : "") +
        ". Dropped, not guessed."
      );
    case "year_only":
      return "Wikidata P569 has a year without a day. Dropped, not guessed.";
    case "wikidata_precision":
      return "Wikidata P569 is not day-precision. Dropped, not guessed.";
    case "missing_hof_id":
      return "No Wikidata P6930 Pro Football Hall of Fame ID. Dropped.";
    case "missing_wikidata":
      return "No matching Wikidata entity. Dropped.";
    case "thin_source":
      return "Wikipedia summary is too short for a unique page. Dropped, not padded.";
    case "source_dupe":
      return "Wikipedia summary overlaps another kept extract by more than 30%. Dropped, not rewritten.";
    case "minor":
      return "Under 18. No page.";
    case "description_keyword":
      return "D3 sensitive-description exclusion.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
