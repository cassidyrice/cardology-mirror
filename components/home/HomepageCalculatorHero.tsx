"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { FreeCourseSignupForm } from "@/components/free-course/FreeCourseSignupForm";
import { PlayingCard } from "@/components/PlayingCard";
import {
  birthCardSlug,
  calculateBirthCardFromIsoDate,
  type BirthCardResult,
} from "@/lib/birth-card-calculator";
import { parseCard } from "@/lib/cards";

const RESULT_PLACEMENT = "home-hero-result";

export function HomepageCalculatorHero() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<BirthCardResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

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
              id="home-birthdate"
              type="date"
              value={date}
              onFocus={() =>
                trackClientFunnelEventOnce("calculator_started", {
                  placement: "home-hero",
                })
              }
              onChange={(event) => setDate(event.target.value)}
              aria-describedby={error ? "home-birthdate-error home-calculator-note" : "home-calculator-note"}
              aria-invalid={Boolean(error)}
              required
              className="mt-3 min-h-12 w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 font-serif text-brand-ink outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-oxblood/20"
            />
            {error && (
              <p id="home-birthdate-error" role="alert" className="mt-3 text-sm text-brand-oxblood">
                {error}
              </p>
            )}
            <button type="submit" className="accent-button large-button mt-4 w-full">
              Reveal my birth card
            </button>
            <p id="home-calculator-note" className="mt-3 text-center text-xs text-brand-ink-soft">
              Private calculation · result appears here
            </p>
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

              <div className="mt-6 space-y-3">
                {slug && cardLabel && (
                  <Link
                    href={`/birth-card/${slug}`}
                    onClick={() =>
                      trackClientFunnelEvent("card_meaning_clicked", {
                        placement: RESULT_PLACEMENT,
                      })
                    }
                    className="paper-button large-button flex w-full justify-center text-center"
                  >
                    Read the {cardLabel} meaning →
                  </Link>
                )}
              </div>

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

              <Link
                href="/products/personal-card-blueprint"
                onClick={() =>
                  trackClientFunnelEvent("blueprint_clicked", {
                    placement: RESULT_PLACEMENT,
                    offerSlug: "personal-card-blueprint",
                  })
                }
                className="editorial-link mt-6 block text-center text-sm text-brand-ink"
              >
                Get the complete Personal Blueprint · $13
              </Link>
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

          <div
            aria-hidden="true"
            className="relative mt-9 hidden h-40 w-56 sm:block"
          >
            <div className="absolute bottom-3 left-3 -rotate-12 opacity-80">
              <PlayingCard code="7♦" size="sm" surface="paper" />
            </div>
            <div className="absolute bottom-6 left-[4.75rem] -rotate-2">
              <PlayingCard code="Q♥" size="sm" surface="paper" />
            </div>
            <div className="absolute bottom-3 left-[8.75rem] rotate-12 opacity-80">
              <PlayingCard code="A♣" size="sm" surface="paper" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
