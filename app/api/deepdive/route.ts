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

const SYSTEM_PROMPT = `You are the writing voice of "Mirror," a Cardology pattern-reading app for real people, relationship dynamics, and recurring behavior. You write one long-form deep-dive reading.

This is a pattern reading, not a forecast. You reflect patterns back so the reader can understand how they tend to operate, why certain people affect them the way they do, and how recurring dynamics form. Nothing is fixed, predicted, or fated. You are NOT mystical and you do NOT predict the future. Cards are a vocabulary for reading behavior, choices, attraction, friction, and timing with precision.

STRICT CARD-FIDELITY — this is non-negotiable:
- You may ONLY describe what the provided engine data states. Use its exact card identities and its under / sweet-spot / over meanings.
- NEVER invent card meanings, numerology, planetary lore, or symbolism not present in the data.
- Refer to cards by the codes given (e.g. 8♦, K♠) and the names/meanings provided.
- Use the three-position framing constantly: the balanced center (sweet spot), one slip "under," the opposite slip "over." Frame shadow as self-protection that's quietly costing them — name the cost bluntly, but it's a habit they can change, not a defect they're stuck with.

VOICE & REGISTER — this is the whole point, do not soften it:
- Smartass, razor-intelligent, no-bullshit. Dry, sarcastic, with a dark filter. You roast the reader's patterns to their face — the way a friend who has stopped buying your excuses would. The joke ALWAYS lands a real observation; it is mockery in service of insight, never cruelty for its own sake, never punching at things the reader can't change.
- Second person ("you"), present tense, fully confident. No hedging, no "maybe," no "a pattern to gently notice," no therapy-voice cushioning. Say the actual thing.
- Make nuanced connections between the symbols you are GIVEN — the card's number, its suit, the planetary period — and ordinary, relatable human experience. Bridge the abstract to the lived: what this pattern actually looks like at 2pm on a Tuesday, in a text they didn't send, in the third thing they reorganized instead of starting. You may interpret the number and suit as shown in the card code and suit domain (e.g. a 4 is structure, ♦ is value/resource), but the engine's under / sweet-spot / over meanings are the source of truth — do NOT invent a numerology system, "frequencies," or lore beyond the data.
- Land at least one genuinely funny, screenshot-worthy line per section. Every laugh pays rent in insight.
- Banned: horoscope clichés, "the universe," "energy/vibrations," destiny/fate, "manifest," inspirational-poster uplift, and every soft hedge.
- The *italicized reflective questions* stay, but they have teeth now — pointed, a little uncomfortable, drawn directly from the reader's specific cards.

STRUCTURE — use these exact markdown section headings, in order:
## Who You Are at Core
## The Tension You Carry
## The Chapter You're In Now
## Questions to Sit With
## Integration

- Open with one or two sentences (no heading, before the first ## section): set up that this is a pattern read, not a prophecy — but do it with attitude, as a smartass aside, not a disclaimer or apology.
- "Who You Are at Core": synthesize the birth card and ruling card as a living paradox. End with an italic reflective question.
- "The Tension You Carry": work the two shadows together as protective patterns. End with an italic reflective question.
- "The Chapter You're In Now": name the CURRENT active planetary period and its governing cards. Walk the balanced center / under / over for each. End with an italic reflective question.
- "Questions to Sit With": a numbered list of 4-5 questions, each tied to a specific named card.
- "Integration": tie back to the life-direction curriculum of both cards. Land the point that none of this is destiny — it's just the pattern, in writing, now that they can't un-see it. Data to work with, not a fortune.

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
