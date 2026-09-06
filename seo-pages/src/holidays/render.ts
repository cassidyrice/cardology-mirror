import { escapeHtml } from "../escape";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  jsonLdGraph,
} from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME, type FaqItem } from "../types";
import { formatMonthDay } from "../urls";
import { OPM_CALENDARS_URL, USC_CITATION, USC_URL, type HolidayPage } from "./types";
import { holidayPath, holidaysCheckoutHref, holidaysHubPath } from "./urls";

const LAYOUT = {
  kicker: "US federal holidays · birth-card coordinates",
  footer: `${SITE_NAME} · coordinates, not fortune-telling · isolated SEO scaffold · not deployed`,
};

export function renderHolidaysHub(holidays: readonly HolidayPage[]): string {
  const path = holidaysHubPath();
  const title = "US Federal Holiday Birth Cards";
  const description =
    "Five fixed-date U.S. legal public holidays from 5 U.S.C. § 6103(a), mapped by month and day to a Card Blueprints birth-card coordinate. Floating holidays and weekend observed shifts are omitted. Not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Holidays", href: path },
  ];
  const faqs = hubFaqs();
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
    itemListJsonLd(
      holidays.map((holiday) => ({
        name: holiday.name,
        urlPath: holidayPath(holiday.slug),
      })),
    ),
  ]);

  const rows = holidays
    .map((holiday) => {
      const dateLabel = formatMonthDay(holiday.month, holiday.day);
      return `<tr>
          <td><a href="${escapeHtml(holidayPath(holiday.slug))}">${escapeHtml(holiday.name)}</a></td>
          <td data-date="${holiday.month.toString().padStart(2, "0")}-${holiday.day.toString().padStart(2, "0")}">${escapeHtml(dateLabel)}</td>
          <td>${escapeHtml(holiday.cardRef.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">Holiday coordinates · 5 fixed dates</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p data-slot="method">
        Each page uses the calendar month and day named in ${escapeHtml(USC_CITATION)}.
        The birth card is that month and day. The year is unused. Weekend observed
        days are not used.
      </p>
    </header>

    <section data-slot="scope">
      <h2>Fixed dates only</h2>
      <p>
        ${escapeHtml(USC_CITATION)} lists eleven legal public holidays. This hub
        maps the five that name a month and a day: New Year’s Day (January 1),
        Juneteenth National Independence Day (June 19), Independence Day (July 4),
        Veterans Day (November 11), and Christmas Day (December 25).
      </p>
    </section>

    <section data-slot="excluded">
      <h2>Floating holidays are not mapped</h2>
      <p>
        Birthday of Martin Luther King, Jr., Washington’s Birthday, Memorial Day,
        Labor Day, Columbus Day, and Thanksgiving Day are Monday or Thursday
        observances. They have no single month-and-day coordinate, so they are
        omitted. Inauguration Day is ${escapeHtml("§ 6103(c)")} only and is also omitted.
      </p>
    </section>

    <section data-slot="observed-shifts">
      <h2>Observed shifts are ignored</h2>
      <p>
        When a fixed holiday falls on Saturday or Sunday, ${escapeHtml("§ 6103(b)")}
        and OPM calendars move the paid day for most Monday–Friday employees.
        This set still maps the statutory calendar day. Example from the OPM
        calendar: Independence Day 2026 is observed Friday, July 3; the coordinate
        here remains July 4.
      </p>
    </section>

    <section data-slot="holidays-table">
      <h2>The five fixed holidays</h2>
      <table>
        <thead>
          <tr>
            <th>Holiday</th>
            <th>Statutory date</th>
            <th>Birth card</th>
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
      <h2>Read your own date</h2>
      <p>
        <a class="cta" data-checkout-link="true" href="${escapeHtml(holidaysCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${sourcesBlock()}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: "US federal holiday birth-card coordinates",
    jsonLd,
    crumbs,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
    body,
  });
}

export function renderHolidayPage(
  holiday: HolidayPage,
  bySlug: Map<string, HolidayPage>,
): string {
  const path = holidayPath(holiday.slug);
  const dateLabel = formatMonthDay(holiday.month, holiday.day);
  const h1 = `${holiday.name}'s Birth Card: The ${holiday.cardRef.label}`;
  const description = `${holiday.name} maps to the ${holiday.cardRef.label} from its statutory date ${dateLabel} under 5 U.S.C. § 6103(a). Month and day only — coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Holidays", href: holidaysHubPath() },
    { name: holiday.name, href: path },
  ];
  const faqs = holidayFaqs(holiday);
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({
      name: holiday.name,
      urlPath: path,
      description,
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const sameCard = [...bySlug.values()].filter(
    (other) => other.slug !== holiday.slug && other.cardRef.slug === holiday.cardRef.slug,
  );
  const sameCardBlock =
    sameCard.length === 0
      ? "<p>No other fixed federal holiday in this set maps to this card.</p>"
      : `<ul>
        ${sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(holidayPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(other.cardRef.label)}</li>`,
          )
          .join("\n        ")}
      </ul>`;

  const liveCardHref =
    holiday.cardRef.kind === "joker" ? "/birth-card/joker" : `/birth-card/${holiday.cardRef.slug}`;

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">Holiday coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date" data-date-kind="${escapeHtml(holiday.date_kind)}" data-date="${holiday.month.toString().padStart(2, "0")}-${holiday.day.toString().padStart(2, "0")}">
        Statutory date: ${escapeHtml(dateLabel)}
      </p>
      <p class="archetype" data-slot="coordinate">${escapeHtml(holiday.cardRef.archetype)}</p>
    </header>

    <section data-slot="mapping">
      <h2>How the card is assigned</h2>
      <p>
        ${escapeHtml(USC_CITATION)} names ${escapeHtml(holiday.name)} on
        ${escapeHtml(dateLabel)}. Card Blueprints uses that month and day only.
        Solar value = 55 − (2 × month + day). December 31 is the Joker. The year
        is unused. Weekend observed days are ignored.
      </p>
      <p data-slot="card">
        Coordinate: the <strong>${escapeHtml(holiday.cardRef.label)}</strong>.
        Live card page (Next.js origin):
        <a href="${escapeHtml(liveCardHref)}">/birth-card/${escapeHtml(holiday.cardRef.slug)}</a>.
      </p>
    </section>

    <section data-slot="observed-shifts">
      <h2>Not the observed weekday</h2>
      <p>
        OPM calendars sometimes list a Friday or Monday in lieu of
        ${escapeHtml(dateLabel)} when that date falls on a weekend. This page
        does not follow those shifts. The coordinate is the statutory day.
      </p>
    </section>

    <section data-slot="same-card">
      <h2>Other fixed holidays on the ${escapeHtml(holiday.cardRef.label)}</h2>
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
        reading of ${escapeHtml(holiday.name)}.
      </p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(holidaysCheckoutHref(holiday.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${sourcesBlock()}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: `${holiday.name} birth-card coordinate`,
    jsonLd,
    crumbs,
    kicker: LAYOUT.kicker,
    footer: LAYOUT.footer,
    body,
  });
}

function coordinateBanner(): string {
  return `<p class="method-banner" data-brand="coordinates" role="note">Coordinates, not fortune-telling. Each page maps a statutory federal holiday date (month + day) from 5 U.S.C. § 6103(a) to a birth card. Year is unused. Floating holidays and weekend observed shifts are omitted.</p>`;
}

function sourcesBlock(): string {
  return `<p class="sources" data-slot="sources">
      Sources: ${escapeHtml(USC_CITATION)}
      (<a href="${escapeHtml(USC_URL)}">Cornell LII</a>).
      OPM Federal Holidays calendars only
      (<a href="${escapeHtml(OPM_CALENDARS_URL)}">opm.gov</a>) — observed
      Friday/Monday shifts are not used as mapping dates.
    </p>`;
}

function hubFaqs(): FaqItem[] {
  return [
    {
      question: "Which federal holidays have a birth card here?",
      answer:
        "The five § 6103(a) holidays that name a month and day: New Year’s Day (January 1), Juneteenth National Independence Day (June 19), Independence Day (July 4), Veterans Day (November 11), and Christmas Day (December 25).",
    },
    {
      question: "Why are Memorial Day and Thanksgiving missing?",
      answer:
        "They are floating observances (last Monday in May; fourth Thursday in November). This set does not invent a calendar day for them.",
    },
    {
      question: "If July 4 is a Saturday, is the card July 3?",
      answer:
        "No. OPM may treat the preceding Friday as the paid holiday. The coordinate stays July 4, the date named in the statute.",
    },
    {
      question: "Is this a reading of the holiday?",
      answer:
        "No. The card is a calendar coordinate for the documented date. The $9 Deep Dive is a written report for a birthday you enter.",
    },
  ];
}

function holidayFaqs(holiday: HolidayPage): FaqItem[] {
  const dateLabel = formatMonthDay(holiday.month, holiday.day);
  return [
    {
      question: `What date does ${holiday.name} use?`,
      answer: `${dateLabel} — the date named in 5 U.S.C. § 6103(a). Month and day assign the card; the year is unused. Observed weekend shifts are ignored.`,
    },
    {
      question: `What is ${holiday.name}'s birth card?`,
      answer: `The ${holiday.cardRef.label}. That is a coordinate on the Card Blueprints calendar, not a fortune-telling claim about the holiday.`,
    },
    {
      question: "Where do the dates come from?",
      answer:
        "Primary: 5 U.S.C. § 6103(a) via Cornell LII. OPM federal-holiday calendars are cited for observed-year schedules only and are not the mapping source.",
    },
  ];
}
