"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PlayingCard } from "@/components/PlayingCard";
import { Eyebrow, PositionStack } from "@/components/ui";
import { parseCard } from "@/lib/cards";
import type { PeriodDetail } from "@/lib/types";
import { formatRange, type PeriodWindow } from "./cycle";

function cardTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/i, "of");
}

interface PeriodRowProps {
  window: PeriodWindow;
  bcDetail: PeriodDetail;
  prcDetail: PeriodDetail;
  isCurrent: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function PeriodRow({
  window: w,
  bcDetail,
  prcDetail,
  isCurrent,
  isLast,
  expanded,
  onToggle,
}: PeriodRowProps) {
  const bc = parseCard(bcDetail.card);
  const prc = parseCard(prcDetail.card);

  return (
    <div className="relative pl-8">
      {/* Timeline rail */}
      {!isLast && (
        <span className="absolute left-[7px] top-6 bottom-0 w-px bg-white/10" aria-hidden />
      )}
      {/* Node dot */}
      <span
        className={`absolute left-0 top-[18px] h-[15px] w-[15px] rounded-full border ${
          isCurrent
            ? "border-gold bg-gold shadow-[0_0_14px_2px_rgba(217,178,106,0.7)]"
            : "border-white/25 bg-haze"
        }`}
        aria-hidden
      />

      <motion.button
        type="button"
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
          isCurrent
            ? "border-gold/40 bg-gold/5"
            : "border-white/[0.06] bg-white/[0.015] hover:border-white/15"
        }`}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-serif text-lg ${isCurrent ? "text-gold" : "text-bone"}`}
              >
                {w.planet}
              </span>
              {isCurrent && (
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider2 text-gold">
                  Now
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-faint tnum">{formatRange(w)}</p>
          </div>

          <div className="flex shrink-0 items-end gap-2">
            <div className="text-center">
              <PlayingCard code={bcDetail.card} size="sm" />
            </div>
            <div className="text-center">
              <PlayingCard code={prcDetail.card} size="sm" />
            </div>
          </div>

          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="ml-1 shrink-0 text-faint"
            aria-hidden
          >
            ▾
          </motion.span>
        </div>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-6 px-1 pb-2 pt-5">
              {/* Birth-card spread */}
              <div className="space-y-3">
                <header className="flex items-baseline gap-2">
                  <span style={{ color: bc?.color }} className="font-serif text-base">
                    {bcDetail.card}
                  </span>
                  <span className="font-serif text-sm text-bone">
                    {cardTitle(bcDetail.interpretation.name)}
                  </span>
                </header>
                <Eyebrow>Birth card · {w.planet}</Eyebrow>
                <PositionStack
                  under={bcDetail.interpretation.under}
                  sweet={bcDetail.interpretation.sweet_spot}
                  over={bcDetail.interpretation.over}
                />
              </div>

              <hr className="hairline border-t" />

              {/* Ruling-card spread */}
              <div className="space-y-3">
                <header className="flex items-baseline gap-2">
                  <span style={{ color: prc?.color }} className="font-serif text-base">
                    {prcDetail.card}
                  </span>
                  <span className="font-serif text-sm text-bone">
                    {cardTitle(prcDetail.interpretation.name)}
                  </span>
                </header>
                <Eyebrow>Ruling card · {w.planet}</Eyebrow>
                <PositionStack
                  under={prcDetail.interpretation.under}
                  sweet={prcDetail.interpretation.sweet_spot}
                  over={prcDetail.interpretation.over}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
