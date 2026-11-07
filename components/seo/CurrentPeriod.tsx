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
    <p className="calc-period">
      <strong>This 52-day stretch.</strong> {period.planet}. {period.cardLabel}. The card you are living through right now. Yes, that explains the week.
    </p>
  );
}
