"use client";

import { useEffect, useState } from "react";

import {
  readPrivacyConsent,
  writePrivacyConsent,
  type PrivacyConsent,
} from "@/lib/consent";

export function PrivacyChoices({ className = "" }: { className?: string }) {
  const [consent, setConsent] = useState<PrivacyConsent>("denied");

  useEffect(() => {
    setConsent(readPrivacyConsent());
  }, []);

  function choose(next: PrivacyConsent) {
    setConsent(next);
    writePrivacyConsent(next);
  }

  return (
    <div className={className}>
      <p className="font-medium text-brand-ink">Privacy choices</p>
      <p className="mt-1 leading-relaxed">
        Optional Google Analytics and PostHog stay off until you allow them.
        First-party conversion events stay in this browser tab and never
        include a birth date.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="button"
          className="underline underline-offset-2 hover:text-brand-ink"
          onClick={() => choose("granted")}
          aria-pressed={consent === "granted"}
        >
          {consent === "granted" ? "Analytics allowed" : "Allow analytics"}
        </button>
        <button
          type="button"
          className="underline underline-offset-2 hover:text-brand-ink"
          onClick={() => choose("denied")}
          aria-pressed={consent === "denied"}
        >
          {consent === "denied" ? "Analytics blocked" : "Block analytics"}
        </button>
      </div>
    </div>
  );
}
