"use client";

import { useState } from "react";
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
function birthCardOf(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [, m, d] = date.split("-").map(Number);
  try {
    const [bc] = cardology.getBirthCard(m, d) as [string, number];
    return bc && bc !== "Unknown" ? bc : null;
  } catch {
    return null;
  }
}

export function CompatibilityCalculator() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pair, setPair] = useState<{ a: string; b: string } | null>(null);
  const [err, setErr] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ca = birthCardOf(a);
    const cb = birthCardOf(b);
    if (!ca || !cb) {
      setErr(true);
      setPair(null);
      return;
    }
    setErr(false);
    setPair({ a: ca, b: cb });
  }

  return (
    <div className="card-surface rounded-2xl p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="da" className="eyebrow block text-gold">First birthday</label>
          <input id="da" type="date" value={a} onChange={(e) => setA(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-white/12 bg-void/60 px-4 py-3 font-serif text-bone focus:border-gold/40 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="db" className="eyebrow block text-gold">Second birthday</label>
          <input id="db" type="date" value={b} onChange={(e) => setB(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-white/12 bg-void/60 px-4 py-3 font-serif text-bone focus:border-gold/40 focus:outline-none" />
        </div>
        <button type="submit" className="w-full rounded-full bg-foil py-3 text-center font-serif text-base text-ink transition active:scale-[0.99]">
          Compare birth cards
        </button>
      </form>

      {err && <p className="mt-4 text-sm text-ember">Enter two full birthdays to compare.</p>}

      {pair && <PairResult a={pair.a} b={pair.b} />}
    </div>
  );
}

function PairResult({ a, b }: { a: string; b: string }) {
  const pa = parseCard(a);
  const pb = parseCard(b);
  const aSlug = slugOf(a);
  const bSlug = slugOf(b);
  const sameSuit = pa?.suit === pb?.suit;

  return (
    <div className="mt-10 animate-fade-up">
      <div className="flex items-center justify-center gap-2">
        <div className="-rotate-6 translate-x-2">
          <PlayingCard code={a} size="md" active />
        </div>
        <div className="z-10 bg-cosmos/80 px-2 py-1 text-xs uppercase tracking-widest text-gold backdrop-blur-sm">
          meets
        </div>
        <div className="rotate-6 -translate-x-2">
          <PlayingCard code={b} size="md" active />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="font-serif text-base leading-relaxed text-bone">
          {sameSuit
            ? `Same suit · ${pa?.domain.toLowerCase()}`
            : `${pa?.domain.toLowerCase()} meets ${pb?.domain.toLowerCase()}`}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-mist">
          {sameSuit
            ? "You share a first instinct and speak a similar language. Communication tends to feel familiar."
            : "You lead from different instincts. This can create a powerful balance or a recurring friction depending on awareness."}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/cardology-compatibility"
          className="rounded-full bg-foil px-8 py-3 font-serif text-base text-ink transition active:scale-[0.99]"
        >
          Read the compatibility guide →
        </Link>
        <div className="flex flex-wrap justify-center gap-2">
          {aSlug && (
            <Link href={`/birth-card/${aSlug}`} className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wider text-gold">
              {a} meaning
            </Link>
          )}
          {bSlug && (
            <Link href={`/birth-card/${bSlug}`} className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wider text-gold">
              {b} meaning
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
