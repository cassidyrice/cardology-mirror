import {
  buildSystemPrompt,
  buildUserPrompt,
  parseCalendarMarkdown,
  type CalendarRow,
} from "./prompt";
import type { StructureDay } from "./structure";

export type GeminiGenerateResult = {
  text: string;
  rows: CalendarRow[];
  weekHeaders: string[];
};

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

function geminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || "").trim();
}

/**
 * Call Gemini (AI Studio) generateContent. Throws GeminiConfigError when the
 * key is missing so callers can return a clear JSON / UI warming-up state.
 */
export async function generateCalendarWithGemini(opts: {
  business: string;
  days: StructureDay[];
  model: string;
}): Promise<GeminiGenerateResult> {
  const key = geminiApiKey();
  if (!key) {
    throw new GeminiConfigError("GEMINI_API_KEY is not configured");
  }

  const system = buildSystemPrompt();
  const user = buildUserPrompt(opts.business, opts.days);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${system}\n\n${user}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    "";
  if (!text.trim()) {
    throw new Error("Gemini returned an empty calendar");
  }

  const parsed = parseCalendarMarkdown(text);
  return { text, rows: parsed.rows, weekHeaders: parsed.weekHeaders };
}
