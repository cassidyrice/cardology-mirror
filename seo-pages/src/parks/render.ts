import { escapeHtml } from "../escape";
import { renderRecordSection } from "../source-text";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  jsonLdGraph,
  parkJsonLd,
} from "../jsonld";
import { renderLayout } from "../layout";
import { SITE_NAME, type FaqItem } from "../types";
import { formatDisplayDate, formatMonthDay } from "../urls";
import {
  ADDITIONAL_SHARED_MONTH_DAYS,
  ALASKA_ANILCA_SLUGS,
  REQUIRED_SHARED_CLUSTERS,
  type ParkPage,
  type PriorDesignation,
} from "./types";
import { parkPath, parksCheckoutHref, parksHubPath } from "./urls";

export function renderParksHub(parks: readonly ParkPage[]): string {
  const path = parksHubPath();
  const title = "US National Park Birth Cards";
  const description =
    "Sixty-three U.S. National Parks mapped from the Wikipedia date each was established as a National Park (month and day only) to a Card Blueprints birth-card coordinate. Not fortune-telling.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "National Parks", href: path },
  ];
  const faqs = hubFaqs();
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
    itemListJsonLd(
      parks.map((park) => ({
        name: park.official_name,
        urlPath: parkPath(park.slug),
      })),
    ),
  ]);

  const rows = parks
    .map((park) => {
      const dateLabel = formatDisplayDate(park.established_date);
      return `<tr>
          <td>${park.established_order}</td>
          <td><a href="${escapeHtml(parkPath(park.slug))}">${escapeHtml(park.name)}</a></td>
          <td>${escapeHtml(park.locations.join(", "))}</td>
          <td data-date="${escapeHtml(park.established_date)}"><time datetime="${escapeHtml(park.established_date)}">${escapeHtml(dateLabel)}</time></td>
          <td>${escapeHtml(park.card.label)}</td>
        </tr>`;
    })
    .join("\n        ");

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">National Park coordinates</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p data-slot="method">
        Each park uses one documented date: Wikipedia’s
        <strong>Date established as park</strong> column — the day the unit
        became a National Park. First monument, reservation, lakeshore, river,
        or memorial dates are footnotes only. The birth card is the month and
        day of that National Park date. The year is unused.
      </p>
    </header>

    <section data-slot="shared-dates" data-cluster="alaska-anilca-1980-12-02">
      <h2>Shared-date clusters</h2>
      <h3>December 2, 1980 — Alaska ANILCA</h3>
      <p>
        Seven current Alaska National Parks share the same National Park date
        under the Alaska National Interest Lands Conservation Act:
        ${alaskaClusterLinks(parks)}.
        Earlier monument dates on NPS Park Anniversaries are not mapped.
      </p>
      ${sharedDateList(parks, "required")}
      <h3>Also sharing a month and day</h3>
      ${sharedDateList(parks, "additional")}
    </section>

    <section data-slot="not-first-monument">
      <h2>Not the first monument</h2>
      <p>
        Many current parks were monuments, reserves, lakeshores, rivers, or
        memorials first. This hub does not use those earlier first-unit dates.
        NPS Park Anniversaries is cited on each page when it lists a different
        first-unit day or year.
      </p>
    </section>

    <section data-slot="parks-table">
      <h2>All 63 National Parks</h2>
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Park</th>
            <th>Location</th>
            <th>National Park date</th>
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
        <a class="cta" data-checkout-link="true" href="${escapeHtml(parksCheckoutHref("hub"))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${hubSourcesBlock(parks[0])}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: "US National Park birth-card coordinates",
    jsonLd,
    crumbs,
    kicker: "National Park coordinates · NPS + Wikipedia dates",
    footer: `${SITE_NAME} · coordinates, not fortune-telling · park establishment dates verified against Wikipedia and NPS`,
    body,
  });
}

export function renderParkPage(park: ParkPage, bySlug: Map<string, ParkPage>): string {
  const path = parkPath(park.slug);
  const dateLabel = formatDisplayDate(park.established_date);
  const monthDay = formatMonthDay(park.month, park.day);
  const h1 = `${park.name}'s National Park Birth Card: The ${park.card.label}`;
  const description = `${park.official_name} maps to the ${park.card.label} from its National Park date ${dateLabel}. Month and day only — coordinates, not fortune-telling.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "National Parks", href: parksHubPath() },
    { name: park.name, href: path },
  ];
  const faqs = parkFaqs(park);
  const jsonLd = jsonLdGraph([
    parkJsonLd({
      name: park.official_name,
      urlPath: path,
      description,
      foundingDate: park.established_date,
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const sameDay = parksSharingMonthDay(park, bySlug);
  const sameCard = [...bySlug.values()].filter(
    (other) => other.slug !== park.slug && other.card.slug === park.card.slug,
  );
  const alaska = isAlaskaAnilca(park.slug);

  const priorBlock = priorDesignationBlock(park);
  const noteBlock = park.date_note
    ? `<aside class="disputed" data-slot="date-note">
      <h2>Date on record</h2>
      <p>${escapeHtml(park.date_note)}</p>
    </aside>`
    : "";

  const sameDayBlock =
    sameDay.length === 0
      ? "<p>No other current National Park shares this month and day on the Wikipedia list.</p>"
      : `<ul>
        ${sameDay
          .map(
            (other) =>
              `<li><a href="${escapeHtml(parkPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(formatDisplayDate(other.established_date))}</li>`,
          )
          .join("\n        ")}
      </ul>`;

  const sameCardBlock =
    sameCard.length === 0
      ? "<p>No other current National Park maps to this card.</p>"
      : `<ul>
        ${sameCard
          .map(
            (other) =>
              `<li><a href="${escapeHtml(parkPath(other.slug))}">${escapeHtml(other.name)}</a> — ${escapeHtml(other.card.label)}</li>`,
          )
          .join("\n        ")}
      </ul>`;

  const liveCardHref =
    park.card.kind === "joker" ? "/birth-card/joker" : `/birth-card/${park.card.slug}`;

  const alaskaBlock = alaska
    ? `<section data-slot="alaska-anilca" data-cluster="alaska-anilca-1980-12-02">
      <h2>December 2 Alaska cluster</h2>
      <p>
        ${escapeHtml(park.name)} is one of seven current Alaska National Parks
        established as parks on December 2, 1980 (ANILCA), with
        ${alaskaSiblingLinks(park, bySlug)}.
        Denali is not in this cluster: its National Park date remains
        February 26, 1917.
      </p>
    </section>`
    : "";

  const recordSection = renderRecordSection({
    heading: `${park.name} on the record`,
    row: park,
    dateSourceNote: "National Park establishment dates come from the Wikipedia list column and NPS Park Anniversaries, not from this article.",
  });

  const body = `
    ${coordinateBanner()}
    <header class="hero">
      <p class="eyebrow">National Park coordinate</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date" data-date-kind="national_park">
        Date established as National Park:
        <time datetime="${escapeHtml(park.established_date)}">${escapeHtml(dateLabel)}</time>
      </p>
      <p class="archetype" data-slot="coordinate">${escapeHtml(park.card.archetype)}</p>
    </header>

    <section data-slot="mapping">
      <h2>How the card is assigned</h2>
      <p>
        ${escapeHtml(park.official_name)}
        (${escapeHtml(park.locations.join(", "))})
        became a National Park on ${escapeHtml(dateLabel)}.
        Card Blueprints uses ${escapeHtml(monthDay)} — month and day only —
        and the public D1 birth-card rule (December 31 is the Joker).
        The year ${escapeHtml(park.established_date.slice(0, 4))} is unused.
      </p>
      <p data-slot="card">
        Coordinate: the <strong>${escapeHtml(park.card.label)}</strong>.
        Live card page (Next.js origin):
        <a href="${escapeHtml(liveCardHref)}">/birth-card/${escapeHtml(park.card.slug)}</a>.
      </p>
    </section>

    ${alaskaBlock}
    ${priorBlock}
    ${noteBlock}

    <section data-slot="same-day">
      <h2>Parks that share ${escapeHtml(monthDay)}</h2>
      ${sameDayBlock}
    </section>

    <section data-slot="same-card">
      <h2>Other parks on the ${escapeHtml(park.card.label)}</h2>
      ${sameCardBlock}
    </section>

    ${recordSection}

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
        reading of ${escapeHtml(park.official_name)}.
      </p>
      <p>
        <a class="cta"
           data-checkout-link="true"
           href="${escapeHtml(parksCheckoutHref(park.slug))}">
          Get the $9 Deep Dive
        </a>
      </p>
    </section>

    ${sourcesBlock(park)}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: `${park.name} National Park birth-card coordinate`,
    jsonLd,
    crumbs,
    kicker: "National Park coordinates · NPS + Wikipedia dates",
    footer: `${SITE_NAME} · coordinates, not fortune-telling · park establishment dates verified against Wikipedia and NPS`,
    body,
  });
}

function coordinateBanner(): string {
  return `<p class="method-banner" data-brand="coordinates" role="note">Coordinates, not fortune-telling. Each page maps the documented Date established as National Park (month + day) to a birth card. Year is unused. First monument and other earlier designations are cited, not mapped.</p>`;
}

function hubSourcesBlock(park: ParkPage | undefined): string {
  if (!park) {
    throw new Error("hubSourcesBlock requires a park row for attribution URLs");
  }
  return `<p class="sources" data-slot="sources">
      Sources: Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(park.wikipedia_list_url)}">${escapeHtml(park.wikipedia_list)}</a>,
      column “${escapeHtml(park.wikipedia_list_column)}”,
      retrieved ${escapeHtml(park.wikipedia_retrieved)})
      + NPS Park Anniversaries footnotes
      (<a href="${escapeHtml(park.nps_anniversaries_url)}">nps.gov</a>,
      retrieved ${escapeHtml(park.nps_anniversaries_retrieved)}).
      Dates are not invented.
    </p>`;
}

function sourcesBlock(park: ParkPage): string {
  return `<p class="sources" data-slot="sources">
      Sources: Wikipedia CC BY-SA 4.0
      (<a href="${escapeHtml(park.wikipedia_list_url)}">${escapeHtml(park.wikipedia_list)}</a>,
      column “${escapeHtml(park.wikipedia_list_column)}”,
      retrieved ${escapeHtml(park.wikipedia_retrieved)};
      article
      <a href="${escapeHtml(wikipediaArticleUrl(park.wikipedia_title))}">${escapeHtml(park.wikipedia_title)}</a>)
      + NPS Park Anniversaries footnotes
      (<a href="${escapeHtml(park.nps_anniversaries_url)}">nps.gov</a>,
      retrieved ${escapeHtml(park.nps_anniversaries_retrieved)}).
      Dates are not invented.
    </p>`;
}

function wikipediaArticleUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

function priorDesignationBlock(park: ParkPage): string {
  if (!park.prior_designation) {
    return "";
  }
  const prior = park.prior_designation;
  return `<aside class="disputed" data-slot="prior-designation" data-prior-kind="${escapeHtml(prior.kind)}">
      <h2>Earlier designation (not mapped)</h2>
      <p>
        ${escapeHtml(priorLabel(prior))}
        This page does not use that earlier date for the birth card.
        The mapped date is the Wikipedia National Park date
        <time datetime="${escapeHtml(park.established_date)}">${escapeHtml(formatDisplayDate(park.established_date))}</time>.
      </p>
    </aside>`;
}

function priorLabel(prior: PriorDesignation): string {
  const when =
    prior.date_precision === "day" ? formatDisplayDate(prior.date) : prior.date;
  return `NPS Park Anniversaries lists ${prior.label} (${when}) as an earlier first-unit record.`;
}

function sharedDateList(
  parks: readonly ParkPage[],
  group: "required" | "additional",
): string {
  const catalog =
    group === "required" ? REQUIRED_SHARED_CLUSTERS : ADDITIONAL_SHARED_MONTH_DAYS;
  const bySlug = new Map(parks.map((park) => [park.slug, park]));
  const items = catalog.map((entry) => {
    const names = entry.slugs
      .map((slug) => {
        const park = bySlug.get(slug);
        if (!park) {
          throw new Error(`Shared-date slug missing: ${slug}`);
        }
        return `<a href="${escapeHtml(parkPath(park.slug))}">${escapeHtml(park.name)}</a> (${escapeHtml(formatDisplayDate(park.established_date))})`;
      })
      .join(", ");
    return `<li data-shared="${entry.month}-${entry.day}">${escapeHtml(formatMonthDay(entry.month, entry.day))} — ${names}</li>`;
  });
  return `<ul>\n        ${items.join("\n        ")}\n      </ul>`;
}

function parksSharingMonthDay(park: ParkPage, bySlug: Map<string, ParkPage>): ParkPage[] {
  return [...bySlug.values()].filter(
    (other) =>
      other.slug !== park.slug && other.month === park.month && other.day === park.day,
  );
}

function isAlaskaAnilca(slug: string): boolean {
  return (ALASKA_ANILCA_SLUGS as readonly string[]).includes(slug);
}

function alaskaClusterLinks(parks: readonly ParkPage[]): string {
  const bySlug = new Map(parks.map((park) => [park.slug, park]));
  return ALASKA_ANILCA_SLUGS.map((slug) => {
    const park = bySlug.get(slug);
    if (!park) {
      throw new Error(`Alaska cluster slug missing: ${slug}`);
    }
    return `<a href="${escapeHtml(parkPath(park.slug))}">${escapeHtml(park.name)}</a>`;
  }).join(", ");
}

function alaskaSiblingLinks(park: ParkPage, bySlug: Map<string, ParkPage>): string {
  return ALASKA_ANILCA_SLUGS.filter((slug) => slug !== park.slug)
    .map((slug) => {
      const other = bySlug.get(slug);
      if (!other) {
        throw new Error(`Alaska sibling missing: ${slug}`);
      }
      return `<a href="${escapeHtml(parkPath(other.slug))}">${escapeHtml(other.name)}</a>`;
    })
    .join(", ");
}

function hubFaqs(): FaqItem[] {
  return [
    {
      question: "Why not use the first monument date?",
      answer:
        "The primary date is Wikipedia’s Date established as park — the National Park designation. NPS Park Anniversaries often lists an earlier first-unit date; those are footnotes, not the mapped coordinate.",
    },
    {
      question: "Which parks share December 2?",
      answer:
        "Gates of the Arctic, Glacier Bay, Katmai, Kenai Fjords, Kobuk Valley, Lake Clark, and Wrangell–St. Elias share December 2, 1980 (ANILCA). Denali does not: its National Park date is February 26, 1917.",
    },
    {
      question: "Is this a reading of the park?",
      answer:
        "No. The card is a calendar coordinate for the documented National Park date. The $9 Deep Dive is a written report for a birthday you enter.",
    },
  ];
}

function parkFaqs(park: ParkPage): FaqItem[] {
  const prior = park.prior_designation;
  const priorAnswer = prior
    ? `NPS Park Anniversaries lists ${prior.label} (${prior.date}) as an earlier first-unit record. That date is cited, not mapped.`
    : "This park’s Wikipedia National Park date is the first-unit date used here; any later rename or expansion is noted when Wikipedia or NPS records it.";
  return [
    {
      question: `What date does ${park.name} use?`,
      answer: `${formatDisplayDate(park.established_date)} — Wikipedia’s Date established as park. Month and day assign the card; the year is unused.`,
    },
    {
      question: `What is ${park.name}'s National Park birth card?`,
      answer: `The ${park.card.label}. That is a coordinate on the Card Blueprints calendar, not a fortune-telling claim about the park.`,
    },
    {
      question: "Where do the dates come from?",
      answer: `Primary: Wikipedia List of national parks of the United States, Date established as park. Footnotes: NPS Park Anniversaries. ${priorAnswer}`,
    },
  ];
}
