"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { FreeCourseSignupForm } from "@/components/free-course/FreeCourseSignupForm";
import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { HomepageLifeSpread } from "@/components/home/HomepageLifeSpread";
import { PlayingCard } from "@/components/PlayingCard";
import {
  birthCardSlug,
  calculateBirthCardFromIsoDate,
  type BirthCardResult,
} from "@/lib/birth-card-calculator";
import { parseCard } from "@/lib/cards";
import { CALCULATOR_PRIVACY_MICROCOPY } from "@/lib/deep-dive";

const RESULT_PLACEMENT = "home-hero-result";

export function HomepageCalculatorHero() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<BirthCardResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.location.hash === "#home-birthdate") {
      dateRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!result) return;
    trackClientFunnelEventOnce("course_offer_shown", {
      placement: RESULT_PLACEMENT,
    });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, [result]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    trackClientFunnelEventOnce("calculator_started", {
      placement: "home-hero",
    });

    const calculated = calculateBirthCardFromIsoDate(date);
    if (!calculated) {
      setResult(null);
      setError("That date could not be calculated. Check it and try again.");
      return;
    }

    setResult(calculated);
    trackClientFunnelEvent("calculator_completed", {
      placement: "home-hero",
    });
    window.__cardBlueprintsElroyBirthdate = date;
    window.dispatchEvent(
      new CustomEvent("elroy:birth-card-revealed", {
        detail: { birthdate: date },
      }),
    );
  }

  const card = result ? parseCard(result.birthCard) : null;
  const cardLabel = result?.birthCard === "Joker" ? "The Joker" : card?.label;
  const slug = result ? birthCardSlug(result.birthCard) : null;

  return (
    <section
      aria-labelledby="home-calculator-title"
      className="border-b border-brand-line bg-brand-paper"
    >
      <div className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-6xl items-center gap-6 px-5 py-7 sm:gap-10 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:gap-16 lg:px-10 lg:py-20">
        <div>
          <p className="type-eyebrow text-brand-oxblood">
            Free · instant · no signup
          </p>
          <h1
            id="home-calculator-title"
            className="type-display mt-3 max-w-[12ch] text-brand-ink sm:mt-4"
          >
            Which playing card were you born under?
          </h1>
          <p className="mt-3 max-w-[34rem] font-serif text-xl leading-relaxed text-brand-ink-soft sm:mt-5 sm:text-2xl">
            Your birthday maps to one card in a fixed 52-card system. Enter it to reveal yours.
          </p>
        </div>

        <div className="rounded-[3px] border border-brand-line-strong bg-brand-ivory p-5 shadow-[0_24px_70px_rgba(43,32,24,0.10)] sm:p-7 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <form onSubmit={submit} noValidate>
            <label htmlFor="home-birthdate" className="type-eyebrow block text-brand-ink">
              Enter your birthday
            </label>
            <input
              ref={dateRef}
              id="home-birthdate"
              type="date"
              value={date}
              onFocus={() =>
                trackClientFunnelEventOnce("calculator_started", {
                  placement: "home-hero",
                })
              }
              onChange={(event) => setDate(event.target.value)}
              aria-describedby={
                error
                  ? "home-birthdate-error home-calculator-privacy"
                  : "home-calculator-privacy"
              }
              aria-invalid={Boolean(error)}
              required
              className="mt-3 min-h-12 w-full scroll-mt-24 rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 font-serif text-brand-ink outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-oxblood/20"
            />
            <p id="home-calculator-privacy" className="mt-2 text-xs leading-relaxed text-brand-ink-soft">
              {CALCULATOR_PRIVACY_MICROCOPY}
            </p>
            {error && (
              <p id="home-birthdate-error" role="alert" className="mt-3 text-sm text-brand-oxblood">
                {error}
              </p>
            )}
            <button type="submit" className="accent-button large-button mt-4 w-full">
              Reveal my birth card
            </button>
          </form>

          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {result && cardLabel ? `Your birth card is ${cardLabel}.` : error}
          </p>

          {result && (
            <div ref={resultRef} className="mt-8 border-t border-brand-line pt-8">
              <div className="flex flex-col items-center text-center">
                {result.birthCard === "Joker" ? (
                  <div className="flex h-44 w-32 items-center justify-center rounded-[3px] border border-brand-line bg-brand-paper text-5xl text-brand-oxblood">
                    ★
                  </div>
                ) : (
                  <PlayingCard
                    code={result.birthCard}
                    size="lg"
                    active
                    glow
                    surface="paper"
                  />
                )}
                <p className="type-eyebrow mt-6 text-brand-bronze">Your birth card</p>
                <h2 className="mt-2 font-serif text-3xl text-brand-ink">
                  {cardLabel}
                </h2>
                {result.rulingCards.length > 0 && (
                  <p className="mt-2 text-sm text-brand-ink-soft">
                    Ruling card{result.rulingCards.length > 1 ? "s" : ""}: {result.rulingCards
                      .map((code) => parseCard(code)?.label ?? code)
                      .join(", ")}
                  </p>
                )}
              </div>

              <DeepDiveCta
                placement={RESULT_PLACEMENT}
                birthdate={date}
                source="home-hero"
                className="mx-auto mt-6"
              />

              {slug && cardLabel && (
                <Link
                  href={`/birth-card/${slug}`}
                  onClick={() =>
                    trackClientFunnelEvent("card_meaning_clicked", {
                      placement: RESULT_PLACEMENT,
                    })
                  }
                  className="editorial-link mt-5 block text-center text-sm text-brand-ink"
                >
                  Read the {cardLabel} meaning →
                </Link>
              )}

              <div className="mt-7 rounded-[3px] border border-brand-line bg-brand-paper p-5">
                <p className="type-eyebrow text-brand-oxblood">Free 4-part course</p>
                <h3 className="mt-2 font-serif text-2xl text-brand-ink">
                  Want to learn how to read your card?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
                  Get the existing four-part birth-card course by email. Your result stays free either way.
                </p>
                <FreeCourseSignupForm
                  source="home-hero-result"
                  surface="paper"
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <ul className="flex flex-wrap gap-2 text-xs text-brand-ink-soft" aria-label="Calculator details">
            {["52 cards", "366 birthdays", "not tarot"].map((item) => (
              <li key={item} className="rounded-[3px] border border-brand-line px-3 py-2">
                {item}
              </li>
            ))}
          </ul>

          <HomepageLifeSpread />
        </div>
      </div>
    </section>
  );
}
