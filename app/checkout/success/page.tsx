import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import { offerBySlug, type ReadingOffer } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Reading purchase status",
  description: "Confirm a Card Blueprints purchase and learn how to start the reading.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  session_id?: string;
}>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id ?? "";

  // The URL is not proof of payment. Confirm a completed session with Stripe
  // and derive the offer from its server-retrieved metadata before showing a
  // payment-confirmed state. Activation and email delivery happen downstream.
  let offer: ReadingOffer | undefined;
  let customerEmail = "";
  let confirmed = false;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email ?? session.customer_email ?? "";
      const paymentSatisfied =
        session.payment_status === "paid" ||
        (session.payment_status === "no_payment_required" && session.amount_total === 0);
      offer =
        session.status === "complete" && paymentSatisfied
          ? offerBySlug(session.metadata?.offer_slug ?? "")
          : undefined;
      confirmed = Boolean(offer);
    } catch (error) {
      console.warn("[checkout/success] could not retrieve session", error);
    }
  }

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Readings", href: "/readings" },
        { label: "Purchase status", href: "/checkout/success" },
      ]}
    >
      <header className="max-w-[38em] pb-8">
        <Kicker className="mb-4">
          {confirmed ? "Payment received" : "Payment not verified"}
        </Kicker>
        <h1 className="type-display text-brand-ink">
          {confirmed && offer
            ? "Payment confirmed. Your access is being activated."
            : "We could not confirm this purchase yet."}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          {confirmed && offer
            ? activationInstructions(offer)
            : "Do not start a paid reading yet. Return to the readings page or contact support so we can verify the payment."}
        </p>
        {confirmed && customerEmail && (
          <p className="mt-3 text-sm text-brand-ink-soft">
            Receipt and start-here instructions will be sent to{" "}
            <strong>{customerEmail}</strong>.
          </p>
        )}
      </header>

      {confirmed ? (
        <section className="border-y border-brand-line py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
              <p className="font-serif text-lg text-brand-bronze">01</p>
              <h2 className="type-h3 mt-2 text-brand-ink">Use your checkout number.</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                Your access is tied to the phone number you entered at checkout.
                The reader recognizes that number when you call.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
              <p className="font-serif text-lg text-brand-bronze">02</p>
              <h2 className="type-h3 mt-2 text-brand-ink">Watch for activation instructions.</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                Payment confirmation does not prove the phone line has recognized
                your access yet. Wait for the start-here email before calling.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
              <p className="font-serif text-lg text-brand-bronze">03</p>
              <h2 className="type-h3 mt-2 text-brand-ink">Then call the reading line.</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                {offer
                  ? sessionDetail(offer)
                  : "Your session details are in your confirmation email."}
              </p>
            </div>
          </div>
          <div className="mt-9 text-center">
            <LinkButton href={READER_PHONE_TEL} variant="accent" size="large">
              Call after activation &mdash; {READER_PHONE_DISPLAY}
            </LinkButton>
            <p className="mt-3 text-xs text-brand-ink-soft">
              Wait for the start-here email, then call from the number you used
              at checkout so the reader recognizes you.
            </p>
          </div>
        </section>
      ) : (
        <section role="status" className="border-y border-brand-line py-8">
          <h2 className="type-h3 text-brand-ink">No paid access is being claimed on this page.</h2>
          <p className="mt-3 max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
            A missing, unpaid, or unavailable Stripe session can land here
            without proving a purchase. If you have a receipt, contact support
            and include the purchase email and offer name.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/readings" variant="primary">
              Return to Readings
            </LinkButton>
            <LinkButton href="/contact" variant="outline">
              Contact Support
            </LinkButton>
          </div>
        </section>
      )}

      <section className="mt-10 max-w-[38em]">
        <h2 className="type-h3 text-brand-ink">If something doesn&rsquo;t work</h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          If the line doesn&rsquo;t recognize your number or a call drops,
          reply to your receipt email or{" "}
          <Link href="/contact" className="editorial-link text-brand-ink">
            send a note via contact
          </Link>{" "}
          with the email and phone number you used at checkout. Unused paid
          sessions are covered by the{" "}
          <Link href="/refund-policy" className="editorial-link text-brand-ink">
            refund policy
          </Link>
          .
        </p>
      </section>
    </SeoShell>
  );
}

function activationInstructions(offer: ReadingOffer): string {
  if (offer.accessType === "season_pass") {
    return "We are linking your 90-day pass to the phone number you used at checkout. Wait for the start-here email before calling.";
  }
  return `We are linking this reading to the phone number you used at checkout. Wait for the start-here email before calling; after activation, you have ${offer.accessDays} days to begin.`;
}

function sessionDetail(offer: ReadingOffer): string {
  if (offer.accessType === "season_pass") {
    return `Unlimited personal return calls for ${offer.accessDays} days, up to ${offer.durationMinutes} minutes per session. One payment — nothing renews.`;
  }
  return `Your session covers up to ${offer.durationMinutes} minutes with the reader. One paid session — start it within ${offer.accessDays} days.`;
}
