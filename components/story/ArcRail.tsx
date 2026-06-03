"use client";

import { motion } from "framer-motion";
import { PlayingCard } from "@/components/PlayingCard";
import type { Reading } from "@/lib/types";

const BEATS = ["Chapter", "Turn", "Horizon"] as const;

function Strand({
  label,
  cards,
  delay,
}: {
  label: string;
  cards: [string, string, string];
  delay: number;
}) {
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <div className="flex items-stretch justify-between gap-1.5">
        {cards.map((code, i) => (
          <div key={i} className="flex flex-1 items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: delay + i * 0.08 }}
              className="flex flex-col items-center gap-1.5"
            >
              <PlayingCard code={code} size="sm" active={i === 1} float={i === 1} />
              <span className="text-[0.55rem] uppercase tracking-wider2 text-faint">
                {BEATS[i]}
              </span>
            </motion.div>
            {i < 2 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: delay + i * 0.08 + 0.2 }}
                className="mx-1 h-px flex-1 origin-left bg-gradient-to-r from-gold/50 to-gold/10"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// The 6-card arc: two strands, each Long-range -> Pluto -> Result.
export function ArcRail({ reading }: { reading: Reading }) {
  const bc: [string, string, string] = [
    reading.long_range.bc.card,
    reading.birth_card_spread.pluto,
    reading.birth_card_spread.result,
  ];
  const prc: [string, string, string] = [
    reading.long_range.prc.card,
    reading.prc_spread.pluto,
    reading.prc_spread.result,
  ];
  return (
    <div className="card-surface space-y-6 p-5">
      <Strand
        label={`Core self · ${reading.archetype.birth_card}`}
        cards={bc}
        delay={0.1}
      />
      <div className="hairline border-t" />
      <Strand
        label={`Outer self · ${reading.archetype.prc}`}
        cards={prc}
        delay={0.3}
      />
    </div>
  );
}
