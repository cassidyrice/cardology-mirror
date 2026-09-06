import { renderCongruenceSection } from "../congruence-render";
import { escapeHtml } from "../escape";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, personJsonLd } from "../jsonld";
import { jokerLineageSlot, renderLayout } from "../layout";
import { SITE_NAME } from "../types";
import { formatDisplayDate, formatMonthDay, isJokerDate, parseIsoDate } from "../urls";
import { signerCopy, sourceProse } from "./copy";
import type { CardMeaning, SignerRow } from "./types";
import {
  bioguidePath,
  cardMeaningPath,
  signerCheckoutHref,
  signerOgSlot,
  signerPath,
  wikidataPath,
} from "./urls";

const LAYOUT = {
  kicker: "Declaration signers · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · dates verified against primary sources`,
};

export function renderSignerPage(
  person: SignerRow,
  meaning: CardMeaning,
  sameCard: readonly SignerRow[],
): string {
  const path = signerPath(person.slug);
  const copy = signerCopy(person, meaning);
  const dateLabel = formatDisplayDate(person.birth_date);
  const { month, day } = parseIsoDate(person.birth_date);
  const h1 = `${person.name}'s Birth Card: The ${meaning.label}`;
  const description = `${person.name}, signer from ${person.colony}, was born ${dateLabel}. The birth-card coordinate for ${formatMonthDay(month, day)} is the ${meaning.label}. Coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Signers", href: "/signers" },
    { name: person.name, href: path },
  ];
  const jsonLd = jsonLdGraph([
    personJsonLd({
      name: person.name,
      urlPath: path,
      description,
      birthDate: person.birth_date,
      image: signerOgSlot(person.slug),
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(copy.faqs),
  ]);

  const deathLine = person.death_date
    ? `<p class="meta" data-slot="death">Died ${escapeHtml(formatDisplayDate(person.death_date))}</p>`
    : "";

  const sameCardList =
    sameCard.length === 0
      ? `<li data-placeholder="true">No other verified signer in this set shares the ${escapeHtml(meaning.label)}.</li>`
      : sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(signerPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(meaning.label)}</li>`,
          )
          .join("\n        ");

  const footnote = person.footnote
    ? `<p class="notes" data-slot="footnote" role="note">${escapeHtml(person.footnote)}</p>`
    : "";

  const showJoker = person.card === "Joker" || isJokerDate(person.birth_date);

  const congruenceSection = renderCongruenceSection({
    name: person.name,
    prose: sourceProse(person),
    birthSymbol: person.card,
    birthDate: person.birth_date,
    sourceUrl: person.source_url,
    sourceTitle: person.wikipedia_title,
    notAForecastOf: "the Revolution",
  });

  const recordSection = copy.record.length
    ? `<section data-slot="record">
      <h2>${escapeHtml(person.name)} in the public record</h2>
      <p>${escapeHtml(copy.record.join(" "))}</p>
      <p class="attribution">Summarised from the lead section of the Wikipedia article
        <a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>
        (CC BY-SA 4.0). No biographical facts were written for this page beyond that article.</p>
    </section>`
    : "";

  const evidenceSection = copy.evidence.length
    ? `<section data-slot="evidence">
      <h2>Also on the record</h2>
      <ol>
        ${copy.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n        ")}
      </ol>
    </section>`
    : "";

  const body = `
    <header class="hero">
      <p class="eyebrow">Declaration signer · birth-card coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="colony">${escapeHtml(person.colony)}</p>
      <p class="meta" data-slot="date">Born ${escapeHtml(dateLabel)}</p>
      ${deathLine}
      <p class="archetype" data-slot="archetype">${escapeHtml(meaning.title)}</p>
    </header>

    <p class="coordinate-note" data-slot="coordinate-note" role="note">
      A birth card is a calendar coordinate for the month and day. It is not fortune-telling
      and does not predict the Declaration or a revolution.
    </p>
    ${footnote}

    <section data-slot="hook">
      <h2>In the record</h2>
      <p>${escapeHtml(copy.hook)}</p>
    </section>

    <section data-slot="card-meaning">
      <h2>The ${escapeHtml(meaning.label)} coordinate</h2>
      <p>${escapeHtml(copy.card_meaning)}</p>
      <p><a href="${escapeHtml(cardMeaningPath(meaning.slug))}">Live ${escapeHtml(meaning.label)} meaning page</a></p>
    </section>

    ${recordSection}

    ${congruenceSection}

    ${evidenceSection}

    <section data-slot="same-card">
      <h2>Other verified signers with this card</h2>
      <ul>
        ${sameCardList}
      </ul>
    </section>

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${copy.faqs
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
      <p>The Deep Dive is a written card report for your own birthday — not a signer reading.</p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(signerCheckoutHref(person.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    <p class="sources" data-slot="sources">
      Sources:
      NARA <a href="https://www.archives.gov/founding-docs/signers-factsheet">Signers Factsheet</a>
      (${escapeHtml(person.nara_birth_raw)})
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(person.source_url)}">${escapeHtml(person.wikipedia_title)}</a>;
      cross-check ${escapeHtml(person.dob_crosscheck)})
      + Bioguide
      (<a href="${escapeHtml(bioguidePath(person.bioguide_id))}">${escapeHtml(person.bioguide_id)}</a>).
      Wikidata QA only:
      <a href="${escapeHtml(wikidataPath(person.qid))}">${escapeHtml(person.qid)}</a>,
      precision ${person.wikidata_precision ?? "n/a"}, ${escapeHtml(person.wikidata_qa)}.
    </p>
    ${showJoker ? jokerLineageSlot() : ""}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: signerOgSlot(person.slug),
    ogImageAlt: `${person.name} birth-card coordinate — ${meaning.label}`,
    jsonLd,
    crumbs,
    body,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
  });
}
