import { escapeHtml } from "./escape";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  sportsTeamJsonLd,
} from "./jsonld";
import { renderLayout } from "./layout";
import type { Franchise } from "./franchise-types";
import {
  FRANCHISE_HUB_PATH,
  franchiseCheckoutHref,
  franchisePath,
} from "./franchise-urls";
import { SITE_NAME, type FaqItem } from "./types";
import { formatDisplayDate, formatMonthDay, parseIsoDate } from "./urls";

const LAYOUT = {
  kicker: "NFL franchise birth cards · isolated",
  footerNote:
    "Card Blueprints · isolated NFL franchise scaffold · not deployed · cards are coordinates, not forecasts",
} as const;

const FORMULA =
  "solar_value = 55 − (2 × month + day); if solar_value ≤ 0 the coordinate is the Joker (December 31 only). Deck order is 1 = Ace of Hearts through 52 = King of Spades.";

export function renderFranchiseHub(franchises: readonly Franchise[]): string {
  const path = FRANCHISE_HUB_PATH;
  const title = "NFL Franchise Birth Cards";
  const description =
    "Birth-card coordinates for all 32 current NFL clubs, mapped from Pro Football Hall of Fame franchise grant dates — not first kickoff.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "NFL franchises", href: path },
  ];
  const byDate = [...franchises].sort((a, b) => {
    const dateCmp = a.grant_date.localeCompare(b.grant_date);
    return dateCmp !== 0 ? dateCmp : a.name.localeCompare(b.name);
  });
  const byCard = groupByCard(franchises);
  const quintet = franchises.filter((row) => row.afl_1959_08_14_quintet);
  const faqs = hubFaqs();
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const dateRows = byDate
    .map((row) => {
      const { month, day } = parseIsoDate(row.grant_date);
      return `<tr>
          <td><a href="${escapeHtml(franchisePath(row.slug))}">${escapeHtml(row.name)}</a></td>
          <td><time datetime="${escapeHtml(row.grant_date)}">${escapeHtml(formatDisplayDate(row.grant_date))}</time></td>
          <td>${escapeHtml(formatMonthDay(month, day))}</td>
          <td><a href="${escapeHtml(row.card.meaning_page)}">${escapeHtml(row.card.label)}</a></td>
          <td>${escapeHtml(`${row.conference} ${row.division}`)}</td>
        </tr>`;
    })
    .join("\n        ");

  const cardGroups = byCard
    .map(([label, members]) => {
      const links = members
        .map(
          (row) =>
            `<li><a href="${escapeHtml(franchisePath(row.slug))}">${escapeHtml(row.name)}</a> — ${escapeHtml(formatDisplayDate(row.grant_date))}</li>`,
        )
        .join("\n          ");
      return `<section class="card-group">
        <h3>${escapeHtml(label)}</h3>
        <ul>
          ${links}
        </ul>
      </section>`;
    })
    .join("\n      ");

  const quintetLinks = quintet
    .map((row) => `<a href="${escapeHtml(franchisePath(row.slug))}">${escapeHtml(row.name)}</a>`)
    .join(", ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Current 32 · grant dates</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="meta">Cards are calendar coordinates. They are not a forecast about a roster, a city, or a Sunday.</p>
    </header>

    <section data-slot="method">
      <h2>How a franchise gets a birth card</h2>
      <p>
        Card Blueprints maps a date onto a fifty-two-card calendar. For people, that date is a birthday.
        For these pages, that date is the <strong>franchise grant</strong> published in the
        <a href="https://www.profootballhof.com/football-history/national-football-league-franchise-histories">Pro Football Hall of Fame Franchise Histories</a>
        table. The Hall’s Franchise Date column travels with the club through later city moves and name changes.
        It is not the first kickoff, and it is not local founding lore.
      </p>
      <p>
        The public formula is ${escapeHtml(FORMULA)}
        December 31 is the Joker (Cass lock D1). None of the current thirty-two grants fall on that day.
      </p>
    </section>

    <aside class="callout" data-slot="afl-quintet">
      <h2>AFL 14 August 1959 quintet</h2>
      <p>
        Five current clubs share the Hall of Fame grant date <time datetime="1959-08-14">August 14, 1959</time>
        (AFL): ${quintetLinks}. That month and day resolve to the Queen of Clubs.
        The Dallas Cowboys and Minnesota Vikings were granted on January 28, 1960 — a different calendar day
        that yields the same solar value, so they sit on the same coordinate without joining the AFL quintet.
      </p>
    </aside>

    <section data-slot="by-date">
      <h2>All 32 by grant date</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Franchise</th>
              <th>HOF grant date</th>
              <th>Month and day</th>
              <th>Birth card</th>
              <th>Conference</th>
            </tr>
          </thead>
          <tbody>
        ${dateRows}
          </tbody>
        </table>
      </div>
    </section>

    <section data-slot="by-card">
      <h2>All 32 by birth card</h2>
      ${cardGroups}
    </section>

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${faqMarkup(faqs)}
      </dl>
    </section>

    <section data-slot="cta">
      <h2>Get your own coordinate</h2>
      <p>
        These pages map league grants. Your page maps your birthday. The
        <a class="cta" data-checkout-link="true" href="${escapeHtml(franchiseCheckoutHref("hub"))}">
          $9 Birth Card Deep Dive
        </a>
        is the existing checkout — this folder does not create a payment path.
      </p>
    </section>

    ${sourcesMarkup()}
  `;

  return renderLayout({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: "NFL franchise birth-card hub",
    jsonLd,
    crumbs,
    body,
    ...LAYOUT,
  });
}

export function renderFranchisePage(
  franchise: Franchise,
  bySlug: Map<string, Franchise>,
): string {
  const path = franchisePath(franchise.slug);
  const dateLabel = formatDisplayDate(franchise.grant_date);
  const { month, day } = parseIsoDate(franchise.grant_date);
  const monthDay = formatMonthDay(month, day);
  const cardLabel = franchise.card.label;
  const h1 = `${franchise.name} Birth Card: The ${cardLabel}`;
  const description = `${franchise.name} franchise birth card is the ${cardLabel}, mapped from the Hall of Fame grant date ${dateLabel}. A coordinate, not a forecast.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "NFL franchises", href: FRANCHISE_HUB_PATH },
    { name: franchise.name, href: path },
  ];
  const faqs = teamFaqs(franchise);
  const jsonLd = jsonLdGraph([
    sportsTeamJsonLd({
      name: franchise.name,
      urlPath: path,
      description,
      foundingDate: franchise.grant_date,
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const leagueClause = leagueSentence(franchise);
  const siblingGrant = siblingList(franchise.same_grant_day_slugs, bySlug, franchise.slug);
  const siblingCard = siblingList(franchise.same_card_slugs, bySlug, franchise.slug);
  const quintetNote = quintetSentence(franchise, bySlug);
  const wikiNote = wikipediaSentence(franchise);

  const body = `
    <header class="hero">
      <p class="eyebrow">${escapeHtml(franchise.conference)} ${escapeHtml(franchise.division)} · franchise grant</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date"><time datetime="${escapeHtml(franchise.grant_date)}">${escapeHtml(dateLabel)}</time></p>
      <p class="archetype" data-slot="archetype">Coordinate: ${escapeHtml(cardLabel)} — ${escapeHtml(franchise.card.archetype)}</p>
    </header>

    <section data-slot="hook">
      <h2>The grant, not the kickoff</h2>
      <p>
        The ${escapeHtml(franchise.name)} birth card on this site is the ${escapeHtml(cardLabel)}.
        That mapping uses the Pro Football Hall of Fame Franchise Date for the club now known as the
        ${escapeHtml(franchise.name)}: <time datetime="${escapeHtml(franchise.grant_date)}">${escapeHtml(dateLabel)}</time>.
        ${escapeHtml(leagueClause)}
        Later city moves and name changes do not reset the coordinate. A first regular-season snap does not set it either.
      </p>
    </section>

    <section data-slot="grant">
      <h2>Hall of Fame franchise row</h2>
      <p>
        HOF lists the row as “${escapeHtml(franchise.hof_row_name)}” with Franchise Date
        ${escapeHtml(franchise.hof_franchise_date_raw)} and years of operation
        ${escapeHtml(franchise.hof_years_of_operation)}.
        We ISO-normalize that cell to ${escapeHtml(franchise.grant_date)} and keep the current marketing name
        ${escapeHtml(franchise.name)}.
      </p>
      ${
        franchise.hof_notes.length > 0
          ? `<ul class="notes">${franchise.hof_notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("\n          ")}</ul>`
          : ""
      }
      <p>
        Wikipedia’s NFL teams table is a year cross-check only. ${escapeHtml(wikiNote)}
        No Wikipedia day is used, and no date on this page was invented to fill a hole.
      </p>
    </section>

    <section data-slot="coordinate">
      <h2>How ${escapeHtml(monthDay)} becomes the ${escapeHtml(cardLabel)}</h2>
      <p>
        ${escapeHtml(FORMULA)}
        For ${escapeHtml(monthDay)}, month = ${month} and day = ${day}, so solar_value =
        55 − (2 × ${month} + ${day}) = ${franchise.solar_value}.
        Slot ${franchise.solar_value} in that deck is the ${escapeHtml(cardLabel)} (${escapeHtml(franchise.card.symbol)}).
      </p>
      <p>
        The card is a position on a calendar, the same way a longitude is a position on a globe.
        It does not say the ${escapeHtml(franchise.name)} “are” a personality, and it does not predict a season.
      </p>
    </section>

    <section data-slot="card-meaning">
      <h2>Published meaning of the ${escapeHtml(cardLabel)}</h2>
      <p>
        The live meaning page
        <a href="${escapeHtml(franchise.card.meaning_page)}">/birth-card/${escapeHtml(franchise.card.slug)}</a>
        names this coordinate “${escapeHtml(franchise.card.archetype)}.”
        That copy is written for a person born on this month and day. Quoted here, it describes the
        coordinate — not a reading of the franchise.
      </p>
      <p>${escapeHtml(franchise.card.sweet_spot)}</p>
      <p>${escapeHtml(franchise.card.core_identity)}</p>
      <p>${escapeHtml(franchise.card.life_direction)}</p>
    </section>

    <section data-slot="same-card">
      <h2>Same-card siblings</h2>
      <p>${escapeHtml(quintetNote)}</p>
      ${
        siblingGrant
          ? `<p>Exact same grant calendar day: ${siblingGrant}.</p>`
          : `<p>No other current club shares this exact grant month and day.</p>`
      }
      ${
        siblingCard
          ? `<p>Same birth-card coordinate (including different grant days that collapse to the same solar value): ${siblingCard}.</p>`
          : `<p>No other current club shares this birth-card coordinate.</p>`
      }
    </section>

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${faqMarkup(faqs)}
      </dl>
    </section>

    <section data-slot="cta">
      <h2>Read your own birth card</h2>
      <p>
        If you want the personal report rather than a league-grant coordinate, the existing
        <a class="cta" data-checkout-link="true" href="${escapeHtml(franchiseCheckoutHref(franchise.slug))}">
          $9 Birth Card Deep Dive
        </a>
        checkout is unchanged. This page only adds <code>utm_source=nfl</code> and
        <code>utm_content=${escapeHtml(franchise.slug)}</code>.
      </p>
    </section>

    ${sourcesMarkup(franchise)}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: `${franchise.name} franchise birth card`,
    jsonLd,
    crumbs,
    body,
    ...LAYOUT,
  });
}

function leagueSentence(franchise: Franchise): string {
  switch (franchise.hof_league_mark) {
    case "AFL":
      return "The Hall marks that grant as AFL.";
    case "AAFC":
      return "The Hall marks that grant as AAFC.";
    case null:
      return "The Hall lists that grant without a rival-league mark.";
    default: {
      const _never: never = franchise.hof_league_mark;
      return exhaustive(_never);
    }
  }
}

function wikipediaSentence(franchise: Franchise): string {
  const label = franchise.wikipedia_first_season_label;
  switch (franchise.year_crosscheck) {
    case "year_mentioned":
      return `The table cell reads “${label}” and mentions the grant year ${franchise.grant_date.slice(0, 4)}.`;
    case "grant_precedes_first_season":
      return `The table cell reads “${label}”, a first-season or NFL-entry year after the ${franchise.grant_date} grant.`;
    case "wikipedia_lists_older_year":
      return `The table cell reads “${label}” and includes a year older than the HOF grant; that older year is not the birth-card date.`;
    default: {
      const _never: never = franchise.year_crosscheck;
      return exhaustive(_never);
    }
  }
}

function quintetSentence(franchise: Franchise, bySlug: Map<string, Franchise>): string {
  const names = AFL_QUINTET_SLUGS.map((slug) => bySlug.get(slug)?.name ?? slug).join(", ");
  if (franchise.afl_1959_08_14_quintet) {
    return `${franchise.name} is one of the AFL 14 August 1959 quintet (${names}). All five share the Queen of Clubs.`;
  }
  if (franchise.card.symbol === "Q♣") {
    return `${franchise.name} is not in the AFL quintet, but January 28 and August 14 produce the same solar value, so this club shares the Queen of Clubs with ${names}.`;
  }
  return `The AFL 14 August 1959 quintet (${names}) is the largest same-day sibling set in this dataset. ${franchise.name} is not in that set.`;
}

function siblingList(
  slugs: readonly string[],
  bySlug: Map<string, Franchise>,
  self: string,
): string {
  const items = slugs
    .filter((slug) => slug !== self)
    .map((slug) => {
      const other = bySlug.get(slug);
      if (!other) return "";
      return `<a href="${escapeHtml(franchisePath(other.slug))}">${escapeHtml(other.name)}</a>`;
    })
    .filter(Boolean);
  return items.join(", ");
}

function groupByCard(franchises: readonly Franchise[]): Array<[string, Franchise[]]> {
  const map = new Map<string, Franchise[]>();
  for (const row of [...franchises].sort((a, b) => a.name.localeCompare(b.name))) {
    const key = row.card.label;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function hubFaqs(): FaqItem[] {
  return [
    {
      question: "What date do you use for an NFL franchise birth card?",
      answer:
        "The Pro Football Hall of Fame Franchise Date — the league grant — kept through relocations and renames. Not first kickoff.",
    },
    {
      question: "Why is Green Bay 1921 instead of 1919?",
      answer:
        "The Hall of Fame grant is August 27, 1921. Wikipedia’s teams table also lists 1919 as pre-NFL lore. These pages keep the NFL grant.",
    },
    {
      question: "Is a franchise birth card fortune-telling?",
      answer:
        "No. The card is a calendar coordinate. The published meaning describes that coordinate for a person born on the same month and day.",
    },
  ];
}

function teamFaqs(franchise: Franchise): FaqItem[] {
  return [
    {
      question: `What is the ${franchise.name} birth card?`,
      answer: `The ${franchise.card.label}, from HOF grant ${formatDisplayDate(franchise.grant_date)} (solar value ${franchise.solar_value}).`,
    },
    {
      question: "Does a relocation change the birth card?",
      answer: `No. The Hall’s Franchise Date for “${franchise.hof_row_name}” stays with the club. ${franchise.name} still maps from ${franchise.grant_date}.`,
    },
    {
      question: "Where does this date come from?",
      answer:
        "The Franchise Date column on the Pro Football Hall of Fame franchise-histories table, retrieved 2026-09-06. Wikipedia years are a cross-check only.",
    },
  ];
}

function faqMarkup(faqs: readonly FaqItem[]): string {
  return faqs
    .map(
      (faq) => `<div>
          <dt>${escapeHtml(faq.question)}</dt>
          <dd>${escapeHtml(faq.answer)}</dd>
        </div>`,
    )
    .join("\n        ");
}

function sourcesMarkup(franchise?: Franchise): string {
  const hof =
    franchise?.sources.find((source) => source.role === "primary_grant_date") ??
    DEFAULT_HOF_SOURCE;
  const wiki =
    franchise?.sources.find((source) => source.role === "year_crosscheck_only") ??
    DEFAULT_WIKI_SOURCE;
  const extra = franchise
    ? ` HOF row “${escapeHtml(franchise.hof_row_name)}”; Wikipedia season cell “${escapeHtml(franchise.wikipedia_first_season_label)}”.`
    : "";
  return `<p class="sources" data-slot="sources">
      Sources: <a href="${escapeHtml(hof.url)}">${escapeHtml(hof.name)}</a>
      (primary grant dates, retrieved ${escapeHtml(hof.retrieved)});
      <a href="${escapeHtml(wiki.url)}">${escapeHtml(wiki.name)}</a>
      (year cross-check only, ${escapeHtml(wiki.license ?? "CC BY-SA 4.0")}, retrieved ${escapeHtml(wiki.retrieved)}).
      Birth cards use <code>pipeline/birthcard.py</code>, the same public formula as celebrity SEO pages.
      ${extra}
    </p>`;
}

const DEFAULT_HOF_SOURCE = {
  name: "Pro Football Hall of Fame — National Football League Franchise Histories",
  url: "https://www.profootballhof.com/football-history/national-football-league-franchise-histories",
  role: "primary_grant_date" as const,
  retrieved: "2026-09-06",
};

const DEFAULT_WIKI_SOURCE = {
  name: "Wikipedia — National Football League teams table",
  url: "https://en.wikipedia.org/wiki/National_Football_League",
  role: "year_crosscheck_only" as const,
  retrieved: "2026-09-06",
  license: "CC BY-SA 4.0",
};

const AFL_QUINTET_SLUGS = [
  "denver-broncos",
  "kansas-city-chiefs",
  "los-angeles-chargers",
  "new-york-jets",
  "tennessee-titans",
] as const;

function exhaustive(value: never): never {
  throw new Error(`unhandled value: ${String(value)}`);
}
