"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { CurrentChapter } from "./CurrentChapter";
import { DeepDiveCta } from "./DeepDiveCta";

export function BirthCardCalculator() {
  const [date, setDate] = useState("");
  const [reveal, setReveal] = useState<BirthCardReveal | null>(null);
  const [touched, setTouched] = useState(false);

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
    setReveal(calculated);
    if (calculated) {
      storeCheckoutBirthdate(date);
      trackClientFunnelEvent("calculator_completed", {
        placement: "calculator-form",
      });
      window.__cardBlueprintsElroyBirthdate = date;
      window.dispatchEvent(
        new CustomEvent("elroy:birth-card-revealed", {
          detail: { birthdate: date },
        }),
      );
    }
  }

  const birthCard = reveal?.result.birthCard;

  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory p-5">
      <BirthShareHero birthCard={birthCard} />

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
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
    <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3">
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
      {!isJoker && (
        <CurrentChapter birthdate={date || reveal.birthdate} />
      )}
      <DeepDiveCta
        placement="birth-card-calculator-result"
        birthdate={date || reveal.birthdate}
        source="birth-card-calculator"
      />
      <BirthdayWorkerAnchor
        reveal={reveal}
        todayIso={todayISO()}
      />
    </div>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
