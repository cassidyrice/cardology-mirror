"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/site";
import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";

// "Share your card" — turns a calculator result into distribution. Uses the
// native share sheet where available (mobile), clipboard copy otherwise.
// The shared URL is the card meaning page, which already has per-card OG art.
export function ShareCard({
  cardLabel,
  slug,
}: {
  cardLabel: string;
  slug: string | null;
}) {
  const [copied, setCopied] = useState(false);
  if (!slug) return null;

  const url = `${SITE_URL}/birth-card/${slug}`;
  const text = `My birth card is the ${cardLabel}. What's yours?`;

  async function onShare() {
    trackClientFunnelEvent("card_shared", { placement: "calculator-result" });
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title: `${cardLabel} birth card`, text, url });
      } catch {
        // Sheet dismissed or share failed — stay quiet, no clipboard surprise.
      }
      return;
    }
    if (nav && typeof nav.clipboard?.writeText === "function") {
      try {
        await nav.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard unavailable (permissions) — fail quiet.
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="text-xs text-brand-ink-soft underline underline-offset-4 transition hover:text-brand-ink"
    >
      {copied ? "Link copied" : "Share your card →"}
    </button>
  );
}
