"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type CheckoutFailure = {
  ok: false;
  code: string;
  message: string;
  field?: string;
};

type CheckoutSuccess = {
  ok: true;
  checkoutUrl: string;
};

export function MyQuestionOrderForm({
  checkoutOpen,
  basePriceCents,
  blueprintPriceCents,
}: {
  checkoutOpen: boolean;
  basePriceCents: number;
  blueprintPriceCents: number;
}) {
  const [primaryBirthdate, setPrimaryBirthdate] = useState("");
  const [includeBlueprint, setIncludeBlueprint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<CheckoutFailure | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const total = basePriceCents + (includeBlueprint ? blueprintPriceCents : 0);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkoutOpen || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/myquestion/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          primaryBirthdate,
          includeQuestionBlueprint: includeBlueprint,
        }),
      });
      const body = (await response.json()) as CheckoutFailure | CheckoutSuccess;
      if (!response.ok || !body.ok) {
        setError(
          body.ok
            ? {
                ok: false,
                code: "checkout_unavailable",
                message: "Secure checkout is unavailable. No payment was taken.",
              }
            : body,
        );
        return;
      }
      window.location.assign(body.checkoutUrl);
    } catch {
      setError({
        ok: false,
        code: "network_error",
        message:
          "Secure checkout could not be reached. Check your connection and try again. No payment was taken.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      method="post"
      action="/myquestion/checkout"
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-describedby="my-question-checkout-note"
    >
      <div>
        <label
          htmlFor="primaryBirthdate"
          className="block text-sm font-semibold text-brand-ink"
        >
          Your birthdate
        </label>
        <p id="birthdate-help" className="mt-1 text-sm leading-relaxed text-brand-ink-soft">
          Used to calculate the cards for your reading. December 31 is not
          supported yet.
        </p>
        <input
          id="primaryBirthdate"
          name="primaryBirthdate"
          type="date"
          required
          value={primaryBirthdate}
          onChange={(event) => setPrimaryBirthdate(event.target.value)}
          aria-describedby="birthdate-help"
          aria-invalid={error?.field === "birthdate" || undefined}
          className="mt-3 min-h-12 w-full rounded-sm border border-brand-line-strong bg-brand-paper px-4 py-3 text-base text-brand-ink shadow-sm outline-none transition focus:border-brand-oxblood focus:ring-2 focus:ring-brand-gold-soft"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-brand-line bg-brand-paper-deep p-4 transition hover:border-brand-line-strong">
        <input
          name="includeQuestionBlueprint"
          type="checkbox"
          checked={includeBlueprint}
          onChange={(event) => setIncludeBlueprint(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-brand-oxblood"
        />
        <span>
          <span className="block font-semibold text-brand-ink">
            Add the Question Blueprint
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-brand-ink-soft">
            A 4-6 page question-specific PDF using the same reviewed reading.
            Add {money.format(blueprintPriceCents / 100)}.
          </span>
        </span>
      </label>

      <div className="border-t border-brand-line pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-semibold text-brand-ink-soft">One-time total</span>
          <output className="font-serif text-3xl font-semibold text-brand-ink" aria-live="polite">
            {money.format(total / 100)}
          </output>
        </div>
        <p id="my-question-checkout-note" className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
          Payment comes first. Your exact weekday delivery date is reserved only
          after the required onboarding form is complete.
        </p>
      </div>

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
        disabled={!checkoutOpen || submitting}
        className="min-h-12 w-full rounded-sm bg-brand-oxblood px-6 py-3 font-semibold text-brand-paper shadow-sm transition hover:bg-brand-oxblood-deep active:translate-y-px disabled:cursor-not-allowed disabled:bg-brand-ink-soft disabled:text-brand-paper"
      >
        {submitting
          ? "Preparing secure checkout..."
          : checkoutOpen
            ? "Continue to secure checkout"
            : "Checkout opens after final review"}
      </button>

      {!checkoutOpen ? (
        <p className="text-center text-xs leading-relaxed text-brand-ink-soft">
          Local preview only. The proof package and payment infrastructure must
          pass final review before checkout can open.
        </p>
      ) : null}
    </form>
  );
}
