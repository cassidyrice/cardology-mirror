"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";

import { trackClientFunnelEventOnce } from "@/components/analytics/AnalyticsCapture";
import { buildCycle } from "@/components/timing/cycle";
import { birthCardSlug } from "@/lib/birth-card-calculator";
import { parseCard, todayISO } from "@/lib/cards";
import { buildReading } from "@/lib/reading";
import type { PlanetName } from "@/lib/types";
import { useBirthday } from "@/lib/use-birthday";

import { BirthdayField } from "./BirthdayField";
import { CardSpecimen } from "./CardSpecimen";
import { Gem, gemSuitFromCode } from "./Gem";
import { PlanetGlyph } from "./PlanetGlyph";

const EXAMPLE_BIRTHDATE = "1990-02-17";
const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function label(code: string | null | undefined): string {
  if (!code) return "";
  return code === "Joker" ? "The Joker" : parseCard(code)?.label ?? code;
}

function firstSentence(text: string | undefined): string {
  if (!text) return "";
  const match = /^[^.!?]+[.!?]/.exec(text.trim());
  return (match?.[0] ?? text).trim();
}

function CardLink({ code }: { code: string }) {
  const slug = birthCardSlug(code);
  const suit = gemSuitFromCode(code);
  const body = (
    <>
      {suit ? <Gem suit={suit} size={18} /> : null}
      <span>{label(code)}</span>
    </>
  );
  return slug ? (
    <Link href={`/birth-card/${slug}`} className="bp-cardlink">
      {body}
    </Link>
  ) : (
    <span className="bp-cardlink">{body}</span>
  );
}

type Readout =
  | { kind: "joker" }
  | {
      kind: "card";
      birthCard: string;
      title: string;
      line: string;
      ruling: string[];
      planet: PlanetName;
      periodCard: string;
      periodEnds: string;
      weekCard: string | null;
      karma: [string, string] | null;
    };

function readoutFor(birthdate: string): Readout | null {
  const [, m, d] = birthdate.split("-").map(Number);
  if (m === 12 && d === 31) return { kind: "joker" };
  try {
    const today = todayISO();
    const r = buildReading(birthdate, today);
    const cycle = buildCycle(birthdate, new Date(`${today}T12:00:00`));
    const window = cycle.windows[cycle.currentIndex];
    const lastDay = new Date(window.end);
    lastDay.setDate(lastDay.getDate() - 1);
    const karma = r.karma?.bc_lifetime;
    return {
      kind: "card",
      birthCard: r.archetype.birth_card,
      title: r.archetype.description?.title ?? "",
      line: firstSentence(r.archetype.description?.core_identity),
      ruling: [r.archetype.prc, r.archetype.prc_secondary].filter(Boolean) as string[],
      planet: r.active_period.planet,
      periodCard: r.active_period.bc_card,
      periodEnds: SHORT.format(lastDay),
      weekCard: r.daily?.bc?.card ?? null,
      karma: karma?.environment && karma?.displacement ? [karma.environment, karma.displacement] : null,
    };
  } catch {
    return null;
  }
}

export function BlueprintHero() {
  const { birthdate, ready, setBirthdate } = useBirthday();
  const tracked = useRef(false);
  const isExample = !birthdate;
  const active = birthdate || EXAMPLE_BIRTHDATE;
  const readout = useMemo(() => readoutFor(active), [active]);

  function onValid(iso: string) {
    if (!tracked.current) {
      tracked.current = true;
      trackClientFunnelEventOnce("calculator_started", { placement: "home-landing" });
      trackClientFunnelEventOnce("calculator_completed", { placement: "home-landing" });
    }
    setBirthdate(iso);
  }

  return (
    <section className="bp-hero" aria-labelledby="home-purpose-title">
      <div className="bp-hero-copy">
        <p className="bp-label">Free birth card lookup · No sign-up</p>
        <h1 id="home-purpose-title" className="bp-display">
          Your birthday is a playing card. <span className="bp-red">Find yours.</span>
        </h1>
        <p className="bp-lead">
          Cardology maps every birthday to one card in a standard 52-card deck, then charts your year
          through seven planetary periods. A lens for reflection, not a prediction.
        </p>
        <div className="bp-panel bp-reg">
          <BirthdayField
            id="home-birthdate"
            label="Your birthday"
            value={ready ? birthdate : ""}
            onValid={onValid}
            hint="Your card appears as soon as the date is complete. Nothing is saved or sent."
          />
        </div>
      </div>

      <div className="bp-hero-readout" aria-live="polite">
        {readout?.kind === "joker" ? (
          <div className="bp-panel">
            <p className="bp-label">December 31</p>
            <p className="bp-h3">The Joker</p>
            <p>
              December 31 is the one birthday outside the 52 cards. It has no spread or periods, so the timing
              tools don&rsquo;t apply. <Link href="/birth-card/joker">Read the Joker</Link>.
            </p>
          </div>
        ) : readout ? (
          <>
            <div className="bp-readout-head">
              <CardSpecimen code={readout.birthCard} size="lg" />
              <div className="bp-readout-title">
                <p className="bp-label">{isExample ? "Example · February 17" : "Your birth card"}</p>
                <p className="bp-h2">{label(readout.birthCard)}</p>
                {readout.title ? <p className="bp-red bp-title-line">{readout.title}</p> : null}
                {readout.line ? <p className="bp-quiet">{readout.line}</p> : null}
              </div>
            </div>

            <dl className="bp-table">
              <div>
                <dt className="bp-label">Ruling card</dt>
                <dd>
                  {readout.ruling.map((code) => (
                    <CardLink key={code} code={code} />
                  ))}
                </dd>
              </div>
              <div>
                <dt className="bp-label">Period now</dt>
                <dd>
                  <span className="bp-planet is-now">
                    <PlanetGlyph planet={readout.planet} size={18} />
                    {readout.planet}
                  </span>
                  <CardLink code={readout.periodCard} />
                  <span className="bp-quiet bp-mono">to {readout.periodEnds}</span>
                </dd>
              </div>
              {readout.weekCard ? (
                <div>
                  <dt className="bp-label">This week</dt>
                  <dd>
                    <CardLink code={readout.weekCard} />
                  </dd>
                </div>
              ) : null}
              {readout.karma ? (
                <div>
                  <dt className="bp-label">Karma cards</dt>
                  <dd>
                    <CardLink code={readout.karma[0]} />
                    <CardLink code={readout.karma[1]} />
                  </dd>
                </div>
              ) : null}
            </dl>

            <nav className="bp-next" aria-label="Go further">
              <Link href={`/birth-card/${birthCardSlug(readout.birthCard) ?? ""}`}>Full profile →</Link>
              <Link href="/your-year">Your year →</Link>
              <Link href="/birth-card-compatibility-calculator">Compare with someone →</Link>
            </nav>
          </>
        ) : null}
      </div>
    </section>
  );
}
