"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
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
  const seat =
    seats.find((item) => item.position === selected) ??
    seats.find((item) => item.position === 1) ??
    seats[0];

  function onBoardKey(e: KeyboardEvent<HTMLDivElement>) {
    const idx = seats.findIndex((item) => item.position === selected);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(seats[(idx + 1) % seats.length].position);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(seats[(idx - 1 + seats.length) % seats.length].position);
    }
  }

  return (
    <section className="mt-10 w-full max-w-xl text-left">
      <p className="type-eyebrow text-center">Life path (spread 1)</p>
      <p className="mt-1 text-center font-serif text-xl text-brand-ink [text-wrap:balance]">
        {profile.birthCardLabel}
      </p>
      <div
        role="listbox"
        aria-label="Your Life Path seats"
        tabIndex={0}
        onKeyDown={onBoardKey}
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-7"
      >
        {seats.map((item) => (
          <button
            key={item.position}
            type="button"
            role="option"
            aria-selected={item.position === selected}
            aria-pressed={item.position === selected}
            onClick={() => setSelected(item.position)}
            className="life-seat"
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
        <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft [text-wrap:pretty]">
          <span className="font-serif text-brand-ink">
            {seat.shortTitle}. {seat.label}.
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
