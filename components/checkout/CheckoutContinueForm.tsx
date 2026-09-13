"use client";

import { useEffect, useState, type FormEvent } from "react";

import { getCheckoutAnalyticsFields } from "@/components/analytics/AnalyticsCapture";
import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import {
  readCheckoutContext,
  readCheckoutQuestionDraft,
  storeCheckoutQuestion,
} from "@/lib/checkout-question";
import { sanitizeBirthdateISO } from "@/lib/birthdate";
import {
  QUESTION_FIELD_HINT,
  QUESTION_FIELD_LABEL,
  QUESTION_MAX_CHARS,
  QUESTION_MIN_CHARS,
  sanitizeQuestion,
} from "@/lib/deep-dive";

type Props = {
  slug: string;
  priceLabel: string;
  birthdate?: string;
  needsBirthdate?: boolean;
  /** One Question Reading: the question is typed here, before Stripe. */
  needsQuestion?: boolean;
  submitLabel?: string;
};

export function CheckoutContinueForm({
  slug,
  priceLabel,
  birthdate,
  needsBirthdate = false,
  needsQuestion = false,
  submitLabel,
}: Props) {
  const [pending, setPending] = useState(false);
  const [storedBirthdate, setStoredBirthdate] = useState("");
  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState("");

  useEffect(() => {
    const fromProp = sanitizeBirthdateISO(birthdate);
    const fromStore = readCheckoutBirthdate();
    const iso = fromProp || fromStore;
    if (iso) {
      storeCheckoutBirthdate(iso);
      setStoredBirthdate(iso);
    }
    if (needsQuestion) {
      setQuestion(readCheckoutQuestionDraft());
    }
  }, [birthdate, needsQuestion]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }

    const form = event.currentTarget;
    const field = form.elements.namedItem("birthdate");
    const raw =
      field instanceof HTMLInputElement
        ? field.value
        : storedBirthdate || readCheckoutBirthdate();
    const iso = sanitizeBirthdateISO(raw);
    if (needsBirthdate && !iso) {
      event.preventDefault();
      return;
    }
    if (needsQuestion) {
      const clean = sanitizeQuestion(question);
      if (!clean) {
        event.preventDefault();
        setQuestionError(
          `Write the question in at least ${QUESTION_MIN_CHARS} characters. One sentence is plenty.`,
        );
        return;
      }
      storeCheckoutQuestion(clean);
      setHiddenField(form, "question", clean);
      const context = readCheckoutContext();
      setHiddenField(form, "source", context.source || "checkout-review");
      if (context.cardLabel) setHiddenField(form, "cardLabel", context.cardLabel);
      if (context.cardSlug) setHiddenField(form, "cardSlug", context.cardSlug);
    }
    setPending(true);

    for (const [name, value] of Object.entries(getCheckoutAnalyticsFields())) {
      setHiddenField(form, name, value);
    }
    if (iso) {
      storeCheckoutBirthdate(iso);
      setHiddenField(form, "birthdate", iso);
    }
  }

  const remaining = QUESTION_MAX_CHARS - question.length;

  return (
    <form
      action={`/checkout/${slug}/session`}
      method="post"
      className="mt-6"
      data-analytics-checkout
      onSubmit={onSubmit}
    >
      {needsBirthdate ? (
        <label className="mb-4 block text-sm text-brand-ink">
          <span className="font-medium">Your birth date</span>
          <input
            key={storedBirthdate || "empty"}
            type="date"
            name="birthdate"
            required
            min="1900-01-01"
            max={new Date().getUTCFullYear() + "-12-31"}
            defaultValue={storedBirthdate}
            className="mt-2 w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink"
          />
          <span className="mt-1 block text-xs leading-relaxed text-brand-ink-soft">
            {needsQuestion
              ? "Your card comes from this date. Fix it here if the calculator had it wrong."
              : "Used only to generate this report. Change it if the calculator date is wrong."}
          </span>
        </label>
      ) : storedBirthdate ? (
        <input type="hidden" name="birthdate" value={storedBirthdate} />
      ) : null}
      {needsQuestion ? (
        <label className="mb-4 block text-sm text-brand-ink">
          <span className="font-medium">{QUESTION_FIELD_LABEL}</span>
          <textarea
            name="question_draft"
            required
            minLength={QUESTION_MIN_CHARS}
            maxLength={QUESTION_MAX_CHARS}
            rows={3}
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              setQuestionError("");
              storeCheckoutQuestion(event.target.value);
            }}
            placeholder="Should I take the job in Denver or stay where I am?"
            aria-describedby="checkout-question-hint"
            aria-invalid={questionError ? true : undefined}
            className="mt-2 w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink"
          />
          <span
            id="checkout-question-hint"
            className="mt-1 flex justify-between gap-3 text-xs leading-relaxed text-brand-ink-soft"
          >
            <span>{questionError || QUESTION_FIELD_HINT}</span>
            <span aria-live="polite">{remaining} left</span>
          </span>
        </label>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="accent-button large-button w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending
          ? "Redirecting to Secure Checkout…"
          : submitLabel || `Continue to Secure Checkout — ${priceLabel}`}
      </button>
    </form>
  );
}

function setHiddenField(form: HTMLFormElement, name: string, value: string) {
  const existing = form.elements.namedItem(name);
  let input: HTMLInputElement;
  if (existing instanceof HTMLInputElement) {
    input = existing;
  } else {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}
