"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import {
  BLUEPRINT_REPORT_CTA_LABEL,
  BLUEPRINT_REPORT_SLUG,
  CONSULT_CTA_LABEL,
  CONSULT_SLUG,
} from "@/lib/blueprint-report";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";

/**
 * Entry to either Blueprint Report tier. Same shape as DeepDiveHostedCheckout, minus
 * the question: the birth date stays in this tab (sessionStorage, never a URL) and the
 * generic review page at /checkout/<slug> confirms it before Stripe.
 * `variant="link"` renders the same click as an inline text link, for the
 * secondary "report only" line under a featured button.
 */
export function ReportCheckoutButton({
  slug = BLUEPRINT_REPORT_SLUG,
  birthdate,
  placement,
  compact = false,
  variant = "button",
  submitLabel,
  className = "",
}: {
  slug?: string;
  birthdate?: string;
  placement: string;
  compact?: boolean;
  variant?: "button" | "link";
  submitLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label =
    submitLabel || (slug === CONSULT_SLUG ? CONSULT_CTA_LABEL : BLUEPRINT_REPORT_CTA_LABEL);

  function onClick() {
    if (pending) return;
    setPending(true);
    trackClientFunnelEvent("offer_cta_clicked", { offerSlug: slug, placement });
    if (birthdate) storeCheckoutBirthdate(birthdate);
    router.push(`/checkout/${slug}`);
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
        className={`font-medium underline underline-offset-4 disabled:cursor-wait disabled:opacity-70 ${className}`}
        data-analytics-checkout
      >
        {pending ? "Opening checkout…" : label}
      </button>
    );
  }

  return (
    <div className={compact ? className : `w-full ${className}`} data-analytics-checkout>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
        className={
          compact
            ? "accent-button small-button text-center disabled:cursor-wait disabled:opacity-70"
            : "accent-button large-button w-full text-center disabled:cursor-wait disabled:opacity-70"
        }
      >
        {pending ? "Opening checkout…" : label}
      </button>
    </div>
  );
}
