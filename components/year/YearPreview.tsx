"use client";

import { useState } from "react";

import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { YearPreviewApp } from "@/components/year/YearPreviewApp";
import { DEEP_DIVE_PRICE_LABEL } from "@/lib/deep-dive";
import type { YearPreviewData } from "@/lib/year-preview";

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
  sample: YearPreviewData;
  includes: string[];
}) {
  // The unlock button in the sales box buys the year the preview is showing.
  const [ownBirthdate, setOwnBirthdate] = useState<string | undefined>(undefined);


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
            birthdate={ownBirthdate}
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
        <YearPreviewApp sample={sample} source="product-page" onOwnYear={setOwnBirthdate} />
      </div>
    </div>
  );
}
