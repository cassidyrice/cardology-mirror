"use client";

import { useMemo, useState } from "react";
import {
  buildLifePathProfile,
  type LifePathCard,
} from "@/lib/life-path";
import { parseCard } from "@/lib/cards";

export function LifePathBoardSolo({ birthdate }: { birthdate: string }) {
  const profile = useMemo(
    () => buildLifePathProfile(birthdate, "You"),
    [birthdate],
  );
  const [selected, setSelected] = useState(1);
  if (!profile) return null;
  const seats = profile.allCards;
  const seat = seats.find((item) => item.position === selected) ?? seats[0];

  return (
    <section className="mt-10 w-full max-w-xl text-left">
      <p className="type-eyebrow text-center">Life path (spread 1)</p>
      <p className="mt-1 text-center font-serif text-xl text-brand-ink">
        {profile.birthCardLabel}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-7">
        {seats.map((item) => (
          <button
            key={item.position}
            type="button"
            aria-pressed={item.position === selected}
            onClick={() => setSelected(item.position)}
            className={`rounded-[3px] border px-2 py-3 text-left ${
              item.position === selected
                ? "border-gold bg-brand-ivory"
                : "border-brand-line bg-brand-paper"
            }`}
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-bronze">
              {item.shortTitle}
            </p>
            <p className={`mt-1 font-serif text-lg leading-none ${suitClass(item)}`}>
              {item.card}
            </p>
          </button>
        ))}
      </div>
      {seat && (
        <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft">
          <span className="font-serif text-brand-ink">
            {seat.shortTitle} — {seat.label}.
          </span>{" "}
          {seat.constitution}
        </p>
      )}
    </section>
  );
}

function suitClass(card: LifePathCard): string {
  const parsed = parseCard(card.card);
  return parsed?.suit === "hearts" || parsed?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
