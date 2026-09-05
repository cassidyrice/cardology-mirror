"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import { buildCycle, formatRange } from "@/components/timing/cycle";
import { parseCard, todayISO } from "@/lib/cards";
import { type BirthCardReveal } from "@/lib/birth-card-calculator";
import { getCardSeo } from "@/lib/seo-cards";
import { buildReading, JokerNotSupportedError } from "@/lib/reading";
import { shareFacePathFromCode } from "@/lib/share-cards";

type RevealProps = {
  reveal: BirthCardReveal;
  birthdate: string;
};

export function Reveal({ reveal, birthdate }: RevealProps) {
  const { result } = reveal;
  const isJoker = result.birthCard === "Joker";
  const seo = isJoker ? null : getCardSeo(result.birthCard);
  const label = isJoker ? "The Joker" : seo?.label ?? parseCard(result.birthCard)?.label ?? result.birthCard;
  const title = seo?.title ?? null;
  const face = shareFacePathFromCode(result.birthCard);

  const rightNow = useMemo(() => {
    if (isJoker) return null;
    try {
      const reading = buildReading(birthdate, todayISO());
      const cycle = buildCycle(birthdate);
      const window = cycle.windows[cycle.currentIndex];
      const periodCode = reading.active_period.bc_card;
      const periodSeo = periodCode ? getCardSeo(periodCode) : null;
      const dailyCode = reading.daily.bc.card;
      const dailySeo = dailyCode ? getCardSeo(dailyCode) : null;
      const today = todayISO();
      return {
        periodLabel: periodSeo?.label ?? periodCode ?? "—",
        periodPlanet: reading.active_period.planet,
        periodRange: window ? formatRange(window) : "",
        dailyLabel: dailySeo?.label ?? dailyCode ?? "—",
        todayLabel: formatIsoShort(today),
      };
    } catch (error) {
      if (error instanceof JokerNotSupportedError) return null;
      return null;
    }
  }, [birthdate, isJoker]);

  useEffect(() => {
    trackClientFunnelEventOnce("reveal_shown", { placement: "home-landing" });
  }, []);

  return (
    <div className="landing-reveal mx-auto w-full max-w-md text-center" data-reveal>
      <div className="landing-reveal-face mx-auto">
        {face ? (
          <img
            src={face}
            alt={label}
            width={624}
            height={936}
            className="landing-reveal-img"
          />
        ) : (
          <div className="landing-reveal-joker" aria-hidden>
            ★
          </div>
        )}
      </div>

      <p className="type-eyebrow mt-5 text-brand-bronze">Your birth card</p>
      <h2 className="mt-1 font-serif text-3xl leading-tight text-brand-ink">{label}</h2>
      {title ? <p className="mt-1 text-sm text-brand-ink-soft">{title}</p> : null}

      {isJoker ? (
        <p className="mt-6 font-serif text-lg leading-snug text-brand-ink">
          December 31 sits outside the 52. No fixed card — the wild edge of the year.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 text-left">
            <RevealLine kicker="Your strength" body={seo?.sweetSpot ?? ""} />
            <RevealLine kicker="Where it trips you" body={seo?.over ?? ""} />
          </div>

          {rightNow ? (
            <div className="mt-5 border border-brand-ink bg-brand-paper p-4 text-left">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brand-ink-soft">
                Right now
              </p>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink">
                <span className="font-semibold">{rightNow.periodPlanet}</span>
                {" · "}
                {rightNow.periodLabel}
                {rightNow.periodRange ? ` · ${rightNow.periodRange}` : ""}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
                Today&rsquo;s card: {rightNow.dailyLabel} · {rightNow.todayLabel}
              </p>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-8 flex flex-col items-stretch gap-3">
        <ShareBirthResultButton
          birthCard={result.birthCard}
          placement="home-reveal-share"
          className="paper-button large-button w-full"
        />
        <p className="text-sm leading-relaxed text-brand-ink-soft">
          The same math runs a calendar.{" "}
          <Link
            href="/content-engine"
            className="font-medium text-brand-ink underline underline-offset-4"
            onClick={() =>
              trackClientFunnelEvent("engine_link_clicked", {
                placement: "home-reveal",
              })
            }
          >
            Use it as a tool for creating →
          </Link>
        </p>
      </div>
    </div>
  );
}

function RevealLine({ kicker, body }: { kicker: string; body: string }) {
  if (!body) return null;
  return (
    <div className="border border-brand-ink bg-brand-paper p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brand-ink-soft">
        {kicker}
      </p>
      <p className="mt-2 font-serif text-lg leading-snug text-brand-ink">{body}</p>
    </div>
  );
}

function formatIsoShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}
