"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { parseCard } from "@/lib/cards";
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
          <section className="rounded-[3px] border border-brand-line bg-brand-ivory p-5 sm:p-6">
            <p className="oracle-eyebrow">choose a card + period filter</p>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-brand-ink-soft">
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
                  className="w-full rounded-[3px] border border-brand-line-strong bg-brand-ivory px-4 py-3 font-serif text-lg text-brand-ink transition"
                >
                  {cards.map((entry) => (
                    <option key={entry.card.slug} value={entry.card.slug}>
                      {entry.card.code} · {entry.card.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-brand-ink-soft">
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
                        className={`rounded-[3px] border px-3 py-3 text-left transition ${
                          activePeriod
                            ? "border-brand-ink bg-brand-ink text-brand-on-dark"
                            : "border-brand-line bg-brand-ivory text-brand-ink hover:border-brand-line-strong"
                        }`}
                        aria-pressed={activePeriod}
                      >
                        <span className="block font-serif text-lg leading-none">{meaning.period}</span>
                        <span className={`mt-1 block text-[0.62rem] uppercase tracking-[0.16em] ${activePeriod ? "text-brand-on-dark-soft" : "text-brand-ink-soft"}`}>
                          {meaning.dayRange}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[3px] border border-brand-line bg-brand-paper-deep p-5">
              <p className="oracle-eyebrow">coverage</p>
              <p className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em] text-brand-ink">
                52 cards × 7 filters = 364 lenses
              </p>
              <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
                This is not a random draw or a forecast. It is a reusable language layer: pick a card, then read the same card through Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune.
              </p>
            </div>
          </section>

          <MeaningPanel meaning={active} />
        </div>

        <section className="shell-ink mt-8 rounded-[3px] border border-brand-ink p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="oracle-eyebrow oracle-eyebrow-on-ink">all seven filters for this card</p>
              <h2 className="mt-2 font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
                {selected.card.code} {selected.card.label}
              </h2>
            </div>
            <Link
              href={`/birth-card/${selected.card.slug}`}
              className="editorial-link text-sm font-bold uppercase tracking-[0.18em] text-brand-on-dark"
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
                className={`group rounded-[3px] border p-4 text-left transition ${
                  meaning.period === active.period
                    ? "border-brand-gold bg-brand-gold-soft"
                    : "border-brand-on-dark-line hover:border-brand-gold"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl text-brand-on-dark">{meaning.period}</p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-brand-on-dark-soft">
                      {meaning.dayRange} · {meaning.periodDomain}
                    </p>
                  </div>
                  <span className="text-brand-gold opacity-70 transition group-hover:translate-x-1">→</span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-brand-on-dark-soft">
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
      className="rounded-[3px] border border-brand-line bg-brand-ivory p-5 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="oracle-eyebrow">interpretation output</p>
          <h2 className="mt-3 font-serif text-4xl leading-[0.9] tracking-[-0.06em] text-brand-ink sm:text-5xl">
            {meaning.cardLabel}
            <span className={`block italic ${paperSuitClass(meaning.cardCode)}`}>
              {meaning.period}
            </span>
          </h2>
        </div>
        <div
          className={`grid h-24 w-16 shrink-0 place-items-center rounded-[3px] border border-brand-line bg-brand-paper font-serif text-3xl ${paperSuitClass(meaning.cardCode)}`}
          aria-label={meaning.cardLabel}
        >
          {meaning.cardCode}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-brand-ink-soft">
        <span className="rounded-[3px] border border-brand-line px-3 py-1">{meaning.dayRange}</span>
        <span className="rounded-[3px] border border-brand-line px-3 py-1">{meaning.suitDomain}</span>
        <span className="rounded-[3px] border border-brand-line px-3 py-1">{meaning.periodDomain}</span>
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

      <div className="mt-6 rounded-[3px] border border-brand-oxblood bg-brand-paper-deep p-5">
        <p className="oracle-eyebrow oracle-eyebrow-accent">reflection prompt</p>
        <p className="mt-3 font-serif text-2xl leading-snug tracking-[-0.03em] text-brand-ink">
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
    <article className={`rounded-[3px] border border-brand-line bg-brand-paper ${compact ? "p-4" : "p-5"}`}>
      <h3 className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-brand-ink-soft">
        {label}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft sm:text-base">{text}</p>
    </article>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
