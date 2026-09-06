import { escapeHtml } from "../escape";
import { renderRecordSection } from "../source-text";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  mlbTeamJsonLd,
} from "../jsonld";
import { renderLayout } from "../layout";
import type { MlbClub } from "./types";
import { MLB_HUB_PATH, mlbCheckoutHref, mlbPath } from "./urls";
import { SITE_NAME, type FaqItem } from "../types";
import { formatDisplayDate, formatMonthDay, parseIsoDate } from "../urls";

const LAYOUT = {
  kicker: "MLB first-game birth cards · isolated",
  footerNote:
    "Card Blueprints · coordinates, not fortune-telling · franchise first-game dates verified against Baseball-Reference and Retrosheet",
} as const;

const FORMULA =
  "solar_value = 55 − (2 × month + day); if solar_value ≤ 0 the coordinate is the Joker (December 31 only). Deck order is 1 = Ace of Hearts through 52 = King of Spades.";

export function renderMlbHub(clubs: readonly MlbClub[]): string {
  const path = MLB_HUB_PATH;
  const title = "MLB First-Game Birth Cards";
  const description =
    "Birth-card coordinates for all 30 current MLB clubs, mapped from Baseball-Reference franchise first MLB games — not player birthdays.";
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "MLB first games", href: path },
  ];
  const byDate = [...clubs].sort((a, b) => {
    const dateCmp = a.first_game.localeCompare(b.first_game);
    return dateCmp !== 0 ? dateCmp : a.name.localeCompare(b.name);
  });
  const byCard = groupByCard(clubs);
  const quartet = clubs.filter((row) => row.expansion_1969_04_08_quartet);
  const trio = clubs.filter((row) => row.aa_1882_05_02_trio);
  const faqs = hubFaqs();
  const jsonLd = jsonLdGraph([
    collectionPageJsonLd({ name: title, urlPath: path, description }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const dateRows = byDate
    .map((row) => {
      const { month, day } = parseIsoDate(row.first_game);
      return `<tr>
          <td><a href="${escapeHtml(mlbPath(row.slug))}">${escapeHtml(row.name)}</a></td>
          <td><time datetime="${escapeHtml(row.first_game)}">${escapeHtml(formatDisplayDate(row.first_game))}</time></td>
          <td>${escapeHtml(formatMonthDay(month, day))}</td>
          <td><a href="${escapeHtml(row.card.meaning_page)}">${escapeHtml(row.card.label)}</a></td>
          <td>${escapeHtml(`${row.league} ${row.division}`)}</td>
        </tr>`;
    })
    .join("\n        ");

  const cardGroups = byCard
    .map(([label, members]) => {
      const links = members
        .map(
          (row) =>
            `<li><a href="${escapeHtml(mlbPath(row.slug))}">${escapeHtml(row.name)}</a> — ${escapeHtml(formatDisplayDate(row.first_game))}</li>`,
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

  const quartetLinks = quartet
    .map((row) => `<a href="${escapeHtml(mlbPath(row.slug))}">${escapeHtml(row.name)}</a>`)
    .join(", ");
  const trioLinks = trio
    .map((row) => `<a href="${escapeHtml(mlbPath(row.slug))}">${escapeHtml(row.name)}</a>`)
    .join(", ");

  const body = `
    <header class="hero">
      <p class="eyebrow">Current 30 · franchise first MLB games</p>
      <h1 data-slot="h1">${escapeHtml(title)}</h1>
      <p class="meta">Cards are calendar coordinates. They are not a forecast about a roster, a city, or a season.</p>
    </header>

    <section data-slot="method">
      <h2>How a club gets a birth card</h2>
      <p>
        Card Blueprints maps a date onto a fifty-two-card calendar. For people, that date is a birthday.
        For these pages, that date is the <strong>franchise first MLB game</strong> published on
        <a href="https://www.baseball-reference.com/teams/">Baseball-Reference’s team pages</a>
        — the first regular-season box of the season BBRef lists as the club’s “From” year.
        Retrosheet first-season game logs corroborate the calendar day.
        The date travels with the club through later city moves and name changes.
        It is not a player date of birth, and it is not local founding lore.
      </p>
      <p>
        The public formula is ${escapeHtml(FORMULA)}
        December 31 is the Joker (Cass lock D1). None of the current thirty first games fall on that day.
      </p>
    </section>

    <aside class="callout" data-slot="expansion-quartet">
      <h2>1969 April 8 expansion quartet</h2>
      <p>
        Four current clubs share the first-game date <time datetime="1969-04-08">April 8, 1969</time>:
        ${quartetLinks}. That month and day resolve to the King of Diamonds.
        Two of those openers were American League (Royals, Seattle Pilots) and two were National League
        (Padres, Montreal Expos). The coordinate stays with the franchise after later city and league moves.
      </p>
    </aside>

    <aside class="callout" data-slot="aa-trio">
      <h2>1882 May 2 American Association trio</h2>
      <p>
        Three current National League clubs opened the American Association on
        <time datetime="1882-05-02">May 2, 1882</time>: ${trioLinks}.
        That month and day resolve to the 4 of Spades.
      </p>
    </aside>

    <section data-slot="by-date">
      <h2>All 30 by first game</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Club</th>
              <th>First MLB game</th>
              <th>Month and day</th>
              <th>Birth card</th>
              <th>League</th>
            </tr>
          </thead>
          <tbody>
        ${dateRows}
          </tbody>
        </table>
      </div>
    </section>

    <section data-slot="by-card">
      <h2>All 30 by birth card</h2>
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
        These pages map franchise first games. Your page maps your birthday. The
        <a class="cta" data-checkout-link="true" href="${escapeHtml(mlbCheckoutHref("hub"))}">
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
    ogImageAlt: "MLB first-game birth-card hub",
    jsonLd,
    crumbs,
    body,
    ...LAYOUT,
  });
}

export function renderMlbPage(club: MlbClub, bySlug: Map<string, MlbClub>): string {
  const path = mlbPath(club.slug);
  const dateLabel = formatDisplayDate(club.first_game);
  const { month, day } = parseIsoDate(club.first_game);
  const monthDay = formatMonthDay(month, day);
  const cardLabel = club.card.label;
  const h1 = `${club.name} Birth Card: The ${cardLabel}`;
  const description = `${club.name} franchise birth card is the ${cardLabel}, mapped from the Baseball-Reference first MLB game ${dateLabel}. A coordinate, not a forecast.`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "MLB first games", href: MLB_HUB_PATH },
    { name: club.name, href: path },
  ];
  const faqs = teamFaqs(club);
  const jsonLd = jsonLdGraph([
    mlbTeamJsonLd({
      name: club.name,
      urlPath: path,
      description,
      foundingDate: club.first_game,
    }),
    breadcrumbJsonLd(crumbs),
    faqPageJsonLd(faqs),
  ]);

  const siblingGame = siblingList(club.same_first_game_day_slugs, bySlug, club.slug);
  const siblingCard = siblingList(club.same_card_slugs, bySlug, club.slug);
  const clusterNote = clusterSentence(club, bySlug);
  const wikiNote = wikipediaSentence(club);

  const recordSection = renderRecordSection({
    heading: `${club.name} on the record`,
    row: club,
    dateSourceNote: "The franchise first-game date comes from Baseball-Reference and Retrosheet, not from this article.",
  });

  const body = `
    <header class="hero">
      <p class="eyebrow">${escapeHtml(club.league)} ${escapeHtml(club.division)} · franchise first game</p>
      <h1 data-slot="h1">${escapeHtml(h1)}</h1>
      <p class="meta" data-slot="date"><time datetime="${escapeHtml(club.first_game)}">${escapeHtml(dateLabel)}</time></p>
      <p class="archetype" data-slot="archetype">Coordinate: ${escapeHtml(cardLabel)} — ${escapeHtml(club.card.archetype)}</p>
    </header>

    <section data-slot="hook">
      <h2>The first game, not a birthday</h2>
      <p>
        The ${escapeHtml(club.name)} birth card on this site is the ${escapeHtml(cardLabel)}.
        That mapping uses the Baseball-Reference first MLB game for the franchise now known as the
        ${escapeHtml(club.name)}: <time datetime="${escapeHtml(club.first_game)}">${escapeHtml(dateLabel)}</time>.
        On that day the club was the ${escapeHtml(club.first_season_name)}.
        Later city moves and name changes do not reset the coordinate. A player date of birth does not set it either.
      </p>
    </section>

    <section data-slot="first-game">
      <h2>Baseball-Reference first-game row</h2>
      <p>
        BBRef lists this franchise from ${escapeHtml(club.first_game.slice(0, 4))}
        (team code ${escapeHtml(club.bbref_first_season_code)} that season;
        current code ${escapeHtml(club.bbref_code)}).
        The first regular-season box is ${escapeHtml(club.first_game_line)}.
        We keep the current marketing name ${escapeHtml(club.name)}.
      </p>
      ${
        club.notes.length > 0
          ? `<ul class="notes">${club.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("\n          ")}</ul>`
          : ""
      }
      <p>
        Wikipedia’s MLB teams table is a year cross-check only. ${escapeHtml(wikiNote)}
        No Wikipedia day is used, and no date on this page was invented to fill a hole.
        Retrosheet’s first-season game log corroborates the same calendar day.
      </p>
    </section>

    <section data-slot="coordinate">
      <h2>How ${escapeHtml(monthDay)} becomes the ${escapeHtml(cardLabel)}</h2>
      <p>
        ${escapeHtml(FORMULA)}
        For ${escapeHtml(monthDay)}, month = ${month} and day = ${day}, so solar_value =
        55 − (2 × ${month} + ${day}) = ${club.solar_value}.
        Slot ${club.solar_value} in that deck is the ${escapeHtml(cardLabel)} (${escapeHtml(club.card.symbol)}).
      </p>
      <p>
        The card is a position on a calendar, the same way a longitude is a position on a globe.
        It does not say the ${escapeHtml(club.name)} “are” a personality, and it does not predict a season.
      </p>
    </section>

    <section data-slot="card-meaning">
      <h2>Published meaning of the ${escapeHtml(cardLabel)}</h2>
      <p>
        The live meaning page
        <a href="${escapeHtml(club.card.meaning_page)}">/birth-card/${escapeHtml(club.card.slug)}</a>
        names this coordinate “${escapeHtml(club.card.archetype)}.”
        That copy is written for a person born on this month and day. Quoted here, it describes the
        coordinate — not a reading of the franchise.
      </p>
      <p>${escapeHtml(club.card.sweet_spot)}</p>
      <p>${escapeHtml(club.card.core_identity)}</p>
      <p>${escapeHtml(club.card.life_direction)}</p>
    </section>

    <section data-slot="same-card">
      <h2>Same-card siblings</h2>
      <p>${escapeHtml(clusterNote)}</p>
      ${
        siblingGame
          ? `<p>Exact same first-game calendar day: ${siblingGame}.</p>`
          : `<p>No other current club shares this exact first-game month and day.</p>`
      }
      ${
        siblingCard
          ? `<p>Same birth-card coordinate (including different first-game days that collapse to the same solar value): ${siblingCard}.</p>`
          : `<p>No other current club shares this birth-card coordinate.</p>`
      }
    </section>

    ${recordSection}

    <section data-slot="faq">
      <h2>FAQ</h2>
      <dl>
        ${faqMarkup(faqs)}
      </dl>
    </section>

    <section data-slot="cta">
      <h2>Read your own birth card</h2>
      <p>
        If you want the personal report rather than a franchise first-game coordinate, the existing
        <a class="cta" data-checkout-link="true" href="${escapeHtml(mlbCheckoutHref(club.slug))}">
          $9 Birth Card Deep Dive
        </a>
        checkout is unchanged. This page only adds <code>utm_source=mlb</code> and
        <code>utm_content=${escapeHtml(club.slug)}</code>.
      </p>
    </section>

    ${sourcesMarkup(club)}
  `;

  return renderLayout({
    title: `${h1} | ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogImage: "/og/example-placeholder.svg",
    ogImageAlt: `${club.name} first-game birth card`,
    jsonLd,
    crumbs,
    body,
    ...LAYOUT,
  });
}

function wikipediaSentence(club: MlbClub): string {
  const label = club.wikipedia_first_season_label;
  switch (club.year_crosscheck) {
    case "year_mentioned":
      return `The table cell reads “${label}” and mentions the first-game year ${club.first_game.slice(0, 4)}.`;
    case "first_game_precedes_wikipedia_join":
      return `The table cell reads “${label}”, a later join year after the ${club.first_game} first game.`;
    case "wikipedia_lists_older_year":
      return `The table cell reads “${label}” and includes a year older than the BBRef first game; that older year is not the birth-card date.`;
    default: {
      const _never: never = club.year_crosscheck;
      return exhaustive(_never);
    }
  }
}

function clusterSentence(club: MlbClub, bySlug: Map<string, MlbClub>): string {
  const quartetNames = EXPANSION_QUARTET_SLUGS.map((slug) => bySlug.get(slug)?.name ?? slug).join(", ");
  const trioNames = AA_TRIO_SLUGS.map((slug) => bySlug.get(slug)?.name ?? slug).join(", ");
  if (club.expansion_1969_04_08_quartet) {
    return `${club.name} is one of the 1969 April 8 expansion quartet (${quartetNames}). All four share the King of Diamonds.`;
  }
  if (club.aa_1882_05_02_trio) {
    return `${club.name} is one of the 1882 May 2 American Association trio (${trioNames}). All three share the 4 of Spades.`;
  }
  if (club.card.symbol === "K♦") {
    return `${club.name} is not in the 1969 quartet, but shares the King of Diamonds with ${quartetNames}.`;
  }
  return `The 1969 April 8 expansion quartet (${quartetNames}) is the largest same-day sibling set in this dataset. ${club.name} is not in that set.`;
}

function siblingList(
  slugs: readonly string[],
  bySlug: Map<string, MlbClub>,
  self: string,
): string {
  const items = slugs
    .filter((slug) => slug !== self)
    .map((slug) => {
      const other = bySlug.get(slug);
      if (!other) return "";
      return `<a href="${escapeHtml(mlbPath(other.slug))}">${escapeHtml(other.name)}</a>`;
    })
    .filter(Boolean);
  return items.join(", ");
}

function groupByCard(clubs: readonly MlbClub[]): Array<[string, MlbClub[]]> {
  const map = new Map<string, MlbClub[]>();
  for (const row of [...clubs].sort((a, b) => a.name.localeCompare(b.name))) {
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
      question: "What date do you use for an MLB franchise birth card?",
      answer:
        "The Baseball-Reference franchise first MLB game — the first regular-season box of the club’s BBRef “From” year — kept through relocations and renames. Not a player birthday.",
    },
    {
      question: "Why is Atlanta 1876 instead of 1871?",
      answer:
        "Baseball-Reference’s franchise start is the 1876 National League. Wikipedia’s teams table also lists 1871 National Association. These pages keep the BBRef first NL game (April 22, 1876).",
    },
    {
      question: "Is a franchise birth card fortune-telling?",
      answer:
        "No. The card is a calendar coordinate. The published meaning describes that coordinate for a person born on the same month and day.",
    },
  ];
}

function teamFaqs(club: MlbClub): FaqItem[] {
  return [
    {
      question: `What is the ${club.name} birth card?`,
      answer: `The ${club.card.label}, from the BBRef first MLB game ${formatDisplayDate(club.first_game)} (solar value ${club.solar_value}).`,
    },
    {
      question: "Does a relocation change the birth card?",
      answer: `No. The first MLB game for the ${club.first_season_name} stays with the club. ${club.name} still maps from ${club.first_game}.`,
    },
    {
      question: "Where does this date come from?",
      answer:
        "Baseball-Reference franchise first-season schedule, corroborated by the Retrosheet first-season game log, retrieved 2026-09-06. Wikipedia years are a cross-check only.",
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

function sourcesMarkup(club?: MlbClub): string {
  const bbref =
    club?.sources.find((source) => source.role === "primary_first_game") ?? DEFAULT_BBREF_SOURCE;
  const retro =
    club?.sources.find((source) => source.role === "game_log_corroboration") ?? DEFAULT_RETRO_SOURCE;
  const wiki =
    club?.sources.find((source) => source.role === "year_crosscheck_only") ?? DEFAULT_WIKI_SOURCE;
  const extra = club
    ? ` First-season name “${escapeHtml(club.first_season_name)}”; Wikipedia season cell “${escapeHtml(club.wikipedia_first_season_label)}”.`
    : "";
  return `<p class="sources" data-slot="sources">
      Sources:
      <a href="${escapeHtml(bbref.url)}">${escapeHtml(bbref.name)}</a>
      (primary first-game dates, retrieved ${escapeHtml(bbref.retrieved)});
      <a href="${escapeHtml(retro.url)}">${escapeHtml(retro.name)}</a>
      (game-log corroboration, ${escapeHtml(retro.license ?? "public domain")}, retrieved ${escapeHtml(retro.retrieved)});
      <a href="${escapeHtml(wiki.url)}">${escapeHtml(wiki.name)}</a>
      (year cross-check only, ${escapeHtml(wiki.license ?? "CC BY-SA 4.0")}, retrieved ${escapeHtml(wiki.retrieved)}).
      Birth cards use <code>pipeline/birthcard.py</code>, the same public formula as celebrity SEO pages.
      ${extra}
    </p>`;
}

const DEFAULT_BBREF_SOURCE = {
  name: "Baseball-Reference — franchise first MLB game",
  url: "https://www.baseball-reference.com/teams/",
  role: "primary_first_game" as const,
  retrieved: "2026-09-06",
};

const DEFAULT_RETRO_SOURCE = {
  name: "Retrosheet — first-season game log",
  url: "https://www.retrosheet.org/boxesetc/MISC/FRDIR.htm",
  role: "game_log_corroboration" as const,
  retrieved: "2026-09-06",
  license: "public domain",
};

const DEFAULT_WIKI_SOURCE = {
  name: "Wikipedia — Major League Baseball teams table",
  url: "https://en.wikipedia.org/wiki/Major_League_Baseball",
  role: "year_crosscheck_only" as const,
  retrieved: "2026-09-06",
  license: "CC BY-SA 4.0",
};

const EXPANSION_QUARTET_SLUGS = [
  "kansas-city-royals",
  "milwaukee-brewers",
  "san-diego-padres",
  "washington-nationals",
] as const;

const AA_TRIO_SLUGS = [
  "cincinnati-reds",
  "pittsburgh-pirates",
  "st-louis-cardinals",
] as const;

function exhaustive(value: never): never {
  throw new Error(`unhandled value: ${String(value)}`);
}
