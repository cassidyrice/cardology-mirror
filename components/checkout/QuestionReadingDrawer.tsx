"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  getClientAttributionContext,
  trackClientFunnelEvent,
} from "@/components/analytics/AnalyticsCapture";
import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import type { QuestionTrack } from "@/lib/question-reading-facts";
import {
  QUESTION_READING_TRACKS,
  QUESTION_SLA_SHORT,
  type DeliveryChannel,
} from "@/lib/question-reading-tracks";

export const OPEN_QUESTION_CHECKOUT_EVENT = "cb:open-question-checkout";

export interface OpenQuestionCheckoutDetail {
  track?: QuestionTrack;
  birth1?: string;
  birth2?: string;
  name1?: string;
  name2?: string;
  monthDayHint?: { month: number; day: number; label: string };
  placement?: string;
}

export function openQuestionCheckout(detail: OpenQuestionCheckoutDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenQuestionCheckoutDetail>(OPEN_QUESTION_CHECKOUT_EVENT, { detail }),
  );
}

type EmbeddedInstance = {
  mount(el: HTMLElement | string): void;
  unmount(): void;
  destroy(): void;
};

let stripePromiseCache: { key: string; promise: Promise<import("@stripe/stripe-js").Stripe | null> } | null =
  null;

async function loadStripeOnDemand(publishableKey: string) {
  if (stripePromiseCache && stripePromiseCache.key === publishableKey) {
    return stripePromiseCache.promise;
  }
  const { loadStripe } = await import("@stripe/stripe-js/pure");
  loadStripe.setLoadParameters({ advancedFraudSignals: false });
  const promise = loadStripe(publishableKey);
  stripePromiseCache = { key: publishableKey, promise };
  return promise;
}

function makeAttemptId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `att_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `att_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export interface QuestionReadingComposerProps {
  defaultTrack?: QuestionTrack;
  initialBirth1?: string;
  initialBirth2?: string;
  monthDayHint?: { month: number; day: number; label: string };
  placement?: string;
  compact?: boolean;
  heading?: string;
  subheading?: string;
  onSuccess?: () => void;
}

export function QuestionReadingComposer({
  defaultTrack = "chemistry-check",
  initialBirth1 = "",
  initialBirth2 = "",
  monthDayHint,
  placement = "inline-composer",
  compact = false,
  heading,
  subheading,
  onSuccess,
}: QuestionReadingComposerProps) {
  const uid = useId();
  const [track, setTrack] = useState<QuestionTrack>(defaultTrack);
  const [birth1, setBirth1] = useState(initialBirth1);
  const [birthYearForHint, setBirthYearForHint] = useState("");
  const [name1, setName1] = useState("");
  const [birth2, setBirth2] = useState(initialBirth2);
  const [name2, setName2] = useState("");
  const [question, setQuestion] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>("email");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  const [step, setStep] = useState<"intake" | "payment" | "confirmed">("intake");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jokerBlocked, setJokerBlocked] = useState(false);
  const [attemptId, setAttemptId] = useState(() => makeAttemptId());
  const [confirmation, setConfirmation] = useState<{
    orderId: string;
    trackTitle: string;
    deliveryChannel: DeliveryChannel;
    destination: string;
    turnaround: string;
  } | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const embeddedRef = useRef<EmbeddedInstance | null>(null);

  // Sync props or tab-stored birthday on mount
  useEffect(() => {
    setTrack(defaultTrack);
  }, [defaultTrack]);

  useEffect(() => {
    if (initialBirth1) {
      setBirth1(initialBirth1);
      return;
    }
    const stored = readCheckoutBirthdate();
    if (stored) {
      setBirth1((curr) => curr || stored);
    }
  }, [initialBirth1]);

  useEffect(() => {
    if (initialBirth2) {
      setBirth2(initialBirth2);
    }
  }, [initialBirth2]);

  // If on /born-on/march-19 and user types a 4-digit year, compose YYYY-MM-DD automatically
  useEffect(() => {
    if (!monthDayHint || birth1) return;
    if (/^\d{4}$/.test(birthYearForHint.trim())) {
      const y = Number(birthYearForHint.trim());
      if (y >= 1900 && y <= new Date().getFullYear()) {
        const composed = `${y}-${String(monthDayHint.month).padStart(2, "0")}-${String(
          monthDayHint.day,
        ).padStart(2, "0")}`;
        setBirth1(composed);
      }
    }
  }, [birthYearForHint, monthDayHint, birth1]);

  const destroyEmbedded = useCallback(() => {
    if (embeddedRef.current) {
      try {
        embeddedRef.current.destroy();
      } catch {
        // already destroyed
      }
      embeddedRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => destroyEmbedded();
  }, [destroyEmbedded]);

  const spec = useMemo(() => QUESTION_READING_TRACKS[track], [track]);

  async function handleStartPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setJokerBlocked(false);
    setBusy(true);

    if (birth1) storeCheckoutBirthdate(birth1);

    try {
      const attribution = getClientAttributionContext();
      const res = await fetch("/api/checkout/question-reading", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId,
          track,
          birth1,
          name1,
          birth2: track === "chemistry-check" ? birth2 : "",
          name2: track === "chemistry-check" ? name2 : "",
          question,
          deliveryChannel,
          buyerEmail,
          buyerPhone,
          smsConsent,
          placement,
          sourcePath: typeof window !== "undefined" ? window.location.pathname : "/",
          attribution,
        }),
      });

      const data = (await res.json()) as {
        orderId?: string;
        sessionId?: string;
        clientSecret?: string;
        publishableKey?: string;
        code?: string;
        error?: string;
      };

      if (!res.ok || !data.clientSecret || !data.publishableKey || !data.sessionId) {
        if (data.code === "JOKER_UNSUPPORTED") {
          setJokerBlocked(true);
        }
        setError(data.error || "Check your details and try again.");
        trackClientFunnelEvent("checkout_error", {
          offerSlug: track,
          placement,
          outcome: data.code || `http_${res.status}`,
        });
        setBusy(false);
        return;
      }

      const sessionId = data.sessionId;
      const orderId = data.orderId || "";
      setStep("payment");

      const stripe = await loadStripeOnDemand(data.publishableKey);
      if (!stripe) {
        throw new Error("Could not load inline payment frame.");
      }

      destroyEmbedded();
      const embedded = await stripe.createEmbeddedCheckoutPage({
        clientSecret: data.clientSecret,
        onComplete: () => {
          void (async () => {
            destroyEmbedded();
            trackClientFunnelEvent("inline_checkout_completed", {
              offerSlug: track,
              placement,
              outcome: deliveryChannel,
            });
            try {
              const confirmRes = await fetch("/api/checkout/question-reading/confirm", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ sessionId }),
              });
              const confirmJson = (await confirmRes.json()) as {
                orderId?: string;
                trackTitle?: string;
                deliveryChannel?: DeliveryChannel;
                destination?: string;
                turnaround?: string;
              };
              setConfirmation({
                orderId: confirmJson.orderId || orderId,
                trackTitle: confirmJson.trackTitle || spec.title,
                deliveryChannel: confirmJson.deliveryChannel || deliveryChannel,
                destination:
                  confirmJson.destination ||
                  (deliveryChannel === "sms" ? buyerPhone : buyerEmail),
                turnaround:
                  confirmJson.turnaround ||
                  "within 48 hours, with almost all delivered in under 24 hours",
              });
            } catch {
              setConfirmation({
                orderId,
                trackTitle: spec.title,
                deliveryChannel,
                destination: deliveryChannel === "sms" ? buyerPhone : buyerEmail,
                turnaround: "within 48 hours, with almost all delivered in under 24 hours",
              });
            }
            setStep("confirmed");
            onSuccess?.();
          })();
        },
      });

      embeddedRef.current = embedded;
      if (mountRef.current) {
        embedded.mount(mountRef.current);
        trackClientFunnelEvent("inline_checkout_mounted", {
          offerSlug: track,
          placement,
          outcome: deliveryChannel,
        });
      }
    } catch (err) {
      setStep("intake");
      setError(err instanceof Error ? err.message : "Could not open inline checkout.");
    } finally {
      setBusy(false);
    }
  }

  function handleEditDetails() {
    destroyEmbedded();
    setAttemptId(makeAttemptId());
    setStep("intake");
    setError(null);
  }

  function handleAskAnother() {
    destroyEmbedded();
    setAttemptId(makeAttemptId());
    setQuestion("");
    setConfirmation(null);
    setStep("intake");
    setError(null);
  }

  return (
    <section
      className={`qr-composer ${compact ? "qr-composer--compact" : ""}`}
      data-question-composer
      data-track={track}
      aria-label="Ask Cass a personal question"
    >
      <div className="qr-head">
        <div className="qr-eyebrow-row">
          <span className="qr-eyebrow">Personal Reading · Never Leave This Page</span>
          <span className="qr-sla-pill">{QUESTION_SLA_SHORT}</span>
        </div>
        <h3 className="qr-title">
          {heading ?? "Ask your actual question. Get Cass’s answer by email or text."}
        </h3>
        <p className="qr-sub">
          {subheading ??
            "Calculated from your exact Cardology spread, drafted from three angles, and personally reviewed and approved by Cass before it’s sent."}
        </p>
      </div>

      {/* Track Switcher ($26 Solo Timing vs $39 Chemistry Check) */}
      {step === "intake" && (
        <div className="qr-tracks" role="tablist" aria-label="Choose reading type">
          {(["timing-map", "chemistry-check"] as const).map((t) => {
            const item = QUESTION_READING_TRACKS[t];
            const active = track === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTrack(t);
                  setError(null);
                  setAttemptId(makeAttemptId());
                }}
                className={`qr-track-tab ${active ? "is-active" : ""}`}
              >
                <span className="qr-track-top">
                  <span className="qr-track-name">{item.title}</span>
                  <strong className="qr-track-price tnum">${item.priceDollars}</strong>
                </span>
                <span className="qr-track-meta">
                  {t === "timing-map" ? "Just you · 12-month timing" : "Two birthdays · Compatibility"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step === "intake" && (
        <form onSubmit={handleStartPayment} className="qr-form">
          <div className={`qr-grid ${track === "chemistry-check" ? "qr-grid--two" : ""}`}>
            <div className="qr-field">
              <label htmlFor={`${uid}-b1`}>Your birth date</label>
              {monthDayHint && !birth1 ? (
                <div className="qr-hint-row">
                  <span className="qr-hint-chip">{monthDayHint.label}</span>
                  <input
                    id={`${uid}-b1-year`}
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={new Date().getFullYear()}
                    placeholder="Birth year (e.g. 1991)"
                    value={birthYearForHint}
                    onChange={(e) => setBirthYearForHint(e.target.value)}
                    className="qr-input"
                  />
                </div>
              ) : null}
              <input
                id={`${uid}-b1`}
                type="date"
                required
                value={birth1}
                onChange={(e) => setBirth1(e.target.value)}
                className="qr-input"
              />
            </div>

            <div className="qr-field">
              <label htmlFor={`${uid}-n1`}>Your first name (optional)</label>
              <input
                id={`${uid}-n1`}
                type="text"
                maxLength={60}
                placeholder="How Cass should greet you"
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                className="qr-input"
              />
            </div>

            {track === "chemistry-check" && (
              <>
                <div className="qr-field">
                  <label htmlFor={`${uid}-b2`}>Their birth date</label>
                  <input
                    id={`${uid}-b2`}
                    type="date"
                    required
                    value={birth2}
                    onChange={(e) => setBirth2(e.target.value)}
                    className="qr-input"
                  />
                </div>
                <div className="qr-field">
                  <label htmlFor={`${uid}-n2`}>Their first name or initials (optional)</label>
                  <input
                    id={`${uid}-n2`}
                    type="text"
                    maxLength={60}
                    placeholder="e.g. Alex"
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    className="qr-input"
                  />
                </div>
              </>
            )}
          </div>

          <div className="qr-field">
            <label htmlFor={`${uid}-q`}>Your question for Cass</label>
            <textarea
              id={`${uid}-q`}
              required
              rows={compact ? 3 : 4}
              maxLength={1200}
              placeholder={
                track === "chemistry-check"
                  ? "What is actually going on between you two, and what do you want a straight answer on?"
                  : "What decision, timing window, career move, or shift in the next 12 months are you weighing?"
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="qr-textarea"
            />
          </div>

          {/* Delivery Toggle: Email vs Text Message */}
          <div className="qr-delivery-box">
            <span className="qr-delivery-label">Where should we send your reading?</span>
            <div className="qr-channel-toggle" role="radiogroup" aria-label="Delivery method">
              <button
                type="button"
                role="radio"
                aria-checked={deliveryChannel === "email"}
                onClick={() => setDeliveryChannel("email")}
                className={`qr-channel-btn ${deliveryChannel === "email" ? "is-active" : ""}`}
              >
                Email delivery
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={deliveryChannel === "sms"}
                onClick={() => setDeliveryChannel("sms")}
                className={`qr-channel-btn ${deliveryChannel === "sms" ? "is-active" : ""}`}
              >
                Text message (SMS)
              </button>
            </div>

            {deliveryChannel === "email" ? (
              <div className="qr-field qr-mt-3">
                <label htmlFor={`${uid}-email`}>Your email address</label>
                <input
                  id={`${uid}-email`}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="qr-input"
                />
              </div>
            ) : (
              <div className="qr-sms-fields qr-mt-3">
                <div className="qr-grid qr-grid--two">
                  <div className="qr-field">
                    <label htmlFor={`${uid}-phone`}>Your mobile number</label>
                    <input
                      id={`${uid}-phone`}
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="(555) 234-5678"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="qr-input"
                    />
                  </div>
                  <div className="qr-field">
                    <label htmlFor={`${uid}-email-backup`}>Backup email (optional)</label>
                    <input
                      id={`${uid}-email-backup`}
                      type="email"
                      autoComplete="email"
                      placeholder="For your full written copy"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="qr-input"
                    />
                  </div>
                </div>
                <label className="qr-consent">
                  <input
                    type="checkbox"
                    required
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                  />
                  <span>
                    Send my personal reading to this mobile number by text message. One-time reading delivery only — never marketing texts.
                  </span>
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="qr-error" role="alert">
              <p>{error}</p>
              {jokerBlocked && (
                <p className="qr-mt-2">
                  <Link href="/contact" className="editorial-link">
                    Message us on the contact page first
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="qr-submit-row">
            <button type="submit" disabled={busy} className="accent-button qr-submit-btn">
              {busy
                ? "Opening secure payment…"
                : `Continue to payment — $${spec.priceDollars}`}
            </button>
            <p className="qr-micro">
              Inline Stripe checkout · Apple Pay, Link & cards · Stay right on this page.
            </p>
          </div>
        </form>
      )}

      {step === "payment" && (
        <div className="qr-payment-stage">
          <div className="qr-payment-bar">
            <div>
              <strong>{spec.title}</strong> · <span className="tnum">${spec.priceDollars}</span>
              <p className="qr-payment-sub">
                Delivering via {deliveryChannel === "sms" ? `text to ${buyerPhone}` : `email to ${buyerEmail}`}
              </p>
            </div>
            <button type="button" onClick={handleEditDetails} className="editorial-link qr-edit-btn">
              Edit question or dates
            </button>
          </div>
          <div ref={mountRef} className="qr-stripe-mount" />
        </div>
      )}

      {step === "confirmed" && confirmation && (
        <div className="qr-confirmed" role="status" aria-live="polite">
          <p className="qr-eyebrow">Order Confirmed · In Cass’s Queue</p>
          <h4 className="qr-confirmed-title">
            Your question is in. You don’t need to do anything else.
          </h4>
          <p className="qr-confirmed-body">
            We’ve pulled the spread for your <strong>{confirmation.trackTitle}</strong> and drafted
            three angles on your question for Cass. She will review, edit, and send your reading to{" "}
            <strong>{confirmation.destination}</strong> {confirmation.turnaround}.
          </p>
          <p className="qr-confirmed-meta">
            Reference: <code>{confirmation.orderId}</code>
          </p>
          <button type="button" onClick={handleAskAnother} className="editorial-link qr-mt-3">
            Ask another question
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * Global zero-leave slide-over modal mounted once in SiteHeader so clicking ANY
 * `[data-open-question-track]` link or calling `openQuestionCheckout()` on any page
 * opens inline checkout without ever leaving the current URL.
 */
export function GlobalQuestionCheckoutModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OpenQuestionCheckoutDetail>({
    track: "chemistry-check",
    placement: "header-modal",
  });

  useEffect(() => {
    function onCustomOpen(event: Event) {
      const custom = event as CustomEvent<OpenQuestionCheckoutDetail>;
      const next = custom.detail ?? {};
      setDetail({
        track: next.track ?? "chemistry-check",
        birth1: next.birth1,
        birth2: next.birth2,
        monthDayHint: next.monthDayHint,
        placement: next.placement ?? "modal",
      });
      setOpen(true);
      trackClientFunnelEvent("drawer_opened", {
        offerSlug: next.track ?? "chemistry-check",
        placement: next.placement ?? "modal",
      });
    }

    function onDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest("[data-open-question-track]");
      if (!trigger) return;
      const attrTrack = trigger.getAttribute("data-open-question-track");
      const track: QuestionTrack =
        attrTrack === "timing-map" ? "timing-map" : "chemistry-check";
      const placement = trigger.getAttribute("data-placement") || "cta-trigger";

      event.preventDefault();
      // Close any open header <details> dropdown cleanly
      const openDetails = trigger.closest("details[open]") as HTMLDetailsElement | null;
      if (openDetails) openDetails.open = false;

      setDetail({ track, placement });
      setOpen(true);
      trackClientFunnelEvent("drawer_opened", {
        offerSlug: track,
        placement,
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener(OPEN_QUESTION_CHECKOUT_EVENT, onCustomOpen);
    document.addEventListener("click", onDocumentClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(OPEN_QUESTION_CHECKOUT_EVENT, onCustomOpen);
      document.removeEventListener("click", onDocumentClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="qr-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Ask a personal Cardology question"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="qr-modal-sheet">
        <div className="qr-modal-topbar">
          <span className="qr-modal-brand">card blueprints · personal reading</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="qr-modal-close"
            aria-label="Close reading drawer"
          >
            Close ✕
          </button>
        </div>
        <QuestionReadingComposer
          defaultTrack={detail.track}
          initialBirth1={detail.birth1}
          initialBirth2={detail.birth2}
          monthDayHint={detail.monthDayHint}
          placement={detail.placement}
          compact
        />
      </div>
    </div>
  );
}
