"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { trackClientFunnelEventOnce } from "@/components/analytics/AnalyticsCapture";
import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { ReportCheckoutButton } from "@/components/checkout/ReportCheckoutButton";
import { CONSULT_SLUG } from "@/lib/blueprint-report";
import { buildCycle, formatRange } from "@/components/timing/cycle";
import { parseCard, todayISO } from "@/lib/cards";
import {
  readCheckoutBirthdate,
  storeCheckoutBirthdate,
} from "@/lib/checkout-birthdate";
import { isJokerBirthdate } from "@/lib/deep-dive";
import {
  buildPeriodMeaning,
  PERIOD_FILTERS,
  type PeriodCardSeed,
} from "@/lib/period-meanings";
import { buildReading, JokerNotSupportedError } from "@/lib/reading";
import { shareFacePathFromCode } from "@/lib/share-cards";
import type { PlanetName } from "@/lib/types";
import { PLANET_ORDER } from "@/lib/types";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = /^[^.!?]+[.!?]?/.exec(trimmed);
  return (match?.[0] ?? trimmed).trim();
}

function seedForCard(
  seeds: PeriodCardSeed[],
  code: string,
): PeriodCardSeed | null {
  return seeds.find((seed) => seed.code === code) ?? null;
}

function meaningLine(
  seeds: PeriodCardSeed[],
  card: string,
  planet: PlanetName,
): string | null {
  const seed = seedForCard(seeds, card);
  const filter = PERIOD_FILTERS.find((entry) => entry.planet === planet);
  if (!seed || !filter) return null;
  return firstSentence(buildPeriodMeaning(seed, filter).essence);
}

function CardFace({ code, size = "sm" }: { code: string; size?: "sm" | "md" }) {
  const src = shareFacePathFromCode(code);
  const label = parseCard(code)?.label ?? code;
  if (!src) return null;
  const dims = size === "md" ? { width: 96, height: 144 } : { width: 56, height: 84 };
  return (
    <img
      src={src}
      alt={`${label} card face`}
      width={dims.width}
      height={dims.height}
      className="rounded-[3px] border border-brand-line bg-brand-paper"
    />
  );
}

export function YourYearView({ seeds }: { seeds: PeriodCardSeed[] }) {
  const [birthdate, setBirthdate] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readCheckoutBirthdate();
    if (stored) setBirthdate(stored);
    setHydrated(true);
  }, []);

  const year = useMemo(() => {
    if (!birthdate) return null;
    if (isJokerBirthdate(birthdate)) return { kind: "joker" as const };
    try {
      const today = todayISO();
      const reading = buildReading(birthdate, today);
      const cycle = buildCycle(birthdate, new Date(`${today}T12:00:00`));
      const activePlanet = reading.active_period.planet as PlanetName;
      const activeIndex = Math.max(0, PLANET_ORDER.indexOf(activePlanet));
      const ordered = PLANET_ORDER.map((planet, offsetFromActive) => {
        const index = (activeIndex + offsetFromActive) % PLANET_ORDER.length;
        const p = PLANET_ORDER[index]!;
        const window = cycle.windows[index]!;
        const card = reading.birth_card_spread.periods[p];
        return {
          planet: p,
          card,
          cardLabel: parseCard(card)?.label ?? card,
          range: formatRange(window),
          startLabel: DATE_FMT.format(window.start),
          line: meaningLine(seeds, card, p),
          isCurrent: offsetFromActive === 0,
        };
      });
      const dayCard = reading.daily.bc.card;
      return {
        kind: "year" as const,
        periods: ordered,
        dayCard,
        dayCardLabel: dayCard ? parseCard(dayCard)?.label ?? dayCard : null,
        dayLine:
          dayCard
            ? meaningLine(seeds, dayCard, reading.daily.period_planet as PlanetName)
            : null,
      };
    } catch (error) {
      if (error instanceof JokerNotSupportedError) return { kind: "joker" as const };
      return null;
    }
  }, [birthdate, seeds]);

  useEffect(() => {
    if (year?.kind === "year") {
      trackClientFunnelEventOnce("year_viewed", { placement: "your-year" });
    }
  }, [year]);

  function submitDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = storeCheckoutBirthdate(draftDate);
    if (next) {
      setBirthdate(next);
      setDraftDate(next);
    }
  }

  if (!hydrated) {
    return (
      <p className="text-sm text-brand-ink-soft" aria-live="polite">
        Loading your year…
      </p>
    );
  }

  if (!birthdate) {
    return (
      <form
        onSubmit={submitDate}
        className="mx-auto flex w-full max-w-md flex-col items-center gap-3"
      >
        <label htmlFor="your-year-bd" className="type-eyebrow block w-full text-center">
          Enter your birthday
        </label>
        <input
          id="your-year-bd"
          type="date"
          value={draftDate}
          onChange={(event) => setDraftDate(event.target.value)}
          className="w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink"
          required
        />
        <button type="submit" className="accent-button large-button w-full text-center sm:w-auto">
          See your year
        </button>
        <p className="text-center text-xs leading-relaxed text-brand-ink-soft">
          Calculated on this page. Your birthday is never stored on our servers.
        </p>
      </form>
    );
  }

  if (year?.kind === "joker") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="font-serif text-xl leading-snug text-brand-ink">
          December 31 is the Joker boundary, sometimes called the Day Out of Time.
        </p>
        <p className="text-sm leading-relaxed text-brand-ink-soft">
          The formula leaves this date outside the 52-card map, so there is no yearly
          period sequence to show. The System Guide still covers how the rest of the
          deck works.
        </p>
        <button
          type="button"
          className="text-xs text-brand-ink-soft underline underline-offset-4"
          onClick={() => {
            setBirthdate("");
            setDraftDate("");
          }}
        >
          Try a different birthday
        </button>
        <ReportCheckoutButton slug={CONSULT_SLUG} placement="your-year" birthdate={birthdate} />
        <p className="text-center text-sm leading-relaxed text-brand-ink-soft">
          Just the report, no call?{" "}
          <ReportCheckoutButton
            variant="link"
            placement="your-year-report-only"
            birthdate={birthdate}
            className="text-brand-ink"
          />
        </p>
      </div>
    );
  }

  if (!year || year.kind !== "year") {
    return (
      <p className="text-sm text-brand-oxblood">
        Enter a full date (year, month, and day) to see your year.
      </p>
    );
  }

  const current = year.periods[0]!;
  const upcoming = year.periods.slice(1);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <section
        aria-labelledby="current-period-heading"
        className="border border-brand-line bg-brand-ivory px-4 py-4 text-center"
      >
        <p className="type-eyebrow mb-2">Now</p>
        <h2 id="current-period-heading" className="font-serif text-2xl text-brand-ink">
          {current.planet}. {current.cardLabel}.
        </h2>
        <p className="mt-1 text-sm text-brand-ink-soft">{current.range}</p>
        <div className="mt-3 flex justify-center">
          <CardFace code={current.card} size="md" />
        </div>
        {current.line && (
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">{current.line}</p>
        )}
      </section>

      {year.dayCard && year.dayCardLabel && (
        <section className="flex items-center gap-3 border border-brand-line bg-brand-paper px-3 py-3">
          <CardFace code={year.dayCard} />
          <div className="min-w-0 text-left">
            <p className="type-eyebrow">Today&apos;s card</p>
            <p className="font-serif text-lg text-brand-ink">{year.dayCardLabel}</p>
            {year.dayLine && (
              <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">{year.dayLine}</p>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="year-periods-heading">
        <h2 id="year-periods-heading" className="type-eyebrow mb-3">
          The rest of your year
        </h2>
        <ol className="flex flex-col gap-3">
          {upcoming.map((period) => (
            <li
              key={period.planet}
              className="flex items-start gap-3 border border-brand-line bg-brand-paper px-3 py-3"
            >
              <CardFace code={period.card} />
              <div className="min-w-0 text-left">
                <p className="font-serif text-lg leading-snug text-brand-ink">
                  {period.planet}. {period.cardLabel}.
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-brand-bronze">
                  Starts {period.startLabel}
                </p>
                {period.line && (
                  <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
                    {period.line}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center text-sm leading-relaxed text-brand-ink-soft">
        Same birthday, same sequence every year; the cards change with the calendar.
      </p>

      {/* TODO(privacy): Email form "Email me when my period changes" — email + consent
          checkbox to store birthday for timing. Gate on Cass privacy decision
          (plans/year-in-cards.md Phase 0 step 3). Do not ship until approved. */}

      <div className="flex flex-col items-center gap-3">
        <DeepDiveCta
          placement="your-year"
          birthdate={birthdate}
          source="birth-card-calculator"
        />
        <button
          type="button"
          className="text-xs text-brand-ink-soft underline underline-offset-4"
          onClick={() => {
            setBirthdate("");
            setDraftDate("");
          }}
        >
          Change birthday
        </button>
        <Link
          href="/birth-card-calculator"
          className="text-xs text-brand-ink-soft underline underline-offset-4"
        >
          Back to calculator
        </Link>
      </div>
    </div>
  );
}
