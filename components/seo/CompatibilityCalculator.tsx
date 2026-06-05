"use client";

import { useState } from "react";
import Link from "next/link";
import cardology from "@/lib/engine-core/engine.js";
import { parseCard, type Suit } from "@/lib/cards";

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
  const sameSuit = pa?.suit === pb?.suit;
  return (
    <div className="mt-6 animate-fade-up">
      <div className="flex items-center justify-center gap-6">
        <CardChip code={a} />
        <span className="text-faint">meets</span>
        <CardChip code={b} />
      </div>
      <p className="mt-4 text-center text-sm text-mist">
        {sameSuit
          ? `Same suit — ${pa?.domain.toLowerCase()}. You share a first instinct and speak a similar language.`
          : `Different suits — ${pa?.domain.toLowerCase()} meets ${pb?.domain.toLowerCase()}. You lead from different instincts.`}
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/bonds" className="rounded-full bg-foil px-5 py-2 font-serif text-ink">
          See the full connection →
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-faint">
        The full reading shows where two patterns share a language and where they pull.
      </p>
    </div>
  );
}

function CardChip({ code }: { code: string }) {
  const p = parseCard(code);
  const slug = slugFor(code);
  const inner = (
    <span className="flex flex-col items-center">
      <span className="font-serif text-3xl" style={{ color: p?.color }}>{code}</span>
      <span className="mt-1 text-xs text-faint">{p?.label}</span>
    </span>
  );
  return slug ? <Link href={`/birth-card/${slug}`}>{inner}</Link> : inner;
}

function slugFor(code: string): string | null {
  return slugOf(code);
}
