"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { parseCard } from "@/lib/cards";
import { classifyElroyBirthdate } from "@/lib/elroy/input";
import {
  canSubmitElroy,
  elroyUiReducer,
  initialElroyUiState,
} from "@/lib/elroy/widget";
import {
  trackClientFunnelEvent,
  trackClientFunnelEventOnce,
} from "@/components/analytics/AnalyticsCapture";
import { ElroyTurnstile } from "./ElroyTurnstile";

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  prefBirthdate?: string;
  placement: string;
};

export function ElroyChatPanel({
  open,
  onClose,
  onComplete,
  prefBirthdate = "",
  placement,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [state, dispatch] = useReducer(
    elroyUiReducer,
    prefBirthdate,
    initialElroyUiState,
  );
  const [resetSignal, setResetSignal] = useState(0);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      trackClientFunnelEventOnce("elroy_opened", { placement });
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, placement]);

  useEffect(() => {
    if (prefBirthdate && prefBirthdate !== state.birthdate && state.step === "welcome") {
      dispatch({ type: "SET_BIRTHDATE", value: prefBirthdate });
    }
  }, [prefBirthdate, state.birthdate, state.step]);

  useEffect(() => {
    if (!liveRef.current) return;
    if (state.step === "card-reveal") {
      liveRef.current.textContent = `Your birth card is the ${state.birthCardLabel}.`;
    } else if (state.step === "reading") {
      liveRef.current.textContent = "Your micro-reading is ready.";
    } else if (state.errorMessage) {
      liveRef.current.textContent = state.errorMessage;
    }
  }, [state.step, state.birthCardLabel, state.errorMessage]);

  function announceBirthdate() {
    try {
      const birth = classifyElroyBirthdate(state.birthdate);
      if (birth.kind === "joker") {
        dispatch({ type: "REVEAL_JOKER", birthdate: birth.birthdate });
        trackClientFunnelEvent("elroy_birthdate_entered", { placement });
        return;
      }
      const label = parseCard(birth.birthCard)?.label || birth.birthCard;
      dispatch({
        type: "REVEAL_STANDARD",
        birthdate: birth.birthdate,
        birthCard: birth.birthCard,
        birthCardLabel: label,
      });
      trackClientFunnelEvent("elroy_birthdate_entered", { placement });
    } catch (err) {
      dispatch({
        type: "FAIL",
        message: err instanceof Error ? err.message : "Enter a valid birth date.",
      });
    }
  }

  async function submitReading() {
    if (!canSubmitElroy(state)) return;
    dispatch({ type: "SUBMIT" });
    trackClientFunnelEvent("elroy_email_submitted", { placement });
    try {
      const res = await fetch("/api/elroy/micro-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthdate: state.birthdate,
          email: state.email.trim(),
          consent: true,
          source: placement,
          turnstileToken: state.turnstileToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailSent?: boolean;
        card?: { birthCard: string; birthCardLabel: string; rulingCards: string[] };
        reading?: {
          core: string;
          tension: string;
          reflection: string;
          disclaimer: string;
        };
      };
      if (!res.ok || !data.card || !data.reading) {
        setResetSignal((n) => n + 1);
        dispatch({
          type: "FAIL",
          message:
            data.error ||
            (res.status === 403
              ? "Verification failed. Complete the check again."
              : "Something went wrong. Try again."),
        });
        return;
      }
      dispatch({
        type: "SUCCESS",
        emailSent: Boolean(data.emailSent),
        reading: {
          ...data.reading,
          rulingCards: data.card.rulingCards || [],
        },
      });
      trackClientFunnelEvent("elroy_micro_reading_viewed", {
        placement,
        outcome: data.emailSent ? "success" : "email_delayed",
      });
      onComplete();
    } catch {
      setResetSignal((n) => n + 1);
      dispatch({
        type: "FAIL",
        message: "Network error. Try again in a moment.",
      });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="elroy-panel"
      aria-labelledby="elroy-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="elroy-panel-shell">
        <header className="elroy-panel-header">
          <img src="/brand/elroy-avatar.svg" alt="" width={32} height={32} />
          <div>
            <h2 id="elroy-title">Elroy</h2>
            <p>Card Blueprints guide</p>
          </div>
          <button
            type="button"
            className="elroy-panel-close"
            aria-label="Close Elroy"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="elroy-messages" aria-live="polite">
          <div className="elroy-bubble elroy-bubble-elroy">
            I can show your birth card first, then give you a short pattern reading.
          </div>

          {state.step !== "welcome" && state.birthdate ? (
            <div className="elroy-bubble elroy-bubble-user">{state.birthdate}</div>
          ) : null}

          {state.step === "card-reveal" ||
          state.step === "email" ||
          state.step === "submitting" ||
          state.step === "reading" ||
          state.step === "error" ? (
            <div className="elroy-bubble elroy-bubble-elroy">
              Your birth card is the {state.birthCardLabel}.
            </div>
          ) : null}

          {state.step === "joker-boundary" ? (
            <div className="elroy-bubble elroy-bubble-elroy">
              Your date reaches the Joker boundary, sometimes called the Day Out of
              Time. The current Card Blueprints engine does not invent a standard
              52-card reading for this date, so Elroy stops here without asking for
              your email.
            </div>
          ) : null}

          {state.step === "email" ||
          state.step === "submitting" ||
          state.step === "error" ? (
            <div className="elroy-bubble elroy-bubble-elroy">
              Want the deeper pattern? I will show it here and email you a copy.
            </div>
          ) : null}

          {state.step === "reading" && state.reading ? (
            <>
              <div className="elroy-bubble elroy-bubble-elroy">
                <strong>Core pattern</strong>
                {"\n"}
                {state.reading.core}
              </div>
              <div className="elroy-bubble elroy-bubble-elroy">
                <strong>Tension</strong>
                {"\n"}
                {state.reading.tension}
              </div>
              <div className="elroy-bubble elroy-bubble-elroy">
                <strong>Reflection</strong>
                {"\n"}
                {state.reading.reflection}
                {"\n\n"}
                {state.reading.disclaimer}
              </div>
              <div className="elroy-bubble elroy-bubble-elroy">
                {state.emailSent
                  ? "I emailed you a copy."
                  : "Your reading is here. The email copy may be delayed."}
              </div>
              <a
                className="elroy-cta"
                href="/products/personal-card-blueprint"
                onClick={() =>
                  trackClientFunnelEvent("elroy_blueprint_clicked", { placement })
                }
              >
                See My Personal Card Blueprint
              </a>
            </>
          ) : null}

          {state.errorMessage ? (
            <div className="elroy-bubble elroy-bubble-elroy elroy-error" role="alert">
              {state.errorMessage}
            </div>
          ) : null}
        </div>

        <div className="elroy-composer">
          {(state.step === "welcome" || state.step === "birthdate") && (
            <>
              <label htmlFor="elroy-birthdate">What is your birth date?</label>
              <input
                id="elroy-birthdate"
                type="date"
                value={state.birthdate}
                onChange={(e) =>
                  dispatch({ type: "SET_BIRTHDATE", value: e.target.value })
                }
              />
              <button type="button" onClick={announceBirthdate}>
                Show my card
              </button>
            </>
          )}

          {state.step === "card-reveal" && (
            <button
              type="button"
              onClick={() => dispatch({ type: "CONTINUE_TO_EMAIL" })}
            >
              Get the deeper pattern
            </button>
          )}

          {(state.step === "email" ||
            state.step === "submitting" ||
            state.step === "error") && (
            <>
              <label htmlFor="elroy-email">Email for your reading copy</label>
              <input
                id="elroy-email"
                type="email"
                autoComplete="email"
                value={state.email}
                onChange={(e) =>
                  dispatch({ type: "SET_EMAIL", value: e.target.value })
                }
                disabled={state.step === "submitting"}
              />
              <label className="elroy-consent">
                <input
                  type="checkbox"
                  checked={state.consent}
                  onChange={(e) =>
                    dispatch({ type: "SET_CONSENT", value: e.target.checked })
                  }
                  disabled={state.step === "submitting"}
                />
                <span>
                  Email me this reading and occasional Card Blueprints educational
                  or product notes. I can unsubscribe anytime.
                </span>
              </label>
              <ElroyTurnstile
                resetSignal={resetSignal}
                onToken={(token) => dispatch({ type: "SET_TOKEN", value: token })}
              />
              <button
                type="button"
                disabled={!canSubmitElroy(state) || state.step === "submitting"}
                onClick={() => {
                  if (state.step === "error") dispatch({ type: "RETRY" });
                  void submitReading();
                }}
              >
                {state.step === "submitting" ? "Working…" : "Send my reading"}
              </button>
            </>
          )}
        </div>
        <div className="elroy-live" ref={liveRef} aria-live="polite" />
      </div>
    </dialog>
  );
}
