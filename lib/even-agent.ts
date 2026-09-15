// Speech → card engine → 48-column text, for the Even Realities glasses agent.
//
// Kept out of the route so the parsing and formatting can be tested without a
// request. The glasses display is 576x136 monochrome: about 48 characters wide
// and a handful of lines, so every reply here is wrapped and short by design.
export const EVEN_LINE_WIDTH = 48;
export const EVEN_MAX_LINES = 6;

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9,
  sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Pull birthdates out of transcribed speech, in the order spoken. Handles
 * "june 14 1946", "14 june 1946", "6/14/1946" and "1946-06-14"; a bare
 * "my card" falls back to the configured default birthday.
 */
export function parseSpokenDates(text: string, fallback?: string): string[] {
  const found: string[] = [];
  const src = text.toLowerCase().replace(/(\d+)(st|nd|rd|th)\b/g, "$1");

  const push = (d: string | null) => {
    if (d && !found.includes(d)) found.push(d);
  };

  const patterns: [RegExp, (m: RegExpExecArray) => string | null][] = [
    [/(\d{4})-(\d{1,2})-(\d{1,2})/g, (m) => iso(+m[1], +m[2], +m[3])],
    [/([a-z]+)\s+(\d{1,2})(?:[,\s]+)(\d{4})/g, (m) =>
      MONTHS[m[1]] ? iso(+m[3], MONTHS[m[1]], +m[2]) : null],
    [/(\d{1,2})\s+([a-z]+)\s+(\d{4})/g, (m) =>
      MONTHS[m[2]] ? iso(+m[3], MONTHS[m[2]], +m[1]) : null],
    [/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/g, (m) => iso(+m[3], +m[1], +m[2])],
  ];

  for (const [re, build] of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) push(build(m));
  }

  // The configured birthday stands in for "my"/"I" questions only, so an
  // unrelated remark gets the help line instead of a confident wrong answer.
  const firstPerson = /\b(my|i|me|mine)\b|^\s*(card|period|timing|ruling)\b/.test(src);
  if (found.length === 0 && fallback && firstPerson) push(fallback);
  return found;
}

/** Hard-wrap to the display width without breaking words. */
export function wrap(text: string, width = EVEN_LINE_WIDTH): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (!line.length) line = word;
      else if (line.length + 1 + word.length <= width) line += ` ${word}`;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

export function fit(text: string, maxLines = EVEN_MAX_LINES): string {
  return wrap(text).slice(0, maxLines).join("\n");
}

type Deps = {
  getReading: (birthdate: string, targetDate?: string) => Promise<Record<string, any>>
  buildLifePathProfile: (iso: string, id: string) => any | null
  compareLifePathProfiles: (a: any, b: any) => { aSeesB: any; bSeesA: any; sharedCards: any[] }
}

const asks = (text: string, ...words: string[]) =>
  words.some((w) => text.toLowerCase().includes(w));

/** One spoken question → at most six 48-column lines. */
export async function buildEvenReply(spoken: string, dates: string[], deps: Deps): Promise<string> {
  if (dates.length === 0) {
    return fit("Say a birthday: \"my card, June 14 1946\". Or ask for today, my period, or match two dates.");
  }

  // Two dates spoken → compatibility. This runs the same 14-seat Life Path
  // comparison the website uses. The previous version matched a spelled label
  // ("Three of Diamonds") against a slug ("3-of-diamonds"), so it reported "no
  // connection" for most real pairs.
  if (dates.length >= 2 && asks(spoken, "match", "compat", "together", "and")) {
    const [a, b] = dates;
    const pa = deps.buildLifePathProfile(a, "A");
    const pb = deps.buildLifePathProfile(b, "B");
    if (!pa || !pb) return fit("December 31 is the Joker. It has no board to compare.");
    const { aSeesB, bSeesA, sharedCards } = deps.compareLifePathProfiles(pa, pb);
    // Neither spoken date is necessarily the wearer, so name the cards rather
    // than saying "you" and "them".
    const lines = [`${pa.birthCardLabel} + ${pb.birthCardLabel}.`]
    if (bSeesA) lines.push(`${pa.birthCardLabel} sits in their ${bSeesA.shortTitle} seat.`)
    if (aSeesB) lines.push(`${pb.birthCardLabel} sits in their ${aSeesB.shortTitle} seat.`)
    if (!aSeesB && !bSeesA) lines.push("Neither lands on the other's board.")
    if (sharedCards.length) lines.push(`${sharedCards.length} cards in common.`)
    return fit(lines.join("\n"))
  }

  let reading: Record<string, any>
  try {
    reading = await deps.getReading(dates[0])
  } catch {
    // The only date the engine refuses is December 31 (the Joker).
    return fit("December 31 is the Joker. No card reading for that date.")
  };
  const card = reading.archetype.birth_card as string;
  const prc = reading.archetype.prc as string;
  const domain = String(reading.archetype.suit_domain ?? "").toLowerCase();

  if (asks(spoken, "period", "timing", "right now", "today", "chapter")) {
    const period = reading.active_period ?? {};
    return fit(
      `${card}. ${period.planet ?? "—"} period` +
        (period.domain ? `: ${String(period.domain).toLowerCase()}.` : ".") +
        (period.bc_card ? `\nCard: ${period.bc_card}.` : "") +
        (reading.timing?.age != null ? `\nYear ${reading.timing.age}.` : ""),
    );
  }

  if (asks(spoken, "ruling", "planetary")) {
    return fit(`${card}. Ruling card ${prc}.`);
  }

  // Default: the card itself.
  return fit(`${card}${domain ? ` — ${domain}` : ""}.\nRuling ${prc}.`);
}
