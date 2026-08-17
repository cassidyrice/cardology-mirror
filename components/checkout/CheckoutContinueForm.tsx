"use client";

import { useEffect, useState, type FormEvent } from "react";

import { getCheckoutAnalyticsFields } from "@/components/analytics/AnalyticsCapture";
import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import { sanitizeBirthdateISO } from "@/lib/birthdate";

type Props = {
  slug: string;
  priceLabel: string;
  birthdate?: string;
  needsBirthdate?: boolean;
};

export function CheckoutContinueForm({
  slug,
  priceLabel,
  birthdate,
  needsBirthdate = false,
}: Props) {
  const [pending, setPending] = useState(false);
  const [storedBirthdate, setStoredBirthdate] = useState("");

  useEffect(() => {
    const fromProp = sanitizeBirthdateISO(birthdate);
    const fromStore = readCheckoutBirthdate();
    const iso = fromProp || fromStore;
    if (iso) {
      storeCheckoutBirthdate(iso);
      setStoredBirthdate(iso);
    }
  }, [birthdate]);

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
    setPending(true);

    for (const [name, value] of Object.entries(getCheckoutAnalyticsFields())) {
      setHiddenField(form, name, value);
    }
    if (iso) {
      storeCheckoutBirthdate(iso);
      setHiddenField(form, "birthdate", iso);
    }
  }

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
            Used only to generate this report. Change it if the calculator
            date is wrong.
          </span>
        </label>
      ) : storedBirthdate ? (
        <input type="hidden" name="birthdate" value={storedBirthdate} />
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="accent-button large-button w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending
          ? "Redirecting to Secure Checkout…"
          : `Continue to Secure Checkout — ${priceLabel}`}
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
