import type { Metadata } from "next";

import { ReviewForm } from "@/components/review/ReviewForm";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { REVIEW_DISCOUNT_PERCENT } from "@/lib/review-offer";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Leave a review | Card Blueprints",
  description: "Tell us how your reading landed. Get half off your next one.",
  alternates: { canonical: "/review" },
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <SeoShell>
      <header className="max-w-2xl pb-8">
        <Kicker className="mb-4">Thank you</Kicker>
        <h1 className="type-display text-brand-ink">You got a reading. Tell us how it landed.</h1>
        <p className="mt-5 text-base leading-relaxed text-brand-ink-soft">
          Three quick questions. Under a minute. When you hit send, a {REVIEW_DISCOUNT_PERCENT}% off code shows up
          right here. Use it on any other report in the store.
        </p>
        <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-brand-ink-soft">
          <li>Answer the questions below.</li>
          <li>Your code appears on this page.</li>
          <li>Tap the button. It copies the code and opens the store.</li>
          <li>Pick a report. Paste the code at checkout. Half off.</li>
        </ol>
      </header>
      <div className="max-w-2xl pb-16">
        <ReviewForm />
      </div>
    </SeoShell>
  );
}
