import { NextRequest, NextResponse } from "next/server";

import { getReading } from "@/lib/engine";
import { birthCardSlug } from "@/lib/birth-card-calculator";
import { compatForCard } from "@/lib/compat-pairs";
import {
  EVEN_LINE_WIDTH,
  buildEvenReply,
  parseSpokenDates,
} from "@/lib/even-agent";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Custom-agent endpoint for Even Realities glasses ("Add Agent" in Even Hub).
 *
 * The glasses POST to this URL verbatim — no /chat/completions is appended —
 * with a Bearer token, an OpenAI-ish body, and device-side transcription:
 *
 *   { "model": "...", "messages": [{ "role": "user", "content": "..." }] }
 *
 * and render choices[0].message.content on a 576x136 monochrome display, so
 * replies are wrapped to EVEN_LINE_WIDTH and kept to a few lines.
 *
 * This runs the deterministic card engine only. There is no model call behind
 * it: the same birthday always returns the same answer, and nothing the wearer
 * says is forwarded anywhere else.
 */

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function completion(content: string) {
  return NextResponse.json({
    id: `cardblueprints-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "cardblueprints-engine",
    choices: [
      { index: 0, message: { role: "assistant", content }, finish_reason: "stop" },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
}

export async function POST(req: NextRequest) {
  const expected = process.env.EVEN_AGENT_TOKEN ?? "";
  // No token configured means the endpoint stays closed rather than open.
  if (!expected) return NextResponse.json({ error: "agent not configured" }, { status: 503 });

  const presented = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!timingSafeEqual(presented, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { messages?: { role?: string; content?: string }[] };
  try {
    body = await req.json();
  } catch {
    return completion("Could not read that. Try again.");
  }

  const spoken = [...(body.messages ?? [])]
    .reverse()
    .find((m) => m.role === "user" && typeof m.content === "string")?.content ?? "";

  const dates = parseSpokenDates(spoken, process.env.EVEN_DEFAULT_BIRTHDATE);
  const reply = await buildEvenReply(spoken, dates, {
    getReading,
    birthCardSlug,
    compatForCard,
  });
  return completion(reply);
}

export async function GET() {
  // Handy for a curl check from the glasses' network without leaking anything.
  return NextResponse.json({ ok: true, service: "even-agent", width: EVEN_LINE_WIDTH });
}
