"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { CardBack } from "@/components/cards/CardBack";
import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import { OfferCta } from "@/components/seo/OfferCta";
import { buildCycle, formatRange } from "@/components/timing/cycle";
import { birthCardSlug } from "@/lib/birth-card-calculator";
import { parseCard, todayISO } from "@/lib/cards";
import { type BirthCardReveal } from "@/lib/birth-card-calculator";
import { getCardSeo } from "@/lib/seo-cards";
import { buildReading, JokerNotSupportedError } from "@/lib/reading";
import { shareFacePathFromCode } from "@/lib/share-cards";

type RevealProps = {
  reveal: BirthCardReveal;
  birthdate: string;
  onReset?: () => void;
};

/**
 * The verdict. Lands in the place the form left, part by part, after the card
 * on the stage has turned (docs/design/MOTION.md). Below 1024px the stage is
 * behind the first screen, so the turned card is repeated here.
 */
export function Reveal({ reveal, birthdate, onReset }: RevealProps) {
  const { result } = reveal;
  const isJoker = result.birthCard === "Joker";
  const seo = isJoker ? null : getCardSeo(result.birthCard);
  const label = isJoker ? "The Joker" : seo?.label ?? parseCard(result.birthCard)?.label ?? result.birthCard;
  const title = seo?.title ?? null;
  const face = shareFacePathFromCode(result.birthCard);
  const cardSlug = isJoker ? null : birthCardSlug(result.birthCard);
  const heading = useRef<HTMLHeadingElement>(null);

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
      return {
        periodLabel: periodSeo?.label ?? periodCode ?? "n/a",
        periodPlanet: reading.active_period.planet,
        periodRange: window ? formatRange(window) : "",
        dailyLabel: dailySeo?.label ?? dailyCode ?? "n/a",
        todayLabel: formatIsoShort(todayISO()),
      };
    } catch (error) {
      if (error instanceof JokerNotSupportedError) return null;
      return null;
    }
  }, [birthdate, isJoker]);

  useEffect(() => {
    trackClientFunnelEventOnce("reveal_shown", { placement: "home-landing" });
    // The keyboard continues from the verdict, not from where the form was.
    heading.current?.focus({ preventScroll: true });
  }, []);

  let i = 0;
  const rise = () => ({ "data-rise": "", style: { "--rise-i": i++ } as React.CSSProperties });

  return (
    <div className="verdict" data-reveal data-in-view="true">
      <div className="verdict-card" aria-hidden="true">
        <div className="flip-scene verdict-card-scene">
          <div className="flip-inner verdict-card-inner">
            <div className="flip-face">
              {face ? (
                <img src={face} alt="" width={624} height={936} className="verdict-card-face" />
              ) : (
                <div className="verdict-card-face verdict-card-joker">Joker</div>
              )}
            </div>
            <div className="flip-face flip-back">
              <div className="verdict-card-face hero-card-back"><CardBack /></div>
            </div>
          </div>
        </div>
      </div>

      <h2 ref={heading} tabIndex={-1} className="verdict-title" {...rise()}>
        {label}
      </h2>
      <p className="verdict-lead" {...rise()}>
        Your birth card{title ? `. ${title}` : ""}.
      </p>

      {isJoker ? (
        <p className="verdict-line" {...rise()}>
          December 31 sits outside the 52. No fixed card. You are the wild edge of the year, and people can tell.
        </p>
      ) : (
        <>
          {seo?.sweetSpot ? (
            <p className="verdict-line" {...rise()}>
              <strong>What you&rsquo;re good at.</strong> {seo.sweetSpot}
            </p>
          ) : null}
          {seo?.over ? (
            <p className="verdict-line" {...rise()}>
              <strong>Where it trips you.</strong> {seo.over}
            </p>
          ) : null}
          {rightNow ? (
            <p className="verdict-now" {...rise()}>
              Right now you are in a {rightNow.periodPlanet} period, the {rightNow.periodLabel}
              {rightNow.periodRange ? `, ${rightNow.periodRange}` : ""}. Today&rsquo;s card is the {rightNow.dailyLabel}, {rightNow.todayLabel}.
            </p>
          ) : null}
        </>
      )}

      <div className="verdict-actions" {...rise()}>
        {cardSlug ? (
          <Link
            href={`/birth-card/${cardSlug}`}
            className="accent-button large-button"
            onClick={() =>
              trackClientFunnelEvent("result_card_clicked", {
                placement: "home-reveal",
              })
            }
          >
            Read my card. All of it
          </Link>
        ) : null}
        <Link
          href="/birth-card-compatibility-calculator"
          className="paper-button large-button"
          onClick={() =>
            trackClientFunnelEvent("result_compare_clicked", {
              placement: "home-reveal",
            })
          }
        >
          Compare it with theirs
        </Link>
        <ShareBirthResultButton
          birthCard={result.birthCard}
          placement="home-reveal-share"
          className="paper-button large-button"
        />
      </div>

      {!isJoker ? (
        <div {...rise()}>
          <OfferCta className="verdict-offer" />
        </div>
      ) : null}

      <p className="verdict-reset" {...rise()}>
        {onReset ? (
          <button type="button" className="editorial-link" onClick={onReset}>
            Wrong birthday? Change it
          </button>
        ) : null}
        <Link href="/explore" className="editorial-link">
          Keep poking around
        </Link>
      </p>
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
