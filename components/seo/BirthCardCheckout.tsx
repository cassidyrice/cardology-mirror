"use client";

import { useEffect, useRef, useState } from "react";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";

const placement = { offerSlug: "birth-card-blueprint", placement: "birth-card-calculator-result" };

export function BirthCardCheckout({ cardName, birthdate }: { cardName: string; birthdate: string }) {
  const [state, setState] = useState<"offer" | "loading" | "open" | "error" | "closed" | "complete">("offer");
  const [request, setRequest] = useState(0);
  const attemptId = useRef("");
  const form = useRef<HTMLDivElement>(null);
  const offer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = offer.current;
    if (!el || !window.IntersectionObserver) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (entry.intersectionRatio >= 0.5) {
        timer = setTimeout(() => {
          trackClientFunnelEvent("offer_viewed", placement);
          observer.disconnect();
        }, 1000);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    let checkout: StripeEmbeddedCheckout | undefined;

    async function open() {
      try {
        const [, month, day] = birthdate.split("-");
        const response = await fetch("/api/checkout/birth-card-blueprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month: Number(month), day: Number(day), attemptId: attemptId.current }),
          signal: controller.signal,
        });
        if (response.status === 409) {
          if (!controller.signal.aborted) setState("closed");
          return;
        }
        if (!response.ok) throw new Error("Checkout unavailable");
        const { clientSecret, publishableKey } = await response.json();
        const { loadStripe } = await import("@stripe/stripe-js/pure");
        if (controller.signal.aborted) return;
        const stripe = await loadStripe(publishableKey);
        if (controller.signal.aborted) return;
        if (!stripe) throw new Error("Stripe unavailable");
        checkout = await stripe.createEmbeddedCheckoutPage({
          clientSecret,
          onComplete: () => {
            if (controller.signal.aborted) return;
            checkout?.destroy();
            checkout = undefined;
            setState("complete");
          },
        });
        if (controller.signal.aborted || !form.current) { checkout.destroy(); return; }
        checkout.mount(form.current);
        setState("open");
      } catch {
        if (!controller.signal.aborted) setState("error");
      }
    }

    void open();
    return () => { controller.abort(); checkout?.destroy(); };
  }, [request, birthdate]);

  function startCheckout() {
    attemptId.current ||= crypto.randomUUID();
    trackClientFunnelEvent("offer_cta_clicked", placement);
    setState("loading");
    setRequest(n => n + 1);
  }

  if (state === "complete") {
    return <div role="status" className="border border-brand-line bg-brand-paper p-4">
      <h3 className="font-serif text-xl">Checkout complete</h3>
      <p className="text-sm">Once payment is confirmed, your personal seven-page Blueprint will be prepared and sent to the email you entered at checkout.</p>
    </div>;
  }

  return (
    <section aria-label="Personal Birth Card Blueprint" className="w-full text-left">
      <div ref={offer} className="rounded border border-brand-line bg-brand-paper p-4">
        <p className="type-eyebrow">Your personal reading</p>
        <h3 className="mt-1 font-serif text-xl text-brand-ink">{cardName} in love and at work</h3>
        <p className="mt-1 text-sm text-brand-ink-soft">Read your birth card alongside your ruling card, with a seven-day practice and three reflection questions. Seven-page PDF by email.</p>
        <a href="/samples/birth-card-blueprint-sample.pdf#page=4" target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm underline">Preview the love and work page</a>
        <p className="my-2 text-xs text-brand-ink-soft">Opening checkout saves your birth month and day for this reading.</p>
        {(state === "offer" || state === "error") && <button type="button" className="accent-button large-button w-full" onClick={startCheckout}>
          {state === "error" ? "Try checkout again" : "Get my Birth Card Blueprint · $13"}
        </button>}
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {state === "loading" && "Opening secure checkout…"}
        {state === "error" && "Checkout couldn’t open. Try again in a moment."}
        {state === "open" && "Birth Card Blueprint · $13 USD"}
        {state === "closed" && "This checkout has ended. Check your email for a receipt before starting a new order."}
      </p>
      <div ref={form} className="w-full" />
    </section>
  );
}
