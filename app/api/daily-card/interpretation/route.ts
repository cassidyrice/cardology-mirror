import { NextRequest, NextResponse } from "next/server";
import { chatStream, getLLMConfig, type ChatMessage } from "@/lib/llm";
import { READING_INTERPRETATION_GUIDE } from "@/lib/interpretation-guidance";
import { runCardologyCliJson } from "@/lib/server/cardology-cli";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the daily-card interpretation engine for cardologypro.com.

Use the attached reading methodology reference as your style and reasoning guide. Use the Cardology CLI output as the source of truth for card identities, period, under/sweet-spot/over language, and person anchors.

Rules:
- Write a daily reading, not a full yearly reading.
- This is a mirror, not a forecast. Do not claim fixed events will happen.
- Draw from the guide, but never contradict the CLI data.
- Keep it warm, direct, practical, second-person.
- Use markdown.
- Use these exact headings:
  ## Today's Card
  ## The Pattern to Notice
  ## Where It Can Slip
  ## How to Work With It
  ## Reflection
- Use **bold** for card codes and key daily phrases, and *italics* for reflective questions.
- Include the ruling-card support as a modifier, not as a second separate reading.`;

function buildDailyContext(daily: unknown): string {
  return JSON.stringify(daily, null, 2);
}

export async function POST(req: NextRequest) {
  let body: { birthdate?: string; date?: string; focus?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const birthdate = body.birthdate?.trim();
  const date = body.date?.trim();
  const focus = body.focus?.trim();

  if (!birthdate) {
    return NextResponse.json({ error: "missing birthdate" }, { status: 400 });
  }

  const { key } = getLLMConfig();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "The daily interpretation engine isn't connected right now (missing OPENAI_API_KEY). The daily card API still works.",
      },
      { status: 503 },
    );
  }

  const args = ["daily-card", "--birthdate", birthdate, "--json"];
  if (date) args.push("--target-date", date);

  let daily: unknown;
  try {
    daily = await runCardologyCliJson(args);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "daily card CLI failed";
    const status = msg.startsWith("invalid") || msg.includes("birthdate") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const focusLine = focus
    ? `\n\nReader focus for today: "${focus}". Use it only where the card data genuinely supports it.`
    : "";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `=== READING METHODOLOGY MARKDOWN ===\n${READING_INTERPRETATION_GUIDE}\n=== END METHODOLOGY ===\n\n` +
        `=== CARDLOGY CLI DAILY-CARD JSON ===\n${buildDailyContext(daily)}\n=== END CLI JSON ===${focusLine}\n\nWrite the daily-card interpretation now.`,
    },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of chatStream(messages, {
          temperature: 0.75,
          max_tokens: 1100,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "stream error";
        controller.enqueue(encoder.encode(`\n\n[The daily reading was interrupted: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
