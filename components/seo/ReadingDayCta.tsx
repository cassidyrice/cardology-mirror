"use client";

import Link from "next/link";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";

const CTA_COPY =
  "Want them read to you? Karma Card Reading Day, Sat Sept 20, $20 · 5 minutes →";

/** One-line promo for the dated Reading Day test (not a standing product). */
export function ReadingDayCta({
  placement,
  className = "",
}: {
  placement: string;
  className?: string;
}) {
  return (
    <p
      className={`w-full max-w-md border border-[#14110d]/15 bg-[#eadfcd]/70 px-4 py-3 text-center text-sm leading-relaxed text-[#3d352d] ${className}`}
    >
      <Link
        href="/karma-reading"
        className="font-medium text-[#14110d] underline decoration-[#14110d]/25 underline-offset-4 transition hover:decoration-[#8e321f]"
        onClick={() =>
          trackClientFunnelEvent("reading_cta_clicked", {
            offerSlug: "karma-reading",
            placement,
          })
        }
      >
        {CTA_COPY}
      </Link>
    </p>
  );
}
