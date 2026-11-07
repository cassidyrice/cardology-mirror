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
import { setStage } from "@/components/home/Stage";
import { Reveal } from "@/components/seo/Reveal";
import {
  calculateBirthCardRevealFromIsoDate,
  type BirthCardReveal,
} from "@/lib/birth-card-calculator";
import { parseCard } from "@/lib/cards";
import { shareFacePathFromCode } from "@/lib/share-cards";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";

/**
 * The live thing on the homepage (docs/design/MOTION.md, "The card turns to
 * face you"). Birthday in; the form leaves, the stage holds, the card turns,
 * the verdict lands. With scripting off the same form opens the calculator page
 * with the birthday, which already reads ?birthdate=.
 */
type Phase = "idle" | "leaving" | "shown";

export function LandingCalculator() {
  const [date, setDate] = useState("");
  const [reveal, setReveal] = useState<BirthCardReveal | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);
  const reduceRef = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
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

    const code = calculated.result.birthCard;
    const label = code === "Joker" ? "The Joker" : parseCard(code)?.label ?? code;

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

    // The stage turns the card; the column follows once the form has left.
    setStage({ kind: "card", face: shareFacePathFromCode(code), label });

    if (reduceRef.current) {
      finish();
      return;
    }
    setPhase("leaving");
    timer.current = window.setTimeout(finish, 180);
  }

  function reset() {
    setReveal(null);
    setPhase("idle");
    setStage({ kind: "film" });
    setTimeout(() => dateRef.current?.focus(), 0);
  }

  return (
    <div className="landing-shell" data-phase={phase}>
      {phase !== "shown" || !reveal ? (
        <form
          onSubmit={onSubmit}
          noValidate
          action="/birth-card-calculator"
          method="get"
          className="landing-form"
          aria-labelledby="home-purpose-title"
        >
          <p className="landing-note">
            The card is free. So is the first uncomfortable thought.{" "}
            <a href="#readings" className="editorial-link">Skip ahead to a personal reading</a>
          </p>
          <label htmlFor="home-birthdate" className="landing-label">
            Your birthday
          </label>
          <div className="landing-row">
            <input
              ref={dateRef}
              id="home-birthdate"
              name="birthdate"
              type="date"
              value={date}
              onFocus={() =>
                trackClientFunnelEventOnce("calculator_started", {
                  placement: "home-landing",
                })
              }
              onChange={(e) => setDate(e.target.value)}
              aria-describedby={error ? "landing-privacy landing-error" : "landing-privacy"}
              aria-invalid={Boolean(error)}
              required
              className="landing-field"
            />
            <button type="submit" className="accent-button landing-submit">
              Show me my card
            </button>
          </div>
          <p id="landing-privacy" className="landing-privacy">
            Calculated in your browser. Your birthday is kept in this tab to continue between tools.
          </p>
          <p id="landing-error" role="alert" className="landing-error" aria-live="assertive">
            {error}
          </p>
        </form>
      ) : (
        <Reveal
          key={`${reveal.result.birthCard}|${reveal.birthdate}`}
          reveal={reveal}
          birthdate={date || reveal.birthdate}
          onReset={reset}
        />
      )}
    </div>
  );
}
