import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { offerBySlug, type ReadingOffer } from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Reading purchase status",
  description: "Confirm a Card Blueprints purchase and learn when the video arrives.",
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
  // payment-confirmed state. Production and email delivery happen downstream.
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Reading purchase status",
    description: metadata.description,
    url: `${SITE_URL}/checkout/success`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Readings", href: "/readings" },
        { label: "Purchase status", href: "/checkout/success" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="max-w-[38em] pb-8">
        <Kicker className="mb-4">
          {confirmed ? "Payment received" : "Payment not verified"}
        </Kicker>
        <h1 className="type-display text-brand-ink">
          {confirmed && offer
            ? "Payment confirmed. Your video is being made."
            : "We could not confirm this purchase yet."}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          {confirmed && offer
            ? deliveryInstructions(offer)
            : "No paid video is being claimed on this page. Return to the readings page or contact support so we can verify the payment."}
        </p>
        {confirmed && customerEmail && (
          <p className="mt-3 text-sm text-brand-ink-soft">
            Receipt and delivery updates go to{" "}
            <strong>{customerEmail}</strong>.
          </p>
        )}
      </header>

      {confirmed ? (
        <section className="border-y border-brand-line py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
              <p className="font-serif text-lg text-brand-bronze">01</p>
              <h2 className="type-h3 mt-2 text-brand-ink">Your video is being made.</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                A personal reading is written, voiced, and produced from the
                birth date you entered at checkout — made for you, not generated
                live.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
              <p className="font-serif text-lg text-brand-bronze">02</p>
              <h2 className="type-h3 mt-2 text-brand-ink">Watch your inbox.</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                A private video link arrives by email within{" "}
                {offer ? offer.deliveryHours : 48} hours, at the address you
                used at checkout. Nothing to schedule, nothing to call.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
              <p className="font-serif text-lg text-brand-bronze">03</p>
              <h2 className="type-h3 mt-2 text-brand-ink">Keep it.</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                The video is yours. Rewatch it whenever you need the pattern
                again.
              </p>
            </div>
          </div>
          <div className="mt-9 text-center">
            <LinkButton href="/" variant="accent" size="large">
              Back to Card Blueprints
            </LinkButton>
            <p className="mt-3 text-xs text-brand-ink-soft">
              If {offer ? offer.deliveryHours : 48} hours pass with no video,
              check spam, then reply to your receipt — we&rsquo;ll make it
              right.
            </p>
          </div>
        </section>
      ) : (
        <section role="status" className="border-y border-brand-line py-8">
          <h2 className="type-h3 text-brand-ink">No paid purchase is being claimed on this page.</h2>
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
          If your video hasn&rsquo;t arrived within the promised window,
          reply to your receipt email or{" "}
          <Link href="/contact" className="editorial-link text-brand-ink">
            send a note via contact
          </Link>{" "}
          with the email you used at checkout. Undelivered videos are covered
          by the{" "}
          <Link href="/refund-policy" className="editorial-link text-brand-ink">
            refund policy
          </Link>
          .
        </p>
      </section>
    </SeoShell>
  );
}

function deliveryInstructions(offer: ReadingOffer): string {
  return `Your ${offer.name} is confirmed. It is being made personally for you from the birth date you entered at checkout — a private video link will arrive by email within ${offer.deliveryHours} hours.`;
}
