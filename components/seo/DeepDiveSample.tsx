"use client";

import { useEffect, useRef } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { DEEP_DIVE_OFFER_SLUG } from "@/lib/deep-dive";

/** Sample images are 900px wide; the crop keeps the top of page 1 and fades out. */
export const DEEP_DIVE_SAMPLE_WIDTH = 900;
export const DEEP_DIVE_SAMPLE_HEIGHT = 722;
/** Card shown when the visitor's card is unknown (product page). */
export const DEEP_DIVE_SAMPLE_DEFAULT_SLUG = "5-of-diamonds";

export function deepDiveSamplePath(slug: string): string {
  return `/deep-dive/samples/${slug}.jpg`;
}

/**
 * Page 1 of the retired Deep Dive PDF (a bonus of the earlier $9 and video offers),
 * shown before the $13 One Question Reading button. The $13 product ships no PDFs;
 * Reveal.tsx and BirthCardCalculator.tsx still render this sample. Fires
 * `sample_viewed` once when at least half of it has scrolled into view.
 */
export function DeepDiveSample({
  cardSlug,
  cardLabel,
  placement,
  className = "",
}: {
  /** SEO slug like "5-of-diamonds"; falls back to the default sample. */
  cardSlug?: string | null;
  cardLabel?: string | null;
  placement: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const slug = cardSlug || DEEP_DIVE_SAMPLE_DEFAULT_SLUG;
  const isOwnCard = Boolean(cardSlug);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (fired) return;
        if (entries.some((e) => e.isIntersecting)) {
          fired = true;
          trackClientFunnelEvent("sample_viewed", {
            offerSlug: DEEP_DIVE_OFFER_SLUG,
            placement,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [placement]);

  const caption = isOwnCard
    ? `Page 1 of the ${cardLabel ?? "your card's"} Deep Dive. Six more pages follow.`
    : "Page 1 of the 5 of Diamonds Deep Dive. Yours is matched to your birthday.";

  return (
    <figure
      ref={ref}
      className={`w-full max-w-md ${className}`}
      data-deep-dive-sample={slug}
    >
      <div className="overflow-hidden rounded-[6px] border border-brand-line bg-brand-paper shadow-[0_10px_30px_rgba(20,17,13,0.10)]">
        <img
          src={deepDiveSamplePath(slug)}
          alt={`Page 1 of the ${cardLabel ?? "5 of Diamonds"} Birth Card Deep Dive PDF`}
          width={DEEP_DIVE_SAMPLE_WIDTH}
          height={DEEP_DIVE_SAMPLE_HEIGHT}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="mt-2 text-center text-xs leading-relaxed text-brand-ink-soft">
        {caption}
      </figcaption>
    </figure>
  );
}
