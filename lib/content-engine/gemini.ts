import {
  buildSystemPrompt,
  buildUserPrompt,
  parseCalendarMarkdown,
  type CalendarRow,
} from "./prompt";
import {
  buildWriteSystemPrompt,
  buildWriteUserPrompt,
  type PieceKind,
} from "./write-prompt";
import type { StructureDay } from "./structure";
import { vertexAccessToken, vertexConfigured, vertexGenerateUrl } from "./vertex-auth";

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
 * Call Gemini generateContent. Production uses Vertex AI (service-account token from
 * lib/content-engine/vertex-auth.ts); an AI Studio key is the dev fallback. Throws
 * GeminiConfigError when neither is configured so callers can show a warming-up state.
 */
export async function generateCalendarWithGemini(opts: {
  business: string;
  days: StructureDay[];
  model: string;
}): Promise<GeminiGenerateResult> {
  const useVertex = vertexConfigured();
  const key = geminiApiKey();
  if (!useVertex && !key) {
    throw new GeminiConfigError("Vertex (VERTEX_SA_JSON + VERTEX_PROJECT) or GEMINI_API_KEY is not configured");
  }

  const system = buildSystemPrompt();
  const user = buildUserPrompt(opts.business, opts.days);
  const url = useVertex
    ? vertexGenerateUrl(opts.model)
    : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(key)}`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (useVertex) headers.authorization = `Bearer ${await vertexAccessToken()}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
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

async function callGeminiText(opts: {
  system: string;
  user: string;
  model: string;
  maxOutputTokens: number;
}): Promise<string> {
  const useVertex = vertexConfigured();
  const key = geminiApiKey();
  if (!useVertex && !key) {
    throw new GeminiConfigError("Vertex (VERTEX_SA_JSON + VERTEX_PROJECT) or GEMINI_API_KEY is not configured");
  }

  const url = useVertex
    ? vertexGenerateUrl(opts.model)
    : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(key)}`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (useVertex) headers.authorization = `Bearer ${await vertexAccessToken()}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${opts.system}\n\n${opts.user}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: opts.maxOutputTokens,
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
    throw new Error("Gemini returned empty text");
  }
  return text.trim();
}

export async function generatePieceWithGemini(opts: {
  business: string;
  weekHeader: string;
  day: CalendarRow;
  kind: PieceKind;
  model?: string;
}): Promise<string> {
  const system = buildWriteSystemPrompt();
  const user = buildWriteUserPrompt({
    business: opts.business,
    weekHeader: opts.weekHeader,
    day: opts.day,
    kind: opts.kind,
  });
  return callGeminiText({
    system,
    user,
    model: opts.model ?? "gemini-2.5-pro",
    maxOutputTokens: 8192,
  });
}
