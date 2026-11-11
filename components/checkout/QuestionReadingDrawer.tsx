"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import {
  getClientAttributionContext,
  trackClientFunnelEvent,
} from "@/components/analytics/AnalyticsCapture";
import {
  ReadingPassInteractivePanel,
  type ClientPassQuestionItem,
  type ClientReadingPassState,
} from "@/components/checkout/ReadingPassPortal";
import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import type { QuestionTrack } from "@/lib/question-reading-facts";
import {
  CARD_BLUEPRINT_READING_SPEC,
  PRIMARY_QUESTION_TRACK,
  QUESTION_SLA_SHORT,
  type DeliveryChannel,
} from "@/lib/question-reading-tracks";
import {
  SUGGESTED_QUESTIONS_FILENAME,
  SUGGESTED_QUESTIONS_PDF_PATH,
} from "@/lib/suggested-questions";

export const OPEN_QUESTION_CHECKOUT_EVENT = "cb:open-question-checkout";

export interface OpenQuestionCheckoutDetail {
  track?: QuestionTrack;
  withPartner?: boolean;
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
  defaultWithPartner?: boolean;
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
  defaultTrack = PRIMARY_QUESTION_TRACK,
  defaultWithPartner,
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
  const spec = CARD_BLUEPRINT_READING_SPEC;

  const initialPartnerMode =
    defaultWithPartner ?? (defaultTrack === "chemistry-check" || Boolean(initialBirth2));
  const [includePartner, setIncludePartner] = useState<boolean>(initialPartnerMode);
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
    passToken: string;
    initialPass: ClientReadingPassState | null;
  } | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const embeddedRef = useRef<EmbeddedInstance | null>(null);

  useEffect(() => {
    setIncludePartner(
      defaultWithPartner ?? (defaultTrack === "chemistry-check" || Boolean(initialBirth2)),
    );
  }, [defaultTrack, defaultWithPartner, initialBirth2]);

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
      setIncludePartner(true);
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
          track: PRIMARY_QUESTION_TRACK,
          birth1,
          name1,
          birth2: includePartner ? birth2 : "",
          name2: includePartner ? name2 : "",
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
          offerSlug: PRIMARY_QUESTION_TRACK,
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
              offerSlug: PRIMARY_QUESTION_TRACK,
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
                passToken?: string;
                passUrl?: string;
                suggestedQuestionsUrl?: string;
                accessExpiresAt?: number;
                windowHours?: number;
                maxQuestions?: number;
                questionsUsed?: number;
                questionsRemaining?: number;
                canSubmitQuestion?: boolean;
                questions?: ClientPassQuestionItem[];
              };

              const finalOrderId = confirmJson.orderId || orderId;
              const finalDestination =
                confirmJson.destination || (deliveryChannel === "sms" ? buyerPhone : buyerEmail);
              const finalTurnaround =
                confirmJson.turnaround ||
                "within 48 hours, with almost all delivered in under 24 hours";
              const passToken = confirmJson.passToken || "";

              const initialPass: ClientReadingPassState | null = passToken
                ? {
                    orderId: finalOrderId,
                    trackTitle: confirmJson.trackTitle || spec.title,
                    priceDollars: spec.priceDollars,
                    birth1,
                    name1,
                    defaultBirth2: includePartner ? birth2 : "",
                    defaultName2: includePartner ? name2 : "",
                    defaultRel2: "",
                    deliveryChannel: confirmJson.deliveryChannel || deliveryChannel,
                    destination: finalDestination,
                    paidAt: Date.now(),
                    accessExpiresAt: confirmJson.accessExpiresAt || Date.now() + 48 * 3_600_000,
                    windowHours: confirmJson.windowHours || 48,
                    windowOpen: true,
                    maxQuestions: confirmJson.maxQuestions || 3,
                    questionsUsed: confirmJson.questionsUsed ?? (question.trim().length >= 12 ? 1 : 0),
                    questionsRemaining:
                      confirmJson.questionsRemaining ?? (question.trim().length >= 12 ? 2 : 3),
                    canSubmitQuestion: confirmJson.canSubmitQuestion ?? true,
                    suggestedQuestionsUrl:
                      confirmJson.suggestedQuestionsUrl || SUGGESTED_QUESTIONS_PDF_PATH,
                    passUrl: confirmJson.passUrl || `/reading-pass?token=${encodeURIComponent(passToken)}`,
                    turnaround: finalTurnaround,
                    questions: confirmJson.questions ?? [],
                  }
                : null;

              setConfirmation({
                orderId: finalOrderId,
                trackTitle: confirmJson.trackTitle || spec.title,
                deliveryChannel: confirmJson.deliveryChannel || deliveryChannel,
                destination: finalDestination,
                turnaround: finalTurnaround,
                passToken,
                initialPass,
              });
            } catch {
              setConfirmation({
                orderId,
                trackTitle: spec.title,
                deliveryChannel,
                destination: deliveryChannel === "sms" ? buyerPhone : buyerEmail,
                turnaround: "within 48 hours, with almost all delivered in under 24 hours",
                passToken: "",
                initialPass: null,
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
          offerSlug: PRIMARY_QUESTION_TRACK,
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

  return (
    <section
      className={`qr-composer ${compact ? "qr-composer--compact" : ""}`}
      data-question-composer
      data-track={PRIMARY_QUESTION_TRACK}
      aria-label="Book The Card Blueprint Reading"
    >
      <div className="qr-head">
        <div className="qr-eyebrow-row">
          <span className="qr-eyebrow">The Card Blueprint Reading · Never Leave This Page</span>
          <span className="qr-sla-pill">{QUESTION_SLA_SHORT}</span>
        </div>
        <h3 className="qr-title">
          {heading ?? "The Card Blueprint Reading — $99"}
        </h3>
        <p className="qr-sub">
          {subheading ??
            "Includes an instant Suggested Questions Guide (.pdf) right after payment plus 48 hours of access to ask up to 3 questions (solo timing, work, blind spots, or two-person chemistry), personally reviewed by Cass and delivered by email or text."}
        </p>
      </div>

      {/* Unified $99 Offer Strip */}
      {step === "intake" && (
        <div className="qr-offer-strip">
          <div className="qr-track-top">
            <span className="qr-track-name">{spec.title}</span>
            <strong className="qr-track-price tnum">${spec.priceDollars}</strong>
          </div>
          <p className="qr-track-meta">
            Instant Suggested Questions download · Up to 3 questions within 48 hours of purchase · Email or Text delivery
          </p>
        </div>
      )}

      {step === "intake" && (
        <form onSubmit={handleStartPayment} className="qr-form">
          <div className="qr-grid">
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
          </div>

          <div className="qr-partner-toggle-box">
            <button
              type="button"
              onClick={() => {
                setIncludePartner((prev) => !prev);
                setAttemptId(makeAttemptId());
              }}
              className="editorial-link qr-edit-btn"
            >
              {includePartner
                ? "− Remove second person’s birthday (you can still add one on any of your 3 questions later)"
                : "+ Include a second person’s birthday (relationship / compatibility)"}
            </button>

            {includePartner && (
              <div className="qr-grid qr-mt-3">
                <div className="qr-field">
                  <label htmlFor={`${uid}-b2`}>Second person’s birth date</label>
                  <input
                    id={`${uid}-b2`}
                    type="date"
                    required={includePartner}
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
              </div>
            )}
          </div>

          <div className="qr-field">
            <label htmlFor={`${uid}-q`}>
              Question 1 of 3 (optional now — or pay first &amp; download the Suggested Questions Guide)
            </label>
            <textarea
              id={`${uid}-q`}
              rows={compact ? 3 : 4}
              maxLength={1200}
              placeholder={
                includePartner
                  ? "Ask Question 1 right now if you already know it — or leave blank to download the Suggested Questions Guide immediately after payment and ask up to 3 questions over 48 hours."
                  : "Type Question 1 now if it’s already on your mind — or leave blank, get the Suggested Questions download right after checkout, and submit up to 3 questions within 48 hours."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="qr-textarea"
            />
          </div>

          {/* Delivery Toggle: Email vs Text Message */}
          <div className="qr-delivery-box">
            <span className="qr-delivery-label">Where should we send your reading pass &amp; answers?</span>
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
                <div className="qr-grid">
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
                    <label htmlFor={`${uid}-email-backup`}>Email for your pass link &amp; written copy (optional)</label>
                    <input
                      id={`${uid}-email-backup`}
                      type="email"
                      autoComplete="email"
                      placeholder="For your Suggested Questions PDF + backup"
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
                    Send my personal reading answers to this mobile number by text message. Reading delivery only — never marketing texts.
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
              Inline Stripe checkout · Instant Suggested Questions PDF · 48h pass for up to 3 questions · Stay right on this page.
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
                Suggested Questions PDF + 48h pass (up to 3 questions) · Delivering via{" "}
                {deliveryChannel === "sms" ? `text to ${buyerPhone}` : `email to ${buyerEmail}`}
              </p>
            </div>
            <button type="button" onClick={handleEditDetails} className="editorial-link qr-edit-btn">
              Edit details
            </button>
          </div>
          <div ref={mountRef} className="qr-stripe-mount" />
        </div>
      )}

      {step === "confirmed" && confirmation && (
        confirmation.passToken ? (
          <ReadingPassInteractivePanel
            passToken={confirmation.passToken}
            initialPass={confirmation.initialPass}
            compact={compact}
          />
        ) : (
          <div className="qr-confirmed" role="status" aria-live="polite">
            <p className="qr-eyebrow">Order Confirmed · 48-Hour Reading Pass Active</p>
            <h4 className="qr-confirmed-title">
              Your Card Blueprint Reading ($99) is confirmed.
            </h4>
            <p className="qr-confirmed-body">
              Download your Suggested Questions Guide right now below, and check{" "}
              <strong>{confirmation.destination}</strong> for your private 48-hour Reading Pass link to submit up to 3 questions.
            </p>
            <div className="qr-pass-actions qr-mt-3">
              <a
                href={SUGGESTED_QUESTIONS_PDF_PATH}
                download={SUGGESTED_QUESTIONS_FILENAME}
                className="accent-button"
              >
                Download Suggested Questions (.pdf)
              </a>
            </div>
            <p className="qr-confirmed-meta">
              Reference: <code>{confirmation.orderId}</code>
            </p>
          </div>
        )
      )}
    </section>
  );
}

/**
 * Global zero-leave slide-over modal mounted once in SiteHeader so clicking ANY
 * `[data-open-question-track]` link or calling `openQuestionCheckout()` on any page
 * opens inline checkout for The Card Blueprint Reading ($99) without ever leaving the current URL.
 */
export function GlobalQuestionCheckoutModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OpenQuestionCheckoutDetail>({
    track: PRIMARY_QUESTION_TRACK,
    withPartner: false,
    placement: "header-modal",
  });

  useEffect(() => {
    function onCustomOpen(event: Event) {
      const custom = event as CustomEvent<OpenQuestionCheckoutDetail>;
      const next = custom.detail ?? {};
      const withPartner =
        next.withPartner ?? (next.track === "chemistry-check" || Boolean(next.birth2));
      setDetail({
        track: PRIMARY_QUESTION_TRACK,
        withPartner,
        birth1: next.birth1,
        birth2: next.birth2,
        monthDayHint: next.monthDayHint,
        placement: next.placement ?? "modal",
      });
      setOpen(true);
      trackClientFunnelEvent("drawer_opened", {
        offerSlug: PRIMARY_QUESTION_TRACK,
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
      const withPartner = attrTrack === "chemistry-check" || attrTrack === "with-partner";
      const placement = trigger.getAttribute("data-placement") || "cta-trigger";

      event.preventDefault();
      // Close any open header <details> dropdown cleanly
      const openDetails = trigger.closest("details[open]") as HTMLDetailsElement | null;
      if (openDetails) openDetails.open = false;

      setDetail({ track: PRIMARY_QUESTION_TRACK, withPartner, placement });
      setOpen(true);
      trackClientFunnelEvent("drawer_opened", {
        offerSlug: PRIMARY_QUESTION_TRACK,
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
      aria-label="Book The Card Blueprint Reading"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="qr-modal-sheet">
        <div className="qr-modal-topbar">
          <span className="qr-modal-brand">card blueprints · $99 reading pass</span>
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
          defaultTrack={PRIMARY_QUESTION_TRACK}
          defaultWithPartner={detail.withPartner}
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
