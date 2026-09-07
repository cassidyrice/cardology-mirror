import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { CardMeaning, EmmyProvenance, EmmyRow } from "./types";
import { emmyCheckoutHref, emmyPath, winPhrase } from "./urls";

const LAYOUT = {
  kicker: "Primetime Emmys · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderEmmysHub(
  people: readonly EmmyRow[],
  meanings: Map<string, CardMeaning>,
  provenance: EmmyProvenance,
): string {
  const path = "/emmys";
  const title = "Primetime Emmy Lead Actor / Actress Birth Cards";
  const description =
    "Birth-card coordinates for Primetime Emmy Lead Actor and Lead Actress winners in drama and comedy, kept only when Wikipedia and Wikidata agree on a day-precision date of birth. Calendar positions, not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Emmys", href: path },
  ];
  const faqs = [
    {
      question: "Who is on these pages?",
      answer:
        `${people.length} people. Scope is Primetime Emmy Lead Actor and Lead Actress winners from the drama and comedy Wikipedia lineage lists. ` +
        `Supporting, Limited Series as its own category, Guest, Daytime, International, and Creative Arts awards are out of scope. ` +
        `Year-only dates, Wikipedia↔Wikidata conflicts, minors, and D3-sensitive descriptions are omitted. Dates are never invented.`,
    },
    {
      question: "Is this fortune-telling?",
      answer:
        "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts Emmys or character.",
    },
    {
      question: "Where do the dates and wins come from?",
      answer:
        "Wins come from the four Wikipedia Primetime Emmy Lead Actor/Actress drama and comedy lists, which compile Television Academy (emmys.com) results. " +
        "Birth dates are Wikipedia person-article infobox/lead day-precision templates, verified against Wikidata P569 at day precision (CC0, Gregorian preferred). " +
        "Hooks and evidence use Wikipedia REST summaries only.",
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
          <td><a href="${escapeHtml(emmyPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(winPhrase(person.wins))}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const dropped = provenance.excluded;
  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} people · day-precision only</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each birthday maps to one card through the public formula. That is a coordinate, not a forecast.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
      Year-only Wikipedia dates and Wikipedia↔Wikidata conflicts are dropped.
    </p>

    <section data-slot="scope">
      <h2>Scope</h2>
      <p>
        Primetime Emmy Award for Outstanding Lead Actor / Lead Actress in a Drama Series and
        in a Comedy Series. Pre-1966 ceremonies were not genre-specific; those wins are kept
        once. Supporting, Limited/Anthology as its own category, Guest, Daytime, International,
        and Creative Arts lists are not in this pack.
      </p>
      <p>
        ${people.length} kept · ${dropped} dropped
        (year-only, conflicts, missing day precision, minors, D3 keywords, or missing sources).
      </p>
    </section>

    <section data-slot="directory">
      <h2>Winners by name</h2>
      <table class="president-table" data-emmy-table="true">
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Emmy record</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </section>

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
      <p>Read your own card. The Blueprint Breakdown is a 5-minute video for your birthday (plus the written Deep Dive), not an Emmy forecast.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(emmyCheckoutHref("hub"))}">
          Get the $47 Blueprint Breakdown
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: Television Academy / Emmys
      (<a href="https://www.emmys.com/">emmys.com</a>)
      + Wikipedia CC BY-SA 4.0 (Primetime Emmy Lead Actor/Actress drama + comedy lists;
      person infobox/lead birth dates; REST summaries)
      + Wikidata CC0 (P569).
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Primetime Emmy Lead Actor / Actress Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
