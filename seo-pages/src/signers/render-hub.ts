import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, jsonLdGraph } from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate } from "../urls";
import type { SignersProvenance } from "./load";
import type { CardMeaning, SignerRow } from "./types";
import { signerCheckoutHref, signerPath } from "./urls";

const LAYOUT = {
  kicker: "Declaration signers · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

export function renderSignersHub(
  people: readonly SignerRow[],
  meanings: Map<string, CardMeaning>,
  provenance: SignersProvenance,
): string {
  const path = "/signers";
  const title = "Declaration Signers’ Birth Cards";
  const description =
    "Birth-card coordinates for the verified-day subset of the 56 signers of the Declaration of Independence. Calendar positions, not fortune-telling. Year-only and contested days are footnoted, not invented.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Signers", href: path },
  ];
  const faqs = [
    {
      question: "How many signer pages are here?",
      answer: `${people.length} verified signers with a known calendar day. Nine signers have only a year in the NARA factsheet, so they have no page. Three contested days (Hancock OS/NS, Harrison V, Hewes) are held.`,
    },
    {
      question: "Is this fortune-telling?",
      answer: "No. A birth card is the calendar coordinate for a month and day. The year is unused. Nothing here predicts the Revolution or character.",
    },
    {
      question: "Where do the dates come from?",
      answer: "NARA Signers Factsheet first, then Wikipedia and Bioguide. New Style is preferred when Old Style is marked. Wikidata P569 at precision 11 is a QA check only — it is never used to invent a day.",
    },
    {
      question: "What about unknown or contested days?",
      answer: "If NARA has only a year, the day is unknown and no card is computed. Hancock, Harrison V, and Hewes are held because the day is contested. No dates are invented.",
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
          <td><a href="${escapeHtml(signerPath(person.slug))}">${escapeHtml(person.name)}</a></td>
          <td>${escapeHtml(person.colony)}</td>
          <td>${escapeHtml(formatDisplayDate(person.birth_date))}</td>
          <td>${escapeHtml(meaning.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const yearOnly = provenance.year_only
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> — NARA ${escapeHtml(row.nara_birth_raw)}.
          ${escapeHtml(row.footnote)}
        </li>`,
    )
    .join("\n        ");

  const held = provenance.held
    .map(
      (row) => `<li>
          <strong>${escapeHtml(row.name)}</strong> — ${escapeHtml(row.footnote)}
        </li>`,
    )
    .join("\n        ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Index · ${people.length} verified signers · 56 in the NARA factsheet</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="archetype">Each known birthday maps to one card through the public formula. That is a coordinate, not a forecast. Days that are unknown or contested are not invented.</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      Solar value = 55 − (2 × month + day). December 31 is the Joker. Year of birth is unused.
    </p>

    <section data-slot="directory">
      <h2>Verified signers</h2>
      <table class="president-table">
        <thead>
          <tr>
            <th scope="col">Signer</th>
            <th scope="col">Colony</th>
            <th scope="col">Born</th>
            <th scope="col">Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </section>

    <section data-slot="year-unknown" class="callout">
      <h2>Day unknown — no page</h2>
      <p>NARA lists only a year for nine signers. The day is unknown. No birth card is computed.</p>
      <ul>
        ${yearOnly}
      </ul>
    </section>

    <section data-slot="held" class="disputed">
      <h2>Held — contested days</h2>
      <p>These three stay off the verified set until the day is no longer contested.</p>
      <ul>
        ${held}
      </ul>
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
      <h2>Get the $9 Deep Dive</h2>
      <p>Read your own card. The Deep Dive is a written report for your birthday, not a reading of 1776.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(signerCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources: NARA
      <a href="https://www.archives.gov/founding-docs/signers-factsheet">Signers Factsheet</a>
      + Wikipedia CC BY-SA 4.0 (infobox + REST summaries)
      + <a href="https://bioguide.congress.gov/">Bioguide</a>.
      Wikidata P569 (precision=11) is QA only.
    </p>
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "Declaration Signers’ Birth Cards — Card Blueprints",
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
