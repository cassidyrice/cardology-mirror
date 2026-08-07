"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import cardology from "@/lib/engine-core/engine.js";
import { parseCard, type Suit } from "@/lib/cards";
import { publicBirthCardCode } from "@/lib/birth-card-truth";
import { PlayingCard } from "../PlayingCard";
import { ReadingBridge } from "./ReadingBridge";

const RANK_SLUG: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };
function slugOf(code: string): string | null {
  const p = parseCard(code);
  if (!p) return null;
  return `${RANK_SLUG[p.rank] ?? p.rank}-of-${p.suit as Suit}`;
}

interface Result {
  birthCard: string;
  rulingCards: string[];
}

function compute(month: number, day: number): Result | null {
  try {
    const bc = publicBirthCardCode(month, day);
    const prc = cardology.getPlanetaryRulingCard(month, day);
    const rulingCards = Array.isArray(prc) ? prc : prc ? [prc] : [];
    if (!bc || bc === "Unknown") return null;
    return { birthCard: bc, rulingCards };
  } catch {
    return null;
  }
}

export function BirthCardCalculator() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [touched, setTouched] = useState(false);

  // Allow prefill via ?birthdate=YYYY-MM-DD (used by the site SearchAction).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("birthdate");
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
      setDate(q);
      const [, m, d] = q.split("-").map(Number);
      const calculated = compute(m, d);
      setResult(calculated);
      setTouched(true);
      trackClientFunnelEventOnce("calculator_started", {
        placement: "search-prefill",
      });
      if (calculated) {
        // Non-once: docs/analytics.md defines calculator_completed as
        // per-calculation, and the form path at :79 already emits it that way.
        trackClientFunnelEvent("calculator_completed", {
          placement: "search-prefill",
        });
      }
    }
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    trackClientFunnelEventOnce("calculator_started", {
      placement: "calculator-form",
    });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setResult(null);
      return;
    }
    const [, m, d] = date.split("-").map(Number);
    const calculated = compute(m, d);
    setResult(calculated);
    if (calculated) {
      trackClientFunnelEvent("calculator_completed", {
        placement: "calculator-form",
      });
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
      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const isJoker = result.birthCard === "Joker";
  const bc = parseCard(result.birthCard);
  const slug = slugOf(result.birthCard);

  return (
    <div className="mt-8 animate-fade-up">
      <p className="type-eyebrow mb-4 text-center">Your birth card</p>

      <div className="flex flex-col items-center gap-6">
        {isJoker ? (
          <div className="flex h-56 w-40 items-center justify-center rounded-[3px] border border-brand-line bg-brand-ivory text-6xl text-brand-oxblood">
            ★
          </div>
        ) : (
          <PlayingCard
            code={result.birthCard}
            size="lg"
            active
            glow
            float
            surface="paper"
            className="scale-110"
          />
        )}

        <div className="text-center">
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

        <div className="mt-2 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/products/personal-card-blueprint"
            className="accent-button large-button text-center"
          >
            Get My Blueprint — $29
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
        <p className="max-w-md text-center text-xs leading-relaxed text-brand-ink-soft">
          One-time personalized written report. No subscription or phone call.
        </p>
      </div>

      <ReadingBridge variant="card" cardLabel={isJoker ? "Joker" : bc?.label} className="mt-8" />
    </div>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
