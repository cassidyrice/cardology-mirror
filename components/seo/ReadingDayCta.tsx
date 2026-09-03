"use client";

import Link from "next/link";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";

const LINE_COPY =
  "Want them read to you? Karma Card Reading Day, Sat Sept 5, $20 · 5 minutes →";

/**
 * Promo for the dated Reading Day test (not a standing product).
 * `line`: one quiet sentence. `lead`: the primary box, used on the calculator result
 * through Sept 5 while the reading is the offer being tested.
 */
export function ReadingDayCta({
  placement,
  className = "",
  variant = "line",
  cardLabel,
}: {
  placement: string;
  className?: string;
  variant?: "line" | "lead";
  cardLabel?: string;
}) {
  const track = () =>
    trackClientFunnelEvent("reading_cta_clicked", {
      offerSlug: "karma-reading",
      placement,
    });

  if (variant === "lead") {
    return (
      <div
        className={`w-full max-w-md border border-[#14110d]/15 bg-[#eadfcd]/70 px-5 py-5 text-center ${className}`}
      >
        <p className="type-eyebrow mb-2">
          {cardLabel ? `${cardLabel} · ` : ""}Saturday, September 5 · ten slots
        </p>
        <p className="font-serif text-2xl leading-snug text-brand-ink [text-wrap:balance]">
          Your two karma cards, read to you.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
          Five minutes on a call with Cassidy Rice: your Lifetime Gift, your Lifetime
          Challenge, and what they mean beside your birth card. Audio only. $20.
        </p>
        <Link
          href="/karma-reading"
          className="accent-button large-button mt-4 inline-flex w-full text-center sm:w-auto"
          onClick={track}
        >
          Book a 5-minute reading — $20
        </Link>
        <p className="mt-3 text-xs leading-relaxed text-brand-ink-faint">
          Pay on Stripe, pick your time on the next page. Cancel up to 24 hours before for a refund.
        </p>
      </div>
    );
  }

  return (
    <p
      className={`w-full max-w-md border border-[#14110d]/15 bg-[#eadfcd]/70 px-4 py-3 text-center text-sm leading-relaxed text-[#3d352d] ${className}`}
    >
      <Link
        href="/karma-reading"
        className="font-medium text-[#14110d] underline decoration-[#14110d]/25 underline-offset-4 transition hover:decoration-[#8e321f]"
        onClick={track}
      >
        {LINE_COPY}
      </Link>
    </p>
  );
}
