"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type StripeEmbeddedCheckout } from "@stripe/stripe-js";

import { getCheckoutAnalyticsFields } from "@/components/analytics/AnalyticsCapture";
import {
  DEEP_DIVE_SESSION_PATH,
  DEEP_DIVE_SUCCESS_COPY,
} from "@/lib/deep-dive";

export function DeepDiveEmbeddedCheckout({
  birthdate,
  source,
}: {
  birthdate: string;
  source: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stripePromise = (async () => {
          const res = await fetch(DEEP_DIVE_SESSION_PATH, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json",
            },
            credentials: "same-origin",
            redirect: "manual",
            body: JSON.stringify({
              birthdate,
              source,
              ...getCheckoutAnalyticsFields(),
            }),
          });
          if (res.type === "opaqueredirect" || res.status >= 300) {
            throw new Error("unavailable");
          }
          const data = (await res.json()) as {
            clientSecret?: string;
            publishableKey?: string;
            error?: string;
          };
          if (!res.ok || !data.clientSecret || !data.publishableKey) {
            throw new Error(data.error || "unavailable");
          }
          return data;
        })();

        const data = await stripePromise;
        const stripe = await loadStripe(data.publishableKey!);
        if (!stripe) throw new Error("unavailable");

        // Official Stripe recipe: /checkout/embedded/quickstart
        // ui_mode embedded_page + createEmbeddedCheckoutPage mounts an iframe
        // in-place. Do not use hosted Checkout or Payment Links.
        const checkout = await stripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => data.clientSecret!,
          onComplete: () => {
            setComplete(true);
            checkoutRef.current?.unmount();
          },
        });
        if (cancelled) {
          checkout.destroy();
          return;
        }
        checkoutRef.current = checkout;
        if (mountRef.current) checkout.mount(mountRef.current);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(
            "Secure checkout is temporarily unavailable. Try again in a moment.",
          );
          setLoading(false);
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [birthdate, source]);

  if (complete) {
    return (
      <div
        role="status"
        className="w-full rounded-[3px] border border-brand-line bg-brand-paper p-5 text-center"
      >
        <p className="font-serif text-xl text-brand-ink">Check your email.</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
          {DEEP_DIVE_SUCCESS_COPY}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <p className="mb-3 text-center text-sm text-brand-ink-soft">
          Opening secure checkout…
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-center text-sm text-brand-oxblood">
          {error}
        </p>
      )}
      <div ref={mountRef} className="min-h-[20rem] w-full" />
    </div>
  );
}
