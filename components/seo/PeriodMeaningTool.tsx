"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CardPeriodMeanings, PeriodMeaning } from "@/lib/period-meanings";

interface PeriodMeaningToolProps {
  cards: CardPeriodMeanings[];
}

export function PeriodMeaningTool({ cards }: PeriodMeaningToolProps) {
  const defaultCard = cards.find((entry) => entry.card.code === "8♦") ?? cards[0];
  const [selectedSlug, setSelectedSlug] = useState(defaultCard.card.slug);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultCard.meanings[0].period);

  const selected = useMemo(
    () => cards.find((entry) => entry.card.slug === selectedSlug) ?? defaultCard,
    [cards, defaultCard, selectedSlug],
  );

  const active =
    selected.meanings.find((meaning) => meaning.period === selectedPeriod) ?? selected.meanings[0];

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="rounded-[2rem] border border-[#14110d]/15 bg-[#f4f0e7]/80 p-5 shadow-[0_1.5rem_4rem_rgba(20,17,13,0.08)] sm:p-6">
            <p className="oracle-eyebrow">choose a card + period filter</p>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#14110d]/55">
                  Card
                </span>
                <select
                  value={selectedSlug}
                  onChange={(event) => {
                    setSelectedSlug(event.target.value);
                    setSelectedPeriod(
                      cards.find((entry) => entry.card.slug === event.target.value)?.meanings[0].period ??
                        selectedPeriod,
                    );
                  }}
                  className="w-full rounded-full border border-[#14110d]/20 bg-[#fffaf0] px-4 py-3 font-serif text-lg text-[#14110d] outline-none transition focus:border-[#9e3d24] focus:ring-4 focus:ring-[#9e3d24]/10"
                >
                  {cards.map((entry) => (
                    <option key={entry.card.slug} value={entry.card.slug}>
                      {entry.card.code} · {entry.card.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#14110d]/55">
                  52-day filter
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {selected.meanings.map((meaning) => {
                    const activePeriod = meaning.period === active.period;
                    return (
                      <button
                        key={meaning.period}
                        type="button"
                        onClick={() => setSelectedPeriod(meaning.period)}
                        className={`rounded-2xl border px-3 py-3 text-left transition ${
                          activePeriod
                            ? "border-[#14110d] bg-[#14110d] text-[#f4f0e7] shadow-[0_1rem_2.5rem_rgba(20,17,13,0.16)]"
                            : "border-[#14110d]/14 bg-[#fffaf0]/65 text-[#14110d] hover:border-[#14110d]/35"
                        }`}
                        aria-pressed={activePeriod}
                      >
                        <span className="block font-serif text-lg leading-none">{meaning.period}</span>
                        <span className={`mt-1 block text-[0.62rem] uppercase tracking-[0.16em] ${activePeriod ? "text-[#eadfcd]" : "text-[#14110d]/50"}`}>
                          {meaning.dayRange}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[#14110d]/12 bg-[#eadfcd]/55 p-5">
              <p className="oracle-eyebrow">coverage</p>
              <p className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] text-[#14110d]">
                52 cards × 7 filters = 364 lenses
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">
                This is not a random draw or a forecast. It is a reusable language layer: pick a card, then read the same card through Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune.
              </p>
            </div>
          </section>

          <MeaningPanel meaning={active} />
        </div>

        <section className="mt-8 rounded-[2rem] border border-[#14110d]/15 bg-[#14110d] p-5 text-[#f4f0e7] shadow-[0_1.5rem_4rem_rgba(20,17,13,0.16)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">all seven filters for this card</p>
              <h2 className="mt-2 font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
                {selected.card.code} {selected.card.label}
              </h2>
            </div>
            <Link
              href={`/birth-card/${selected.card.slug}`}
              className="text-sm font-bold uppercase tracking-[0.18em] text-[#d9b26a] underline decoration-[#d9b26a]/35 underline-offset-4"
            >
              open card page →
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {selected.meanings.map((meaning) => (
              <button
                key={meaning.period}
                type="button"
                onClick={() => {
                  setSelectedPeriod(meaning.period);
                  document.getElementById("period-meaning-output")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`group rounded-3xl border p-4 text-left transition ${
                  meaning.period === active.period
                    ? "border-[#d9b26a]/60 bg-[#d9b26a]/10"
                    : "border-[#f4f0e7]/10 bg-[#f4f0e7]/[0.03] hover:border-[#d9b26a]/35"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl text-[#f4f0e7]">{meaning.period}</p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-[#c8bca8]">
                      {meaning.dayRange} · {meaning.periodDomain}
                    </p>
                  </div>
                  <span className="text-[#d9b26a] opacity-70 transition group-hover:translate-x-1">→</span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#d7cdbc]">
                  {meaning.alignment}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MeaningPanel({ meaning }: { meaning: PeriodMeaning }) {
  return (
    <section
      id="period-meaning-output"
      className="rounded-[2rem] border border-[#14110d]/18 bg-[#fffaf0]/86 p-5 shadow-[0_1.5rem_4rem_rgba(20,17,13,0.1)] sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="oracle-eyebrow">interpretation output</p>
          <h2 className="mt-3 font-serif text-4xl leading-[0.9] tracking-[-0.06em] text-[#14110d] sm:text-5xl">
            {meaning.cardLabel}
            <span className="block italic" style={{ color: meaning.cardColor }}>
              {meaning.period}
            </span>
          </h2>
        </div>
        <div
          className="grid h-24 w-16 shrink-0 place-items-center rounded-xl border border-[#14110d]/18 bg-[#f4f0e7] font-serif text-3xl shadow-[0_1rem_2rem_rgba(20,17,13,0.12)]"
          style={{ color: meaning.cardColor }}
          aria-label={meaning.cardLabel}
        >
          {meaning.cardCode}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#14110d]/60">
        <span className="rounded-full border border-[#14110d]/15 px-3 py-1">{meaning.dayRange}</span>
        <span className="rounded-full border border-[#14110d]/15 px-3 py-1">{meaning.suitDomain}</span>
        <span className="rounded-full border border-[#14110d]/15 px-3 py-1">{meaning.periodDomain}</span>
      </div>

      <div className="mt-7 grid gap-4">
        <MeaningBlock label="Card essence" text={meaning.essence} />
        <MeaningBlock label="Period lens" text={meaning.periodLens} />
        <MeaningBlock label="Shadow" text={meaning.shadow} />
        <MeaningBlock label="Alignment" text={meaning.alignment} />
        <div className="grid gap-4 sm:grid-cols-2">
          <MeaningBlock label="Challenge pattern" text={meaning.challenge} compact />
          <MeaningBlock label="Support pattern" text={meaning.support} compact />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[#9e3d24]/25 bg-[#9e3d24]/[0.08] p-5">
        <p className="oracle-eyebrow text-[#9e3d24]">reflection prompt</p>
        <p className="mt-3 font-serif text-2xl leading-snug tracking-[-0.03em] text-[#14110d]">
          {meaning.reflectionPrompt}
        </p>
      </div>
    </section>
  );
}

function MeaningBlock({
  label,
  text,
  compact = false,
}: {
  label: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <article className={`rounded-3xl border border-[#14110d]/12 bg-[#f4f0e7]/70 ${compact ? "p-4" : "p-5"}`}>
      <h3 className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#14110d]/[0.52]">
        {label}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[#3d352d] sm:text-base">{text}</p>
    </article>
  );
}
