import Link from "next/link";

import { READING_OFFERS, offerBySlug, readingOfferHref } from "@/lib/products";
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
      <aside className={`border border-[#14110d]/18 bg-[#14110d] p-6 text-[#f4f0e7] sm:p-8 ${className}`}>
        <p className="oracle-eyebrow text-[#c8bca8]">Have it read for you</p>
        <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-none sm:text-4xl">
          The pages explain the system. A reading applies it to your life.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#d7cdbc]">
          Bring a birth date and a real question. You get a written reading
          about the actual person, relationship, or decision — not a
          horoscope, not a copy-paste of a card page.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {READING_OFFERS.map((offer) => (
            <Link
              key={offer.slug}
              href={readingOfferHref(offer)}
              className="block border border-[#f4f0e7]/20 bg-[#f4f0e7]/[0.04] p-4 transition hover:bg-[#f4f0e7]/10"
            >
              <p className="font-serif text-2xl text-[#d9b26a]">{offer.priceLabel}</p>
              <p className="mt-1 font-serif text-lg leading-tight text-[#f4f0e7]">{offer.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#c8bca8]">{offer.oneLine}</p>
            </Link>
          ))}
        </div>
        <Link
          href={READINGS_PATH}
          className="mt-5 inline-block text-sm font-bold uppercase text-[#d9b26a] underline underline-offset-4"
        >
          Compare all three readings →
        </Link>
      </aside>
    );
  }

  const config = bridgeConfig(variant, cardLabel);
  const offer = offerBySlug(config.offerSlug);
  if (!offer) return null;

  return (
    <aside className={`border border-[#14110d]/18 bg-[#eadfcd]/70 p-6 sm:p-7 ${className}`}>
      <p className="oracle-eyebrow text-[#9e3d24]">{config.eyebrow}</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-none text-[#14110d] sm:text-4xl">
        {config.headline}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3d352d]">
        {config.body}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={readingOfferHref(offer)} className="ink-button large-button">
          {offer.cta} <span aria-hidden="true">→</span>
        </Link>
        <Link href={READINGS_PATH} className="paper-button large-button">
          Compare all readings
        </Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[#5b5148]">
        Secure checkout. You confirm the birth details and question right
        after payment, and the reading is delivered by email.
      </p>
    </aside>
  );
}

function bridgeConfig(variant: Exclude<BridgeVariant, "general">, cardLabel?: string) {
  switch (variant) {
    case "card":
      return {
        offerSlug: "basic-birth-card-report",
        eyebrow: "This card, read for you",
        headline: cardLabel
          ? `Get the ${cardLabel} read as a person, not a page.`
          : "Get this card read as a person, not a page.",
        body: cardLabel
          ? `The page above is the general ${cardLabel} pattern. The $29 report reads it for one specific person — birth card, ruling card, shadow range, and the relational cues that only show up when a real birthday is on the table.`
          : "A card page describes the pattern in general. The $29 report reads it for one specific person — birth card, ruling card, shadow range, and the relational cues that only show up when a real birthday is on the table.",
      };
    case "relationship":
      return {
        offerSlug: "one-question-reading",
        eyebrow: "This dynamic, read for you",
        headline: "The calculator names the pattern. A reading answers your question about it.",
        body: "If there is a real relationship behind this comparison — a partner, a parent, a friend, someone you can't quite figure out — the $99 one-question reading takes both birthdays and your actual question and gives you a written answer about the dynamic itself.",
      };
    case "timing":
      return {
        offerSlug: "one-question-reading",
        eyebrow: "Your timing, read for you",
        headline: "This tool shows the lens. A reading tells you what your current period is pressing on.",
        body: "The filters above are generic by design. The $99 one-question reading works from your real birth date and a real decision — what this chapter is asking you to handle, and how your card tends to respond under exactly this kind of pressure.",
      };
  }
}
