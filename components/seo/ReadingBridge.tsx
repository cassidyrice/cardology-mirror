import Link from "next/link";

import {
  FREE_PREVIEW_BLURB,
  READER_PHONE_DISPLAY,
  READER_PHONE_TEL,
} from "@/lib/offers";
import { offerBySlug, readingOfferHref, instantReportBySlug } from "@/lib/products";
import { READINGS_PATH } from "@/lib/site";

// Contextual bridge from free content into the paid reading ladder.
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
          The pages explain the system. A reading applies it to your life.
        </h2>
        <p className="mt-4 max-w-[38em] text-base leading-relaxed text-brand-on-dark-soft">
          Call with a birthday and talk it through with the AI Cardology
          reader — one focused question, the complete pattern, or a whole
          season of return calls.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href={READER_PHONE_TEL} className="accent-button large-button text-center">
            Hear Your First Card Free
          </a>
          <Link href={READINGS_PATH} className="on-dark-button large-button text-center">
            Compare the Readings
          </Link>
        </div>
        <p className="mt-4 max-w-[38em] text-xs leading-relaxed text-brand-on-dark-soft">
          {FREE_PREVIEW_BLURB} Paid readings are one-time purchases tied to
          your checkout phone number — no subscription.
        </p>
      </aside>
    );
  }

  const config = bridgeConfig(variant, cardLabel);
  const voiceOffer = offerBySlug(config.offerSlug);
  const reportOffer = instantReportBySlug(config.offerSlug);
  if (!voiceOffer && !reportOffer) return null;

  const href = reportOffer
    ? reportOffer.href ?? `/checkout/${reportOffer.slug}`
    : readingOfferHref(voiceOffer!);
  const ctaLabel = reportOffer ? reportOffer.cta : voiceOffer!.cta;
  const note = reportOffer
    ? reportOffer.checkoutNote
    : `Secure one-time checkout. The reading is delivered by phone by an AI voice reader after successful payment and phone-number recognition. Call from your checkout number. ${voiceOffer!.checkoutNote}`;

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
        <Link href={href} className="ink-button large-button">
          {ctaLabel} <span aria-hidden="true">→</span>
        </Link>
        <Link href={READINGS_PATH} className="paper-button large-button">
          Compare the readings
        </Link>
      </div>
      <p className="mt-4 max-w-[38em] text-xs leading-relaxed text-brand-ink-soft">
        {note}
      </p>
      <p className="mt-2 max-w-[38em] text-xs leading-relaxed text-brand-ink-soft">
        Want to hear it first?{" "}
        <a href={READER_PHONE_TEL} className="editorial-link font-semibold text-brand-ink">
          Call the AI reader free
        </a>{" "}
        ({READER_PHONE_DISPLAY}) for a short introduction to your birth card.
      </p>
    </aside>
  );
}

function bridgeConfig(variant: Exclude<BridgeVariant, "general">, cardLabel?: string) {
  switch (variant) {
    case "card":
      return {
        offerSlug: "personal-card-blueprint",
        eyebrow: "This card, read for you",
        headline: cardLabel
          ? `See the ${cardLabel} as your whole pattern, not just a card.`
          : "See this card as your whole pattern, not just a card.",
        body: cardLabel
          ? `The page above is the general ${cardLabel} pattern. The Personal Card Blueprint connects it to a real birthday — birth card, ruling card, and the chapter you're in now — delivered instantly, no phone call.`
          : "A card page describes the pattern in general. The Personal Card Blueprint connects it to a real birthday — birth card, ruling card, and the chapter you're in now — delivered instantly, no phone call.",
      };
    case "relationship":
      return {
        offerSlug: "complete-reading",
        eyebrow: "This dynamic, read for you",
        headline: "The calculator names the pattern. The reader lets you talk it through.",
        body: "If there is a real relationship behind this comparison — a partner, a parent, a friend, someone you can't quite figure out — the $39 Complete Reading compares both birthdays and gives the dynamic up to fifteen unhurried minutes.",
      };
    case "timing":
      return {
        offerSlug: "quick-question",
        eyebrow: "Your timing, read for you",
        headline: "This tool shows the lens. The reader points it at your life.",
        body: "The filters above are generic by design. A $19 Quick Question works from your real birth date — what this chapter may be asking you to notice, and how your card tends to respond under this kind of pressure.",
      };
  }
}
