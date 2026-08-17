"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
import {
  personalCheckoutHref,
  storeCheckoutBirthdate,
} from "@/lib/checkout-birthdate";
import { instantReportBySlug } from "@/lib/products";
import { PlayingCard } from "../PlayingCard";
import { NewsletterSignupForm } from "./NewsletterSignupForm";
import { ShareCard } from "./ShareCard";

const blueprintOffer = instantReportBySlug("personal-card-blueprint");
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

  return (
    <div className="rounded-[3px] border border-brand-line bg-brand-ivory p-5">
      <form onSubmit={onSubmit} className="space-y-3">
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
}: {
  reveal: BirthCardReveal;
}) {
  const { birthdate, result } = reveal;
  const isJoker = result.birthCard === "Joker";
  const bc = parseCard(result.birthCard);
  const slug = birthCardSlug(result.birthCard);
  const rootRef = useRef<HTMLDivElement>(null);
  const priceLabel = blueprintOffer?.priceLabel ?? "$13";
  const checkoutHref = personalCheckoutHref();

  // Bring the reveal into view on small screens. "nearest" = no-op when
  // the result is already visible; reduced motion gets an instant jump.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rootRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, []);

  return (
    <div ref={rootRef} className="mt-8 animate-fade-up">
      <p className="type-eyebrow mb-4 text-center">Your birth card</p>

      <div className="flex flex-col items-center gap-6">
        {isJoker ? (
          <div className="flex h-56 w-40 items-center justify-center rounded-[3px] border border-brand-line bg-brand-ivory text-6xl text-brand-oxblood">
            ★
          </div>
        ) : (
          <div className="flip-scene">
            <div className="flip-inner">
              <div className="flip-face">
                <PlayingCard
                  code={result.birthCard}
                  size="lg"
                  active
                  glow
                  float
                  surface="paper"
                  className="scale-110"
                />
              </div>
              <div className="flip-face flip-back" aria-hidden>
                <PlayingCard
                  code={result.birthCard}
                  size="lg"
                  faceDown
                  surface="paper"
                  className="scale-110"
                />
              </div>
            </div>
          </div>
        )}

        <div className="rise text-center" style={{ animationDelay: "0.55s" }}>
          <p className="font-serif text-2xl text-brand-ink">{isJoker ? "The Joker" : bc?.label}</p>
          {isJoker && (
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-ink-soft">
              December 31 is the Joker position: the one birthday outside the 52 standard cards.
            </p>
          )}
          {result.rulingCards.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-brand-ink-soft">
              <span className="uppercase tracking-widest text-brand-bronze">Ruling:</span>
              {result.rulingCards.map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className={paperSuitClass(c)}>{c}</span>
                  {parseCard(c)?.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          className="rise mt-2 flex w-full max-w-md flex-col items-center gap-3"
          style={{ animationDelay: "0.72s" }}
        >
          <Link
            href={checkoutHref}
            prefetch={false}
            className="accent-button large-button w-full text-center sm:w-auto"
            onClick={() => {
              storeCheckoutBirthdate(birthdate);
              trackClientFunnelEvent("offer_cta_clicked", {
                offerSlug: "personal-card-blueprint",
                placement: "birth-card-calculator-result",
              });
            }}
          >
            {`Get My Blueprint — ${priceLabel}`}
          </Link>
          <Link
            href="/products/personal-card-blueprint"
            className="text-sm font-medium text-brand-ink underline underline-offset-4"
          >
            What&apos;s inside the Blueprint? →
          </Link>
          <BirthdayWorkerAnchor
            reveal={reveal}
            todayIso={todayISO()}
          />
          {slug && (
            <Link
              href={`/birth-card/${slug}`}
              className="text-sm font-medium text-brand-ink underline underline-offset-4"
            >
              Read the {bc?.label} meaning →
            </Link>
          )}
        </div>
        <p
          className="rise max-w-md text-center text-xs leading-relaxed text-brand-ink-soft"
          style={{ animationDelay: "0.82s" }}
        >
          A written pattern you can actually use — not a horoscope.
          Locks pattern, ruling card, and your current 52-day period in
          writing. One-time{" "}
          {priceLabel}.
        </p>
        {!isJoker && bc?.label && (
          <div className="rise" style={{ animationDelay: "0.88s" }}>
            <ShareCard cardLabel={bc.label} slug={slug} />
          </div>
        )}
        <div className="rise w-full max-w-xl" style={{ animationDelay: "0.94s" }}>
          <NewsletterSignupForm source="calculator-result" compact />
        </div>
      </div>

    </div>
  );
}

function paperSuitClass(code: string): string {
  const card = parseCard(code);
  return card?.suit === "hearts" || card?.suit === "diamonds"
    ? "text-brand-oxblood"
    : "text-brand-ink";
}
