import { NextRequest, NextResponse } from "next/server";
import { getReading, EngineError } from "@/lib/engine";
import { chatStream, getLLMConfig, type ChatMessage } from "@/lib/llm";
import { READING_INTERPRETATION_GUIDE } from "@/lib/interpretation-guidance";
import { bearerFrom, verifyToken } from "@/lib/gate";
import type { Reading, Interpretation, PlanetName } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PLANETS: PlanetName[] = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

function pos(i: Interpretation): string {
  return [
    `    - Under: ${i.under}`,
    `    - Sweet spot (balanced): ${i.sweet_spot}`,
    `    - Over: ${i.over}`,
  ].join("\n");
}

// Flatten the engine JSON into a dense, faithful context block.
// Everything here is verbatim from the engine — the LLM may ONLY draw on this.
function buildContext(r: Reading): string {
  const a = r.archetype;
  const d = a.description;
  const p = a.prc_description;
  const t = r.timing;
  const ap = r.active_period;

  const lines: string[] = [];

  lines.push(`BIRTH CARD: ${a.birth_card} — "${d.title}"`);
  lines.push(`  Suit domain: ${a.suit_domain}`);
  lines.push(`  Core identity: ${d.core_identity}`);
  lines.push(`  Gifts:\n${d.gifts.replace(/^/gm, "    ")}`);
  lines.push(`  Shadow: ${d.shadow}`);
  lines.push(`  Life direction (curriculum): ${d.life_direction}`);

  lines.push(``);
  lines.push(`PERSONALITY / RULING CARD (PRC): ${a.prc} — "${p.title}"`);
  lines.push(`  Core identity: ${p.core_identity}`);
  lines.push(`  Gifts:\n${p.gifts.replace(/^/gm, "    ")}`);
  lines.push(`  Shadow: ${p.shadow}`);
  lines.push(`  Life direction (curriculum): ${p.life_direction}`);

  lines.push(``);
  lines.push(`TIMING: age ${t.age}. Crown / life-theme cards: ${t.crown.join(", ")}.`);

  lines.push(``);
  lines.push(
    `CURRENT CHAPTER — active planetary period: ${ap.planet} (themes: ${ap.domain}).`,
  );
  lines.push(`  Governing card from BIRTH-CARD spread: ${ap.bc_card} (${ap.interpretation_bc.name})`);
  lines.push(pos(ap.interpretation_bc));
  lines.push(`  Governing card from RULING-CARD spread: ${ap.prc_card} (${ap.interpretation_prc.name})`);
  lines.push(pos(ap.interpretation_prc));

  lines.push(``);
  lines.push(`FULL BIRTH-CARD SPREAD (anchor ${r.birth_card_spread.anchor}) — each period card with its three positions:`);
  for (const pl of PLANETS) {
    const pd = r.birth_card_spread.periods_detailed[pl];
    if (!pd) continue;
    lines.push(`  ${pl}: ${pd.card} (${pd.interpretation.name})`);
    lines.push(pos(pd.interpretation));
  }

  lines.push(``);
  lines.push(`FULL RULING-CARD SPREAD (anchor ${r.prc_spread.anchor}):`);
  for (const pl of PLANETS) {
    const pd = r.prc_spread.periods_detailed[pl];
    if (!pd) continue;
    lines.push(`  ${pl}: ${pd.card} (${pd.interpretation.name})`);
    lines.push(pos(pd.interpretation));
  }

  if (r.karma?.bc_lifetime) {
    lines.push(``);
    lines.push(
      `LIFETIME KARMA: gift/environment card ${r.karma.bc_lifetime.environment}; challenge/displacement card ${r.karma.bc_lifetime.displacement}.`,
    );
  }

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are the writing voice of "Mirror," a Cardology self-reflection app. You write one long-form deep-dive reading.

This is a MIRROR, not a forecast. You reflect patterns back so the reader can notice how they tend to operate. Nothing is fixed, predicted, or fated. You are NOT mystical and you do NOT predict the future. Cards are simply a vocabulary for noticing patterns the reader can examine, work with, or set down.

STRICT CARD-FIDELITY — this is non-negotiable:
- You may ONLY describe what the provided engine data states. Use its exact card identities and its under / sweet-spot / over meanings.
- NEVER invent card meanings, numerology, planetary lore, or symbolism not present in the data.
- Refer to cards by the codes given (e.g. 8♦, K♠) and the names/meanings provided.
- Use the three-position framing constantly: the balanced center (sweet spot), one slip "under," the opposite slip "over." Frame shadow as self-protection to watch, not a defect to fear.

VOICE & REGISTER:
- Warm, direct, intelligent, second-person ("you"). Co-Star meets The Pattern. Plain, grounded, occasionally blunt. No horoscope clichés, no "the universe," no destiny.
- Weave in *italicized reflective questions* on their own — the "where in your life right now…" kind, drawn directly from the reader's specific cards.

STRUCTURE — use these exact markdown section headings, in order:
## Who You Are at Core
## The Tension You Carry
## The Chapter You're In Now
## Questions to Sit With
## Integration

- Open with a one or two sentence framing that this is a mirror, not a forecast (no heading, before the first ## section).
- "Who You Are at Core": synthesize the birth card and ruling card as a living paradox. End with an italic reflective question.
- "The Tension You Carry": work the two shadows together as protective patterns. End with an italic reflective question.
- "The Chapter You're In Now": name the CURRENT active planetary period and its governing cards. Walk the balanced center / under / over for each. End with an italic reflective question.
- "Questions to Sit With": a numbered list of 4-5 questions, each tied to a specific named card.
- "Integration": tie back to the life-direction curriculum of both cards. Remind them none of this is destiny; it is data to work with.

Use **bold** for card codes and key phrases, *italics* for reflective questions. Keep it tight and human — no filler.`;

export async function POST(req: NextRequest) {
  let body: { birthdate?: string; date?: string; focus?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const birthdate = (body.birthdate ?? "").trim();
  const date = body.date?.trim() || undefined;
  const focus = body.focus?.trim();

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

  // Graceful handling when the gateway key is absent.
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

  const context = buildContext(reading);
  const focusLine = focus
    ? `\n\nThe reader named a focus for this reading: "${focus}". Weave it in where the cards genuinely speak to it; do not force it or invent meanings to fit it.`
    : "";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `Write the deep-dive mirror reading for this person, drawing ONLY on the engine data below. Use the interpretation methodology markdown as reading-process guidance, but do not invent card facts beyond the engine data.\n\n` +
        `=== INTERPRETATION METHODOLOGY MARKDOWN ===\n${READING_INTERPRETATION_GUIDE}\n=== END METHODOLOGY ===\n\n` +
        `=== ENGINE DATA (verbatim — your only source for card identities/meanings) ===\n${context}\n=== END ENGINE DATA ===${focusLine}`,
    },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of chatStream(messages, {
          temperature: 0.85,
          max_tokens: 1800,
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
