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
  title: "Reading purchase confirmed",
  description: "How to start your Card Blueprints voice reading.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  session_id?: string;
  offer?: string;
}>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const offer = sp.offer ? offerBySlug(sp.offer) : undefined;
  const sessionId = sp.session_id ?? "";

  // Try to enrich with Stripe session details (customer email, paid status).
  // Failure here is non-fatal — the start-here instructions still render.
  let customerEmail = "";
  let paid = false;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      customerEmail = session.customer_details?.email ?? session.customer_email ?? "";
      paid = session.payment_status === "paid";
    } catch (e) {
      console.warn("[checkout/success] could not retrieve session", e);
    }
  }

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Readings", href: "/readings" },
        { label: "Confirmed", href: "/checkout/success" },
      ]}
    >
      <header className="max-w-[38em] pb-8">
        <Kicker className="mb-4">Payment received</Kicker>
        <h1 className="type-display text-brand-ink">
          {offer ? `Your ${offer.name} is ready.` : "Your reading is ready."}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          {offer ? offerInstructions(offer) : "Call the reading line from the phone number you used at checkout."}
        </p>
        {paid && customerEmail && (
          <p className="mt-3 text-sm text-brand-ink-soft">
            Receipt and start-here email sent to <strong>{customerEmail}</strong>.
          </p>
        )}
      </header>

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
            <h2 className="type-h3 mt-2 text-brand-ink">Call the reading line.</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
              The AI Cardology reader answers directly — no menu, no
              appointment. Have the birthday (or birthdays) ready.
            </p>
          </div>
          <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
            <p className="font-serif text-lg text-brand-bronze">03</p>
            <h2 className="type-h3 mt-2 text-brand-ink">Take your time.</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
              {offer ? sessionDetail(offer) : "Your session details are in your confirmation email."}
            </p>
          </div>
        </div>
        <div className="mt-9 text-center">
          <LinkButton href={READER_PHONE_TEL} variant="accent" size="large">
            Call {READER_PHONE_DISPLAY}
          </LinkButton>
          <p className="mt-3 text-xs text-brand-ink-soft">
            Call from the number you used at checkout so the reader recognizes you.
          </p>
        </div>
      </section>

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

function offerInstructions(offer: ReadingOffer): string {
  if (offer.accessType === "season_pass") {
    return "Call the reading line from the phone number you used at checkout — your pass is open for the next 90 days.";
  }
  return `Call the reading line from the phone number you used at checkout. You have ${offer.accessDays} days to begin.`;
}

function sessionDetail(offer: ReadingOffer): string {
  if (offer.accessType === "season_pass") {
    return `Unlimited personal return calls for ${offer.accessDays} days, up to ${offer.durationMinutes} minutes per session. One payment — nothing renews.`;
  }
  return `Your session covers up to ${offer.durationMinutes} minutes with the reader. One paid session — start it within ${offer.accessDays} days.`;
}
