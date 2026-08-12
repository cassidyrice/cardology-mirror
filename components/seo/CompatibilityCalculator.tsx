"use client";

import { useState } from "react";
import Link from "next/link";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
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
    trackClientFunnelEventOnce("calculator_started", {
      placement: "compatibility-calculator",
    });
    const first = buildLifePathProfile(a, "First person");
    const second = buildLifePathProfile(b, "Second person");
    if (!first || !second) {
      setErr(true);
      setPair(null);
      return;
    }
    setErr(false);
    setPair({ a: first, b: second });
    trackClientFunnelEvent("calculator_completed", {
      placement: "compatibility-calculator",
    });
  }

  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="da" className="type-eyebrow block">First birthday</label>
          <input id="da" type="date" value={a}
            onFocus={() =>
              trackClientFunnelEventOnce("calculator_started", {
                placement: "compatibility-calculator",
              })
            }
            onChange={(e) => setA(e.target.value)} required
            className="mt-2 w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink" />
        </div>
        <div>
          <label htmlFor="db" className="type-eyebrow block">Second birthday</label>
          <input id="db" type="date" value={b}
            onFocus={() =>
              trackClientFunnelEventOnce("calculator_started", {
                placement: "compatibility-calculator",
              })
            }
            onChange={(e) => setB(e.target.value)} required
            className="mt-2 w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink" />
        </div>
        <button type="submit" className="accent-button large-button w-full">
          Compare birth cards and Life Paths
        </button>
      </form>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {err ? "Enter two full birthdays to compare." : pair ? "Compatibility comparison ready." : ""}
      </p>
      {err && <p className="mt-4 text-sm text-brand-oxblood">Enter two full birthdays to compare.</p>}
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
          <PlayingCard code={a.birthCard} size="md" active surface="paper" />
        </div>
        <div className="z-10 bg-brand-ivory px-2 py-1 text-xs uppercase tracking-widest text-brand-bronze">
          meets
        </div>
        <div className="rotate-6 -translate-x-2">
          <PlayingCard code={b.birthCard} size="md" active surface="paper" />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="font-serif text-base leading-relaxed text-brand-ink">
          {sameSuit
            ? `Same suit - ${pa?.domain.toLowerCase()}`
            : `${pa?.domain.toLowerCase()} meets ${pb?.domain.toLowerCase()}`}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-brand-ink-soft">
          {sameSuit
            ? "You share a first instinct and speak a similar language. Communication tends to feel familiar."
            : "You lead from different instincts. This can create a powerful balance or a recurring friction depending on awareness."}
        </p>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ConstitutionPanel profile={a} />
        <ConstitutionPanel profile={b} />
      </section>

      <section className="mt-8 rounded-[3px] border border-brand-line bg-brand-paper-deep p-5">
        <p className="type-eyebrow mb-2">Relationship cross-reference</p>
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
          <h3 className="font-serif text-lg text-brand-ink">Shared Life Path cards</h3>
          <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
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
            <p className="mt-4 rounded-[3px] border border-brand-line bg-brand-ivory p-4 text-sm leading-relaxed text-brand-ink-soft">
              No direct shared cards appear inside the Moon-plus-13 Life Path spectrum.
              Read the suit/rank chemistry and ruling cards first.
            </p>
          )}
        </div>
      </section>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/checkout/personal-card-blueprint"
          className="accent-button large-button text-center"
          onClick={() =>
            trackClientFunnelEvent("offer_cta_clicked", {
              offerSlug: "personal-card-blueprint",
              placement: "compatibility-calculator-result",
            })
          }
        >
          Get My Blueprint - $29
        </Link>
        <p className="max-w-md text-center text-xs leading-relaxed text-brand-ink-soft">
          One-time personalized written report for your side of the pattern.
          No subscription or phone call.
        </p>
        <Link
          href="/cardology-compatibility"
          className="text-sm font-medium text-brand-ink underline underline-offset-4"
        >
          Read the compatibility guide ->
        </Link>
        <div className="flex flex-wrap justify-center gap-2">
          {aSlug && (
            <Link href={`/birth-card/${aSlug}`} className="paper-button small-button">
              {a.birthCard} meaning
            </Link>
          )}
          {bSlug && (
            <Link href={`/birth-card/${bSlug}`} className="paper-button small-button">
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
    <article className="rounded-[3px] border border-brand-line bg-brand-ivory p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-eyebrow">{profile.label}</p>
          <h2 className="mt-1 font-serif text-2xl leading-none text-brand-ink">
            {profile.birthCardLabel} Life Path constitution
          </h2>
        </div>
        <PlayingCard code={profile.birthCard} size="sm" active surface="paper" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft">{constitutionSummary(profile)}</p>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {Object.entries(profile.suitCounts).map(([suit, count]) => (
          <div key={suit} className="rounded-[3px] border border-brand-line bg-brand-paper p-3">
            <p className="font-bold uppercase tracking-wider text-brand-bronze">{suit}</p>
            <p className="mt-1 font-serif text-2xl text-brand-ink">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {spotlight.map((card) => (
          <LifePathCardRow key={`${profile.label}-${card.position}`} card={card} compact />
        ))}
      </div>

      <details className="mt-5 rounded-[3px] border border-brand-line bg-brand-paper p-4">
        <summary className="cursor-pointer font-serif text-base text-brand-ink">
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
    <div className="rounded-[3px] border border-brand-line bg-brand-paper p-3">
      <div className="flex items-start gap-3">
        <div className={`min-w-12 rounded-[3px] border border-brand-line bg-brand-ivory px-2 py-2 text-center font-serif text-lg ${paperSuitClass(card.card)}`}>
          {card.card}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-bronze">
            {card.position}. {card.shortTitle} - {card.phrase}
          </p>
          <h3 className="mt-1 font-serif text-base leading-tight text-brand-ink">
            {card.label} - {card.titleText}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
            {compact ? card.constitution : `${card.constitution} ${card.gift}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleHit({ title, text, card }: { title: string; text: string; card: LifePathCard | null }) {
  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory p-4">
      <p className="type-eyebrow">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{text}</p>
      {card && (
        <p className="mt-3 font-serif text-base text-brand-ink">
          {card.card} - {card.title} - {card.titleText}
        </p>
      )}
    </div>
  );
}

function SharedCardRow({ shared }: { shared: LifePathSharedCard }) {
  const aRoles = shared.aRoles.map((role) => `${role.shortTitle}`).join(", ");
  const bRoles = shared.bRoles.map((role) => `${role.shortTitle}`).join(", ");

  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="font-serif text-lg text-brand-ink">
          {shared.card} - {shared.label}
        </h4>
        <Link
          href={`/birth-card/${slugOf(shared.card) ?? ""}`}
          className="editorial-link text-xs font-bold uppercase tracking-wider text-brand-ink"
        >
          Card meaning
        </Link>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        First person carries it as <span className="text-brand-ink">{aRoles}</span>.
        Second person carries it as <span className="text-brand-ink">{bRoles}</span>.
      </p>
    </div>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
