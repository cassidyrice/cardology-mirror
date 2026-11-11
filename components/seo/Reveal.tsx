"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { CardBack } from "@/components/cards/CardBack";
import { QuestionReadingComposer } from "@/components/checkout/QuestionReadingDrawer";
import { setStage } from "@/components/home/Stage";
import { ShareBirthResultButton } from "@/components/share/ShareCardCanvas";
import { buildCycle, formatRange } from "@/components/timing/cycle";
import {
  birthCardSlug,
  calculateBirthCardRevealFromIsoDate,
  type BirthCardReveal,
} from "@/lib/birth-card-calculator";
import { parseCard, todayISO } from "@/lib/cards";
import { canonicalCompatPairPath } from "@/lib/compat-routing";
import { getCardSeo } from "@/lib/seo-cards";
import { buildReading, JokerNotSupportedError } from "@/lib/reading";
import { shareFacePathFromCode } from "@/lib/share-cards";

type RevealProps = {
  reveal: BirthCardReveal;
  birthdate: string;
  onReset?: () => void;
};

/**
 * The verdict on `/`: shows the user's card, active 52-day planetary window,
 * optional inline 2-card 3D comparison (without leaving `/`), and inline
 * zero-leave question reading checkout (Email or Text delivery).
 */
export function Reveal({ reveal, birthdate, onReset }: RevealProps) {
  const { result } = reveal;
  const isJoker = result.birthCard === "Joker";
  const seo = isJoker ? null : getCardSeo(result.birthCard);
  const label = isJoker
    ? "The Joker"
    : seo?.label ?? parseCard(result.birthCard)?.label ?? result.birthCard;
  const title = seo?.title ?? null;
  const face = shareFacePathFromCode(result.birthCard);
  const cardSlug = isJoker ? null : birthCardSlug(result.birthCard);
  const heading = useRef<HTMLHeadingElement>(null);

  const [compareOpen, setCompareOpen] = useState(false);
  const [secondDate, setSecondDate] = useState("");
  const [secondReveal, setSecondReveal] = useState<BirthCardReveal | null>(null);
  const [secondError, setSecondError] = useState("");

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
    heading.current?.focus({ preventScroll: true });
  }, []);

  function handleSecondCompare(e: FormEvent) {
    e.preventDefault();
    setSecondError("");
    const calcB = calculateBirthCardRevealFromIsoDate(secondDate);
    if (!calcB) {
      setSecondReveal(null);
      setSecondError("Enter their full birth date (year, month, and day).");
      return;
    }
    setSecondReveal(calcB);
    trackClientFunnelEvent("result_compare_clicked", { placement: "home-reveal-inline-3d" });
    const codeB = calcB.result.birthCard;
    const labelB = codeB === "Joker" ? "The Joker" : parseCard(codeB)?.label ?? codeB;
    setStage({
      kind: "pair",
      cardA: { face, label },
      cardB: { face: shareFacePathFromCode(codeB), label: labelB },
    });
  }

  function clearSecondCompare() {
    setSecondReveal(null);
    setSecondDate("");
    setSecondError("");
    const rulingCode = result.rulingCards[0] ?? null;
    setStage({
      kind: "card",
      face,
      label,
      rulingFace: rulingCode ? shareFacePathFromCode(rulingCode) : null,
      rulingLabel:
        rulingCode && rulingCode !== "Joker" ? parseCard(rulingCode)?.label ?? rulingCode : null,
    });
  }

  const secondCode = secondReveal?.result.birthCard ?? null;
  const secondSlug = secondCode && secondCode !== "Joker" ? birthCardSlug(secondCode) : null;
  const secondLabel = secondCode
    ? secondCode === "Joker"
      ? "The Joker"
      : getCardSeo(secondCode)?.label ?? parseCard(secondCode)?.label ?? secondCode
    : null;
  const compatHref =
    cardSlug && secondSlug ? canonicalCompatPairPath(`${cardSlug}-and-${secondSlug}`) : null;

  let i = 0;
  const rise = () => ({ "data-rise": "", style: { "--rise-i": i++ } as React.CSSProperties });

  return (
    <div className="verdict" data-reveal data-in-view="true">
      <div className="verdict-card" aria-hidden="true">
        <div className="flip-scene verdict-card-scene">
          <div className="flip-inner verdict-card-inner">
            <div className="flip-face">
              {face ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={face} alt="" width={624} height={936} className="verdict-card-face" />
              ) : (
                <div className="verdict-card-face verdict-card-joker">Joker</div>
              )}
            </div>
            <div className="flip-face flip-back">
              <div className="verdict-card-face hero-card-back">
                <CardBack />
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 ref={heading} tabIndex={-1} className="verdict-title" {...rise()}>
        {secondLabel ? `${label} × ${secondLabel}` : label}
      </h2>
      <p className="verdict-lead" {...rise()}>
        {secondLabel
          ? "Two cards on the 3D stage. Now ask what is actually happening between you."
          : `Your birth card${title ? `. ${title}` : ""}.`}
      </p>

      {isJoker ? (
        <p className="verdict-line" {...rise()}>
          December 31 sits outside the 52. No fixed card. You are the wild edge of the year, and
          people can tell.{" "}
          <Link href="/contact" className="editorial-link">
            Reach out to Cass directly for a custom Joker note
          </Link>
          .
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
              Active chapter: <strong>{rightNow.periodPlanet}</strong> ({rightNow.periodLabel}
              {rightNow.periodRange ? `, ${rightNow.periodRange}` : ""}) · Today&rsquo;s calendar
              card: {rightNow.dailyLabel} ({rightNow.todayLabel}).
            </p>
          ) : null}

          {/* Inline 2-card 3D pair switcher — zero page navigation needed */}
          <div className="verdict-inline-compare" {...rise()}>
            {!compareOpen && !secondReveal ? (
              <button
                type="button"
                className="paper-button small-button"
                onClick={() => setCompareOpen(true)}
              >
                + Add a second birthday (3D pair view)
              </button>
            ) : (
              <form onSubmit={handleSecondCompare} className="verdict-compare-form" noValidate>
                <label htmlFor="verdict-second-date" className="landing-label">
                  Second person&rsquo;s birthday
                </label>
                <div className="landing-row">
                  <input
                    id="verdict-second-date"
                    type="date"
                    value={secondDate}
                    onChange={(e) => setSecondDate(e.target.value)}
                    className="landing-field"
                  />
                  <button type="submit" className="paper-button">
                    Place both cards
                  </button>
                  {secondReveal ? (
                    <button
                      type="button"
                      onClick={clearSecondCompare}
                      className="editorial-link text-sm"
                    >
                      Solo view
                    </button>
                  ) : null}
                </div>
                {secondError ? (
                  <p className="landing-error" role="alert">
                    {secondError}
                  </p>
                ) : null}
                {compatHref && secondLabel ? (
                  <p className="mt-2 text-sm text-brand-ink-soft">
                    Pairing unlocked: <strong>{label}</strong> + <strong>{secondLabel}</strong> ·{" "}
                    <a href={compatHref} className="editorial-link">
                      Read the free {label} &amp; {secondLabel} library page →
                    </a>
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </>
      )}

      <div className="verdict-actions verdict-actions-row" {...rise()}>
        {cardSlug ? (
          <Link
            href={`/birth-card/${cardSlug}`}
            className="paper-button"
            onClick={() =>
              trackClientFunnelEvent("result_card_clicked", {
                placement: "home-reveal",
              })
            }
          >
            Read full {label} profile
          </Link>
        ) : null}
        <ShareBirthResultButton
          birthCard={result.birthCard}
          placement="home-reveal-share"
          className="paper-button"
        />
      </div>

      {!isJoker && secondCode !== "Joker" ? (
        <div className="verdict-offer" {...rise()}>
          <QuestionReadingComposer
            key={secondReveal ? `pair-${secondDate}` : "solo"}
            defaultTrack="card-blueprint-reading"
            defaultWithPartner={Boolean(secondReveal)}
            initialBirth1={birthdate}
            initialBirth2={secondReveal ? secondDate : ""}
            placement="home-reveal-inline"
            compact
          />
        </div>
      ) : null}

      <p className="verdict-reset" {...rise()}>
        {onReset ? (
          <button type="button" className="editorial-link" onClick={onReset}>
            Wrong birthday? Change it
          </button>
        ) : null}
        <Link href="/explore" className="editorial-link">
          Browse the library index
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
