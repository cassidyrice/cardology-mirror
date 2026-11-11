// 3-Angle AI reading writer for The Card Blueprint Reading ($99 · up to 3 questions / 48h).
// Grounded strictly in QuestionReadingFacts from lib/question-reading-facts.ts and Cass's voice:
// - Direct, warm-deadpan, behavioral, specific ("anxiety style" sharpness without cruelty:
//   roast behavior and defense mechanisms, never bodies, identity, trauma, or real hardship).
// - Zero invented cards, zero invented dates, zero woo/self-help cliches.
// - Always returns 3 distinct angles, each with both email (subject + emailBody) and text (smsBody).

import { chat, getLLMConfig, type ChatMessage } from "./llm";
import type {
  PermanentSeatHit,
  PersonSpreadFacts,
  QuestionReadingFacts,
} from "./question-reading-facts";

export interface PriorQuestionContext {
  number: number;
  question: string;
  answer?: string | null;
}

export interface ReadingAngleDraft {
  angle: 1 | 2 | 3;
  key: "verdict" | "mirror" | "timeline";
  label: string;
  thesis: string;
  subject: string;
  emailBody: string;
  smsBody: string;
  lintWarnings: string[];
}

export interface ThreeAnglesResult {
  angles: [ReadingAngleDraft, ReadingAngleDraft, ReadingAngleDraft];
  model: string;
  source: "llm" | "deterministic-fallback";
}

const BANNED_VOICE_PATTERNS: RegExp[] = [
  /\bthe universe\b/i,
  /\bmanifest(?:ing|ation)?\b/i,
  /\bvibrations?\b/i,
  /\byour energy\b/i,
  /\byou['’]ve got this\b/i,
  /\btrust the process\b/i,
  /\byou deserve\b/i,
  /\bfate\b/i,
  /\bdestiny will\b/i,
  /\bforetells?\b/i,
];

export function lintReadingDraft(text: string): string[] {
  const warnings: string[] = [];
  for (const pattern of BANNED_VOICE_PATTERNS) {
    const m = pattern.exec(text);
    if (m) warnings.push(`banned phrase: "${m[0]}"`);
  }
  return warnings;
}

function sanitizeBannedPhrases(text: string): string {
  return text
    .replace(/\bthe universe\b/gi, "the deck")
    .replace(/\byou['’]ve got this\.?/gi, "")
    .replace(/\btrust the process\.?/gi, "")
    .replace(/\bdestiny will\b/gi, "the pattern tends to")
    .replace(/\bforetells?\b/gi, "points to")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SYSTEM_PROMPT = `You are drafting personal Cardology question readings for Cass at Card Blueprints (cardblueprints.com).
Write 3 genuinely different angles answering the buyer's exact question so Cass can review, lightly edit if needed, and approve 1 angle to send by Email or Text Message (SMS).

VOICE & SAFETY RULES:
- Blend Cass's direct reader voice with "anxiety style" precision: short, specific, grounded sentences that name the real pattern without fluff.
- Roast behavior and defense mechanisms (avoidance, scanning for signals, withholding the call, over-analyzing instead of asking) — never bodies, identity, trauma, or real hardship.
- Never use exclamation marks, emojis, cheerleading, or woo cliches. Never write: "the universe", "manifest", "vibrations", "your energy", "you've got this", "trust the process", "you deserve", "fate", "destiny will", or "foretells".
- Never invent a card, ruling card, planetary seat, age, or calendar date. Use ONLY the verified engine facts provided in the prompt.
- Every emailBody must read like a personal note from Cass: open with "Hi <Name>," (or start right on the line if name is "You"), answer their actual question in plain English using exact card glyphs (♥, ♦, ♣, ♠) and exact calendar date ranges, and sign off simply with "Cass". Aim for 260-420 words per emailBody.
- Every smsBody must be a tight, standalone text message version of that angle (450-850 characters, 2-4 short paragraphs separated by blank lines, exact cards + key date window, ending with "— Cass").

THE 3 REQUIRED ANGLES:
1. Angle 1 ("verdict" — "Direct Verdict & Date Window"): Answer their exact question in paragraph one. Name the structural truth on the board (one-way vs mutual seats for compatibility; current season + payoff card for solo) and give them one clear calendar window to make the call.
2. Angle 2 ("mirror" — "Behavioral Mirror & Blind Spot"): Focus on the psychological/behavioral loop running underneath the question — how their birth/ruling card and current 52-day season behave under stress vs. at their best, and what pattern to stop repeating right now.
3. Angle 3 ("timeline" — "Season-by-Season Timing Map"): Walk chronologically from right now through the next 2-3 planetary 52-day windows and the upcoming birthday shift so they know what each chapter rewards and what fog or friction to avoid.

OUTPUT FORMAT:
Return strict JSON only (no markdown fences) matching this exact shape:
{
  "angles": [
    {
      "angle": 1,
      "key": "verdict",
      "label": "Direct Verdict & Date Window",
      "thesis": "One-sentence summary for Cass in /ops/inbox",
      "subject": "Email subject line",
      "emailBody": "Full email text...",
      "smsBody": "Concise SMS text..."
    },
    { "angle": 2, "key": "mirror", "label": "Behavioral Mirror & Blind Spot", "thesis": "...", "subject": "...", "emailBody": "...", "smsBody": "..." },
    { "angle": 3, "key": "timeline", "label": "Season-by-Season Timing Map", "thesis": "...", "subject": "...", "emailBody": "...", "smsBody": "..." }
  ]
}`;

function formatSeatsList(hits: PermanentSeatHit[], ownerName: string): string {
  if (hits.length === 0) return `none in ${ownerName}'s birth or ruling spread`;
  return hits
    .map(
      (h) =>
        `${h.subjectCard} (${h.subjectCardKind} card) sits in ${ownerName}'s ${h.seatTitle} seat (${h.ownerSpreadCard} ${h.ownerSpreadKind} spread)`,
    )
    .join("; ");
}

function buildUserPrompt(
  facts: QuestionReadingFacts,
  opts: {
    steeringNote?: string;
    questionNumber?: number;
    priorQuestions?: PriorQuestionContext[];
  } = {},
): string {
  const qTag = opts.questionNumber ? `Question ${opts.questionNumber} of 3` : "Question 1 of 3";
  const modeLabel =
    facts.person2 && facts.compatibility
      ? "Two-Person Compatibility & Timing Spread"
      : "Solo Birth, Ruling & 52-Day Timing Spread";
  const lines: string[] = [
    `OFFER: The Card Blueprint Reading ($99 · ${qTag} · ${modeLabel})`,
    `READING DATE: ${facts.targetDateIso}`,
    `BUYER QUESTION (${qTag}): "${facts.question}"`,
  ];
  if (facts.relationshipContext) {
    lines.push(`RELATIONSHIP CONTEXT: ${facts.relationshipContext}`);
  }
  if (opts.priorQuestions && opts.priorQuestions.length > 0) {
    lines.push("", "=== PRIOR QUESTIONS ON THIS 48-HOUR READING PASS (DO NOT REPEAT YOURSELF; BUILD ON THIS) ===");
    for (const pq of opts.priorQuestions) {
      lines.push(`- Question ${pq.number}: "${pq.question}"`);
      if (pq.answer) {
        lines.push(`  Prior answer summary: ${pq.answer.slice(0, 420)}`);
      }
    }
  }
  if (opts.steeringNote?.trim()) {
    lines.push(`OPERATOR STEERING NOTE FROM CASS: ${opts.steeringNote.trim()}`);
  }

  const describePerson = (label: string, p: PersonSpreadFacts) => {
    const cy = p.currentYear;
    lines.push(
      "",
      `=== ${label}: ${p.name} (${p.birthdateDisplay}) ===`,
      `- Birth Card: ${p.birthCard} (${p.birthCardLabel}${p.birthCardTitle ? ` — ${p.birthCardTitle}` : ""})`,
      `- Ruling Card(s): ${p.rulingCards.join(", ")} (primary: ${p.rulingCard} ${p.rulingCardLabel})`,
      `- Core wiring: ${p.coreIdentity}`,
      `- Sweet spot: ${p.sweetSpot}`,
      `- Under stress / low road: ${p.under} | Over-rotated: ${p.over}`,
      `- Lifetime Karma: Environment (gift) ${p.lifetimeEnvironment ?? "fixed"}, Displacement (challenge) ${p.lifetimeDisplacement ?? "fixed"}`,
      `- Age ${cy.age} year (${cy.yearRangeLabel}): Long Range ${cy.longRangeCard}, Pluto ${cy.plutoCard}, Result ${cy.resultCard}, Environment ${cy.environmentCard ?? "fixed"}, Displacement ${cy.displacementCard ?? "fixed"}${
        cy.prcResultCard ? `, Ruling-spread Result ${cy.prcResultCard}` : ""
      }${cy.selfEnvironmentAndDisplacement ? " (NOTE: own birth card sits in BOTH Environment and Displacement this year)" : ""}`,
      `- Active 52-day period right now: ${cy.activePeriod.planet} ${cy.activePeriod.bcCard} (${cy.activePeriod.rangeLabel}) — sweet spot: ${cy.activePeriod.sweetSpot}; watch-for: ${cy.activePeriod.under}`,
      `- Full 7-period 52-day calendar (${cy.yearRangeLabel}):`,
      ...cy.periods.map(
        (per) =>
          `  * [${per.state.toUpperCase()}] ${per.planet} (${per.rangeLabel}): ${per.bcCard} (${per.bcLabel})${per.prcCard ? ` / ruling ${per.prcCard}` : ""}`,
      ),
      `- Next birthday year (Age ${p.nextYear.age}, opens ${p.nextYear.opensLabel}): Long Range ${p.nextYear.longRangeCard}, Pluto ${p.nextYear.plutoCard}, Result ${p.nextYear.resultCard}${
        p.nextYear.prcResultCard ? `, Ruling-spread Result ${p.nextYear.prcResultCard}` : ""
      }, Env ${p.nextYear.environmentCard ?? "fixed"}, Disp ${p.nextYear.displacementCard ?? "fixed"}`,
    );
  };

  describePerson("PERSON 1 (BUYER)", facts.person1);

  if (facts.person2 && facts.compatibility) {
    const p2 = facts.person2;
    describePerson("PERSON 2", p2);
    const c = facts.compatibility;
    lines.push(
      "",
      "=== COMPATIBILITY & TIMING CROSSINGS ===",
      `- Directionality: ${c.directionSummary}`,
      `- ${facts.person1.name} in ${p2.name}'s permanent spreads: ${formatSeatsList(c.person1InPerson2, p2.name)}`,
      `- ${p2.name} in ${facts.person1.name}'s permanent spreads: ${formatSeatsList(c.person2InPerson1, facts.person1.name)}`,
      `- Moon connection either way: ${c.hasMoonConnection ? "YES" : "NO"} (${facts.person1.name}'s Moon is ${facts.person1.moonCard}; ${p2.name}'s Moon is ${p2.moonCard})`,
      `- Shared cards across this 12-month window: ${c.sharedWindowCards.map((x) => x.card).join(", ") || "none"}`,
      `- Exact same card at the same time (365-day lookahead): ${
        c.overlappingWindows.length > 0
          ? c.overlappingWindows
              .map(
                (w) =>
                  `${w.card} (${w.cardLabel}) from ${w.rangeLabel} (${w.days} days — ${facts.person1.name} in ${w.person1Planet}, ${p2.name} in ${w.person2Planet})`,
              )
              .join("; ")
          : "no simultaneous identical period card in the next 365 days"
      }`,
      ...c.crossYearAppearances.slice(0, 10).map((a) => {
        const who =
          a.whoAppears === "person1_in_person2"
            ? `${facts.person1.name}'s ${a.card} (${a.cardKind}) appears in ${p2.name}'s ${a.where}`
            : `${p2.name}'s ${a.card} (${a.cardKind}) appears in ${facts.person1.name}'s ${a.where}`;
        return `- Cross-year seat: ${who} (${a.whenLabel})`;
      }),
    );
  }

  return lines.join("\n");
}

function greetingFor(name: string): string {
  const clean = name.trim();
  if (!clean || clean.toLowerCase() === "you") return "";
  return `Hi ${clean},\n\n`;
}

export function buildDeterministicThreeAngles(
  facts: QuestionReadingFacts,
  opts: { questionNumber?: number; priorQuestions?: PriorQuestionContext[] } = {},
): [ReadingAngleDraft, ReadingAngleDraft, ReadingAngleDraft] {
  const p1 = facts.person1;
  const cy1 = p1.currentYear;
  const greet = greetingFor(p1.name);
  const upcoming1 = cy1.periods.filter((p) => p.state !== "done").slice(0, 3);
  const qBadge = opts.questionNumber ? ` (Question ${opts.questionNumber} of 3)` : "";
  const followUpLead =
    opts.questionNumber && opts.questionNumber > 1
      ? `Picking right up on Question ${opts.questionNumber} of 3 from your Card Blueprint Reading.\n\n`
      : "";

  if (facts.person2 && facts.compatibility) {
    const p2 = facts.person2;
    const cy2 = p2.currentYear;
    const comp = facts.compatibility;
    const p1SeatsText =
      comp.person1InPerson2.length > 0
        ? comp.person1InPerson2
            .map(
              (h) =>
                `your ${h.subjectCard} sits in ${p2.name}'s ${h.seatTitle} seat (${h.ownerSpreadCard} ${h.ownerSpreadKind} spread)`,
            )
            .join(", and ")
        : `neither your ${p1.birthCard} nor your ${p1.rulingCard} sits directly inside ${p2.name}'s permanent spreads`;

    const p2SeatsText =
      comp.person2InPerson1.length > 0
        ? comp.person2InPerson1
            .map(
              (h) =>
                `${p2.name}'s ${h.subjectCard} sits in your ${h.seatTitle} seat (${h.ownerSpreadCard} ${h.ownerSpreadKind} spread)`,
            )
            .join(", and ")
        : `neither ${p2.name}'s ${p2.birthCard} nor ${p2.rulingCard} lands directly in your ${p1.birthCard} or ${p1.rulingCard} spreads`;

    const overlapWindow = comp.overlappingWindows[0] ?? null;
    const pivotWindow =
      overlapWindow
        ? `${overlapWindow.rangeLabel}, when you are both running the ${overlapWindow.card} (${p1.name === "You" ? "you" : p1.name} in ${overlapWindow.person1Planet}, ${p2.name} in ${overlapWindow.person2Planet})`
        : cy1.nextPeriod
          ? `${cy1.nextPeriod.rangeLabel}, as you shift into ${cy1.nextPeriod.planet} on the ${cy1.nextPeriod.bcCard}`
          : `${cy1.activePeriod.rangeLabel}, before your current ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard} window closes`;

    const subjectBase =
      p1.name !== "You"
        ? `Your Card Blueprint Reading${qBadge}: ${p1.name} & ${p2.name}`
        : `Your Card Blueprint Reading${qBadge} (${p1.birthCard} & ${p2.birthCard})`;

    const angle1Email = sanitizeBannedPhrases(
      `${greet}${followUpLead}Short answer to your question first, straight off the spreads.\n\n` +
        `You are a ${p1.birthCard} with a ${p1.rulingCard} ruling card. ${p2.name} is a ${p2.birthCard} with a ${p2.rulingCard} ruling card. On the permanent board, ${p1SeatsText}. Going the other way, ${p2SeatsText}.\n\n` +
        `${comp.directionSummary} ${
          comp.hasMoonConnection
            ? "There is a Moon tie holding familiarity underneath the friction."
            : `There is no Moon tie in either direction (your Moon is ${p1.moonCard}, ${p2.name}'s is ${p2.moonCard}), so long-haul ease is not automatic — clarity has to be spoken, not assumed.`
        }\n\n` +
        `Right now you are in ${cy1.activePeriod.planet} through ${cy1.activePeriod.rangeLabel.split("–")[1]?.trim() ?? cy1.activePeriod.endIso} on the ${cy1.activePeriod.bcCard}, while ${p2.name} is in ${cy2.activePeriod.planet} (${cy2.activePeriod.rangeLabel}) on the ${cy2.activePeriod.bcCard}. ` +
        `Give your question a concrete calendar boundary: ${pivotWindow}. Make the clean, plain move inside that window rather than carrying an unspoken maybe past it. Your Result card for age ${cy1.age} is the ${cy1.resultCard} — the year pays off when you stop negotiating against your own floor.\n\nCass`,
    );

    const angle1Sms = sanitizeBannedPhrases(
      `${p1.birthCard} (${p1.rulingCard}) + ${p2.name} ${p2.birthCard} (${p2.rulingCard}): ${comp.directionSummary}\n\n` +
        `Now: you are in ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard} (${cy1.activePeriod.rangeLabel}); ${p2.name} is in ${cy2.activePeriod.planet} ${cy2.activePeriod.bcCard} (${cy2.activePeriod.rangeLabel}).\n\n` +
        `Key window: ${pivotWindow}. Put your question on the table plainly before that window closes; your ${cy1.resultCard} Result card this year rewards a clean call over waiting. — Cass`,
    );

    const angle2Email = sanitizeBannedPhrases(
      `${greet}Here is the loop running underneath "${facts.question}" — because these two charts go quiet in very specific ways.\n\n` +
        `Your ${p1.birthCard} sweet spot is simple: ${p1.sweetSpot} Under pressure, though, the ${p1.birthCard} slips into its low road: ${p1.under} Right now your ${cy1.activePeriod.planet} season runs the ${cy1.activePeriod.bcCard} (${cy1.activePeriod.rangeLabel}), where the trap is ${cy1.activePeriod.under.toLowerCase()}\n\n` +
        `Across the table, ${p2.name}'s ${p2.birthCard} (${p2.rulingCard} ruling) operates differently. Healthy, ${p2.sweetSpot.toLowerCase()} Under stress, ${p2.under.toLowerCase()} And in ${p2.name}'s current ${cy2.activePeriod.planet} ${cy2.activePeriod.bcCard} window (${cy2.activePeriod.rangeLabel}), hesitation looks like composure from the outside.\n\n` +
        `When you put those two habits in one room, silence gets misread as a verdict. ${
          cy1.selfEnvironmentAndDisplacement
            ? `At age ${cy1.age}, your own ${p1.birthCard} sits in both your Environment and Displacement — you are both the gift and the cost of your own year.`
            : `Your Environment card at age ${cy1.age} is ${cy1.environmentCard ?? p1.birthCard} and your Displacement is ${cy1.displacementCard ?? p1.rulingCard}.`
        } Stop auditing ${p2.name}'s weather before checking your own. State what you actually want once, before ${cy1.activePeriod.rangeLabel.split("–")[1]?.trim() ?? cy1.activePeriod.endIso}, and let ${p2.name}'s response be data instead of a puzzle.\n\nCass`,
    );

    const angle2Sms = sanitizeBannedPhrases(
      `The real friction here isn't guesswork — it's two defense styles colliding. Your ${p1.birthCard} under stress: ${p1.under} ${p2.name}'s ${p2.birthCard} under stress: ${p2.under}\n\n` +
        `You're in ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard} (${cy1.activePeriod.rangeLabel}) while ${p2.name} runs ${cy2.activePeriod.planet} ${cy2.activePeriod.bcCard}. Don't read quiet as destiny. Ask once in plain words before ${
          overlapWindow ? overlapWindow.rangeLabel : cy1.activePeriod.rangeLabel
        } ends, and treat the answer as fact. — Cass`,
    );

    const angle3Email = sanitizeBannedPhrases(
      `${greet}Let's put your ${p1.birthCard} and ${p2.name}'s ${p2.birthCard} question on the actual 52-day calendar so you aren't guessing week to week.\n\n` +
        `1. Right now (${cy1.activePeriod.rangeLabel} · ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard}): You are in ${cy1.activePeriod.planet} while ${p2.name} is in ${cy2.activePeriod.planet} ${cy2.activePeriod.bcCard} (${cy2.activePeriod.rangeLabel}). Best move right now: ${cy1.activePeriod.sweetSpot}\n\n` +
        (upcoming1[1]
          ? `2. Next shift (${upcoming1[1].rangeLabel} · ${upcoming1[1].planet} ${upcoming1[1].bcCard}): The tone changes into ${upcoming1[1].bcLabel}. Best move here: ${upcoming1[1].sweetSpot}\n\n`
          : "") +
        (overlapWindow
          ? `3. Shared card window (${overlapWindow.rangeLabel}): You both land on the ${overlapWindow.card} at the exact same time — you in ${overlapWindow.person1Planet}, ${p2.name} in ${overlapWindow.person2Planet}. Same card, two rooms. That ${overlapWindow.days}-day stretch is the cleanest window on the board for a direct conversation.\n\n`
          : comp.sharedWindowCards.length > 0
            ? `3. Shared year themes: Across these twelve months you both touch ${comp.sharedWindowCards.map((c) => c.card).join(", ")}.\n\n`
            : "") +
        `4. Looking ahead to ${p1.nextYear.opensLabel} (Age ${p1.nextYear.age}): Your new chart opens with Long Range ${p1.nextYear.longRangeCard} and Result ${p1.nextYear.resultCard}${
          p1.nextYear.prcResultCard ? ` (ruling Result ${p1.nextYear.prcResultCard})` : ""
        }. Handle what is unfinished before that turn so you walk into ${p1.nextYear.opensLabel} with your hands free.\n\nCass`,
    );

    const angle3Sms = sanitizeBannedPhrases(
      `Your Compatibility Calendar (${p1.birthCard} + ${p2.birthCard}):\n` +
        `• Now (${cy1.activePeriod.rangeLabel}): ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard} vs ${p2.name}'s ${cy2.activePeriod.planet} ${cy2.activePeriod.bcCard}.\n` +
        (upcoming1[1]
          ? `• Next (${upcoming1[1].rangeLabel}): ${upcoming1[1].planet} ${upcoming1[1].bcCard}.\n`
          : "") +
        (overlapWindow
          ? `• Shared ${overlapWindow.card} window (${overlapWindow.rangeLabel}): cleanest stretch to ask directly.\n`
          : "") +
        `• Year payoff: ${cy1.resultCard} Result, turning ${p1.nextYear.opensLabel} into ${p1.nextYear.resultCard}. — Cass`,
    );

    return [
      {
        angle: 1,
        key: "verdict",
        label: "Direct Verdict & Date Window",
        thesis: `${comp.directionSummary} Pins decision window to ${overlapWindow ? overlapWindow.rangeLabel : cy1.activePeriod.rangeLabel}.`,
        subject: subjectBase,
        emailBody: angle1Email,
        smsBody: angle1Sms,
        lintWarnings: lintReadingDraft(angle1Email + "\n" + angle1Sms),
      },
      {
        angle: 2,
        key: "mirror",
        label: "Behavioral Mirror & Blind Spot",
        thesis: `Contrasts ${p1.birthCard} stress habit vs. ${p2.name}'s ${p2.birthCard} stress habit during ${cy1.activePeriod.planet}/${cy2.activePeriod.planet}.`,
        subject: `${subjectBase} — what the silence actually is`,
        emailBody: angle2Email,
        smsBody: angle2Sms,
        lintWarnings: lintReadingDraft(angle2Email + "\n" + angle2Sms),
      },
      {
        angle: 3,
        key: "timeline",
        label: "Season-by-Season Timing Map",
        thesis: `Chronological walk from ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard} through ${p1.nextYear.opensLabel}.`,
        subject: `${subjectBase} — your dates on the board`,
        emailBody: angle3Email,
        smsBody: angle3Sms,
        lintWarnings: lintReadingDraft(angle3Email + "\n" + angle3Sms),
      },
    ];
  }

  // Solo spread deterministic 3 angles
  const subjectSolo =
    p1.name !== "You"
      ? `Your Card Blueprint Reading${qBadge}, ${p1.name} (${p1.birthCard})`
      : `Your Card Blueprint Reading${qBadge} (${p1.birthCard})`;

  const nextWindowText = cy1.nextPeriod
    ? `${cy1.nextPeriod.rangeLabel} (${cy1.nextPeriod.planet} on the ${cy1.nextPeriod.bcCard})`
    : `${p1.nextYear.opensLabel} (when age ${p1.nextYear.age} opens on Long Range ${p1.nextYear.longRangeCard})`;

  const solo1Email = sanitizeBannedPhrases(
    `${greet}${followUpLead}Direct answer on your question first.\n\n` +
      `You are a ${p1.birthCard} (${p1.birthCardLabel}) with a ${p1.rulingCard} ruling card, currently in your age-${cy1.age} chart (${cy1.yearRangeLabel}). Your headline Long Range card this year is the ${cy1.longRangeCard}, your Pluto pressure card is the ${cy1.plutoCard}, and your Result payoff card is the ${cy1.resultCard}.\n\n` +
      `Right now (${cy1.activePeriod.rangeLabel}) you are inside your 52-day ${cy1.activePeriod.planet} period running the ${cy1.activePeriod.bcCard}. That card rewards one specific posture: ${cy1.activePeriod.sweetSpot} What stalls this window is ${cy1.activePeriod.under.toLowerCase()}\n\n` +
      `Use the rest of ${cy1.activePeriod.rangeLabel} to strip away the side noise around "${facts.question}", and use ${nextWindowText} as your execution marker. By the time your chart turns on ${p1.nextYear.opensLabel} (Result ${p1.nextYear.resultCard}), the decision you make in this window becomes the floor you stand on.\n\nCass`,
  );

  const solo1Sms = sanitizeBannedPhrases(
    `${p1.birthCard} (${p1.rulingCard} ruling) · Age ${cy1.age} Long Range ${cy1.longRangeCard}, Pluto ${cy1.plutoCard}, Result ${cy1.resultCard}.\n\n` +
      `Now (${cy1.activePeriod.rangeLabel}): ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard} — ${cy1.activePeriod.sweetSpot}\n\n` +
      `Next marker: ${nextWindowText}. Make the clean call inside this window so your ${cy1.resultCard} Result card can actually pay out. — Cass`,
  );

  const solo2Email = sanitizeBannedPhrases(
    `${greet}Let's look at the habit underneath your question, because timing only works when you stop running your birth card's defense reflex.\n\n` +
      `As a ${p1.birthCard}, your natural authority is real: ${p1.sweetSpot} Under pressure, though, the ${p1.birthCard} defaults to: ${p1.under} And with ${cy1.plutoCard} sitting in your Pluto seat all year (${cy1.yearRangeLabel}), the exact thing you keep postponing is the lever the year is asking you to pull.\n\n` +
      `${
        cy1.environmentCard
          ? `Your Environment card at age ${cy1.age} is ${cy1.environmentCard} (what supports you when you show up) and your Displacement card is ${cy1.displacementCard} (where the friction collects when you stall).`
          : `As a fixed card (${p1.birthCard}), nobody else moves your floor for you.`
      } Right now in ${cy1.activePeriod.planet} (${cy1.activePeriod.rangeLabel}), the ${cy1.activePeriod.bcCard} catches you if ${cy1.activePeriod.under.toLowerCase()} Cut the rehearsal loop this week and make one visible move before ${cy1.activePeriod.rangeLabel.split("–")[1]?.trim() ?? cy1.activePeriod.endIso}.\n\nCass`,
  );

  const solo2Sms = sanitizeBannedPhrases(
    `Watch the ${p1.birthCard} reflex underneath your question: under stress, ${p1.under}\n\n` +
      `Your Pluto card all year is ${cy1.plutoCard} and right now (${cy1.activePeriod.rangeLabel}) you're on ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard}. Stop rehearsing the decision in private — make one concrete move before ${cy1.activePeriod.rangeLabel.split("–")[1]?.trim() ?? cy1.activePeriod.endIso} toward your ${cy1.resultCard} payoff. — Cass`,
  );

  const solo3Email = sanitizeBannedPhrases(
    `${greet}Here is your ${p1.birthCard} 52-day calendar from today through your next birthday turn so you can pace this properly.\n\n` +
      upcoming1
        .map(
          (per, idx) =>
            `${idx + 1}. ${per.planet} · ${per.bcCard} (${per.rangeLabel}${per.state === "now" ? " — active now" : ""}): ${per.sweetSpot} Watch for: ${per.under}`,
        )
        .join("\n\n") +
      `\n\nYear spine (${cy1.yearRangeLabel}): Long Range ${cy1.longRangeCard}, Pluto ${cy1.plutoCard}, Result ${cy1.resultCard}.\n\n` +
      `Next birthday shift (${p1.nextYear.opensLabel}, Age ${p1.nextYear.age}): Opens on Long Range ${p1.nextYear.longRangeCard} with Result ${p1.nextYear.resultCard}. Treat the current ${cy1.activePeriod.bcCard} window as preparation and commitment, not waiting.\n\nCass`,
  );

  const solo3Sms = sanitizeBannedPhrases(
    `Your 52-Day Map (${p1.birthCard}):\n` +
      upcoming1
        .map((per) => `• ${per.planet} ${per.bcCard} (${per.rangeLabel}): ${per.sweetSpot}`)
        .join("\n") +
      `\n• Year Result: ${cy1.resultCard} -> turns ${p1.nextYear.opensLabel} to ${p1.nextYear.resultCard}. — Cass`,
  );

  return [
    {
      angle: 1,
      key: "verdict",
      label: "Direct Verdict & Date Window",
      thesis: `Answers straight from Age ${cy1.age} (${cy1.longRangeCard} / Pluto ${cy1.plutoCard} / Result ${cy1.resultCard}) + ${cy1.activePeriod.planet} ${cy1.activePeriod.bcCard}.`,
      subject: subjectSolo,
      emailBody: solo1Email,
      smsBody: solo1Sms,
      lintWarnings: lintReadingDraft(solo1Email + "\n" + solo1Sms),
    },
    {
      angle: 2,
      key: "mirror",
      label: "Behavioral Mirror & Blind Spot",
      thesis: `Calls out ${p1.birthCard} stress reflex + Pluto ${cy1.plutoCard} pressure during ${cy1.activePeriod.rangeLabel}.`,
      subject: `${subjectSolo} — the pattern to cut`,
      emailBody: solo2Email,
      smsBody: solo2Sms,
      lintWarnings: lintReadingDraft(solo2Email + "\n" + solo2Sms),
    },
    {
      angle: 3,
      key: "timeline",
      label: "Season-by-Season Timing Map",
      thesis: `Walks upcoming 52-day periods from ${cy1.activePeriod.rangeLabel} into ${p1.nextYear.opensLabel}.`,
      subject: `${subjectSolo} — your 52-day dates`,
      emailBody: solo3Email,
      smsBody: solo3Sms,
      lintWarnings: lintReadingDraft(solo3Email + "\n" + solo3Sms),
    },
  ];
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    const firstBrace = stripped.indexOf("{");
    const lastBrace = stripped.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(stripped.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateThreeReadingAngles(
  facts: QuestionReadingFacts,
  opts: {
    steeringNote?: string;
    questionNumber?: number;
    priorQuestions?: PriorQuestionContext[];
    llmChat?: (messages: ChatMessage[], options?: { temperature?: number; max_tokens?: number }) => Promise<string>;
  } = {},
): Promise<ThreeAnglesResult> {
  const fallback = buildDeterministicThreeAngles(facts, {
    questionNumber: opts.questionNumber,
    priorQuestions: opts.priorQuestions,
  });
  const cfg = getLLMConfig();
  const caller = opts.llmChat ?? (cfg.key ? chat : null);

  if (!caller) {
    return {
      angles: fallback,
      model: "deterministic-spread-composer",
      source: "deterministic-fallback",
    };
  }

  try {
    const raw = await caller(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(facts, {
            steeringNote: opts.steeringNote,
            questionNumber: opts.questionNumber,
            priorQuestions: opts.priorQuestions,
          }),
        },
      ],
      { temperature: 0.65, max_tokens: 3000 },
    );

    const parsed = extractJsonObject(raw);
    const arr = Array.isArray(parsed?.angles) ? parsed.angles : null;
    if (!arr || arr.length < 3) {
      return {
        angles: fallback,
        model: "deterministic-spread-composer",
        source: "deterministic-fallback",
      };
    }

    const keys: ["verdict", "mirror", "timeline"] = ["verdict", "mirror", "timeline"];
    const built = ([0, 1, 2] as const).map((idx) => {
      const candidate = (arr[idx] ?? {}) as Record<string, unknown>;
      const fb = fallback[idx];
      const emailBody = sanitizeBannedPhrases(
        typeof candidate.emailBody === "string" && candidate.emailBody.trim().length >= 80
          ? candidate.emailBody
          : fb.emailBody,
      );
      const smsBody = sanitizeBannedPhrases(
        typeof candidate.smsBody === "string" && candidate.smsBody.trim().length >= 40
          ? candidate.smsBody
          : fb.smsBody,
      );
      const subject =
        typeof candidate.subject === "string" && candidate.subject.trim().length >= 5
          ? sanitizeBannedPhrases(candidate.subject)
          : fb.subject;
      const thesis =
        typeof candidate.thesis === "string" && candidate.thesis.trim().length >= 8
          ? sanitizeBannedPhrases(candidate.thesis)
          : fb.thesis;
      const label =
        typeof candidate.label === "string" && candidate.label.trim().length >= 4
          ? candidate.label.trim()
          : fb.label;

      return {
        angle: (idx + 1) as 1 | 2 | 3,
        key: keys[idx],
        label,
        thesis,
        subject,
        emailBody,
        smsBody,
        lintWarnings: lintReadingDraft(emailBody + "\n" + smsBody),
      } satisfies ReadingAngleDraft;
    }) as [ReadingAngleDraft, ReadingAngleDraft, ReadingAngleDraft];

    return {
      angles: built,
      model: cfg.model || "llm-gateway",
      source: "llm",
    };
  } catch (err) {
    console.warn("[question-reading-writer] LLM unavailable; using deterministic spread composer", err);
    return {
      angles: fallback,
      model: "deterministic-spread-composer",
      source: "deterministic-fallback",
    };
  }
}
