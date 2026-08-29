"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { parseCard } from "@/lib/cards";
import { birthCardSlug } from "@/lib/birth-card-calculator";
import {
  equationPreview,
  isFixedKarmaCard,
  lifeSpread,
  lifetimeKarma,
  spiritSolarCell,
  spiritSpread,
} from "@/lib/karma-origin";
const DECK = [
  "A♥", "2♥", "3♥", "4♥", "5♥", "6♥", "7♥", "8♥", "9♥", "10♥", "J♥", "Q♥", "K♥",
  "A♣", "2♣", "3♣", "4♣", "5♣", "6♣", "7♣", "8♣", "9♣", "10♣", "J♣", "Q♣", "K♣",
  "A♦", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "8♦", "9♦", "10♦", "J♦", "Q♦", "K♦",
  "A♠", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "10♠", "J♠", "Q♠", "K♠",
];

const BEATS = ["Equation", "Spirit (year 0)", "Life path (spread 1)"] as const;

export function KarmaOriginLab({
  birthdate,
  birthCard,
}: {
  birthdate: string;
  birthCard: string;
}) {
  const preview = equationPreview(birthdate);
  const [beat, setBeat] = useState(0);
  const [wrong, setWrong] = useState(false);
  const options = useMemo(() => decoys(birthCard), [birthCard]);

  if (!preview || preview.kind === "joker" || birthCard === "Joker") return null;

  const railIndex = beat === 3 ? 0 : beat;

  return (
    <section className="mt-10 w-full max-w-xl text-left">
      <p className="type-eyebrow text-center">Karma origin</p>
      <h3 className="mt-1 text-center font-serif text-xl text-brand-ink [text-wrap:balance]">
        Find where Environment and Displacement come from
      </h3>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-brand-ink-soft [text-wrap:pretty]">
        Same date, same card. Coordinates. You choose the meaning.
      </p>
      {beat !== 3 && (
        <div
          className="beat-rail"
          role="img"
          aria-label={`${BEATS[railIndex]}. ${railIndex + 1} of 3.`}
        >
          {BEATS.map((name, i) => (
            <span key={name} data-current={i === railIndex} />
          ))}
        </div>
      )}

      {beat === 0 && (
        <EquationBeat
          preview={preview}
          options={options}
          wrong={wrong}
          onWrong={() => setWrong(true)}
          onRight={() => {
            setWrong(false);
            setBeat(isFixedKarmaCard(birthCard) ? 3 : 1);
          }}
        />
      )}

      {beat === 1 && (
        <SpiritBeat
          birthCard={birthCard}
          solarValue={preview.solarValue}
          wrong={wrong}
          onWrong={() => setWrong(true)}
          onRight={() => {
            setWrong(false);
            setBeat(2);
          }}
        />
      )}

      {beat === 2 && <LifeKarmaBeat birthCard={birthCard} />}

      {beat === 3 && (
        <p className="mt-6 rounded-[3px] border border-brand-line bg-brand-paper p-4 text-sm leading-relaxed text-brand-ink-soft [text-wrap:pretty]">
          {birthCard} is a Fixed card. It has no Environment or Displacement pair.
          The rest of the map still stands.
        </p>
      )}
    </section>
  );
}

function EquationBeat({
  preview,
  options,
  wrong,
  onWrong,
  onRight,
}: {
  preview: { month: number; day: number; solarValue: number; card: string };
  options: string[];
  wrong: boolean;
  onWrong: () => void;
  onRight: () => void;
}) {
  const raw = 55 - (2 * preview.month + preview.day);
  return (
    <div className="mt-6 rounded-[3px] border border-brand-line bg-brand-paper p-5">
      <p className="text-sm leading-relaxed text-brand-ink [text-wrap:pretty]">
        Solar value = 55 − (2 × month + day). For {preview.month}/{preview.day}:{" "}
        <span className="eq-nums">
          55 − (2 × {preview.month} + {preview.day}) = {raw}
          {raw <= 0 ? ` → ${raw} + 52 = ${preview.solarValue}` : ""}.
        </span>{" "}
        That solar value is one playing card.
      </p>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-bronze">
        Which card is solar value {preview.solarValue}?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((card) => (
          <button
            key={card}
            type="button"
            className="paper-button small-button"
            onClick={() => (card === preview.card ? onRight() : onWrong())}
          >
            {card}
          </button>
        ))}
      </div>
      {wrong && (
        <p role="status" className="mt-3 text-sm text-brand-oxblood">
          Not that card. Same date, same card.
        </p>
      )}
    </div>
  );
}

function SpiritBeat({
  birthCard,
  solarValue,
  wrong,
  onWrong,
  onRight,
}: {
  birthCard: string;
  solarValue: number;
  wrong: boolean;
  onWrong: () => void;
  onRight: () => void;
}) {
  const target = spiritSolarCell(birthCard);
  const spread = spiritSpread();
  return (
    <div className="mt-6">
      <p className="text-sm leading-relaxed text-brand-ink [text-wrap:pretty]">
        Solar value {solarValue} is {birthCard}. Tap that card on the{" "}
        <strong>Spirit (year 0)</strong> spread, not the life path.
      </p>
      <SpreadBoard
        label="Spirit (year 0)"
        grid={spread.grid}
        crown={spread.crown}
        onPick={(card) => (card === target?.card ? onRight() : onWrong())}
      />
      {wrong && (
        <p role="status" className="mt-3 text-sm text-brand-oxblood">
          Not that coordinate.
        </p>
      )}
    </div>
  );
}

function LifeKarmaBeat({ birthCard }: { birthCard: string }) {
  const karma = lifetimeKarma(birthCard);
  const spread = lifeSpread();

  return (
    <div className="mt-6">
      <p className="text-sm leading-relaxed text-brand-ink [text-wrap:pretty]">
        Same seat, next spread. {birthCard} on the{" "}
        <strong>Life path (spread 1)</strong>, one permutation after spirit.
      </p>
      <SpreadBoard
        label="Life path (spread 1)"
        grid={spread.grid}
        crown={spread.crown}
        highlight={birthCard}
        interactive={false}
        onPick={() => undefined}
      />
      {karma && (
        <div className="mt-4 rounded-[3px] border border-brand-line bg-brand-ivory p-4 text-sm leading-relaxed text-brand-ink">
          <p>
            Environment sits in your spirit seat on spread 1:{" "}
            <MeaningLink code={karma.environment} />.
          </p>
          <p className="mt-2">
            Displacement sits in your life-path seat on year 0:{" "}
            <MeaningLink code={karma.displacement} />.
          </p>
          <p className="mt-2 text-brand-ink-soft [text-wrap:pretty]">
            These cards come from reading spirit against spread 1. Coordinates.
            You choose the meaning.
          </p>
        </div>
      )}
    </div>
  );
}

function SpreadBoard({
  label,
  grid,
  crown,
  highlight,
  interactive = true,
  onPick,
}: {
  label: string;
  grid: string[][];
  crown: string[];
  highlight?: string | null;
  interactive?: boolean;
  onPick: (card: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-bronze">{label}</p>
      <div className="spread-crown mt-2">
        {crown.map((card, i) => (
          <CellButton
            key={`c${i}`}
            card={card}
            highlight={highlight}
            interactive={interactive}
            onPick={onPick}
          />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.flatMap((row, r) =>
          row.map((card, c) => (
            <CellButton
              key={`${r}-${c}`}
              card={card}
              highlight={highlight}
              interactive={interactive}
              onPick={onPick}
            />
          )),
        )}
      </div>
    </div>
  );
}

function CellButton({
  card,
  highlight,
  interactive = true,
  onPick,
}: {
  card: string;
  highlight?: string | null;
  interactive?: boolean;
  onPick: (card: string) => void;
}) {
  const parsed = parseCard(card);
  const lit = highlight === card;
  const suit =
    parsed?.suit === "hearts" || parsed?.suit === "diamonds"
      ? "text-brand-oxblood"
      : "text-brand-ink";
  return (
    <button
      type="button"
      aria-disabled={!interactive}
      tabIndex={interactive ? 0 : -1}
      onClick={() => interactive && onPick(card)}
      className={`spread-cell ${suit} ${lit ? "is-lit" : ""} ${interactive ? "" : "is-static"}`}
    >
      {card}
    </button>
  );
}

function MeaningLink({ code }: { code: string }) {
  const slug = birthCardSlug(code);
  const label = parseCard(code)?.label ?? code;
  if (!slug) return <span>{code}</span>;
  return (
    <Link href={`/birth-card/${slug}`} className="underline underline-offset-4">
      {label} ({code})
    </Link>
  );
}

function decoys(correct: string): string[] {
  const others = DECK.filter((card) => card !== correct);
  const a = others[correct.charCodeAt(0) % others.length];
  const b = others[(correct.charCodeAt(0) + 17) % others.length];
  const picks = [correct, a, b === a ? others[1] : b];
  return picks.sort();
}
