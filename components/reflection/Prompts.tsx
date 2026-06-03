"use client";

// Card-faithful reflection prompts, in the voice of the gold reading's
// "Questions to Sit With": italic, specific, drawn from the person's actual
// cards, with a little sting. Everything is templated strictly from engine
// fields — no invented meaning, no forecast.

import { motion } from "framer-motion";
import type { ActivePeriod, Reading } from "@/lib/types";
import { parseCard } from "@/lib/cards";

export interface ReflectionPrompt {
  id: string; // stable key, e.g. "shadow", "active-bc"
  label: string; // small eyebrow, e.g. "The 8♦ question"
  question: string; // the prompt body
  cards: string[]; // governing card glyphs this prompt is drawn from
}

// "10 OF HEARTS" -> "10 of Hearts"
function cardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/i, "of");
}

// Lower-cased leading clause of a sweet-spot/under/over line, with the
// "You're " lead stripped, so it folds cleanly into a question.
function clause(line: string): string {
  const first = line.trim().split(/[,.]/)[0].trim();
  return first.replace(/^you'?re\s+/i, "").trim().toLowerCase();
}

function domainLead(period: ActivePeriod): string {
  return period.domain.split(",")[0].trim();
}

// Build 4-6 reflective questions from a Reading. Pure function — reusable
// from any screen. Order: core shadow, ruling shadow, the active chapter's
// two cards, the life-direction curriculum, and the crown.
export function buildPrompts(reading: Reading): ReflectionPrompt[] {
  const a = reading.archetype;
  const ap = reading.active_period;
  const prompts: ReflectionPrompt[] = [];

  // 1. Birth-card shadow.
  prompts.push({
    id: "core-shadow",
    label: `The ${a.birth_card} question`,
    question: `Your ${a.description.title} shadow is the pattern where ${clause(
      a.description.shadow,
    )}. Name one place this week where you caught yourself doing exactly that — and what you were protecting.`,
    cards: [a.birth_card],
  });

  // 2. Ruling-card shadow.
  prompts.push({
    id: "ruling-shadow",
    label: `The ${a.prc} question`,
    question: `As the ${a.prc_description.title}, your edge is ${clause(
      a.prc_description.shadow,
    )}. What's one thing you abandoned right when it asked you to go deeper instead of moving on?`,
    cards: [a.prc],
  });

  // 3. Active chapter — birth card in this planet.
  prompts.push({
    id: "active-bc",
    label: `The ${ap.bc_card} ${ap.planet} question`,
    question: `In the realm of ${domainLead(ap)} right now, are you slipping "under" — ${clause(
      ap.interpretation_bc.under,
    )} — or tipping "over" into ${clause(
      ap.interpretation_bc.over,
    )}? What would the balanced version ask of you in your next real moment?`,
    cards: [ap.bc_card],
  });

  // 4. Active chapter — ruling card in this planet.
  prompts.push({
    id: "active-prc",
    label: `The ${ap.prc_card} ${ap.planet} question`,
    question: `Your ${cardName(
      ap.interpretation_prc.name,
    )} pattern is most itself when ${clause(
      ap.interpretation_prc.sweet_spot,
    )}. Where are you withholding that today, and who would notice if you stopped?`,
    cards: [ap.prc_card],
  });

  // 5. Life-direction curriculum (the throughline).
  prompts.push({
    id: "curriculum",
    label: "The curriculum question",
    question: `${a.description.life_direction.trim()} Where did today hand you that exact lesson — and did you take it or dodge it?`,
    cards: [a.birth_card],
  });

  // 6. Crown — the long-range life themes.
  if (ap && reading.timing.crown.length) {
    const crown = reading.timing.crown;
    prompts.push({
      id: "crown",
      label: "The crown question",
      question: `Your longer themes point toward ${crown.join(
        ", ",
      )}. Where in your life right now is the exchange genuinely fair — and where are you taking more than you give, or giving so you never have to ask?`,
      cards: crown,
    });
  }

  return prompts;
}

function Glyphs({ cards }: { cards: string[] }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {cards.map((code, i) => {
        const c = parseCard(code);
        if (!c) return null;
        return (
          <span
            key={`${code}-${i}`}
            className="font-serif text-sm"
            style={{ color: c.color }}
          >
            {code}
          </span>
        );
      })}
    </span>
  );
}

export interface PromptsProps {
  reading: Reading;
  onSelect?: (prompt: ReflectionPrompt) => void;
  className?: string;
}

// Reusable list of card-derived prompts. Tapping one fires onSelect.
export function Prompts({ reading, onSelect, className = "" }: PromptsProps) {
  const prompts = buildPrompts(reading);
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className={`space-y-3 ${className}`}
    >
      {prompts.map((p) => (
        <motion.li
          key={p.id}
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <button
            type="button"
            onClick={() => onSelect?.(p)}
            className="card-surface group w-full rounded-2xl p-5 text-left transition-colors hover:border-gold/30 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow text-gold">{p.label}</span>
              <Glyphs cards={p.cards} />
            </div>
            <p className="prose-reading mt-3 text-pretty font-serif text-[1.05rem] italic leading-relaxed text-bone">
              {p.question}
            </p>
            <span className="mt-3 inline-block text-xs uppercase tracking-wider2 text-faint transition-colors group-hover:text-gold">
              Sit with this &rarr;
            </span>
          </button>
        </motion.li>
      ))}
    </motion.ul>
  );
}
