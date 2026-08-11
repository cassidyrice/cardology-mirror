"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { MY_QUESTION_MAX_LENGTH } from "@/lib/my-question/core";

type OnboardingFailure = {
  ok: false;
  code: string;
  message: string;
  field?: string;
};

type OnboardingSuccess = {
  ok: true;
  fulfillmentDate: string;
  slotNumber: number;
  notificationPending: boolean;
};

export function MyQuestionOnboardingForm({
  sessionId,
}: {
  sessionId: string;
}) {
  const [customerName, setCustomerName] = useState("");
  const [question, setQuestion] = useState("");
  const [relevantBirthdates, setRelevantBirthdates] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<OnboardingFailure | null>(null);
  const [completed, setCompleted] = useState<OnboardingSuccess | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || completed) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/my-question/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sessionId,
          customerName,
          question,
          relevantBirthdates: relevantBirthdates.filter(Boolean),
        }),
      });
      const body = (await response.json()) as OnboardingFailure | OnboardingSuccess;
      if (!response.ok || !body.ok) {
        setError(
          body.ok
            ? {
                ok: false,
                code: "onboarding_unavailable",
                message:
                  "Your payment is safe, but onboarding could not be saved. Try again or contact support.",
              }
            : body,
        );
        return;
      }
      setCompleted(body);
    } catch {
      setError({
        ok: false,
        code: "network_error",
        message:
          "Your payment is safe, but the form could not be submitted. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <section
        aria-labelledby="onboarding-complete-heading"
        className="rounded-sm border border-brand-line-strong bg-brand-ivory p-6 sm:p-8"
      >
        <h2 id="onboarding-complete-heading" className="font-serif text-3xl font-semibold text-brand-ink">
          Your reading date is reserved.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-brand-ink-soft">
          Your private reading is assigned for{" "}
          <strong className="text-brand-ink">
            {formatFulfillmentDate(completed.fulfillmentDate)}
          </strong>
          .{" "}
          {completed.notificationPending
            ? "Your date is saved, but the confirmation email may be delayed. Keep this page and your Stripe receipt."
            : "A confirmation was sent to the email used at checkout."}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft">
          Keep your Stripe receipt. It contains the payment record connected to
          this order.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div>
        <label htmlFor="customerName" className="block text-sm font-semibold text-brand-ink">
          Name for the reading
        </label>
        <input
          id="customerName"
          name="customerName"
          autoComplete="name"
          required
          maxLength={80}
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          aria-invalid={error?.field === "customerName" || undefined}
          className="mt-2 min-h-12 w-full rounded-sm border border-brand-line-strong bg-brand-paper px-4 py-3 text-base text-brand-ink shadow-sm outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-gold-soft"
        />
      </div>

      <div>
        <div className="flex items-end justify-between gap-4">
          <label htmlFor="question" className="block text-sm font-semibold text-brand-ink">
            Your one focused question
          </label>
          <span className="text-xs text-brand-ink-faint" aria-live="polite">
            {question.length}/{MY_QUESTION_MAX_LENGTH}
          </span>
        </div>
        <p id="question-help" className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
          Ask about one situation, relationship, decision, or recurring pattern.
        </p>
        <textarea
          id="question"
          name="question"
          required
          rows={7}
          maxLength={MY_QUESTION_MAX_LENGTH}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          aria-describedby="question-help question-boundaries"
          aria-invalid={error?.field === "question" || undefined}
          className="mt-3 w-full resize-y rounded-sm border border-brand-line-strong bg-brand-paper px-4 py-3 text-base leading-relaxed text-brand-ink shadow-sm outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-gold-soft"
        />
        <p id="question-boundaries" className="mt-2 text-xs leading-relaxed text-brand-ink-soft">
          Do not submit a medical, legal, financial, crisis, treatment,
          guaranteed-prediction, or mind-reading request.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-brand-ink">
          Relevant birthdates, if needed
        </legend>
        <p className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
          Include up to three people only when they are directly relevant to
          your question. Leave every field blank if no one else is involved.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {relevantBirthdates.map((value, index) => (
            <div key={index}>
              <label
                htmlFor={`relevantBirthdate${index + 1}`}
                className="block text-xs font-semibold text-brand-ink-soft"
              >
                Birthdate {index + 1}
              </label>
              <input
                id={`relevantBirthdate${index + 1}`}
                name="relevantBirthdates"
                type="date"
                value={value}
                onChange={(event) =>
                  setRelevantBirthdates((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
                aria-invalid={error?.field === "relevantBirthdates" || undefined}
                className="mt-2 min-h-12 w-full rounded-sm border border-brand-line-strong bg-brand-paper px-3 py-3 text-base text-brand-ink outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-gold-soft"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-sm border border-brand-oxblood bg-brand-paper-deep px-4 py-3 text-sm leading-relaxed text-brand-ink outline-none"
        >
          {error.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 w-full rounded-sm bg-brand-oxblood px-6 py-3 font-semibold text-brand-paper shadow-sm transition hover:bg-brand-oxblood-deep active:translate-y-px disabled:cursor-wait disabled:bg-brand-ink-soft"
      >
        {submitting ? "Reserving your date..." : "Submit and reserve my date"}
      </button>

      <p className="text-xs leading-relaxed text-brand-ink-soft">
        Your question and additional birthdates are private fulfillment data.
        Detailed intake is scheduled for deletion 90 days after delivery.
      </p>
    </form>
  );
}

function formatFulfillmentDate(dateIso: string): string {
  const parsed = new Date(`${dateIso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
