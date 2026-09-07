import { escapeHtml } from "../escape";
import {
  administrativeAreaJsonLd,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  jsonLdGraph,
} from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME, type FaqItem } from "../types";
import { formatDisplayDate, formatMonthDay } from "../urls";
import {
  ADDITIONAL_SHARED_MONTH_DAYS,
  REQUIRED_SHARED_MONTH_DAYS,
  type DateKind,
  type StatePage,
} from "./types";
import { statePath, statesCheckoutHref, statesHubPath } from "./urls";

export function renderStatesHub(states: readonly StatePage[]): string {
  const path = statesHubPath();
  const title = "US States Admission Birth Cards";
  const description =
    "Fifty U.S. states mapped from their official admission or Constitution ratification date (month and day only) to a Card Blueprints birth-card coordinate. Not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "States", href: path },
  ];
  const faqs = hubFaqs();
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
    itemListJsonLd(
      states.map((state) => ({
        name: state.name,
        urlPath: statePath(state.slug),
      })),
    ),
  ]);

  const rows = states
    .map((state) => {
      const dateLabel = formatDisplayDate(state.admission_date);
      const kind = dateKindLabel(state.date_kind);
      return `<tr>
          <td>${state.admission_order}</td>
          <td><a href="${escapeHtml(statePath(state.slug))}">${escapeHtml(state.name)}</a></td>
          <td data-date="${escapeHtml(state.admission_date)}">${escapeHtml(dateLabel)}</td>
          <td>${escapeHtml(kind)}</td>
          <td>${escapeHtml(state.card.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">State coordinates</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p data-slot="method">
        Each state uses one documented date from CRS report R47747 Table 1.
        The birth card is the month and day of that date. The year is unused.
      </p>
    </header>

    <section data-slot="disclosure-original-13">
      <h2>Original 13 ratification dates</h2>
      <p>
        The first thirteen rows are Constitution ratification dates, not later
        admission acts. CRS Table 1 states this explicitly. This hub follows
        that table and does not substitute Articles of Confederation dates.
      </p>
    </section>

    <section data-slot="shared-dates">
      <h2>Shared month-and-day coordinates</h2>
      ${sharedDateList(states, "required")}
      <h3>Also sharing a month and day</h3>
      ${sharedDateList(states, "additional")}
    </section>

    <section data-slot="disputed">
      <h2>Disputed date on record</h2>
      <p data-flag="ohio-date">
        Ohio: Wikipedia notes Congress set a formal statehood date only in 1953
        (Pub. L. 83–204), designating March 1, 1803. CRS Table 1 uses
        March 1, 1803, so this hub maps Ohio to that coordinate.
      </p>
    </section>

    <section data-slot="states-table">
      <h2>All 50 states</h2>
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>State</th>
            <th>Date</th>
            <th>Kind</th>
            <th>Birth card</th>
          </tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </section>

    <section data-slot="cta">
      <h2>Read your own date</h2>
      <p>
        <a class="cta" data-checkout-link="true" href="${escapeHtml(statesCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${sourcesBlock(states[0])}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: "US states admission birth-card coordinates",
    jsonLd,
    crumbs,
    kicker: "State admission coordinates · CRS R47747",
    footer: `${SITE_NAME} · coordinates, not fortune-telling · admission dates from CRS R47747 Table 1`,
    body,
  });
}

export function renderStatePage(
  state: StatePage,
  bySlug: Map<string, StatePage>,
): string {
  const path = statePath(state.slug);
  const dateLabel = formatDisplayDate(state.admission_date);
  const monthDay = formatMonthDay(state.month, state.day);
  const kind = dateKindLabel(state.date_kind);
  const h1 = `${state.name}'s Admission Birth Card: The ${state.card.label}`;
  const description = `${state.name} maps to the ${state.card.label} from its ${kind.toLowerCase()} date ${dateLabel}. Month and day only — coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "States", href: statesHubPath() },
    { name: state.name, href: path },
  ];
  const faqs = stateFaqs(state);
  const jsonLd = jsonLdGraph([
    administrativeAreaJsonLd({
      name: state.name,
      urlPath: path,
      description,
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const sameDay = statesSharingMonthDay(state, bySlug);
  const sameCard = [...bySlug.values()].filter(
    (other) => other.slug !== state.slug && other.card.slug === state.card.slug,
  );

  const all = [...bySlug.values()].sort((a, b) => a.admission_order - b.admission_order);
  const previous = all.find((s) => s.admission_order === state.admission_order - 1);
  const next = all.find((s) => s.admission_order === state.admission_order + 1);
  const year = Number(state.admission_date.slice(0, 4));
  const sameYear = all.filter(
    (s) => s.slug !== state.slug && Number(s.admission_date.slice(0, 4)) === year,
  );
  const solarValue = 55 - (2 * state.month + state.day);

  const gapNote = (() => {
    if (!previous) return "";
    const prevYear = Number(previous.admission_date.slice(0, 4));
    const gap = year - prevYear;
    if (gap <= 0) {
      return `${previous.name} entered the same year, at number ${previous.admission_order}.`;
    }
    return `${gap} ${gap === 1 ? "year" : "years"} after ${previous.name} (number ${previous.admission_order}, ${prevYear}).`;
  })();

  const sameYearNote = sameYear.length
    ? `${sameYear.map((s) => s.name).join(" and ")} also ${sameYear.length === 1 ? "enters" : "enter"} the table in ${year}, so ${year} carries ${sameYear.length + 1} of the 50 dates.`
    : `${year} carries only this one date in Table 1.`;

  const admissionRecord = `<section data-slot="admission-record">
      <h2>${escapeHtml(state.name)}'s place in the admission record</h2>
      <p>
        CRS R47747 Table 1 lists ${escapeHtml(state.name)} at number
        ${state.admission_order} of 50. ${escapeHtml(gapNote)}
        ${next ? escapeHtml(`${next.name} follows at number ${next.admission_order}, in ${next.admission_date.slice(0, 4)}.`) : "No state follows it in the table."}
        ${escapeHtml(sameYearNote)}
      </p>
      <dl class="facts">
        <div><dt>Order in Table 1</dt><dd>${state.admission_order} of 50</dd></div>
        <div><dt>Date kind</dt><dd>${escapeHtml(kind)} — ${escapeHtml(
          state.date_kind === "ratification"
            ? "an original state, dated by its ratification of the Constitution"
            : "admission became effective on this date",
        )}</dd></div>
        <div><dt>Date used</dt><dd>${escapeHtml(dateLabel)}</dd></div>
        <div><dt>Month and day used</dt><dd>${escapeHtml(monthDay)} (the year ${year} is unused)</dd></div>
        <div><dt>Solar value</dt><dd>55 − (2 × ${state.month} + ${state.day}) = ${solarValue}</dd></div>
        <div><dt>Coordinate</dt><dd>${escapeHtml(state.card.label)} — ${escapeHtml(state.card.archetype)}</dd></div>
        <div><dt>States sharing ${escapeHtml(monthDay)}</dt><dd>${sameDay.length === 0 ? "none" : sameDay.map((s) => s.name).join(", ")}</dd></div>
        <div><dt>Wikidata inception (P571)</dt><dd>${escapeHtml(state.wikidata_p571_iso)}${state.wikidata_p571_extra.length ? ` (plus ${escapeHtml(state.wikidata_p571_extra.join(", "))}, unused)` : ""}</dd></div>
      </dl>
    </section>`;

  const leadProse = (state.source_text_full ?? "").trim();
  const leadSection = leadProse
    ? `<section data-slot="state-record">
      <h2>${escapeHtml(state.name)} on the record</h2>
      <p>${escapeHtml(trimToSentences(leadProse, 14))}</p>
      <p class="attribution">Summarised from the lead section of the Wikipedia article
        <a href="${escapeHtml(state.source_url ?? state.wikipedia_list_url)}">${escapeHtml(state.wikipedia_title ?? state.name)}</a>
        (CC BY-SA 4.0). Nothing here was written for this page beyond that article; the
        admission date itself comes from CRS ${escapeHtml(state.crs_report)}, not Wikipedia.</p>
    </section>`
    : "";

  const original13 = state.original_thirteen
    ? `<section data-slot="original-13">
      <h2>Constitution ratification date</h2>
      <p>
        ${escapeHtml(state.name)} is one of the original 13.
        CRS R47747 Table 1 records the date this state ratified the Constitution
        (${escapeHtml(dateLabel)}), not an admission act.
      </p>
    </section>`
    : "";

  const disputed = state.disputed_date
    ? `<aside class="disputed" data-slot="disputed-date" data-flag="ohio-date">
      <h2>Date on record</h2>
      <p>${escapeHtml(state.disputed_date)}</p>
    </aside>`
    : "";

  const extraP571 =
    state.wikidata_p571_extra.length > 0
      ? `<p data-slot="wikidata-extra">
      Wikidata P571 also lists ${escapeHtml(state.wikidata_p571_extra.join(", "))}
      for ${escapeHtml(state.wikidata_qid)}. Those extra inception values are
      not used. This page maps the CRS Table 1 date ${escapeHtml(state.admission_date)}.
    </p>`
      : "";

  const sameDayBlock =
    sameDay.length === 0
      ? "<p>No other state shares this month and day on the CRS table.</p>"
      : `<ul>
        ${sameDay
          .map(
            (other) =>
              `<li><a href="${escapeHtml(statePath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(formatDisplayDate(other.admission_date))}</li>`,
          )
          .join("\n        ")}
      </ul>`;

  const sameCardBlock =
    sameCard.length === 0
      ? "<p>No other state maps to this card.</p>"
      : `<ul>
        ${sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(statePath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(other.card.label)}</li>`,
          )
          .join("\n        ")}
      </ul>`;

  const liveCardHref =
    state.card.kind === "joker" ? "/birth-card/joker" : `/birth-card/${state.card.slug}`;

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">State coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date" data-date-kind="${escapeHtml(state.date_kind)}">
        ${escapeHtml(kind)} date: ${escapeHtml(dateLabel)}
      </p>
      <p class="archetype" data-slot="coordinate">${escapeHtml(state.card.archetype)}</p>
    </header>

    <section data-slot="mapping">
      <h2>How the card is assigned</h2>
      <p>
        ${escapeHtml(state.name)} (${escapeHtml(state.postal)}) entered the
        Table 1 record on ${escapeHtml(dateLabel)}.
        Card Blueprints uses ${escapeHtml(monthDay)} — month and day only —
        and the public D1 birth-card rule (December 31 is the Joker).
        The year ${escapeHtml(state.admission_date.slice(0, 4))} is unused.
      </p>
      <p data-slot="card">
        Coordinate: the <strong>${escapeHtml(state.card.label)}</strong>.
        Card meaning page:
        <a href="${escapeHtml(liveCardHref)}">/birth-card/${escapeHtml(state.card.slug)}</a>.
      </p>
    </section>

    ${admissionRecord}

    ${leadSection}

    ${original13}
    ${disputed}
    ${extraP571}

    <section data-slot="same-day">
      <h2>States that share ${escapeHtml(monthDay)}</h2>
      ${sameDayBlock}
    </section>

    <section data-slot="same-card">
      <h2>Other states on the ${escapeHtml(state.card.label)}</h2>
      ${sameCardBlock}
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
      <h2>Get your own coordinate</h2>
      <p>
        The $9 Deep Dive is a written report for a birthday you enter — not a
        reading of ${escapeHtml(state.name)}.
      </p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(statesCheckoutHref(state.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${sourcesBlock(state)}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/default.png",
    ogImageAlt: `${state.name} admission birth-card coordinate`,
    jsonLd,
    crumbs,
    kicker: "State admission coordinates · CRS R47747",
    footer: `${SITE_NAME} · coordinates, not fortune-telling · admission dates from CRS R47747 Table 1`,
    body,
  });
}

/** First `max` sentences of a lead section, so a very long article does not swamp the page. */
function trimToSentences(text: string, max: number): string {
  const parts = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, max).join(" ");
}

function coordinateBanner(): string {
  return `<p class="method-banner" data-brand="coordinates" role="note">Coordinates, not fortune-telling. Each page maps a documented admission or ratification date (month + day) to a birth card. Year is unused. District of Columbia and territories are excluded.</p>`;
}

function sourcesBlock(state: StatePage | undefined): string {
  if (!state) {
    throw new Error("sourcesBlock requires a state row for attribution URLs");
  }
  return `<p class="sources" data-slot="sources">
      Sources: CRS ${escapeHtml(state.crs_report)} ${escapeHtml(state.crs_table)}
      (<a href="${escapeHtml(state.crs_html)}">congress.gov</a>,
      <a href="${escapeHtml(state.crs_pdf)}">PDF R47747.16</a>)
      + Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(state.wikipedia_list_url)}">${escapeHtml(state.wikipedia_list)}</a>).
      Optional Wikidata P571 cross-check via REST wbgetentities (no SPARQL).
    </p>`;
}

function sharedDateList(
  states: readonly StatePage[],
  group: "required" | "additional",
): string {
  const catalog = group === "required" ? REQUIRED_SHARED_MONTH_DAYS : ADDITIONAL_SHARED_MONTH_DAYS;
  const bySlug = new Map(states.map((state) => [state.slug, state]));
  const items = catalog.map((entry) => {
    const names = entry.slugs
      .map((slug) => {
        const state = bySlug.get(slug);
        if (!state) {
          throw new Error(`Shared-date slug missing: ${slug}`);
        }
        return `<a href="${escapeHtml(statePath(state.slug))}">${escapeHtml(state.name)}</a> (${escapeHtml(formatDisplayDate(state.admission_date))})`;
      })
      .join(" and ");
    return `<li data-shared="${entry.month}-${entry.day}">${escapeHtml(formatMonthDay(entry.month, entry.day))} — ${names}</li>`;
  });
  return `<ul>\n        ${items.join("\n        ")}\n      </ul>`;
}

function statesSharingMonthDay(
  state: StatePage,
  bySlug: Map<string, StatePage>,
): StatePage[] {
  return [...bySlug.values()].filter(
    (other) =>
      other.slug !== state.slug && other.month === state.month && other.day === state.day,
  );
}

function dateKindLabel(kind: DateKind): string {
  switch (kind) {
    case "ratification":
      return "Ratification";
    case "admission":
      return "Admission";
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unhandled date kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function hubFaqs(): FaqItem[] {
  return [
    {
      question: "Why do the original 13 use ratification dates?",
      answer:
        "CRS R47747 Table 1 records Constitution ratification dates for those states. This hub does not invent a later admission act date.",
    },
    {
      question: "Which states share a month and day?",
      answer:
        "Kentucky and Tennessee share June 1. Oregon and Arizona share February 14. North Dakota and South Dakota share November 2. Rhode Island and Wisconsin share May 29. Ohio and Nebraska share March 1.",
    },
    {
      question: "Is this a reading of the state?",
      answer:
        "No. The card is a calendar coordinate for the documented date. The $9 Deep Dive is a written report for a birthday you enter.",
    },
  ];
}

function stateFaqs(state: StatePage): FaqItem[] {
  const kind = dateKindLabel(state.date_kind).toLowerCase();
  return [
    {
      question: `What date does ${state.name} use?`,
      answer: `${formatDisplayDate(state.admission_date)} — the CRS R47747 Table 1 ${kind} date. Month and day assign the card; the year is unused.`,
    },
    {
      question: `What is ${state.name}'s admission birth card?`,
      answer: `The ${state.card.label}. That is a coordinate on the Card Blueprints calendar, not a fortune-telling claim about the state.`,
    },
    {
      question: "Where do the dates come from?",
      answer:
        "Primary: CRS R47747 Table 1. Secondary: Wikipedia’s list of U.S. states by date of admission. Optional Wikidata P571 matched the CRS day for every state QID used here.",
    },
  ];
}
