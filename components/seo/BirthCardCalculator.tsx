"use client";

import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { parseCard, todayISO } from "@/lib/cards";
import {
  birthdayWorkerLinkForReveal,
  birthCardSlug,
  calculateBirthCardRevealFromIsoDate,
  type BirthCardReveal,
} from "@/lib/birth-card-calculator";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import { BirthShareHero } from "@/components/share/BirthShareHero";
import { CurrentPeriod } from "./CurrentPeriod";
import { CALCULATOR_PRIVACY_MICROCOPY } from "@/lib/deep-dive";
import { DeepDiveCta } from "./DeepDiveCta";
import { DeepDiveSample } from "./DeepDiveSample";
import { testimonialByline, testimonialForCard } from "@/lib/testimonials";
import { shareFacePathFromCode } from "@/lib/share-cards";
import THREE_LENS from "@/lib/card-meanings.json";

const PREVIEW_CODES = ["Q♦", "8♦", "A♠"] as const;

function CalculatorPreviewFan() {
  return (
    <div className="flex h-28 items-end justify-center" aria-hidden="true">
      {PREVIEW_CODES.map((code, i) => {
        const src = shareFacePathFromCode(code);
        if (!src) return null;
        const rotate = i === 0 ? "-rotate-12" : i === 2 ? "rotate-12" : "rotate-0";
        const z = i === 1 ? "z-10" : "z-0";
        const overlap = i === 0 ? "translate-x-3" : i === 2 ? "-translate-x-3" : "";
        return (
          <img
            key={code}
            src={src}
            alt=""
            width={72}
            height={108}
            className={`relative ${z} ${rotate} ${overlap} rounded-[6px] border border-brand-line bg-brand-paper shadow-sm`}
          />
        );
      })}
    </div>
  );
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
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory px-4 py-6">
      <div className="mx-auto flex w-full max-w-[17.5rem] flex-col items-center">
      {birthCard ? <BirthShareHero birthCard={birthCard} /> : <CalculatorPreviewFan />}

      <form
        onSubmit={onSubmit}
        className="mt-4 w-full space-y-3"
        hidden={Boolean(reveal)}
        aria-hidden={reveal ? true : undefined}
      >
        <label htmlFor="bd" className="type-eyebrow block">
          Enter your birthday
        </label>
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
          className="w-full scroll-mt-24 rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink"
          required
        />
        <p id="calculator-privacy" className="text-xs leading-relaxed text-brand-ink-soft">
          {CALCULATOR_PRIVACY_MICROCOPY}
        </p>
        <button
          type="submit"
          className="accent-button large-button w-full"
        >
          Reveal my birth card
        </button>
      </form>

      {reveal && (
        <button
          type="button"
          onClick={() => {
            setReveal(null);
            setTouched(false);
            setTimeout(() => dateRef.current?.focus(), 0);
          }}
          className="mt-3 text-xs text-brand-ink-soft underline underline-offset-4"
        >
          Not your birthday? Change it
        </button>
      )}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {touched && !reveal
          ? "Enter a full date, including year, month, and day."
          : reveal
            ? `Your birth card is ${parseCard(reveal.result.birthCard)?.label ?? reveal.result.birthCard}.`
            : ""}
      </p>
      {touched && !reveal && (
        <p className="mt-4 text-sm text-brand-oxblood">
          Enter a full date (year, month, and day) to calculate your card.
        </p>
      )}
      {reveal && (
        <BirthCardResultCard
          key={`${reveal.result.birthCard}|${reveal.result.rulingCards.join(",")}`}
          reveal={reveal}
          date={date}
        />
      )}
      </div>
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
    <a
      href={birthdayLink.href}
      className="text-sm font-medium text-brand-ink underline underline-offset-4"
    >
      Read the {birthdayLink.label} birth-card page →
    </a>
  );
}

function BirthCardResultCard({
  reveal,
  date,
}: {
  reveal: BirthCardReveal;
  date: string;
}) {
  const { result } = reveal;
  const isJoker = result.birthCard === "Joker";
  const bc = parseCard(result.birthCard);
  const slug = birthCardSlug(result.birthCard);

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-3">
      {result.rulingCards.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-brand-ink-soft">
          <span className="uppercase tracking-widest text-brand-bronze">Ruling:</span>
          {result.rulingCards.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className={paperSuitClass(c)}>{c}</span>
              {parseCard(c)?.label}
            </span>
          ))}
        </div>
      )}
      {slug && (
        <Link
          href={`/birth-card/${slug}`}
          className="text-sm font-medium text-brand-ink underline underline-offset-4"
        >
          {bc?.label} meaning
        </Link>
      )}
      {!isJoker && <OneLineRead code={result.birthCard} />}
      <p className="mt-6 text-center font-serif text-xl text-brand-ink">
        The written Deep Dive comes free with the video. It is seven pages. This is page 1.
      </p>
      {!isJoker && (
        <DeepDiveSample
          cardSlug={slug}
          cardLabel={bc?.label}
          placement="birth-card-calculator-result"
        />
      )}
      <DeepDiveCta
        placement="birth-card-calculator-result"
        birthdate={date || reveal.birthdate}
        source="birth-card-calculator"
        cardLabel={bc?.label}
        cardSlug={slug ?? undefined}
      />
      {!isJoker && (
        <>
          <CurrentPeriod birthdate={date || reveal.birthdate} />
          <Link
            href="/your-year"
            className="text-sm font-medium text-brand-ink underline underline-offset-4"
            onClick={() =>
              trackClientFunnelEvent("year_link_clicked", {
                placement: "birth-card-calculator-result",
              })
            }
          >
            See your whole year →
          </Link>
        </>
      )}
      {(() => {
        const t = testimonialForCard(bc?.label);
        return (
          <figure className="mt-4 max-w-md text-center">
            <blockquote className="text-sm leading-relaxed text-brand-ink-soft">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-bronze">
              <span aria-label="5 out of 5 stars" className="mr-2 tracking-normal">★★★★★</span>
              {testimonialByline(t)}
            </figcaption>
            <p className="mt-2 text-xs leading-relaxed text-brand-ink-faint">
              Real customer words, shared with permission. Individual reflections, not typical-results claims.
            </p>
          </figure>
        );
      })()}
      <BirthdayWorkerAnchor
        reveal={reveal}
        todayIso={todayISO()}
      />
    </div>
  );
}

type Lens = { name: string; under: string; sweet_spot: string; over: string };
const LENSES = THREE_LENS as Record<string, Lens>;

/** Free sample of the card's written pattern, shown before the $47 CTA. */
function OneLineRead({ code }: { code: string }) {
  const lens = LENSES[code];
  if (!lens) return null;
  return (
    <div className="w-full max-w-md border border-brand-line bg-brand-paper px-4 py-3 text-center">
      <p className="type-eyebrow mb-2">Your card in one line</p>
      <p className="font-serif text-lg leading-snug text-brand-ink">
        {lens.sweet_spot}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        <span className="font-semibold text-brand-oxblood">Shadow:</span>{" "}
        {lens.under}
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
