"use client";

import Link from "next/link";
import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import { CARD_APP_PRODUCT_PATH, CARD_APP_SLUG } from "@/lib/card-app-slug";

export function CardAppCta({ placement, birthdate, connections = false }: {
  placement: string; birthdate?: string; connections?: boolean;
}) {
  return (
    <aside className="my-5 w-full rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" aria-label="Your personal Card Blueprint App">
      <h3 className="font-serif text-xl text-brand-ink">Keep exploring your cards.</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        {connections ? "Compare birth cards and ruling cards in both directions, alongside your own daily and yearly cards."
          : "Your card for today, your current 52-day period, and your year in one personal app."}
        {" "}Use it alongside a physical deck of cards. $69 once; no subscription.
      </p>
      <Link href={CARD_APP_PRODUCT_PATH} className="accent-button mt-4 inline-flex min-h-11 items-center justify-center text-center"
        onClick={() => {
          if (birthdate) storeCheckoutBirthdate(birthdate);
          trackClientFunnelEvent("offer_cta_clicked", { offerSlug: CARD_APP_SLUG, placement });
        }}>
        Explore the app sample →
      </Link>
      <p className="mt-2 text-xs text-brand-ink-soft">The sample uses a made-up birthday. Your purchase opens your own cards.</p>
    </aside>
  );
}
