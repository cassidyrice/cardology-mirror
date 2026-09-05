import type { CalendarRow } from "./prompt";

export const PIECE_KINDS = [
  "article",
  "short-video",
  "thread",
  "carousel",
  "newsletter",
] as const;

export type PieceKind = (typeof PIECE_KINDS)[number];

const FORMAT_SPECS: Record<PieceKind, string> = {
  article: "900–1,200 words with H2 headings",
  "short-video": "45–60 second script with hook, beats, and CTA",
  thread: "6–9 posts for a social thread",
  carousel: "6–8 slides with headline and body per slide",
  newsletter: "150–250 words",
};

const BANNED_WORDS =
  "fate, universe, energy, destiny, manifest, predicts, journey, vibration, sacred";

const WRITE_SYSTEM_PROMPT = `You write one piece of content for a business, in the business's own voice — not a marketer's voice, not a fortune teller.

Rules:
- Write only the finished piece. No preamble, no "here is your…", no meta commentary.
- Match the business description. Use their products, places, and habits.
- Short sentences. Plain words. No mystic language.
- Banned words: ${BANNED_WORDS}.
- Never mention cards, cardology, planets, patterns, or ranks.`;

export function pieceKindLabel(kind: PieceKind): string {
  switch (kind) {
    case "article":
      return "Article";
    case "short-video":
      return "Short-video script";
    case "thread":
      return "Thread";
    case "carousel":
      return "Carousel copy";
    case "newsletter":
      return "Newsletter";
  }
}

export function formatSpecForKind(kind: PieceKind): string {
  return FORMAT_SPECS[kind];
}

export function buildWriteSystemPrompt(): string {
  return WRITE_SYSTEM_PROMPT;
}

export function buildWriteUserPrompt(opts: {
  business: string;
  weekHeader: string;
  day: CalendarRow;
  kind: PieceKind;
}): string {
  const spec = formatSpecForKind(opts.kind);
  return `Business: ${opts.business.trim()}

Week context: ${opts.weekHeader.trim() || "This week"}

Day ${opts.day.day}:
- Theme: ${opts.day.theme}
- Why today: ${opts.day.why}
- Post idea: ${opts.day.post}
- Suggested format: ${opts.day.format}

Write a ${pieceKindLabel(opts.kind).toLowerCase()} (${spec}) for this day.`;
}

export function isPieceKind(value: unknown): value is PieceKind {
  return typeof value === "string" && (PIECE_KINDS as readonly string[]).includes(value);
}
