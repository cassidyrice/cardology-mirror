"use client";

import { useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { YearBlueprintApp } from "@/components/year/YearBlueprintApp";
import {
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_SESSION_PATH,
} from "@/lib/deep-dive";
import type { YearBlueprint } from "@/lib/year-blueprint";

/**
 * The tappable 52xSeven Blueprint preview: a phone-framed year that starts on an
 * example birthday and rebuilds on the visitor's via POST /api/year-preview, so
 * the birthday never enters a URL. Every unlock button POSTs that birthday to
 * the hosted checkout. Used on the sales page and under the homepage calculator.
 * Brand tokens only — it renders on the paper shell and the bare landing alike.
 */
export function YearPreviewApp({
  sample,
  source,
  className = "",
  onOwnYear,
}: {
  sample: YearBlueprint;
  /** Checkout + analytics source for this placement. */
  source: string;
  className?: string;
  /** Called with the visitor's birthday once their own year is built. */
  onOwnYear?: (iso: string) => void;
}) {
  const [data, setData] = useState<YearBlueprint>(sample);
  const [own, setOwn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function onBirthdate(iso: string) {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/year-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthdate: iso }),
      });
      if (res.status === 422) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setNote(
          body.error === "joker"
            ? "December 31 is the Joker — it sits outside the 52-card calendar, so there is no year to draw for it."
            : "That date could not be read. Try again.",
        );
        return;
      }
      if (!res.ok) {
        setNote("The preview is busy right now. Try again in a moment.");
        return;
      }
      const year = (await res.json()) as YearBlueprint;
      setData(year);
      setOwn(true);
      onOwnYear?.(year.birthdate);
      trackClientFunnelEvent("calculator_completed", {
        offerSlug: DEEP_DIVE_OFFER_SLUG,
        placement: `52xseven-preview-${source}`,
      });
    } catch {
      setNote("The preview is busy right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const birthdate = own ? data.birthdate : undefined;

  return (
    <div className={className}>
      <p
        className="mb-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-bronze"
        aria-live="polite"
      >
        {busy
          ? "Building your year…"
          : own
            ? "Live preview · your birthday · tap around"
            : "Live preview · example birthday · tap around"}
      </p>
      <YearBlueprintApp
        data={data}
        mode="preview"
        onBirthdate={onBirthdate}
        unlock={{ action: DEEP_DIVE_SESSION_PATH, source, birthdate }}
        priceLabel={DEEP_DIVE_PRICE_LABEL}
        sample={!own}
        framed
      />
      {note ? (
        <p role="status" className="mt-3 text-center text-xs leading-relaxed text-brand-oxblood">
          {note}
        </p>
      ) : null}
      <p className="mt-3 text-center text-xs leading-relaxed text-brand-ink-soft">
        Cards are computed by the Cardology engine for the birthday shown. Enter
        yours in the preview to see your own year. Your birthday is never stored.
      </p>
    </div>
  );
}
