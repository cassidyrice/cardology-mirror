"use client";

import { useMemo } from "react";

import { todayISO } from "@/lib/cards";
import { currentPeriodFor } from "@/lib/current-period";

export function CurrentPeriod({ birthdate }: { birthdate: string }) {
  const period = useMemo(
    () => currentPeriodFor(birthdate, todayISO()),
    [birthdate],
  );
  if (!period) return null;

  return (
    <div className="w-full max-w-md border border-brand-line bg-brand-paper px-4 py-3 text-center">
      <p className="type-eyebrow mb-2">This 52-day stretch</p>
      <p className="font-serif text-lg text-brand-ink">
        {period.planet}. {period.cardLabel}.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        The card you are living through right now. The $47 Blueprint Breakdown includes your Yearly Timing Map and shows all seven of your period cards on the confirmation page.
      </p>
    </div>
  );
}
