import Link from "next/link";

import { READING_OFFERS, offerBySlug, readingOfferHref } from "@/lib/products";
import { READINGS_PATH } from "@/lib/site";

const videoOffer = READING_OFFERS[0];

// Contextual bridge from free content into the paid reading.
// One component, one voice, used everywhere a page resolves a visitor's
// question and the honest next step is a personal reading.
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
  if (variant === "general") {
    return (
      <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-8 ${className}`}>
        <p className="type-eyebrow-dark">Have it read for you</p>
        <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
          The pages explain the system. A video reading applies it to your life.
        </h2>
        <p className="mt-4 max-w-[38em] text-base leading-relaxed text-brand-on-dark-soft">
          Send a birth date at checkout — a personally-made video reading
          connects your cards to a real question and arrives in your inbox
          within 48 hours.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={readingOfferHref(videoOffer)} className="accent-button large-button text-center">
            {videoOffer.cta}
          </Link>
          <Link href={READINGS_PATH} className="on-dark-button large-button text-center">
            How It Works
          </Link>
        </div>
        <p className="mt-4 max-w-[38em] text-xs leading-relaxed text-brand-on-dark-soft">
          One-time payment. No calls, no appointments — the reading comes to
          you by email.
        </p>
      </aside>
    );
  }

  const config = bridgeConfig(variant, cardLabel);
  const offer = offerBySlug(config.offerSlug);
  if (!offer) return null;

  return (
    <aside className={`border border-brand-line bg-brand-paper-deep p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow">{config.eyebrow}</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-brand-ink sm:text-4xl">
        {config.headline}
      </h2>
      <p className="mt-4 max-w-[38em] text-base leading-relaxed text-brand-ink-soft">
        {config.body}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={readingOfferHref(offer)} className="ink-button large-button">
          {offer.cta} <span aria-hidden="true">→</span>
        </Link>
        <Link href={READINGS_PATH} className="paper-button large-button">
          How it works
        </Link>
      </div>
      <p className="mt-4 max-w-[38em] text-xs leading-relaxed text-brand-ink-soft">
        Secure one-time checkout. Your video is made personally for you and
        delivered by email within {offer.deliveryHours} hours.{" "}
        {offer.checkoutNote}
      </p>
    </aside>
  );
}

function bridgeConfig(variant: Exclude<BridgeVariant, "general">, cardLabel?: string) {
  switch (variant) {
    case "card":
      return {
        offerSlug: "video-reading",
        eyebrow: "This card, read for you",
        headline: cardLabel
          ? `Watch the ${cardLabel} read as a person, not a page.`
          : "Watch this card read as a person, not a page.",
        body: cardLabel
          ? `The page above is the general ${cardLabel} pattern. The $99 Personal Video Reading connects it to a real birthday — birth card, ruling card, and the dynamics that only show up when the cards meet an actual life — delivered as a private video you can keep.`
          : "A card page describes the pattern in general. The $99 Personal Video Reading connects it to a real birthday — birth card, ruling card, and the dynamics that only show up when the cards meet an actual life — delivered as a private video you can keep.",
      };
    case "relationship":
      return {
        offerSlug: "video-reading",
        eyebrow: "This dynamic, read for you",
        headline: "The calculator names the pattern. A reading brings it to life.",
        body: "If there is a real relationship behind this comparison — a partner, a parent, a friend, someone you can't quite figure out — the $99 Personal Video Reading compares both birthdays and delivers the dynamic as a private video you can rewatch together or alone.",
      };
    case "timing":
      return {
        offerSlug: "video-reading",
        eyebrow: "Your timing, read for you",
        headline: "This tool shows the lens. A reading points it at your life.",
        body: "The filters above are generic by design. The $99 Personal Video Reading works from your real birth date — what this chapter may be asking you to notice, and how your card tends to respond under this kind of pressure — made for you and delivered by email within 48 hours.",
      };
  }
}
