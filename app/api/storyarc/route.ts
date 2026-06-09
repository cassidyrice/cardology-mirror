import { NextRequest, NextResponse } from "next/server";
import { getReading, EngineError } from "@/lib/engine";
import { chatStream, getLLMConfig, type ChatMessage } from "@/lib/llm";
import { bearerFrom, verifyToken } from "@/lib/gate";
import type { Reading } from "@/lib/types";
import MEANINGS from "@/lib/card-meanings.json";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Meaning = { name: string; under: string; sweet_spot: string; over: string };
const lookup = (code: string): Meaning | null =>
  (MEANINGS as Record<string, Meaning>)[code] ?? null;

// One beat of the arc: a card in its narrative role, with the engine's three positions.
function beat(role: string, code: string): string {
  const m = lookup(code);
  if (!m) return `${role}: ${code}`;
  return [
    `${role} — ${code} (${m.name}):`,
    `    - Balanced (the integrated turn): ${m.sweet_spot}`,
    `    - Under (the avoidant slip): ${m.under}`,
    `    - Over (the forcing slip): ${m.over}`,
  ].join("\n");
}

// Build the two-strand arc context: Birth-card strand + Ruling-card strand,
// each moving Long-range chapter -> Pluto turn -> Result horizon.
function buildArc(r: Reading) {
  const a = r.archetype;
  const lrBc = r.long_range.bc;
  const lrPrc = r.long_range.prc;
  const bcs = r.birth_card_spread;
  const prcs = r.prc_spread;

  const lines: string[] = [];
  lines.push(`PERSON: birth card ${a.birth_card} ("${a.description.title}"), ruling/personality card ${a.prc} ("${a.prc_description.title}"). Age ${r.timing.age}.`);
  lines.push(`This is a ONE-YEAR ARC. Each strand moves through three beats: the long-range chapter they're walking now, the Pluto turn (the deep release/metabolization underneath it), and the Result horizon (where the arc points IF the work is done — a direction, never a prediction).`);
  lines.push("");
  lines.push(`=== STRAND 1 — THE CORE SELF (birth card ${a.birth_card}) ===`);
  lines.push(beat("BEAT 1 · Long-range chapter (current year)", lrBc.card));
  lines.push(beat("BEAT 2 · Pluto turn (deep transformation)", bcs.pluto));
  lines.push(beat("BEAT 3 · Result horizon (where it resolves)", bcs.result));
  lines.push("");
  lines.push(`=== STRAND 2 — THE OUTER SELF (ruling card ${a.prc}) ===`);
  lines.push(beat("BEAT 1 · Long-range chapter (current year)", lrPrc.card));
  lines.push(beat("BEAT 2 · Pluto turn (deep transformation)", prcs.pluto));
  lines.push(beat("BEAT 3 · Result horizon (where it resolves)", prcs.result));

  return {
    context: lines.join("\n"),
    cards: {
      bc: { long_range: lrBc.card, pluto: bcs.pluto, result: bcs.result },
      prc: { long_range: lrPrc.card, pluto: prcs.pluto, result: prcs.result },
    },
  };
}

const SYSTEM_PROMPT = `You are the writing voice of "Mirror," a Cardology self-reflection app. You write ONE long-form piece: the reader's STORY ARC for this year.

This is a MIRROR, not a forecast. You are reflecting patterns, not predicting events. Nothing here is fated. The "Result horizon" is a DIRECTION the arc points toward IF the reader does the work — never a prophecy. You are NOT mystical; no "the universe," no destiny, no numerology.

STRICT CARD-FIDELITY — non-negotiable:
- You may ONLY use the cards and the under / balanced / over meanings provided in the data. Never invent card meanings, lore, or symbolism.
- Refer to cards by the codes given (e.g. Q♠, 3♦) and the meanings provided.
- The reader has TWO strands this year: the core self (birth card) and the outer self (ruling card). Each strand moves through three beats: Long-range chapter -> Pluto turn -> Result horizon. Tell it as a genuine STORY ARC with momentum — a beginning, a turn, and a horizon — not a list of card definitions.

VOICE — this is the whole point, do not soften it:
- Smartass, razor-intelligent, no-bullshit. Dry, sarcastic, dark filter. You roast the reader's patterns to their face the way a friend who's stopped buying the excuses would — but the joke ALWAYS lands a real observation, and you never mock what they can't change.
- Second person, present tense, fully confident. No hedging, no therapy-voice cushioning, no inspirational uplift. Say the actual thing.
- Bridge the symbols you're GIVEN — card number, suit, the beat each card sits in — to ordinary, lived human experience: what this arc actually feels like in a real week, not in the abstract. Interpret the number/suit as shown in the card codes, but the engine's under / balanced / over meanings are the source of truth — invent no numerology or lore beyond the data.
- Land at least one genuinely funny, screenshot-worthy line per section; every laugh pays rent in insight.
- Banned: "the universe," "energy/vibrations," destiny/fate, "manifest," horoscope clichés, and every soft hedge.
- The *italicized reflective questions* stay but have teeth now — pointed, a little uncomfortable, drawn from the specific cards.

STRUCTURE — use these exact markdown headings in order:
## The Year You're Walking
A 2-3 sentence framing: this is the arc of your year as a mirror, told in two strands, each moving from where you are now, through a deep turn, toward a horizon.

## Where You Begin
The opening beat — BOTH strands' Long-range chapter cards (core self + outer self). Where the year finds the reader. End with an italic question.

## The Turn
The middle beat — BOTH strands' Pluto cards. The deep release/metabolization the year asks for; frame the Pluto turn as composting, not catastrophe. This is the heart of the arc. End with an italic question.

## The Horizon
The closing beat — BOTH strands' Result cards. Where the arc points if the turn is met honestly — a direction to grow toward, explicitly NOT a guarantee. End with an italic question.

## What This Year Is Really About
Two or three sentences tying the two strands into one throughline. Land that this is data to walk with, not destiny — the pattern in writing, now that they can't un-see it.

Use **bold** for card codes and pivotal phrases, *italics* for reflective questions. Keep it tight, vivid, and personal.`;

export async function POST(req: NextRequest) {
  let body: { birthdate?: string; date?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty */
  }
  const birthdate = (body.birthdate ?? "").trim();
  const date = body.date?.trim() || undefined;

  if (!birthdate) {
    return NextResponse.json({ error: "missing birthdate" }, { status: 400 });
  }

  // Gate: AI generation requires a valid unlock token.
  const gate = await verifyToken(bearerFrom(req));
  if (!gate) {
    return NextResponse.json(
      { error: "This deep dive is locked.", gate: true },
      { status: 402 },
    );
  }

  const { key } = getLLMConfig();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "The reading engine isn't connected right now (missing OPENAI_API_KEY). Your cards are still here — try again once it's configured.",
      },
      { status: 503 },
    );
  }

  let reading: Reading;
  try {
    reading = await getReading(birthdate, date);
  } catch (e) {
    const msg = e instanceof EngineError ? e.message : "internal error";
    const status = e instanceof EngineError && msg.startsWith("invalid") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const { context } = buildArc(reading);

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `Write this person's one-year STORY ARC, drawing ONLY on the engine data below.\n\n` +
        `=== ENGINE DATA (verbatim — your only source) ===\n${context}\n=== END ENGINE DATA ===`,
    },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of chatStream(messages, {
          temperature: 0.85,
          max_tokens: 1700,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "stream error";
        controller.enqueue(encoder.encode(`\n\n[The read was interrupted: ${msg}]`));
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
