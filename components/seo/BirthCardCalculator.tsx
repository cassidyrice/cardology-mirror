"use client";

import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { StanReadingCta } from "./StanReadingCta";
import dynamic from "next/dynamic";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { BirthShareHero } from "@/components/share/BirthShareHero";
import { parseCard, todayISO } from "@/lib/cards";
import {
  birthdayWorkerLinkForReveal,
  birthCardSlug,
  calculateBirthCardRevealFromIsoDate,
  type BirthCardReveal,
} from "@/lib/birth-card-calculator";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import {
  CALCULATOR_PRIVACY_MICROCOPY,
} from "@/lib/deep-dive";
// The 7KB authored source of card-bible watchFor lines, not the 271KB bible (client bundle).
import CARD_VOICE from "@/scripts/card-bible-voice.json";
import { testimonialByline, testimonialForCard } from "@/lib/testimonials";
import THREE_LENS from "@/lib/card-meanings.json";

// Result-only UI: loaded on demand so it stays out of the first-paint bundle.
const CurrentPeriod = dynamic(() => import("./CurrentPeriod").then((m) => m.CurrentPeriod));

/** The card in the shell's rail follows the calculator through this event. */
const CALC_EVENT = "cb:calculator-card";

function announceCard(birthCard: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string | null>(CALC_EVENT, { detail: birthCard }));
}

/**
 * The pinned card beside the reading on desktop (SeoShell's `stage`). It is
 * face down until the calculator reports a birthday, then it turns.
 */
export function CalculatorStage() {
  const [birthCard, setBirthCard] = useState<string | null>(null);
  useEffect(() => {
    const onCard = (event: Event) => setBirthCard((event as CustomEvent<string | null>).detail);
    window.addEventListener(CALC_EVENT, onCard);
    return () => window.removeEventListener(CALC_EVENT, onCard);
  }, []);
  return <BirthShareHero birthCard={birthCard ?? undefined} compact />;
}

export function BirthCardCalculator() {
  const [date, setDate] = useState("");
  const [reveal, setReveal] = useState<BirthCardReveal | null>(null);
  const [touched, setTouched] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.location.hash === "#bd") {
      dateRef.current?.focus();
    }
  }, []);

  // Legacy ?birthdate= links: consume the date, then strip it from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("birthdate") || params.get("bd") || params.get("dob");
    if (!q) return;
    const calculated = calculateBirthCardRevealFromIsoDate(q);
    window.history.replaceState({}, "", window.location.pathname);
    if (!calculated) return;
    storeCheckoutBirthdate(q);
    setDate(q);
    setReveal(calculated);
    setTouched(true);
    announceCard(calculated.result.birthCard);
    trackClientFunnelEventOnce("calculator_started", {
      placement: "search-prefill",
    });
    trackClientFunnelEvent("calculator_completed", {
      placement: "search-prefill",
    });
    window.__cardBlueprintsElroyBirthdate = q;
    window.dispatchEvent(
      new CustomEvent("elroy:birth-card-revealed", {
        detail: { birthdate: q },
      }),
    );
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    trackClientFunnelEventOnce("calculator_started", {
      placement: "calculator-form",
    });
    const calculated = calculateBirthCardRevealFromIsoDate(date);
    // INP: paint the click feedback first; the result subtree renders in a
    // transition and the elroy listener runs in its own task.
    startTransition(() => setReveal(calculated));
    announceCard(calculated?.result.birthCard ?? null);
    if (calculated) {
      storeCheckoutBirthdate(date);
      trackClientFunnelEvent("calculator_completed", {
        placement: "calculator-form",
      });
      window.__cardBlueprintsElroyBirthdate = date;
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("elroy:birth-card-revealed", {
            detail: { birthdate: date },
          }),
        );
      }, 0);
    }
  }

  const birthCard = reveal?.result.birthCard;

  return (
    <div className="calc">
      {/* The same card, inline, where the rail is not shown (below 1024px). */}
      <div className="calc-inline-card" data-has-card={birthCard ? "true" : "false"}>
        <BirthShareHero
          birthCard={birthCard}
          action={reveal && birthCard ? <CalculatorNextStep /> : undefined}
        />
      </div>

      <form
        onSubmit={onSubmit}
        className="calc-form"
        hidden={Boolean(reveal)}
        aria-hidden={reveal ? true : undefined}
      >
        <label htmlFor="bd" className="calc-label">
          Enter your birthday
        </label>
        <div className="calc-row">
          <input
            ref={dateRef}
            id="bd"
            type="date"
            value={date}
            onFocus={() =>
              trackClientFunnelEventOnce("calculator_started", {
                placement: "calculator-input",
              })
            }
            onChange={(e) => setDate(e.target.value)}
            aria-describedby="calculator-privacy"
            className="calc-field scroll-mt-24"
            required
          />
          <button type="submit" className="accent-button calc-submit">
            Show me my birth card
          </button>
        </div>
        <p id="calculator-privacy" className="calc-privacy">
          {CALCULATOR_PRIVACY_MICROCOPY}
        </p>
      </form>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {touched && !reveal
          ? "Enter a full date, including year, month, and day."
          : reveal
            ? `Your birth card is ${parseCard(reveal.result.birthCard)?.label ?? reveal.result.birthCard}.`
            : ""}
      </p>
      {touched && !reveal && (
        <p className="calc-error">
          Enter a full date (year, month, and day) to calculate your card.
        </p>
      )}
      {reveal && (
        <BirthCardResultCard
          key={`${reveal.result.birthCard}|${reveal.result.rulingCards.join(",")}`}
          reveal={reveal}
          date={date}
          onReset={() => {
            setReveal(null);
            setTouched(false);
            announceCard(null);
            setTimeout(() => dateRef.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
}

export function BirthdayWorkerAnchor({
  reveal,
  todayIso,
}: {
  reveal: BirthCardReveal;
  todayIso: string;
}) {
  const birthdayLink = birthdayWorkerLinkForReveal(
    reveal.birthdate,
    todayIso,
  );
  if (!birthdayLink) return null;

  return (
    <a href={birthdayLink.href} className="editorial-link">
      Read the {birthdayLink.label} birth-card page
    </a>
  );
}

/** The result continues to the Chemistry Check or a free exercise. */
function CalculatorNextStep() {
  return (
    <div className="calc-next">
      <StanReadingCta />
      <a href="#use-your-card" className="editorial-link">
        Try a free exercise before you screenshot this
      </a>
    </div>
  );
}

function BirthCardResultCard({
  reveal,
  date,
  onReset,
}: {
  reveal: BirthCardReveal;
  date: string;
  onReset: () => void;
}) {
  const { result } = reveal;
  const isJoker = result.birthCard === "Joker";
  const bc = parseCard(result.birthCard);
  const slug = birthCardSlug(result.birthCard);
  const watchFor = slug ? (CARD_VOICE.watchFor as Record<string, string>)[slug] : undefined;
  const t = testimonialForCard(bc?.label);
  let i = 0;
  const rise = () => ({ "data-rise": "", style: { "--rise-i": i++ } as React.CSSProperties });

  return (
    <div className="calc-result" data-in-view="true">
      {/* On desktop the rail shows the card; the name and the paid step live here. */}
      <div className="calc-result-head">
        <h2 className="calc-result-name" {...rise()}>{bc?.label ?? (isJoker ? "The Joker" : result.birthCard)}</h2>
        {result.rulingCards.length > 0 && (
          <p className="calc-ruling" {...rise()}>
            Ruling card{result.rulingCards.length > 1 ? "s" : ""}:{" "}
            {result.rulingCards.map((c, index) => (
              <span key={c}>
                {index > 0 ? ", " : ""}
                <span className={paperSuitClass(c)}>{parseCard(c)?.label ?? c}</span>
              </span>
            ))}
          </p>
        )}
      </div>
      {!isJoker && <OneLineRead code={result.birthCard} rise={rise} />}
      {!isJoker && watchFor && (
        <p className="calc-watch" {...rise()}>{watchFor}</p>
      )}
      <div className="calc-desktop-next" {...rise()}>
        <CalculatorNextStep />
      </div>
      <nav aria-label="What to do next" className="calc-now" {...rise()}>
        <p className="calc-now-title">Now what</p>
        <ol>
          {slug && (
            <li>
              <Link href={`/birth-card/${slug}`} className="editorial-link">
                Read your {bc?.label ?? "birth card"} meaning. It knows things
              </Link>
            </li>
          )}
          <li>
            <Link href="/birth-card-compatibility-calculator#da" className="editorial-link">
              Compare with the person you keep checking
            </Link>
          </li>
          {!isJoker && (
            <li>
              <Link
                href="/your-year"
                className="editorial-link"
                data-placement="birth-card-calculator-result"
                onClick={() =>
                  trackClientFunnelEvent("year_link_clicked", {
                    placement: "birth-card-calculator-result",
                  })
                }
              >
                See your whole year. Plan accordingly
              </Link>
            </li>
          )}
          <li>
            <BirthdayWorkerAnchor reveal={reveal} todayIso={todayISO()} />
          </li>
        </ol>
      </nav>
      {!isJoker && <div {...rise()}><CurrentPeriod birthdate={date || reveal.birthdate} /></div>}
      <figure className="calc-quote" {...rise()}>
        <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
        <figcaption>
          <span aria-label="5 out of 5 stars">★★★★★</span> {testimonialByline(t)}
          <span className="calc-quote-note">Real customer words, shared with permission. Individual reflections, not typical-results claims.</span>
        </figcaption>
      </figure>
      <p className="calc-reset" {...rise()}>
        <button type="button" className="editorial-link" onClick={onReset}>
          Wrong birthday? Change it
        </button>
      </p>
    </div>
  );
}

type Lens = { name: string; under: string; sweet_spot: string; over: string };
const LENSES = THREE_LENS as Record<string, Lens>;

/** Free one-line read of the card's pattern, shown with the card result. */
function OneLineRead({ code, rise }: { code: string; rise: () => Record<string, unknown> }) {
  const lens = LENSES[code];
  if (!lens) return null;
  return (
    <div className="calc-read" {...rise()}>
      <p className="calc-read-line">{lens.sweet_spot}</p>
      <p className="calc-read-shadow"><strong>Shadow.</strong> {lens.under}</p>
    </div>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
