"use client";

import { useEffect, useState, type FormEvent } from "react";

import { getCheckoutAnalyticsFields } from "@/components/analytics/AnalyticsCapture";
import { readCheckoutBirthdate, storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import { sanitizeBirthdateISO } from "@/lib/birthdate";

type Props = {
  slug: string;
  priceLabel: string;
  birthdate?: string;
};

export function CheckoutContinueForm({ slug, priceLabel, birthdate }: Props) {
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
    setPending(true);

    const form = event.currentTarget;
    for (const [name, value] of Object.entries(getCheckoutAnalyticsFields())) {
      setHiddenField(form, name, value);
    }
    const iso = storedBirthdate || readCheckoutBirthdate();
    if (iso) setHiddenField(form, "birthdate", iso);
  }

  return (
    <form
      action={`/checkout/${slug}/session`}
      method="post"
      className="mt-6"
      data-analytics-checkout
      onSubmit={onSubmit}
    >
      {storedBirthdate ? (
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
