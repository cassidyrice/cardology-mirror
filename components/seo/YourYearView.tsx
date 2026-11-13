"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import { trackClientFunnelEventOnce } from "@/components/analytics/AnalyticsCapture";
import { BirthdayField } from "@/components/bp/BirthdayField";
import { CardSpecimen } from "@/components/bp/CardSpecimen";
import { Gem, gemSuitFromCode } from "@/components/bp/Gem";
import { PlanetGlyph } from "@/components/bp/PlanetGlyph";
import { buildCycle } from "@/components/timing/cycle";
import { birthCardSlug } from "@/lib/birth-card-calculator";
import { parseCard, todayISO } from "@/lib/cards";
import {
  buildPeriodMeaning,
  PERIOD_FILTERS,
  type PeriodCardSeed,
} from "@/lib/period-meanings";
import { buildReading, JokerNotSupportedError } from "@/lib/reading";
import type { PlanetName } from "@/lib/types";
import { PLANET_ORDER } from "@/lib/types";
import { useBirthday } from "@/lib/use-birthday";

const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = /^[^.!?]+[.!?]?/.exec(trimmed);
  return (match?.[0] ?? trimmed).trim();
}

function meaningLine(seeds: PeriodCardSeed[], card: string, planet: PlanetName): string | null {
  const seed = seeds.find((s) => s.code === card);
  const filter = PERIOD_FILTERS.find((entry) => entry.planet === planet);
  if (!seed || !filter) return null;
  return firstSentence(buildPeriodMeaning(seed, filter).essence);
}

function cardLabel(code: string): string {
  return parseCard(code)?.label ?? code;
}

function CardName({ code }: { code: string }) {
  const suit = gemSuitFromCode(code);
  const slug = birthCardSlug(code);
  const inner = (
    <>
      {suit ? <Gem suit={suit} size={18} /> : null}
      {cardLabel(code)}
    </>
  );
  return slug ? (
    <Link href={`/birth-card/${slug}`} className="bp-cardlink">
      {inner}
    </Link>
  ) : (
    <span className="bp-cardlink">{inner}</span>
  );
}

type Period = {
  planet: PlanetName;
  card: string;
  range: string;
  line: string | null;
  isCurrent: boolean;
  isPast: boolean;
};

type Year =
  | { kind: "joker" }
  | {
      kind: "year";
      periods: Period[];
      current: Period;
      todayPct: number;
      todayLabel: string;
      weekCard: string | null;
      weekLine: string | null;
    };

/**
 * Your year as one timeline. The birthday comes from the shared field (entered
 * once on any tool) and the year redraws the moment the date is complete.
 * Your birthday is never stored on our servers: everything runs on this page.
 */
export function YourYearView({ seeds }: { seeds: PeriodCardSeed[] }) {
  const { birthdate, ready, setBirthdate } = useBirthday();

  const year = useMemo<Year | null>(() => {
    if (!birthdate) return null;
    const [, m, d] = birthdate.split("-").map(Number);
    if (m === 12 && d === 31) return { kind: "joker" };
    try {
      const today = todayISO();
      const reading = buildReading(birthdate, today);
      const cycle = buildCycle(birthdate, new Date(`${today}T12:00:00`));
      const periods = PLANET_ORDER.map((planet, index) => {
        const window = cycle.windows[index]!;
        const last = new Date(window.end);
        last.setDate(last.getDate() - 1);
        const card = reading.birth_card_spread.periods[planet];
        return {
          planet,
          card,
          range: `${SHORT.format(window.start)} – ${SHORT.format(last)}`,
          line: meaningLine(seeds, card, planet),
          isCurrent: index === cycle.currentIndex,
          isPast: index < cycle.currentIndex,
        };
      });
      const dayOfYear = cycle.currentIndex * 52 + cycle.daysIntoCurrent;
      const weekCard = reading.daily?.bc?.card ?? null;
      return {
        kind: "year",
        periods,
        current: periods[cycle.currentIndex]!,
        todayPct: Math.min(99.5, ((dayOfYear + 0.5) / 365) * 100),
        todayLabel: SHORT.format(new Date(`${today}T12:00:00`)),
        weekCard,
        weekLine: weekCard ? meaningLine(seeds, weekCard, reading.daily.period_planet as PlanetName) : null,
      };
    } catch (error) {
      if (error instanceof JokerNotSupportedError) return { kind: "joker" };
      return null;
    }
  }, [birthdate, seeds]);

  useEffect(() => {
    if (year?.kind === "year") trackClientFunnelEventOnce("year_viewed", { placement: "your-year" });
  }, [year]);

  return (
    <div className="bp-tool">
      <div className="bp-tool-inputs">
        <div className="bp-panel bp-reg">
          <BirthdayField
            id="your-year-bd"
            label="Birthday, with the year"
            value={ready ? birthdate : ""}
            onValid={setBirthdate}
            hint="Calculated on this page. Your birthday is never stored on our servers."
          />
        </div>
        {year?.kind === "year" ? (
          <div className="bp-panel" aria-live="polite">
            <p className="bp-label">Now</p>
            <p className="bp-h3">
              <span className="bp-planet is-now">
                <PlanetGlyph planet={year.current.planet} size={22} /> {year.current.planet}
              </span>
            </p>
            <p className="bp-mono bp-quiet">{year.current.range}</p>
          </div>
        ) : null}
      </div>

      {!ready ? null : !birthdate ? (
        <p className="bp-quiet">Enter your birthday and your seven periods appear here.</p>
      ) : year?.kind === "joker" ? (
        <div className="bp-panel">
          <p className="bp-h3">December 31 is the Joker.</p>
          <p>
            The formula leaves this date outside the 52-card map, so there is no yearly period sequence to show.{" "}
            <Link href="/birth-card/joker">Read the Joker</Link>.
          </p>
        </div>
      ) : !year ? (
        <p className="bp-red">That isn&rsquo;t a full date. Year, month and day.</p>
      ) : (
        <>
          <section aria-labelledby="year-now-heading" className="bp-readout-head">
            <CardSpecimen code={year.current.card} size="md" />
            <div className="bp-readout-title">
              <p className="bp-label">Period card now</p>
              <h2 id="year-now-heading" className="bp-h2">
                {cardLabel(year.current.card)}
              </h2>
              {year.current.line ? <p>{year.current.line}</p> : null}
              {year.weekCard ? (
                <p className="bp-quiet">
                  This week: <CardName code={year.weekCard} />
                  {year.weekLine ? ` ${year.weekLine}` : ""}
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="year-periods-heading">
            <div className="bp-rule-head">
              <h2 id="year-periods-heading" className="bp-label">
                Your seven periods
              </h2>
            </div>
            <div className="bp-timeline-wrap">
              <div className="bp-timeline-frame">
              <ol className="bp-timeline">
                {year.periods.map((p) => (
                  <li key={p.planet} className={p.isCurrent ? "is-now" : undefined} aria-current={p.isCurrent ? "true" : undefined}>
                    <PlanetGlyph planet={p.planet} size={24} />
                    <span>{p.planet}</span>
                    <span className="bp-mono bp-quiet">{p.range}</span>
                    <CardName code={p.card} />
                    <span className="bp-label">{p.isCurrent ? "Now" : p.isPast ? "Past" : "Ahead"}</span>
                  </li>
                ))}
              </ol>
                <div className="bp-timeline-today" style={{ left: `${year.todayPct}%` }} aria-hidden="true">
                  <span>Today · {year.todayLabel}</span>
                </div>
              </div>
            </div>
          </section>

          <p className="bp-quiet">
            Same birthday, same sequence every year. Want to time a decision inside one of these windows?{" "}
            <Link href="/#readings">Ask in a reading</Link>.
          </p>
        </>
      )}
    </div>
  );
}
