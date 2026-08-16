"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { parseCard } from "@/lib/cards";
import {
  birthCardSlug,
  calculateBirthCardFromIsoDate,
  type BirthCardResult,
} from "@/lib/birth-card-calculator";
import { PlayingCard } from "../PlayingCard";
import { ReadingBridge } from "./ReadingBridge";
import { ShareCard } from "./ShareCard";

export function BirthCardCalculator() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<BirthCardResult | null>(null);
  const [touched, setTouched] = useState(false);

  // Allow prefill via ?birthdate=YYYY-MM-DD (used by the site SearchAction).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("birthdate");
    if (q) {
      const calculated = calculateBirthCardFromIsoDate(q);
      if (!calculated) return;
      setDate(q);
      setResult(calculated);
      setTouched(true);
      trackClientFunnelEventOnce("calculator_started", {
        placement: "search-prefill",
      });
      if (calculated) {
        trackClientFunnelEvent("calculator_completed", {
          placement: "search-prefill",
        });
        if (typeof window !== "undefined") {
          window.__cardBlueprintsElroyBirthdate = q;
          window.dispatchEvent(
            new CustomEvent("elroy:birth-card-revealed", {
              detail: { birthdate: q },
            }),
          );
        }
      }
    }
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    trackClientFunnelEventOnce("calculator_started", {
      placement: "calculator-form",
    });
    const calculated = calculateBirthCardFromIsoDate(date);
    setResult(calculated);
    if (calculated) {
      trackClientFunnelEvent("calculator_completed", {
        placement: "calculator-form",
      });
      if (typeof window !== "undefined") {
        window.__cardBlueprintsElroyBirthdate = date;
        window.dispatchEvent(
          new CustomEvent("elroy:birth-card-revealed", {
            detail: { birthdate: date },
          }),
        );
      }
    }
  }

  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory p-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="bd" className="type-eyebrow block">
          Enter your birthday
        </label>
        <input
          id="bd"
          type="date"
          value={date}
          onFocus={() =>
            trackClientFunnelEventOnce("calculator_started", {
              placement: "calculator-input",
            })
          }
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink"
          required
        />
        <button
          type="submit"
          className="accent-button large-button w-full"
        >
          Reveal my birth card
        </button>
      </form>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {touched && !result
          ? "Enter a full date, including year, month, and day."
          : result
            ? `Your birth card is ${parseCard(result.birthCard)?.label ?? result.birthCard}.`
            : ""}
      </p>
      {touched && !result && (
        <p className="mt-4 text-sm text-brand-oxblood">
          Enter a full date (year, month, and day) to calculate your card.
        </p>
      )}
      {result && (
        <BirthCardResultCard
          key={`${result.birthCard}|${result.rulingCards.join(",")}`}
          result={result}
        />
      )}
    </div>
  );
}

function BirthCardResultCard({ result }: { result: BirthCardResult }) {
  const isJoker = result.birthCard === "Joker";
  const bc = parseCard(result.birthCard);
  const slug = birthCardSlug(result.birthCard);
  const rootRef = useRef<HTMLDivElement>(null);

  // Bring the reveal into view on small screens. "nearest" = no-op when
  // the result is already visible; reduced motion gets an instant jump.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, []);

  return (
    <div ref={rootRef} className="mt-8 animate-fade-up">
      <p className="type-eyebrow mb-4 text-center">Your birth card</p>

      <div className="flex flex-col items-center gap-6">
        {isJoker ? (
          <div className="flex h-56 w-40 items-center justify-center rounded-[3px] border border-brand-line bg-brand-ivory text-6xl text-brand-oxblood">
            ★
          </div>
        ) : (
          <div className="flip-scene">
            <div className="flip-inner">
              <div className="flip-face">
                <PlayingCard
                  code={result.birthCard}
                  size="lg"
                  active
                  glow
                  float
                  surface="paper"
                  className="scale-110"
                />
              </div>
              <div className="flip-face flip-back" aria-hidden>
                <PlayingCard
                  code={result.birthCard}
                  size="lg"
                  faceDown
                  surface="paper"
                  className="scale-110"
                />
              </div>
            </div>
          </div>
        )}

        <div className="rise text-center" style={{ animationDelay: "0.55s" }}>
          <p className="font-serif text-2xl text-brand-ink">{isJoker ? "The Joker" : bc?.label}</p>
          {isJoker && (
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-ink-soft">
              December 31 is the Joker position: the one birthday outside the 52 standard cards.
            </p>
          )}
          {result.rulingCards.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-brand-ink-soft">
              <span className="uppercase tracking-widest text-brand-bronze">Ruling:</span>
              {result.rulingCards.map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className={paperSuitClass(c)}>{c}</span>
                  {parseCard(c)?.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className="rise mt-2 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.72s" }}
        >
          <Link
            href="/products/personal-card-blueprint"
            className="accent-button large-button text-center"
          >
            Get My Blueprint — $13
          </Link>
          {slug && (
            <Link
              href={`/birth-card/${slug}`}
              className="paper-button large-button text-center"
            >
              Read the {bc?.label} meaning →
            </Link>
          )}
        </div>
        <p
          className="rise max-w-md text-center text-xs leading-relaxed text-brand-ink-soft"
          style={{ animationDelay: "0.82s" }}
        >
          One-time personalized written report. No subscription or phone call.
        </p>
        {!isJoker && bc?.label && (
          <div className="rise" style={{ animationDelay: "0.88s" }}>
            <ShareCard cardLabel={bc.label} slug={slug} />
          </div>
        )}
      </div>

      <div className="rise" style={{ animationDelay: "0.92s" }}>
        <ReadingBridge variant="card" cardLabel={isJoker ? "Joker" : bc?.label} className="mt-8" />
      </div>
    </div>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
