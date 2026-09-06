/**
 * Congruence: one honest link between a page's subject and their birth card.
 *
 * Every hub page states a coordinate (month + day -> card) and then quotes the
 * card's meaning as generic system copy. Nothing connects the two, so the card
 * reads as decoration. This module finds the single strongest overlap between
 * the card's *published* language and the *sourced* record, and hands the
 * renderer both quotes plus the shared vocabulary.
 *
 * What this deliberately does NOT do:
 *   - assert the card caused anything, or predict anything;
 *   - write new biographical prose (both quotes are verbatim from their source);
 *   - claim a match when there isn't one (it reports that honestly instead).
 *
 * The card text comes from pipeline/data/card_meanings.json, harvested from the
 * live /birth-card/{slug} pages. The record sentence comes from the Wikipedia
 * lead section already cited on the page.
 */

/** Minimal shape shared by every hub's CardMeaning type. */
export type MeaningLike = {
  label: string;
  title: string;
  core_identity?: string;
  sweet_spot?: string;
  /** Full harvested meaning page copy, present in card_meanings.json. */
  meaning?: string;
};

export type Congruence = {
  /** Verbatim line of the card's published language. */
  cardLine: string;
  /** Which section of the card page `cardLine` came from. */
  cardSource: "gift" | "balanced" | "core";
  /** Verbatim sentence from the subject's sourced record, or null if no echo. */
  recordLine: string | null;
  /** Content words present in both, lowercased and de-duplicated. */
  shared: string[];
  /** How the pairing was found: shared wording, or shared suit domain. */
  basis: "wording" | "domain" | "none";
  /** Suit domain name when `basis` is "domain" (e.g. "mind and communication"). */
  domain?: string;
};

/**
 * Suit domains in the Camp-lineage system this site uses. These are the
 * system's own suit meanings, not a description invented here: hearts govern
 * relationship and feeling, clubs the mind and communication, diamonds value
 * and commerce, spades work, health and mastery.
 *
 * The marker lists are the editorial bridge — concrete words that appear in
 * biographies and belong to each domain. They are listed in the source so the
 * rule that picked a sentence is auditable, and the rendered page says plainly
 * that this is a domain overlap, not a causal claim.
 *
 * Deliberately excluded: generic political-service vocabulary (served, office,
 * elected, senator, governor) which appears in nearly every biography in these
 * hubs and would match everything.
 */
export const SUIT_DOMAINS: Record<string, { name: string; markers: readonly string[] }> = {
  "♥": {
    name: "relationship and feeling",
    markers: [
      "family", "families", "mother", "father", "marriage", "married", "children",
      "community", "relationship", "care", "caregiver", "charity", "humanitarian",
      "advocacy", "advocate", "nonprofit", "pastor", "minister", "congregation",
      "volunteer", "philanthropy", "philanthropist", "counseling", "hospice", "adoption",
    ],
  },
  "♣": {
    name: "the mind and communication",
    markers: [
      "lawyer", "attorney", "professor", "teacher", "taught", "teaching", "education",
      "educator", "journalist", "author", "writer", "wrote", "editor", "researcher",
      "research", "scientist", "scholar", "doctorate", "academic", "broadcaster",
      "broadcasting", "commentator", "coach", "coaching", "published", "publication",
      "analyst", "linguist", "historian", "philosophy", "physics", "chemistry",
      "mathematics", "literature", "curriculum", "lecturer", "debate",
    ],
  },
  "♦": {
    name: "value and commerce",
    markers: [
      "business", "businessman", "businesswoman", "entrepreneur", "investor",
      "investment", "banker", "banking", "finance", "financial", "hedge", "fund",
      "executive", "founder", "founded", "company", "corporation", "trade", "commerce",
      "economics", "economist", "treasury", "revenue", "retail", "merchant", "wealth",
      "billionaire", "millionaire", "capital", "venture", "insurance", "estate",
    ],
  },
  "♠": {
    name: "work, health and mastery",
    markers: [
      "army", "navy", "marine", "military", "veteran", "soldier", "colonel", "captain",
      "physician", "surgeon", "medical", "medicine", "health", "nurse", "labor",
      "union", "farmer", "farming", "rancher", "engineer", "engineering",
      "construction", "sheriff", "police", "prosecutor", "athlete", "athletic",
      "olympic", "championship", "discipline", "apprentice", "craft", "pilot",
    ],
  },
};

export function suitOf(cardLabelOrSymbol: string): string | null {
  for (const suit of ["♥", "♣", "♦", "♠"]) {
    if (cardLabelOrSymbol.includes(suit)) return suit;
  }
  const lower = cardLabelOrSymbol.toLowerCase();
  if (lower.includes("heart")) return "♥";
  if (lower.includes("club")) return "♣";
  if (lower.includes("diamond")) return "♦";
  if (lower.includes("spade")) return "♠";
  return null;
}

const STOPWORDS = new Set([
  "about", "after", "again", "against", "along", "also", "among", "another", "around",
  "because", "been", "before", "being", "between", "both", "came", "come", "could",
  "during", "each", "even", "ever", "every", "from", "have", "having", "here", "into",
  "just", "like", "made", "make", "many", "more", "most", "much", "must", "never",
  "only", "other", "over", "own", "same", "should", "since", "some", "such", "than",
  "that", "their", "them", "then", "there", "these", "they", "thing", "this", "those",
  "through", "under", "until", "very", "was", "were", "what", "when", "where", "which",
  "while", "who", "whom", "will", "with", "would", "your", "yours", "you", "our", "and",
  "the", "for", "not", "but", "his", "her", "she", "him", "its", "it's", "are", "has",
  "had", "him", "himself", "herself", "itself", "themselves", "one", "two", "first",
  "second", "third", "born", "american", "united", "states", "state", "senator",
  "representative", "politician", "member", "party", "republican", "democratic",
  "democrat", "served", "serving", "seat", "held", "since", "elected", "office",
  "national", "county", "city", "university", "college", "school", "district",
]);

/** Crude suffix stripper so "leading" and "leads" both reduce to "lead". */
function stem(word: string): string {
  let w = word;
  for (const suffix of ["ingly", "edly", "ing", "ers", "er", "ed", "es", "s"]) {
    if (w.length > suffix.length + 3 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  return w;
}

function contentWords(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of text.toLowerCase().split(/[^a-z']+/)) {
    const word = raw.replace(/^'+|'+$/g, "");
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    const key = stem(word);
    if (!out.has(key)) out.set(key, word);
  }
  return out;
}

/** Split the harvested meaning page into its labelled sections. */
export function meaningSections(meaning: MeaningLike): Record<string, string> {
  const text = meaning.meaning ?? "";
  const sections: Record<string, string> = {};
  for (const block of text.split(/\n{2,}/)) {
    const match = /^([A-Z][A-Za-z ]{2,20}):\s*([\s\S]+)$/.exec(block.trim());
    if (match) sections[match[1].toLowerCase()] = match[2].trim();
  }
  return sections;
}

/**
 * Candidate card lines, best first: individual Gifts, then the Balanced line,
 * then core identity. Gifts are the most concrete and the most varied, so they
 * give the strongest and least repetitive match.
 */
export function cardLines(meaning: MeaningLike): { text: string; kind: Congruence["cardSource"] }[] {
  const sections = meaningSections(meaning);
  const lines: { text: string; kind: Congruence["cardSource"] }[] = [];
  const gifts = sections.gifts ?? "";
  for (const gift of gifts.split(";")) {
    const trimmed = gift.trim().replace(/\s+/g, " ");
    if (trimmed.length > 12) lines.push({ text: trimmed, kind: "gift" });
  }
  const balanced = (sections.balanced ?? meaning.sweet_spot ?? "").trim();
  if (balanced) lines.push({ text: balanced, kind: "balanced" });
  const core = (meaning.core_identity ?? "").trim();
  if (core) lines.push({ text: core, kind: "core" });
  return lines;
}

/**
 * Abbreviations that end in a period but do not end a sentence. Without these,
 * "Dobbs v. Jackson" and "the U.S. Senate" split mid-citation and produce
 * fragments that then match domain markers out of context.
 */
const ABBREVIATIONS = [
  "v", "vs", "no", "art", "sec", "ch", "pp", "ed", "eds", "cf", "al", "etc",
  "mr", "mrs", "ms", "dr", "prof", "gen", "sen", "rep", "gov", "st", "mt",
  "jr", "sr", "inc", "co", "corp", "ltd", "u.s", "u.k", "d.c", "ph.d", "m.d",
  "j.d", "b.a", "m.a", "approx", "est", "fl", "b", "d", "c", "ca",
];

function splitSentences(prose: string): string[] {
  const guarded = prose.replace(
    new RegExp(`\\b(${ABBREVIATIONS.join("|")})\\.`, "gi"),
    (m) => m.replace(".", ""),
  );
  return guarded
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
    .map((s) => s.replace(//g, ".").trim().replace(/\s+/g, " "))
    .filter((s) => s.split(" ").length >= 8 && /^[A-Z0-9“"]/.test(s));
}

/**
 * How far into the lead a domain match may look. Biographies state who someone
 * is and what they do in the opening sentences; later sentences drift into
 * case names, election results and other material where a domain marker is
 * usually incidental rather than descriptive of the person.
 */
const DOMAIN_WINDOW = 4;

/** One card in a person's fixed life path, with the role it plays. */
export type PathCard = {
  /** Card symbol, e.g. "8♣". */
  symbol: string;
  /** How this card sits in the person's path. */
  role:
    | "Birth Card"
    | "Karma — Environment"
    | "Karma — Displacement"
    | "Planetary Ruling Card"
    | "Planetary Ruling Card (second ruler)"
    | "PRC Karma — Environment"
    | "PRC Karma — Displacement";
  meaning: MeaningLike;
};

/**
 * Roles searched only after the birth card and its karma find nothing. The PRC
 * is a real part of the fixed path — the reference doc calls a reading without
 * it incomplete — but the birth card stays the primary identity, so it is tried
 * first and the PRC layer only widens the pool when it comes up empty.
 */
const SECOND_TIER: ReadonlySet<PathCard["role"]> = new Set([
  "Planetary Ruling Card",
  "Planetary Ruling Card (second ruler)",
  "PRC Karma — Environment",
  "PRC Karma — Displacement",
]);

/**
 * Best pairing between any card in the person's life path and their record.
 *
 * Two passes, best first:
 *   1. "wording" — the card line and a record sentence share two or more
 *      content words. Rare, but unambiguous when it happens.
 *   2. "domain"  — the record sentence carries markers for that card's suit
 *      domain. The bridge is the marker list in SUIT_DOMAINS, not a guess.
 *
 * If neither pass clears its bar, `recordLine` is null and `basis` is "none";
 * the renderer then says there is no clear echo rather than inventing one.
 *
 * Passing the karma cards alongside the birth card widens the pool from one
 * card's language to three, which is what makes a real match likely.
 */
export function findCongruence(
  prose: string,
  path: readonly PathCard[],
): Congruence & { card?: PathCard } {
  // Two attempts: the birth card and its karma first, then the whole fixed path
  // including the planetary ruling layer. This keeps every existing match
  // identical and only reaches further for the pages that found nothing.
  const primary = path.filter((c) => !SECOND_TIER.has(c.role));
  if (primary.length && primary.length < path.length) {
    const first = matchAgainst(prose, primary);
    if (first.basis !== "none") return first;
  }
  return matchAgainst(prose, path);
}

function matchAgainst(
  prose: string,
  path: readonly PathCard[],
): Congruence & { card?: PathCard } {
  const sentences = splitSentences(prose);
  const firstCard = path[0];
  const firstLines = firstCard ? cardLines(firstCard.meaning) : [];
  const fallback: Congruence & { card?: PathCard } = {
    cardLine: firstLines[0]?.text ?? firstCard?.meaning.title ?? "",
    cardSource: firstLines[0]?.kind ?? "core",
    recordLine: null,
    shared: [],
    basis: "none",
    card: firstCard,
  };
  if (path.length === 0 || sentences.length === 0) return fallback;

  const sentenceWords = sentences.map((s) => contentWords(s));
  const sentenceLower = sentences.map((s) => ` ${s.toLowerCase().replace(/[^a-z ]+/g, " ")} `);

  let best: (Congruence & { card?: PathCard }) | null = null;
  let bestScore = 0;

  // Pass 1 — shared wording.
  for (const pathCard of path) {
    for (const line of cardLines(pathCard.meaning)) {
      const lineWords = contentWords(line.text);
      for (let i = 0; i < sentences.length; i++) {
        const shared: string[] = [];
        for (const [key, word] of lineWords) {
          if (sentenceWords[i].has(key)) shared.push(sentenceWords[i].get(key) ?? word);
        }
        const score = shared.length * 100 + (line.kind === "gift" ? 2 : 0) - i * 0.01;
        if (shared.length >= 2 && score > bestScore) {
          bestScore = score;
          best = {
            cardLine: line.text,
            cardSource: line.kind,
            recordLine: sentences[i],
            shared: [...new Set(shared)].sort(),
            basis: "wording",
            card: pathCard,
          };
        }
      }
    }
  }
  if (best) return best;

  // Pass 2 — shared suit domain.
  for (const pathCard of path) {
    const suit = suitOf(pathCard.symbol) ?? suitOf(pathCard.meaning.label);
    const domain = suit ? SUIT_DOMAINS[suit] : undefined;
    if (!domain) continue;
    const lines = cardLines(pathCard.meaning);
    for (let i = 0; i < Math.min(sentences.length, DOMAIN_WINDOW); i++) {
      const hits = domain.markers.filter((m) => sentenceLower[i].includes(` ${m} `));
      // Birth card first, then karma; earlier sentences slightly preferred.
      const roleBonus = pathCard.role === "Birth Card" ? 3 : 0;
      const score = hits.length * 10 + roleBonus - i * 0.01;
      if (hits.length >= 1 && score > bestScore) {
        bestScore = score;
        best = {
          cardLine: lines[0]?.text ?? pathCard.meaning.title,
          cardSource: lines[0]?.kind ?? "core",
          recordLine: sentences[i],
          shared: [...new Set(hits)].sort(),
          basis: "domain",
          domain: domain.name,
          card: pathCard,
        };
      }
    }
  }
  return best ?? fallback;
}

export type KarmaTable = Record<
  string,
  { environment: string | null; displacement: string | null; fixed: boolean }
>;

/**
 * The person's fixed cards, in reading order.
 *
 * Tier 1 — birth card, then its two karma cards.
 * Tier 2 — the planetary ruling card (both, for the dual-ruler signs) and the
 *          karma cards of the primary ruler.
 *
 * Everything here is fixed for life. Planetary period and long-range cards move
 * year by year and are deliberately absent: a static page cannot state them
 * correctly, and `docs/reading-voice.md` is explicit that a period card is not
 * the same thing as the card whose spread it came from.
 *
 * `prc` is optional so callers without the table keep the old tier-1 behaviour.
 */
export function lifePath(
  birthSymbol: string,
  meanings: Map<string, MeaningLike> | Record<string, MeaningLike>,
  karma: KarmaTable,
  prc?: readonly string[],
): PathCard[] {
  const get = (symbol: string): MeaningLike | undefined =>
    meanings instanceof Map ? meanings.get(symbol) : meanings[symbol];
  const out: PathCard[] = [];
  const seen = new Set<string>();

  const push = (symbol: string | null | undefined, role: PathCard["role"]): void => {
    if (!symbol || seen.has(symbol)) return;
    const meaning = get(symbol);
    if (!meaning) return;
    seen.add(symbol);
    out.push({ symbol, role, meaning });
  };

  const addKarma = (
    symbol: string,
    envRole: PathCard["role"],
    dispRole: PathCard["role"],
  ): void => {
    const pair = karma[symbol];
    // The three Fixed Cards (8♣, J♥, K♠) never move and have no karma pair.
    if (!pair || pair.fixed) return;
    push(pair.environment, envRole);
    push(pair.displacement, dispRole);
  };

  push(birthSymbol, "Birth Card");
  addKarma(birthSymbol, "Karma — Environment", "Karma — Displacement");

  if (prc && prc.length) {
    // A Leo's ruling card is their birth card; `push` de-duplicates it away.
    push(prc[0], "Planetary Ruling Card");
    if (prc.length > 1) push(prc[1], "Planetary Ruling Card (second ruler)");
    if (prc[0] && prc[0] !== birthSymbol) {
      addKarma(prc[0], "PRC Karma — Environment", "PRC Karma — Displacement");
    }
  }
  return out;
}
