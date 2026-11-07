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
import { CardBack } from "@/components/cards/CardBack";
import { shareFacePathFromCode } from "@/lib/share-cards";
import { OfferCta } from "./OfferCta";

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
      className="accent-button large-button"
    >
      Read the full {firstLabel} and {secondLabel} pairing
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

  const stage = (
    <PairStage
      key={pair ? `${pair.a.birthCard}:${pair.b.birthCard}` : "empty"}
      first={pair?.a.birthCard}
      second={pair?.b.birthCard}
    />
  );

  return (
    <div className="compat">
      <div className="compat-inline">{stage}</div>
      <div className="compat-rail-slot">
        <CompatShareHero
          firstBirthCard={pair?.a.birthCard}
          secondBirthCard={pair?.b.birthCard}
          firstLifePathSeatCodes={pair?.a.allCards.map((seat) => seat.card)}
          stage={<div className="compat-rail">{stage}</div>}
        />
      </div>

      <form onSubmit={onSubmit} className="compat-form" aria-label="Two birthdays">
        <div className="compat-fields">
          <div className="compat-field">
            <label htmlFor="da">First birthday (probably yours)</label>
            <input id="da" type="date" value={a}
              onFocus={() =>
                trackClientFunnelEventOnce("calculator_started", {
                  placement: "compatibility-calculator",
                })
              }
              onChange={(e) => setA(e.target.value)} required />
          </div>
          <div className="compat-field">
            <label htmlFor="db">Second birthday (theirs)</label>
            <input id="db" type="date" value={b}
              onFocus={() =>
                trackClientFunnelEventOnce("calculator_started", {
                  placement: "compatibility-calculator",
                })
              }
              onChange={(e) => setB(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="accent-button large-button compat-submit">
          Show me the friction
        </button>
        <p className="compat-error" role="alert" aria-live="assertive">
          {err ? "Two full birthdays. Not one, not a guess." : ""}
        </p>
      </form>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {err
          ? "Two full birthdays. Not one, not a guess."
          : pair
            ? "Comparison ready. Tap a Life Path seat. Brace yourself."
            : ""}
      </p>
      {pair && (
        <PairResult
          key={`${pair.a.birthdate}:${pair.b.birthdate}`}
          a={pair.a}
          b={pair.b}
        />
      )}
    </div>
  );
}

/** Two cards on a board. The static state is two card backs; a known pair turns both, the second a beat after the first. */
function PairStage({ first, second }: { first?: string; second?: string }) {
  return (
    <div className="compat-stage" aria-hidden={first && second ? undefined : "true"}>
      {[first, second].map((code, i) => {
        const isJoker = code === "Joker";
        const face = code && !isJoker ? shareFacePathFromCode(code) : null;
        const label = isJoker ? "The Joker" : code ? parseCard(code)?.label : null;
        return (
          <div className="compat-stage-card" key={`${i}-${code ?? "back"}`}>
            {code ? (
              <div className="flip-scene" style={{ width: "100%", height: "100%" }}>
                <div className="flip-inner">
                  <div className="flip-face">
                    {face ? (
                      <img src={face} alt={`${label} playing card`} width={432} height={648} className="compat-stage-face" />
                    ) : (
                      <div className="compat-stage-face hero-card-back" role="img" aria-label="The Joker" />
                    )}
                  </div>
                  <div className="flip-face flip-back">
                    <div className="compat-stage-face hero-card-back"><CardBack /></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="compat-stage-face hero-card-back"><CardBack /></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function defaultSeat(hit: LifePathCard | null): number {
  return hit?.position ?? 1;
}

function PairResult({
  a,
  b,
}: {
  a: LifePathProfile;
  b: LifePathProfile;
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
    <div className="compat-result" data-in-view="true">
      <h2 data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
        {sameSuit
          ? `Same suit: ${pa?.domain.toLowerCase()}`
          : `${pa?.domain} meets ${pb?.domain.toLowerCase()}`}
      </h2>
      <p data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
        {sameSuit
          ? "You share a first instinct and speak a similar language. It feels easy. That is also how you both miss the same thing."
          : "You lead from different instincts. One of you is already annoyed by how the other one decides. That is balance or a recurring fight, depending on whether anyone notices."}
      </p>

      <div className="compat-owner" data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
        <button
          type="button"
          className="paper-button"
          aria-pressed={owner === "a"}
          onClick={() => selectOwner("a")}
        >
          First person’s path
        </button>
        <button
          type="button"
          className="paper-button"
          aria-pressed={owner === "b"}
          onClick={() => selectOwner("b")}
        >
          Second person’s path
        </button>
      </div>

      <p className="compat-owner-line" data-rise style={{ "--rise-i": 3 } as React.CSSProperties}>
        {active.label}, the {active.birthCardLabel}. Moon seat plus thirteen.
      </p>

      <div
        role="listbox"
        aria-label={`${active.label} Life Path seats`}
        tabIndex={0}
        onKeyDown={onBoardKey}
        className="compat-board"
        data-rise
        style={{ "--rise-i": 4 } as React.CSSProperties}
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
              className="compat-seat"
              data-lives={livesHere ? "true" : undefined}
            >
              <small>
                {seat.shortTitle}
                {livesHere ? ", lives here" : ""}
                {!livesHere && shared ? ", shared" : ""}
              </small>
              <strong className={paperSuitClass(seat.card)}>{seat.card}</strong>
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

      <div className="compat-actions">
        <CompatibilityWorkerAnchor
          firstSlug={aSlug}
          secondSlug={bSlug}
          firstLabel={pa?.label}
          secondLabel={pb?.label}
        />
        {aSlug && pa?.label && (
          <Link href={`/birth-card/${aSlug}`} className="paper-button large-button">
            {pa.label} meaning
          </Link>
        )}
        {bSlug && pb?.label && (
          <Link href={`/birth-card/${bSlug}`} className="paper-button large-button">
            {pb.label} meaning
          </Link>
        )}
      </div>
      <div className="compat-links">
        <Link href="/cardology-compatibility" className="editorial-link">
          Read the compatibility guide. All of it
        </Link>
      </div>
      <OfferCta />
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
    <section className="compat-detail" aria-live="polite">
      <h3>
        {seat.label}, {seat.titleText}
      </h3>
      <p className="compat-owner-line">{seat.shortTitle}. {seat.phrase}</p>
      <p>{seat.constitution}</p>
      <p>
        {isHit
          ? relationshipSentence(ownerName, otherName, seat)
          : `${otherBirthLabel} does not sit in this seat on the ${ownerName}’s path. Nothing to see here. Try another seat.`}
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
    <section className="compat-shared">
      <h3>Shared Life Path cards</h3>
      <p>
        Cards that appear in both paths. Shared does not mean easy. It means the same
        pattern in different roles. Usually the one you argue about.
      </p>
      {sharedCards.length > 0 ? (
        <div className="compat-shared-list">
          {sharedCards.map((shared) => {
            const onActive = active.allCards.find((seat) => seat.card === shared.card);
            return (
              <button
                key={shared.card}
                type="button"
                className="paper-button"
                onClick={() => onActive && onPick(onActive.position)}
              >
                {shared.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p>
          No direct shared cards appear inside the Moon-plus-13 Life Path spectrum.
          Not a red flag. Just less overlap. Read the suit/rank chemistry and ruling
          cards first.
        </p>
      )}
    </section>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds" ? "is-red" : "";
}
