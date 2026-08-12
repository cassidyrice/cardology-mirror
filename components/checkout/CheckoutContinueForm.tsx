"use client";

import { useState, type FormEvent } from "react";

import { getCheckoutAnalyticsFields } from "@/components/analytics/AnalyticsCapture";

type Props = {
  slug: string;
  priceLabel: string;
  birthdate?: string;
};

export function CheckoutContinueForm({ slug, priceLabel, birthdate }: Props) {
  const [pending, setPending] = useState(false);

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
  }

  return (
    <form
      action={`/checkout/${slug}/session`}
      method="post"
      className="mt-6"
      data-analytics-checkout
      onSubmit={onSubmit}
    >
      {birthdate ? (
        <input type="hidden" name="birthdate" value={birthdate} />
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
