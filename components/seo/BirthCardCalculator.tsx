"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import cardology from "@/lib/engine-core/engine.js";
import { parseCard, type Suit } from "@/lib/cards";
import { PlayingCard } from "../PlayingCard";

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
    const [bc] = cardology.getBirthCard(month, day) as [string, number];
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
      setResult(compute(m, d));
      setTouched(true);
    }
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setResult(null);
      return;
    }
    const [, m, d] = date.split("-").map(Number);
    setResult(compute(m, d));
  }

  return (
    <div className="card-surface rounded-2xl p-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="bd" className="eyebrow block text-gold">
          Enter your birthday
        </label>
        <input
          id="bd"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-white/12 bg-void/60 px-4 py-3 font-serif text-bone focus:border-gold/40 focus:outline-none"
          required
        />
        <button
          type="submit"
          className="w-full rounded-full bg-foil py-3 text-center font-serif text-base text-ink transition active:scale-[0.99]"
        >
          Reveal my birth card
        </button>
      </form>

      {touched && !result && (
        <p className="mt-4 text-sm text-ember">
          Enter a full date (year, month, and day) to calculate your card.
        </p>
      )}

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const bc = parseCard(result.birthCard);
  const slug = slugOf(result.birthCard);

  return (
    <div className="mt-8 animate-fade-up">
      <p className="eyebrow mb-4 text-center text-faint">Your birth card</p>

      <div className="flex flex-col items-center gap-6">
        <PlayingCard
          code={result.birthCard}
          size="lg"
          active
          glow
          float
          className="scale-110"
        />

        <div className="text-center">
          <p className="font-serif text-2xl text-bone">{bc?.label}</p>
          {result.rulingCards.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-faint">
              <span className="uppercase tracking-widest text-gold/60">Ruling:</span>
              {result.rulingCards.map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span style={{ color: parseCard(c)?.color }}>{c}</span>
                  {parseCard(c)?.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {slug && (
          <Link
            href={`/birth-card/${slug}`}
            className="mt-2 inline-block rounded-full border border-gold/30 px-6 py-2.5 font-serif text-sm text-gold transition hover:border-gold hover:bg-gold/5"
          >
            Read the {bc?.label} meaning →
          </Link>
        )}
      </div>
    </div>
  );
}
