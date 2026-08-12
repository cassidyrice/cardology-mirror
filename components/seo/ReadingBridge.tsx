"use client";

import Link from "next/link";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { instantReportBySlug } from "@/lib/products";

type BridgeVariant = "card" | "relationship" | "timing" | "general";

export function ReadingBridge({
  variant = "general",
  cardLabel,
  className = "",
}: {
  variant?: BridgeVariant;
  cardLabel?: string;
  className?: string;
}) {
  const offer = instantReportBySlug("personal-card-blueprint");
  if (!offer) return null;

  const config = bridgeConfig(variant, cardLabel);
  const href = offer.href ?? `/checkout/${offer.slug}`;

  return (
    <aside className={`border border-brand-line bg-brand-paper-deep p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow">{config.eyebrow}</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-brand-ink sm:text-4xl">
        {config.headline}
      </h2>
      <p className="mt-4 max-w-[38em] text-base leading-relaxed text-brand-ink-soft">
        {config.body}
      </p>
      <div className="mt-6">
        <Link
          href={href}
          className="ink-button large-button"
          onClick={() =>
            trackClientFunnelEvent("offer_cta_clicked", {
              offerSlug: offer.slug,
              placement: `reading-bridge-${variant}`,
            })
          }
        >
          {offer.cta} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <p className="mt-4 max-w-[38em] text-xs leading-relaxed text-brand-ink-soft">
        {offer.checkoutNote}
      </p>
    </aside>
  );
}

function bridgeConfig(variant: BridgeVariant, cardLabel?: string) {
  switch (variant) {
    case "card":
      return {
        eyebrow: "This card, personalized",
        headline: cardLabel
          ? `See the ${cardLabel} as your whole pattern, not just a card.`
          : "See this card as your whole pattern, not just a card.",
        body: cardLabel
          ? `The page above is the general ${cardLabel} pattern. The Personal Card Blueprint connects it to a real birthday — birth card, ruling card, and the chapter you're in now — delivered instantly.`
          : "A card page describes the pattern in general. The Personal Card Blueprint connects it to a real birthday — birth card, ruling card, and the chapter you're in now — delivered instantly.",
      };
    case "relationship":
      return {
        eyebrow: "Your pattern, written out",
        headline: "The calculator names the dynamic. Your Blueprint explains your side of it.",
        body: "Use your real birth date to get the birth card, ruling layer, current chapter, and reflection prompts in one personalized written report.",
      };
    case "timing":
      return {
        eyebrow: "Your timing, personalized",
        headline: "This tool shows the lens. Your Blueprint places it in your pattern.",
        body: "The Personal Card Blueprint works from your birth date and turns the fixed Cardology structure into a report you can read immediately and return to later.",
      };
    case "general":
      return {
        eyebrow: "Personal Card Blueprint",
        headline: "The pages explain the system. Your Blueprint applies it to your birthday.",
        body: "Get your birth card, ruling layer, current chapter, and three reflection prompts in one instant personalized written report.",
      };
  }
}
