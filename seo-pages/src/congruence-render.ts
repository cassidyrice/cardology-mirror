/**
 * Renders the congruence section shared by every people hub.
 *
 * The section sets one line of a card's published language beside one sentence
 * of the subject's sourced record, and says which rule paired them. Both quotes
 * are verbatim; nothing here is written about the person. When no pairing
 * clears the bar the section says so rather than manufacturing a resemblance.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  findCongruence,
  lifePath,
  type MeaningLike,
  type PathCard,
} from "./congruence";
import { escapeHtml } from "./escape";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

type KarmaTable = Record<
  string,
  { environment: string | null; displacement: string | null; fixed: boolean }
>;

type PrcTable = Record<string, { prc: string[]; birth: string }>;

let karmaCache: KarmaTable | null = null;
let meaningsCache: Record<string, MeaningLike> | null = null;
let prcCache: PrcTable | null = null;

/**
 * Planetary ruling cards for all 366 month/day pairs, generated from the
 * production engine's `getPlanetaryRulingCard` (`lib/engine-core/engine.js`) —
 * the same function the paid reading uses. Dual-ruler signs carry two cards.
 */
export function loadPrcTable(path?: string): PrcTable {
  if (prcCache && !path) return prcCache;
  const file = path ?? join(REPO_ROOT, "pipeline", "data", "prc_cards.json");
  const table = JSON.parse(readFileSync(file, "utf8")) as PrcTable;
  if (!path) prcCache = table;
  return table;
}

/** PRC symbols for an ISO birth date, or [] when the date is unusable. */
export function prcFor(birthDate: string | undefined): string[] {
  if (!birthDate) return [];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!m) return [];
  const entry = loadPrcTable()[`${Number(m[2])}-${Number(m[3])}`];
  return entry?.prc ?? [];
}

/**
 * All 53 harvested card meanings. Loaded here so a renderer only needs the
 * subject's own card symbol — the karma cards it pulls in are looked up for it.
 */
export function loadAllMeanings(path?: string): Record<string, MeaningLike> {
  if (meaningsCache && !path) return meaningsCache;
  const file = path ?? join(REPO_ROOT, "pipeline", "data", "card_meanings.json");
  const table = JSON.parse(readFileSync(file, "utf8")) as Record<string, MeaningLike>;
  if (!path) meaningsCache = table;
  return table;
}

/** Karma pairs for all 52 cards, generated from the hermes engine. */
export function loadKarmaTable(path?: string): KarmaTable {
  if (karmaCache && !path) return karmaCache;
  const file = path ?? join(REPO_ROOT, "pipeline", "data", "karma_cards.json");
  const table = JSON.parse(readFileSync(file, "utf8")) as KarmaTable;
  if (!path) karmaCache = table;
  return table;
}

/** The three fixed cards never move and have no karma pair. */
export function isFixedCard(symbol: string): boolean {
  return symbol === "8♣" || symbol === "J♥" || symbol === "K♠";
}

export function renderLifePathList(
  birthSymbol: string,
  meanings?: Map<string, MeaningLike> | Record<string, MeaningLike>,
  birthDate?: string,
): string {
  const path = lifePath(
    birthSymbol,
    meanings ?? loadAllMeanings(),
    loadKarmaTable(),
    prcFor(birthDate),
  );
  if (path.length <= 1) {
    return `<p data-slot="life-path-fixed">
      ${escapeHtml(birthSymbol)} is one of the three Fixed Cards. It never moves in the
      spreads, so it has no karma pair — the birth card is the whole fixed path.
    </p>`;
  }
  return `<ul data-slot="life-path">
        ${path
          .map(
            (card) =>
              `<li><strong>${escapeHtml(card.symbol)}</strong> — ${escapeHtml(card.role)}: ${escapeHtml(card.meaning.title)}</li>`,
          )
          .join("\n        ")}
      </ul>`;
}

export function renderCongruenceSection(input: {
  name: string;
  prose: string;
  birthSymbol: string;
  /** ISO birth date, used to look up the planetary ruling card. */
  birthDate?: string;
  meanings?: Map<string, MeaningLike> | Record<string, MeaningLike>;
  sourceUrl: string;
  sourceTitle: string;
  /** e.g. "a Senate seat", "the Court" — what the page must not be read as forecasting. */
  notAForecastOf: string;
}): string {
  const meanings = input.meanings ?? loadAllMeanings();
  const path: PathCard[] = lifePath(
    input.birthSymbol,
    meanings,
    loadKarmaTable(),
    prcFor(input.birthDate),
  );
  if (path.length === 0) return "";
  const match = findCongruence(input.prose, path);

  const lifePathBlock = `<div class="life-path">
      <h3>Cards in ${escapeHtml(input.name)}'s fixed path</h3>
      ${renderLifePathList(input.birthSymbol, meanings, input.birthDate)}
      <p class="note">Birth card from the month and day. Karma cards are fixed to the birth
        card. The planetary ruling card comes from the sun sign's ruling planet — the signs
        with two rulers carry two. All of these are fixed for life, unlike planetary period
        and long-range cards, which move year by year and are not shown on a static page.</p>
    </div>`;

  if (!match.recordLine || match.basis === "none") {
    return `<section data-slot="congruence" data-basis="none">
      <h2>Where the record meets the cards</h2>
      ${lifePathBlock}
      <p>
        No sentence in the sourced record shows a clear echo of the published language for
        ${escapeHtml(path.map((c) => c.symbol).join(", "))}. None is claimed here. The
        coordinate rests on the calendar date alone, and this page does not forecast
        ${escapeHtml(input.notAForecastOf)}.
      </p>
    </section>`;
  }

  const card = match.card;
  const basisLine =
    match.basis === "wording"
      ? `Paired on shared wording: ${escapeHtml(match.shared.join(", "))}.`
      : `Paired on ${escapeHtml(match.domain ?? "the suit domain")} — the domain ${escapeHtml(
          card?.symbol.slice(-1) ?? "",
        )} governs in this system. Markers in the record: ${escapeHtml(match.shared.join(", "))}.`;

  return `<section data-slot="congruence" data-basis="${escapeHtml(match.basis)}" data-card="${escapeHtml(card?.symbol ?? "")}">
      <h2>Where the record meets the ${escapeHtml(card?.meaning.label ?? "card")}</h2>
      <p class="note">
        A card is a calendar coordinate, not a cause. What follows sets one line of the
        card's own published language beside one sentence of the sourced record, paired by
        a documented rule. It is a resemblance offered for the reader to weigh — not a
        claim about ${escapeHtml(input.name)}, and not a forecast of ${escapeHtml(input.notAForecastOf)}.
      </p>
      ${lifePathBlock}
      <blockquote data-slot="card-line">
        <p>${escapeHtml(match.cardLine)}</p>
        <footer>${escapeHtml(card?.symbol ?? "")} — ${escapeHtml(card?.role ?? "")}${
          card && card.role !== "Birth Card"
            ? `, fixed to the ${escapeHtml(input.birthSymbol)}`
            : ""
        }, from the published ${escapeHtml(card?.meaning.label ?? "card")} meaning</footer>
      </blockquote>
      <blockquote data-slot="record-line">
        <p>${escapeHtml(match.recordLine)}</p>
        <footer>Wikipedia, <a href="${escapeHtml(input.sourceUrl)}">${escapeHtml(input.sourceTitle)}</a> (CC BY-SA 4.0)</footer>
      </blockquote>
      <p data-slot="congruence-basis">${basisLine}</p>
    </section>`;
}
