import type { StructureDay } from "./structure";
import variables from "./variables.json";

/** Fixed header so the model cannot echo the long instruction columns. */
export const FIXED_TABLE_HEADER = "| DAY | THEME | WHY | POST | FORMAT |";
export const FIXED_TABLE_SEPARATOR = "| :-- | :--- | :--- | :--- | :--- |";

export type CalendarRow = {
  day: number;
  theme: string;
  why: string;
  post: string;
  format: string;
};

export type ParsedCalendar = {
  weekHeaders: string[];
  rows: CalendarRow[];
};

const SYSTEM_PROMPT = `You turn a fixed daily structure into a content calendar for one business. Input: days. Each day has a hidden pattern (a playing card: rank = the pattern, suit domain = the material, plus a sweet-spot line and two failure lines) and a weekly mode (one planet word with three verbs). Use the pattern to pick the day's angle, but write ONLY in the business's own language.

For each day output exactly five columns. Use this header on every table, verbatim — do not rewrite or expand the header:
${FIXED_TABLE_HEADER}
${FIXED_TABLE_SEPARATOR}

Columns: DAY (integer), THEME (3–6 words), WHY (one plain sentence about the week's mode and the day's angle, written for the business owner; never mention cards, ranks, suits, planets, or patterns), POST (one specific piece they could make that day, with a concrete hook or example), FORMAT (short video / long video / carousel / thread / newsletter / live / photo).

Rules: every day distinct; the week's three verbs shape that week's seven days; specific to the business, not generic marketing advice; short sentences; never state a fact about the business that is not in the business text — phrase specifics as "for example" ideas; no words: fate, universe, energy, destiny, manifest, predicts, journey.
Output: one markdown table per week with a one-line week header in the business's terms (never the planet name). Do not add a card key table.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(business: string, days: StructureDay[]): string {
  const planetBlock = Object.entries(variables.planets)
    .map(([name, { verbs }]) => `${name}: ${verbs.join(", ")}`)
    .join("; ");

  const payload = days.map((d) => ({
    day: d.day,
    date: d.date,
    week: d.week,
    weekMode: d.weekMode,
    pattern: d.pattern,
    material: d.material,
    card: d.cardLabel,
    sweetSpot: d.sweetSpot,
    under: d.under,
    over: d.over,
  }));

  return `Business: ${business.trim()}

Planet modes (hidden from the reader; three verbs each): ${planetBlock}

Days:
${JSON.stringify(payload)}`;
}

/** Split a markdown table row into cells, respecting quoted pipes lightly. */
function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function looksLikeHeader(cells: string[]): boolean {
  if (cells.length < 5) return false;
  const norm = cells.map((c) => c.toUpperCase().replace(/\(.*$/, "").trim());
  return (
    norm[0] === "DAY" &&
    norm[1].startsWith("THEME") &&
    norm[2].startsWith("WHY") &&
    norm[3].startsWith("POST") &&
    norm[4].startsWith("FORMAT")
  );
}

/**
 * Parse model markdown tables into JSON rows.
 * Accepts both the fixed short header and the long instruction-style headers
 * from Fable's reference outputs.
 */
export function parseCalendarMarkdown(text: string): ParsedCalendar {
  const lines = text.split(/\r?\n/);
  const rows: CalendarRow[] = [];
  const weekHeaders: string[] = [];
  let expectingData = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    if (line.includes("|")) {
      const cells = splitRow(line);
      if (looksLikeHeader(cells)) {
        expectingData = true;
        continue;
      }
      if (isSeparator(cells)) {
        expectingData = true;
        continue;
      }
      if (expectingData && cells.length >= 5) {
        const dayNum = Number(cells[0]);
        if (Number.isFinite(dayNum) && dayNum > 0) {
          rows.push({
            day: dayNum,
            theme: cells[1] ?? "",
            why: cells[2] ?? "",
            post: cells[3] ?? "",
            format: cells[4] ?? "",
          });
          continue;
        }
      }
    }

    // Week header lines (### Week 1: …) — keep for the UI.
    const weekMatch = /^(?:#{1,3}\s*)?(Week\s+\d+[:.].+)$/i.exec(line);
    if (weekMatch) {
      weekHeaders.push(weekMatch[1]!.trim());
      expectingData = false;
    }
  }

  rows.sort((a, b) => a.day - b.day);
  return { weekHeaders, rows };
}

export function assertFixedHeaderInPrompt(prompt: string): boolean {
  return prompt.includes(FIXED_TABLE_HEADER);
}
