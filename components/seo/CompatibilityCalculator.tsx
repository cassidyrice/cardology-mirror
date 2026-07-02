"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCard, type Suit } from "@/lib/cards";
import {
  buildLifePathProfile,
  compareLifePathProfiles,
  constitutionSummary,
  relationshipSentence,
  type LifePathCard,
  type LifePathProfile,
  type LifePathSharedCard,
} from "@/lib/life-path";
import { PlayingCard } from "../PlayingCard";
import { ReadingBridge } from "./ReadingBridge";

const RANK_SLUG: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };
function slugOf(code: string): string | null {
  const p = parseCard(code);
  if (!p) return null;
  return `${RANK_SLUG[p.rank] ?? p.rank}-of-${p.suit as Suit}`;
}

export function CompatibilityCalculator() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pair, setPair] = useState<{ a: LifePathProfile; b: LifePathProfile } | null>(null);
  const [err, setErr] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const first = buildLifePathProfile(a, "First person");
    const second = buildLifePathProfile(b, "Second person");
    if (!first || !second) {
      setErr(true);
      setPair(null);
      return;
    }
    setErr(false);
    setPair({ a: first, b: second });
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
          Compare birth cards and Life Paths
        </button>
      </form>

      {err && <p className="mt-4 text-sm text-ember">Enter two full birthdays to compare.</p>}

      {pair && <PairResult a={pair.a} b={pair.b} />}
    </div>
  );
}

function PairResult({ a, b }: { a: LifePathProfile; b: LifePathProfile }) {
  const pa = parseCard(a.birthCard);
  const pb = parseCard(b.birthCard);
  const aSlug = slugOf(a.birthCard);
  const bSlug = slugOf(b.birthCard);
  const sameSuit = pa?.suit === pb?.suit;
  const comparison = compareLifePathProfiles(a, b);

  return (
    <div className="mt-10 animate-fade-up">
      <div className="flex items-center justify-center gap-2">
        <div className="-rotate-6 translate-x-2">
          <PlayingCard code={a.birthCard} size="md" active />
        </div>
        <div className="z-10 bg-cosmos/80 px-2 py-1 text-xs uppercase tracking-widest text-gold backdrop-blur-sm">
          meets
        </div>
        <div className="rotate-6 -translate-x-2">
          <PlayingCard code={b.birthCard} size="md" active />
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

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ConstitutionPanel profile={a} />
        <ConstitutionPanel profile={b} />
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="eyebrow mb-2 text-gold">Relationship cross-reference</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <RoleHit
            title={`${b.birthCardLabel} inside the first person`}
            text={relationshipSentence("the first person", "the second person", comparison.aSeesB)}
            card={comparison.aSeesB}
          />
          <RoleHit
            title={`${a.birthCardLabel} inside the second person`}
            text={relationshipSentence("the second person", "the first person", comparison.bSeesA)}
            card={comparison.bSeesA}
          />
        </div>

        <div className="mt-6">
          <h3 className="font-serif text-lg text-bone">Shared Life Path cards</h3>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            These are the cards that appear in both Life Path spectrums. Shared cards
            do not make the relationship easy by default; they show where both people
            are carrying the same symbolic weather in different roles.
          </p>
          {comparison.sharedCards.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {comparison.sharedCards.map((shared) => (
                <SharedCardRow key={shared.card} shared={shared} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-white/10 bg-void/30 p-4 text-sm leading-relaxed text-mist">
              No direct shared cards appear inside the Moon-plus-13 Life Path spectrum.
              Read the suit/rank chemistry and ruling cards first.
            </p>
          )}
        </div>
      </section>

      <ReadingBridge variant="relationship" className="mt-8" />

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
              {a.birthCard} meaning
            </Link>
          )}
          {bSlug && (
            <Link href={`/birth-card/${bSlug}`} className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wider text-gold">
              {b.birthCard} meaning
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ConstitutionPanel({ profile }: { profile: LifePathProfile }) {
  const spotlight = [
    profile.pathCards[0],
    profile.pathCards[1],
    profile.pathCards[2],
    profile.pathCards[3],
    profile.pathCards[5],
    profile.pathCards[8],
    profile.pathCards[12],
  ].filter(Boolean);

  return (
    <article className="rounded-2xl border border-white/10 bg-void/35 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-gold">{profile.label}</p>
          <h2 className="mt-1 font-serif text-2xl leading-none text-bone">
            {profile.birthCardLabel} Life Path constitution
          </h2>
        </div>
        <PlayingCard code={profile.birthCard} size="sm" active />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-mist">{constitutionSummary(profile)}</p>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {Object.entries(profile.suitCounts).map(([suit, count]) => (
          <div key={suit} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="font-bold uppercase tracking-wider text-gold">{suit}</p>
            <p className="mt-1 font-serif text-2xl text-bone">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {spotlight.map((card) => (
          <LifePathCardRow key={`${profile.label}-${card.position}`} card={card} compact />
        ))}
      </div>

      <details className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <summary className="cursor-pointer font-serif text-base text-bone">
          Full Moon + 13-card spectrum
        </summary>
        <div className="mt-4 grid gap-3">
          {profile.allCards.map((card) => (
            <LifePathCardRow key={`${profile.label}-full-${card.position}`} card={card} />
          ))}
        </div>
      </details>
    </article>
  );
}

function LifePathCardRow({ card, compact = false }: { card: LifePathCard; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-12 rounded-lg border border-white/10 bg-cosmos/60 px-2 py-2 text-center font-serif text-lg text-bone">
          {card.card}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-gold">
            {card.position}. {card.shortTitle} · {card.phrase}
          </p>
          <h3 className="mt-1 font-serif text-base leading-tight text-bone">
            {card.label} · {card.titleText}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            {compact ? card.constitution : `${card.constitution} ${card.gift}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleHit({ title, text, card }: { title: string; text: string; card: LifePathCard | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <p className="eyebrow text-gold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-mist">{text}</p>
      {card && (
        <p className="mt-3 font-serif text-base text-bone">
          {card.card} · {card.title} · {card.titleText}
        </p>
      )}
    </div>
  );
}

function SharedCardRow({ shared }: { shared: LifePathSharedCard }) {
  const aRoles = shared.aRoles.map((role) => `${role.shortTitle}`).join(", ");
  const bRoles = shared.bRoles.map((role) => `${role.shortTitle}`).join(", ");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="font-serif text-lg text-bone">
          {shared.card} · {shared.label}
        </h4>
        <Link
          href={`/birth-card/${slugOf(shared.card) ?? ""}`}
          className="text-xs font-bold uppercase tracking-wider text-gold underline underline-offset-4"
        >
          Card meaning
        </Link>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-mist">
        First person carries it as <span className="text-bone">{aRoles}</span>.
        Second person carries it as <span className="text-bone">{bRoles}</span>.
      </p>
    </div>
  );
}
