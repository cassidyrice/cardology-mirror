"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  startTransition,
} from "react";

import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { Reveal } from "@/components/seo/Reveal";
import {
  calculateBirthCardRevealFromIsoDate,
  type BirthCardReveal,
} from "@/lib/birth-card-calculator";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";

/**
 * Home landing calculator: birthday in, reveal out. Flip only; no river.
 */
export function LandingCalculator() {
  const [date, setDate] = useState("");
  const [reveal, setReveal] = useState<BirthCardReveal | null>(null);
  const [phase, setPhase] = useState<"idle" | "fold" | "shown">("idle");
  const [error, setError] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (window.location.hash === "#home-birthdate" || window.location.hash === "#bd") {
      dateRef.current?.focus();
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    trackClientFunnelEventOnce("calculator_started", { placement: "home-landing" });
    const calculated = calculateBirthCardRevealFromIsoDate(date);
    if (!calculated) {
      setReveal(null);
      setPhase("idle");
      setError("Enter a full date (year, month, and day).");
      return;
    }

    storeCheckoutBirthdate(date);
    trackClientFunnelEvent("calculator_completed", { placement: "home-landing" });
    window.__cardBlueprintsElroyBirthdate = date;

    const finish = () => {
      startTransition(() => {
        setReveal(calculated);
        setPhase("shown");
      });
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("elroy:birth-card-revealed", {
            detail: { birthdate: date },
          }),
        );
      }, 0);
    };

    if (reduceRef.current) {
      finish();
      return;
    }

    setPhase("fold");
    window.setTimeout(finish, 420);
  }

  return (
    <section
      className={`landing-shell ${phase === "fold" ? "is-fold" : ""} ${phase === "shown" ? "is-shown" : ""}`}
      aria-labelledby="home-calculator-title"
    >
      <div className="mx-auto max-w-lg px-5 text-center">
        <h1
          id="home-calculator-title"
          className="font-serif text-3xl leading-tight text-brand-ink sm:text-4xl"
        >
          Which card were you born under?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft sm:text-base">
          Your birthday adds up to one card. Same date, same card, every time.
        </p>
      </div>

      {!reveal ? (
        <form
          onSubmit={onSubmit}
          noValidate
          className="landing-form mx-auto mt-6 w-full max-w-sm px-5"
        >
          <div className="landing-field-wrap">
            <label htmlFor="home-birthdate" className="sr-only">
              Birthday
            </label>
            <input
              ref={dateRef}
              id="home-birthdate"
              type="date"
              value={date}
              onFocus={() =>
                trackClientFunnelEventOnce("calculator_started", {
                  placement: "home-landing",
                })
              }
              onChange={(e) => setDate(e.target.value)}
              aria-describedby="landing-privacy"
              aria-invalid={Boolean(error)}
              required
              className="landing-field min-h-12 w-full border border-brand-ink bg-brand-paper px-4 font-serif text-brand-ink outline-none focus:ring-0"
            />
            <div className="landing-field-back" aria-hidden>
              <span className="landing-field-back-mark">CB</span>
            </div>
          </div>
          <p id="landing-privacy" className="mt-2 text-center text-xs text-brand-ink-soft">
            Calculated here. Never stored.
          </p>
          {error ? (
            <p role="alert" className="mt-2 text-center text-sm text-brand-oxblood">
              {error}
            </p>
          ) : null}
          <button type="submit" className="accent-button large-button mt-4 w-full">
            Show my card
          </button>
        </form>
      ) : (
        <div className="mt-8 px-5">
          <Reveal
            key={`${reveal.result.birthCard}|${reveal.birthdate}`}
            reveal={reveal}
            birthdate={date || reveal.birthdate}
          />
          <p className="mt-4 text-center">
            <button
              type="button"
              className="text-xs text-brand-ink-soft underline underline-offset-4"
              onClick={() => {
                setReveal(null);
                setPhase("idle");
                setTimeout(() => dateRef.current?.focus(), 0);
              }}
            >
              Not your birthday? Change it
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
