"use client";

import { motion } from "framer-motion";

import type { DailyCard as DailyCardType } from "@/lib/types";
import { parseCard } from "@/lib/cards";
import { Eyebrow, PositionStack } from "@/components/ui";
import { PlayingCard } from "@/components/PlayingCard";
import { dailyLabel, dailyLine } from "@/components/today/reflection";

function cardTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/i, "of");
}

export function DailyCardBlock({ daily }: { daily: DailyCardType }) {
  const bc = daily.bc;
  const prc = daily.prc;
  const interp = bc.interpretation;
  if (!bc.card || !interp) return null;

  const parsed = parseCard(bc.card);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface rounded-2xl p-6"
    >
      <Eyebrow className="text-gold">Your card today</Eyebrow>
      <p className="mt-1 text-xs uppercase tracking-wider2 text-faint">
        {dailyLabel(daily)}
      </p>

      <div className="mt-5 flex items-center gap-5">
        <PlayingCard
          code={bc.card}
          subtitle="Today"
          title={cardTitle(interp.name)}
          size="md"
          active
        />
        <div className="min-w-0">
          <span
            style={{ color: parsed?.color }}
            className="font-serif text-2xl"
          >
            {bc.card}
          </span>
          <h2 className="display mt-1 text-2xl leading-tight text-bone">
            {dailyLine(daily)}
          </h2>
          <p className="mt-2 text-xs text-faint">{daily.domain}</p>
        </div>
      </div>

      <div className="mt-6">
        <PositionStack
          under={interp.under}
          sweet={interp.sweet_spot}
          over={interp.over}
        />
      </div>

      {prc.card && prc.card !== bc.card && (
        <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
          <PlayingCard code={prc.card} subtitle="Ruling" size="sm" />
          <p className="text-[0.9rem] leading-relaxed text-mist">
            Your ruling line today runs through{" "}
            <span className="text-bone">
              {prc.interpretation
                ? cardTitle(prc.interpretation.name)
                : prc.card}
            </span>
            {prc.interpretation
              ? ` — ${prc.interpretation.sweet_spot
                  .trim()
                  .split(/[,.]/)[0]
                  .replace(/^you'?re\s+/i, "")
                  .trim()
                  .toLowerCase()}.`
              : "."}
          </p>
        </div>
      )}
    </motion.div>
  );
}
