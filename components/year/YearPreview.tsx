"use client";

import { useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { YearBlueprintApp } from "@/components/year/YearBlueprintApp";
import {
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_SESSION_PATH,
} from "@/lib/deep-dive";
import type { YearBlueprint } from "@/lib/year-blueprint";

/**
 * Sales-page preview of the 52xSeven Blueprint. Starts on an example birthday;
 * when the visitor enters theirs, the year is rebuilt via POST /api/year-preview
 * (the birthday never enters a URL) and every unlock button POSTs that birthday
 * to the hosted checkout.
 */
export function YearPreview({
  sample,
  includes,
}: {
  sample: YearBlueprint;
  includes: string[];
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
      trackClientFunnelEvent("calculator_completed", {
        offerSlug: DEEP_DIVE_OFFER_SLUG,
        placement: "52xseven-preview",
      });
    } catch {
      setNote("The preview is busy right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const birthdate = own ? data.birthdate : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start">
      <div>
        <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-5">
          <p className="eyebrow text-gold">What {DEEP_DIVE_PRICE_LABEL} unlocks</p>
          <ul className="mb-4 mt-3 space-y-1 text-sm text-mist">
            {includes.map((line) => (
              <li key={line}>✓ {line}</li>
            ))}
            <li>✓ Instant on the confirmation page, plus an emailed sign-in link</li>
            <li>✓ 12 months of access · one payment · no renewal</li>
          </ul>
          <DeepDiveCta
            placement="52xseven-product-page"
            source="product-page"
            birthdate={birthdate}
            showFulfillment={false}
          />
          <p className="mt-3 text-xs leading-relaxed text-mist">
            {DEEP_DIVE_PRICE_LABEL} one time · no subscription · wrong date: we fix it or refund
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[
            ["My card", "Your birth card with the light and the shadow read — the part nobody tells you politely."],
            ["Now", "The 52-day chapter you're in, dated, with how far through it you are and one small dare."],
            ["Chapters", "All seven chapters of your year with a short light + shadow line for each."],
            ["Story", "The yearly arc on one map: Long Range, Pluto, Result, Environment and Displacement."],
          ].map(([title, body]) => (
            <div key={title} className="border-t border-white/10 pt-4">
              <h2 className="font-serif text-lg text-bone">{title}</h2>
              <p className="prose-reading mt-2 text-sm text-mist">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="preview" className="lg:sticky lg:top-6">
        <p className="mb-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold" aria-live="polite">
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
          unlock={{
            action: DEEP_DIVE_SESSION_PATH,
            source: "product-page",
            birthdate,
          }}
          priceLabel={DEEP_DIVE_PRICE_LABEL}
          sample={!own}
          framed
        />
        {note ? (
          <p role="status" className="mt-3 text-center text-xs leading-relaxed text-gold">
            {note}
          </p>
        ) : null}
        <p className="mt-3 text-center text-xs leading-relaxed text-mist">
          Cards are computed by the Cardology engine for the birthday shown.
          Enter yours in the preview to see your own year. Your birthday is
          never stored.
        </p>
      </div>
    </div>
  );
}
