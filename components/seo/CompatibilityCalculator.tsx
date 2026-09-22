"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { parseCard, type Suit } from "@/lib/cards";
import { compatibilityPairPath } from "@/lib/worker-seo-routes";
import {
  buildLifePathProfile,
  compareLifePathProfiles,
  relationshipSentence,
  type LifePathCard,
  type LifePathProfile,
  type LifePathSharedCard,
} from "@/lib/life-path";
import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import { CompatShareHero } from "@/components/share/CompatShareHero";
import { DeepDiveCta } from "./DeepDiveCta";

const RANK_SLUG: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };
function slugOf(code: string): string | null {
  const p = parseCard(code);
  if (!p) return null;
  return `${RANK_SLUG[p.rank] ?? p.rank}-of-${p.suit as Suit}`;
}

export function CompatibilityWorkerAnchor({
  firstSlug,
  secondSlug,
  firstLabel,
  secondLabel,
}: {
  firstSlug: string | null;
  secondSlug: string | null;
  firstLabel: string | undefined;
  secondLabel: string | undefined;
}) {
  const pairPath =
    firstSlug && secondSlug
      ? compatibilityPairPath(firstSlug, secondSlug)
      : null;
  if (!pairPath || !firstLabel || !secondLabel) return null;

  return (
    <a
      href={pairPath}
      className="text-sm font-medium text-brand-ink underline underline-offset-4"
    >
      Read the full {firstLabel} + {secondLabel} pairing →
    </a>
  );
}

export function CompatibilityCalculator() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pair, setPair] = useState<{ a: LifePathProfile; b: LifePathProfile } | null>(null);
  const [err, setErr] = useState(false);

  // The birth-card calculator already parks this birthday in the tab for checkout.
  // Reuse that value so "compare with someone" continues from it. Never put it in the URL.
  useEffect(() => {
    const stored = readCheckoutBirthdate();
    if (!stored) return;
    setA((current) => current || stored);
  }, []);

  function onSubmit(e: FormEvent) {
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
    storeCheckoutBirthdate(a);
    trackClientFunnelEvent("calculator_completed", {
      placement: "compatibility-calculator",
    });
  }

  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory px-4 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
      <CompatShareHero
        firstBirthCard={pair?.a.birthCard}
        secondBirthCard={pair?.b.birthCard}
        firstLifePathSeatCodes={pair?.a.allCards.map((seat) => seat.card)}
      />

      <form onSubmit={onSubmit} className="mt-5 w-full space-y-4">
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
          Compare
        </button>
      </form>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {err
          ? "Enter two full birthdays to compare."
          : pair
            ? "Compatibility comparison ready. Tap a Life Path seat."
            : ""}
      </p>
      {err && <p className="mt-4 text-sm text-brand-oxblood">Enter two full birthdays to compare.</p>}
      {pair && (
        <PairResult
          key={`${pair.a.birthdate}:${pair.b.birthdate}`}
          a={pair.a}
          b={pair.b}
          birthdateA={pair.a.birthdate}
        />
      )}
      </div>
    </div>
  );
}

function defaultSeat(hit: LifePathCard | null): number {
  return hit?.position ?? 1;
}

function PairResult({
  a,
  b,
  birthdateA,
}: {
  a: LifePathProfile;
  b: LifePathProfile;
  birthdateA: string;
}) {
  const pa = parseCard(a.birthCard);
  const pb = parseCard(b.birthCard);
  const aSlug = slugOf(a.birthCard);
  const bSlug = slugOf(b.birthCard);
  const sameSuit = pa?.suit === pb?.suit;
  const comparison = compareLifePathProfiles(a, b);
  const [owner, setOwner] = useState<"a" | "b">("a");
  const [selected, setSelected] = useState<number>(() => defaultSeat(comparison.aSeesB));

  const active = owner === "a" ? a : b;
  const other = owner === "a" ? b : a;
  const hit = owner === "a" ? comparison.aSeesB : comparison.bSeesA;
  const seats = active.allCards;
  const selectedSeat = seats.find((seat) => seat.position === selected) ?? seats[1] ?? seats[0];
  const otherCards = useMemo(() => new Set(other.allCards.map((seat) => seat.card)), [other]);
  const isHit = Boolean(hit && selectedSeat && hit.position === selectedSeat.position);

  function selectOwner(next: "a" | "b") {
    setOwner(next);
    const nextHit = next === "a" ? comparison.aSeesB : comparison.bSeesA;
    setSelected(defaultSeat(nextHit));
  }

  function onBoardKey(e: KeyboardEvent<HTMLDivElement>) {
    const idx = seats.findIndex((seat) => seat.position === selected);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = seats[(idx + 1) % seats.length];
      setSelected(next.position);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = seats[(idx - 1 + seats.length) % seats.length];
      setSelected(next.position);
    }
  }

  const ownerName = owner === "a" ? "first person" : "second person";
  const otherName = owner === "a" ? "second person" : "first person";

  return (
    <div className="mt-8 w-full animate-fade-up">
      <div className="text-center">
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

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className={owner === "a" ? "accent-button small-button" : "paper-button small-button"}
          aria-pressed={owner === "a"}
          onClick={() => selectOwner("a")}
        >
          First person’s path
        </button>
        <button
          type="button"
          className={owner === "b" ? "accent-button small-button" : "paper-button small-button"}
          aria-pressed={owner === "b"}
          onClick={() => selectOwner("b")}
        >
          Second person’s path
        </button>
      </div>

      <p className="mt-3 text-center text-xs uppercase tracking-wider text-brand-bronze">
        {active.label} · {active.birthCardLabel} · Moon + 13
      </p>

      <div
        role="listbox"
        aria-label={`${active.label} Life Path seats`}
        tabIndex={0}
        onKeyDown={onBoardKey}
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-7"
      >
        {seats.map((seat) => {
          const livesHere = seat.card === other.birthCard;
          const shared = otherCards.has(seat.card);
          const pressed = seat.position === selected;
          return (
            <button
              key={`${active.label}-${seat.position}`}
              type="button"
              role="option"
              aria-selected={pressed}
              aria-pressed={pressed}
              onClick={() => setSelected(seat.position)}
              className={`life-seat ${livesHere ? "ring-2 ring-gold" : ""}`}
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-bronze">
                {seat.shortTitle}
                {livesHere ? " · lives here" : ""}
                {!livesHere && shared ? " · shared" : ""}
              </p>
              <p className={`mt-1 font-serif text-lg leading-none ${paperSuitClass(seat.card)}`}>
                {seat.card}
              </p>
            </button>
          );
        })}
      </div>

      {selectedSeat && (
        <SeatDetail
          seat={selectedSeat}
          isHit={isHit}
          ownerName={ownerName}
          otherName={otherName}
          otherBirthLabel={other.birthCardLabel}
        />
      )}

      <SharedList
        sharedCards={comparison.sharedCards}
        active={active}
        onPick={(position) => setSelected(position)}
      />

      <div className="mt-8 flex w-full flex-col items-center gap-3">
        <DeepDiveCta
          placement="compatibility-calculator-result"
          birthdate={birthdateA}
          source="birth-card-compatibility-calculator"
        />
        <p className="max-w-md text-center text-xs leading-relaxed text-brand-ink-soft">
          This $13 One Question Reading is for the first birthday only — that person’s question, not a couple’s.
        </p>
        <CompatibilityWorkerAnchor
          firstSlug={aSlug}
          secondSlug={bSlug}
          firstLabel={pa?.label}
          secondLabel={pb?.label}
        />
        <Link
          href="/cardology-compatibility"
          className="text-sm font-medium text-brand-ink underline underline-offset-4"
        >
          Read the compatibility guide →
        </Link>
        <div className="flex flex-wrap justify-center gap-2">
          {aSlug && pa?.label && (
            <Link href={`/birth-card/${aSlug}`} className="paper-button small-button">
              {pa.label} meaning
            </Link>
          )}
          {bSlug && pb?.label && (
            <Link href={`/birth-card/${bSlug}`} className="paper-button small-button">
              {pb.label} meaning
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SeatDetail({
  seat,
  isHit,
  ownerName,
  otherName,
  otherBirthLabel,
}: {
  seat: LifePathCard;
  isHit: boolean;
  ownerName: string;
  otherName: string;
  otherBirthLabel: string;
}) {
  return (
    <section className="mt-6 rounded-[3px] border border-brand-line bg-brand-paper-deep p-5">
      <p className="type-eyebrow">
        {seat.shortTitle}. {seat.phrase}
      </p>
      <h3 className="mt-2 font-serif text-xl text-brand-ink">
        {seat.label} · {seat.titleText}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{seat.constitution}</p>
      <p className="mt-3 text-sm leading-relaxed text-brand-ink">
        {isHit
          ? relationshipSentence(ownerName, otherName, seat)
          : `${otherBirthLabel} does not sit in this seat on the ${ownerName}’s path.`}
      </p>
    </section>
  );
}

function SharedList({
  sharedCards,
  active,
  onPick,
}: {
  sharedCards: LifePathSharedCard[];
  active: LifePathProfile;
  onPick: (position: number) => void;
}) {
  return (
    <section className="mt-8">
      <h3 className="font-serif text-lg text-brand-ink">Shared Life Path cards</h3>
      <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
        Cards that appear in both paths. Shared does not mean easy. It marks the same
        pattern in different roles.
      </p>
      {sharedCards.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {sharedCards.map((shared) => {
            const onActive = active.allCards.find((seat) => seat.card === shared.card);
            return (
              <button
                key={shared.card}
                type="button"
                className="paper-button small-button"
                onClick={() => onActive && onPick(onActive.position)}
              >
                {shared.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-[3px] border border-brand-line bg-brand-ivory p-4 text-sm leading-relaxed text-brand-ink-soft">
          No direct shared cards appear inside the Moon-plus-13 Life Path spectrum.
          Read the suit/rank chemistry and ruling cards first.
        </p>
      )}
    </section>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
