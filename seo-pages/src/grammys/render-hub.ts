import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { GrammysProvenance } from "./load";
import type { CardMeaning, GrammyRow, HeldGrammy } from "./types";
import { AOTY_WIKI, GRAMMY_AWARDS, GRAMMY_HOME, awardPhrase, grammyCheckoutHref, grammyPath } from "./urls";

const LAYOUT = {
  kicker: "Grammy Album of the Year · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderGrammysHub(
  people: readonly GrammyRow[],
  meanings: Map<string, CardMeaning>,
  provenance: GrammysProvenance,
): string {
  const path = "/grammys/aoty";
  const title = "Grammy Album of the Year Birth Cards";
  const description =
    "Birth-card coordinates for Grammy Album of the Year primary billed winners with day-precision public dates of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Grammys AOTY", href: path },
  ];
  const faqs = [
    {
      question: "How many Album of the Year pages are here?",
      answer: `${people.length} people. Primary billed winners only. Bands are expanded only when a member has a public day-precision date of birth. Year-only Wikipedia infobox dates, Wikidata day-precision failures, and Wikipedia↔Wikidata conflicts are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts awards or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "Wikipedia person-page infobox birth-date templates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). Winner identity comes from the Wikipedia Album of the Year list, which cites Grammy.com / Recording Academy pages.",
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
          <td><a href="${escapeHtml(grammyPath(person.slug))}">${escapeHtml(person.name)}</a></td>
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

  const various = provenance.various_artists
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.year)} ${escapeHtml(row.album)}</strong> — various artists soundtrack; no primary billed person. Omitted.
        </li>`,
    )
    .join("\n        ");

  const bands = provenance.bands
    .map((band) => {
      if (band.action === "expanded") {
        return `<li>
          <strong>${escapeHtml(band.name)}</strong> — expanded to members with public day-precision dates: ${escapeHtml(band.members_kept.join(", "))}.
        </li>`;
      }
      return `<li>
          <strong>${escapeHtml(band.name)}</strong> — omitted. ${escapeHtml(band.reason.replaceAll("_", " "))}.
        </li>`;
    })
    .join("\n        ");

  const heldSection =
    provenance.exclusions.length === 0 && provenance.various_artists.length === 0
      ? ""
      : `
    <section data-slot="held" class="disputed">
      <h2>Held — no page</h2>
      <p>These billed acts stay off the verified set because the day is missing, year-only, conflicted, or not a primary person. No date was invented.</p>
      <ul>
        ${held}
        ${various}
      </ul>
    </section>`;

  const bandSection = `
    <section data-slot="bands">
      <h2>Bands — expanded or omitted</h2>
      <p>Primary billed only. A band is expanded only when a member has a public day-precision Wikipedia infobox date that matches Wikidata P569.</p>
      <ul>
        ${bands}
      </ul>
    </section>`;

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · Album of the Year · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that conflict or are year-only are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia infobox dates and source conflicts are dropped.
    </p>

    <section data-slot="directory">
      <h2>People by name</h2>
      <table class="president-table" data-grammys-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Album of the Year</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </section>
    ${bandSection}
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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not a Grammy forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(grammyCheckoutHref("hub"))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Grammy.com
      (<a href="${escapeHtml(GRAMMY_HOME)}">grammy.com</a>,
      <a href="${escapeHtml(GRAMMY_AWARDS)}">Awards index</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(AOTY_WIKI)}">Album of the Year</a>,
      REST summaries)
      + Wikidata CC0 (P569 day precision).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Grammy Album of the Year Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}

function exclusionPhrase(row: HeldGrammy): string {
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
    case "various_artists":
      return "Various artists soundtrack. No primary billed person.";
    default:
      return `${row.reason.replaceAll("_", " ")}. No page.`;
  }
}
