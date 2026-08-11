import type { Metadata } from "next";
import Link from "next/link";

import { MyQuestionOnboardingForm } from "@/components/my-question/MyQuestionOnboardingForm";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import {
  verifyPaidMyQuestionOrder,
  type MyQuestionStripe,
} from "@/lib/my-question/service";
import {
  resolveMyQuestionRuntime,
  runtimeString,
} from "@/lib/my-question/runtime";
import { getStripe } from "@/lib/stripe";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete Your My Question Reading | Card Blueprints",
  description: "Private onboarding for a paid My Question reading.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function MyQuestionOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId = "" } = await searchParams;
  if (!sessionId) {
    return <OnboardingState title="Payment link missing" message="Open the secure onboarding link from your Stripe confirmation or payment email." />;
  }

  const runtimeContext = await resolveMyQuestionRuntime();
  const secretKey = runtimeString(runtimeContext.env, "STRIPE_SECRET_KEY");
  if (!runtimeContext.db || !secretKey) {
    return (
      <OnboardingState
        title="Onboarding is temporarily unavailable"
        message="Your payment record is not affected. Try the secure link again shortly or reply to your receipt for support."
      />
    );
  }

  const result = await verifyPaidMyQuestionOrder(sessionId, {
    db: runtimeContext.db,
    stripe: getStripe(secretKey) as unknown as MyQuestionStripe,
  });
  if (!result.ok) {
    return (
      <OnboardingState
        title="Payment could not be verified"
        message={result.message}
      />
    );
  }

  const order = result.value;
  if (order.fulfillmentDate) {
    return (
      <OnboardingState
        title="Your reading date is reserved"
        message={`Your private reading is assigned for ${formatFulfillmentDate(order.fulfillmentDate)}. A confirmation was sent to the email used at checkout.`}
      />
    );
  }

  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="shell-paper-deep">
        <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-start gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(22rem,1fr)] lg:px-10 lg:py-16">
          <section aria-labelledby="onboarding-heading" className="lg:sticky lg:top-24">
            <p className="type-eyebrow">Payment verified</p>
            <h1 id="onboarding-heading" className="type-h1 mt-5 max-w-[13ch] text-brand-ink">
              Tell me the one question to read.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-brand-ink-soft">
              Your payment is complete. This required form starts the delivery
              clock and reserves one of three weekday production slots.
            </p>

            <dl className="mt-9 space-y-4 border-t border-brand-line pt-6 text-sm">
              <div className="flex items-start justify-between gap-5">
                <dt className="font-semibold text-brand-ink-soft">Primary birthdate</dt>
                <dd className="text-right text-brand-ink">{formatBirthdate(order.primaryBirthdate)}</dd>
              </div>
              <div className="flex items-start justify-between gap-5">
                <dt className="font-semibold text-brand-ink-soft">Reading</dt>
                <dd className="text-right text-brand-ink">Private 5-7 minute video</dd>
              </div>
              <div className="flex items-start justify-between gap-5">
                <dt className="font-semibold text-brand-ink-soft">Question Blueprint</dt>
                <dd className="text-right text-brand-ink">
                  {order.includeQuestionBlueprint ? "Included" : "Not included"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-sm border border-brand-line-strong bg-brand-ivory p-6 shadow-[0_20px_50px_rgba(44,31,20,0.12)] sm:p-8">
            <MyQuestionOnboardingForm sessionId={sessionId} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function OnboardingState({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="shell-paper-deep">
        <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl items-center px-5 py-16 sm:px-8 lg:px-10">
          <section className="w-full rounded-sm border border-brand-line-strong bg-brand-ivory p-7 sm:p-10">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-brand-ink">{title}</h1>
            <p className="mt-5 max-w-[40rem] text-base leading-relaxed text-brand-ink-soft">{message}</p>
            <Link
              href="/myquestion"
              className="mt-7 inline-flex min-h-11 items-center rounded-sm border border-brand-line-strong px-5 py-2.5 font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:underline"
            >
              Return to My Question
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatBirthdate(dateIso: string): string {
  const parsed = new Date(`${dateIso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatFulfillmentDate(dateIso: string): string {
  const parsed = new Date(`${dateIso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
