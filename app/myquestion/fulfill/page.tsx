import type { Metadata } from "next";

import { MyQuestionFulfillmentControls } from "@/components/my-question/MyQuestionFulfillmentControls";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { loadMyQuestionFulfillment } from "@/lib/my-question/fulfillment-service";
import {
  resolveMyQuestionRuntime,
  runtimeString,
} from "@/lib/my-question/runtime";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Private My Question Fulfillment | Card Blueprints",
  description: "Private creator fulfillment workspace.",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function MyQuestionFulfillmentPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const runtimeContext = await resolveMyQuestionRuntime();
  const signingSecret = runtimeString(
    runtimeContext.env,
    "MY_QUESTION_SIGNING_SECRET",
  );

  if (!token || !runtimeContext.db || !signingSecret) {
    return <PrivateState message="This private fulfillment link is invalid, expired, or temporarily unavailable." />;
  }

  const result = await loadMyQuestionFulfillment(token, {
    db: runtimeContext.db,
    signingSecret,
  });
  if (!result.ok) return <PrivateState message={result.message} />;

  const order = result.value;
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="shell-paper-deep">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="border-b border-brand-line pb-8">
            <p className="type-eyebrow">Private creator workspace</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-brand-ink sm:text-5xl">
              My Question fulfillment
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-ink-soft">
              This page contains private customer intake. Do not forward the link, copy it into shared notes, or leave it open on a public screen.
            </p>
          </div>

          <div className="mt-9 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.52fr)]">
            <section aria-labelledby="order-details-heading" className="rounded-sm border border-brand-line-strong bg-brand-ivory p-6 sm:p-8">
              <h2 id="order-details-heading" className="font-serif text-3xl font-semibold text-brand-ink">
                Order details
              </h2>
              <dl className="mt-6 divide-y divide-brand-line text-sm">
                <Detail label="Status" value={formatStatus(order.status)} />
                <Detail label="Assigned date" value={order.fulfillmentDate ? formatDate(order.fulfillmentDate) : "Not assigned"} />
                <Detail label="Capacity slot" value={order.slotNumber ? `${order.slotNumber} of 3` : "Not assigned"} />
                <Detail label="Customer" value={order.customerName ?? "Pending onboarding"} />
                <Detail label="Email" value={order.customerEmail ?? "Not available"} />
                <Detail label="Primary birthdate" value={formatBirthdate(order.primaryBirthdate)} />
                <Detail
                  label="Question Blueprint"
                  value={order.includeQuestionBlueprint ? "Included" : "Not included"}
                />
                <Detail
                  label="Paid amount"
                  value={order.amountCents == null ? "Not available" : formatMoney(order.amountCents)}
                />
                <Detail
                  label="Relevant birthdates"
                  value={
                    order.relevantBirthdates.length
                      ? order.relevantBirthdates.map(formatBirthdate).join(", ")
                      : "None submitted"
                  }
                />
              </dl>

              <div className="mt-8 border-t border-brand-line pt-7">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-ink-soft">
                  One focused question
                </h2>
                <p className="mt-3 whitespace-pre-wrap font-serif text-2xl leading-relaxed text-brand-ink">
                  {order.question ?? "Waiting for customer onboarding."}
                </p>
              </div>
            </section>

            <div className="lg:sticky lg:top-24">
              <MyQuestionFulfillmentControls
                token={token}
                initialStatus={order.status}
                initialDeliveryUrl={order.deliveryUrl}
              />
              <p className="mt-4 text-xs leading-relaxed text-brand-ink-soft">
                Detailed intake is scheduled for deletion 90 days after delivery. Keep only the minimum fulfillment record required for support and accounting.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-5">
      <dt className="font-semibold text-brand-ink-soft">{label}</dt>
      <dd className="break-words text-brand-ink">{value}</dd>
    </div>
  );
}

function PrivateState({ message }: { message: string }) {
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="shell-paper-deep">
        <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl items-center px-5 py-16 sm:px-8">
          <section className="w-full rounded-sm border border-brand-line-strong bg-brand-ivory p-7 sm:p-10">
            <h1 className="font-serif text-4xl font-semibold leading-tight text-brand-ink">Private link unavailable</h1>
            <p className="mt-5 text-base leading-relaxed text-brand-ink-soft">{message}</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function formatStatus(status: string): string {
  return status.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function formatDate(dateIso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateIso}T12:00:00Z`));
}

function formatBirthdate(dateIso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateIso}T12:00:00Z`));
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
