import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import {
  productBySlug,
  isDigitalDownload,
  isInstantReport,
  isVoiceReading,
  type SiteProduct,
} from "@/lib/products";
import { mintReportToken } from "@/lib/report-token";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Purchase status",
  description:
    "Confirm a Card Blueprints purchase and access your order.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ session_id?: string }>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id ?? "";

  let product: SiteProduct | undefined;
  let customerEmail = "";
  let confirmed = false;
  let session2: import("stripe").Stripe.Checkout.Session | undefined;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(
        sessionId,
      );
      session2 = session;
      customerEmail =
        session.customer_details?.email ??
        session.customer_email ??
        "";
      const paymentSatisfied =
        session.payment_status === "paid" ||
        (session.payment_status === "no_payment_required" &&
          session.amount_total === 0);
      product =
        session.status === "complete" && paymentSatisfied
          ? productBySlug(session.metadata?.offer_slug ?? "")
          : undefined;
      confirmed = Boolean(product);
    } catch (error) {
      console.warn(
        "[checkout/success] could not retrieve session",
        error,
      );
    }
  }

  const digital = product && isDigitalDownload(product);
  const voice = product && isVoiceReading(product);
  const instantReport = product && isInstantReport(product);

  // Instant report: pull the birth date from the Stripe Checkout custom
  // field and mint a report token so the report opens immediately.
  let reportToken = "";
  if (instantReport && confirmed) {
    const birthdate = (
      session2?.custom_fields?.find((f) => f.key === "birthdate")?.text?.value ?? ""
    ).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate) && customerEmail) {
      try {
        reportToken = await mintReportToken(
          customerEmail,
          product!.slug,
          sessionId,
          birthdate,
        );
      } catch (e) {
        console.error("[checkout/success] report token mint failed", e);
      }
    }
  }

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        {
          label: "Readings",
          href: digital ? "/products/analog-algorithm" : "/readings",
        },
        {
          label: "Purchase status",
          href: "/checkout/success",
        },
      ]}
    >
      <header className="max-w-[38em] pb-8">
        <Kicker className="mb-4">
          {confirmed ? "Payment received" : "Payment not verified"}
        </Kicker>
        <h1 className="type-display text-brand-ink">
          {confirmed && digital
            ? "Your e-book is ready for download."
            : confirmed && instantReport
              ? "Payment confirmed. Your Blueprint is ready."
              : confirmed && voice
                ? "Payment confirmed. Your access is being activated."
                : "We could not confirm this purchase yet."}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          {confirmed && digital
            ? `"${product!.name}" — ${product!.priceLabel}. Your download link is below. Save the PDF somewhere safe.`
            : confirmed && instantReport
              ? reportToken
                ? `"${product!.name}" — ${product!.priceLabel}. Your personalized report is generated and ready to read. A return link was also emailed to you.`
                : "Payment is confirmed, but we could not read a birth date from this checkout. Reply to your receipt email with your birth date (YYYY-MM-DD) and we'll finish your Blueprint."
              : confirmed && voice
                ? activationInstructions(product!)
                : "Do not start a paid reading yet. Return to the readings page or contact support so we can verify the payment."}
        </p>
        {confirmed && customerEmail && (
          <p className="mt-3 text-sm text-brand-ink-soft">
            Receipt and instructions were sent to{" "}
            <strong>{customerEmail}</strong>.
          </p>
        )}
      </header>

      {confirmed ? (
        <section className="border-y border-brand-line py-8">
          {digital ? (
            <DigitalFulfillment
              product={product!}
              email={customerEmail}
            />
          ) : instantReport ? (
            <ReportFulfillment reportToken={reportToken} />
          ) : voice ? (
            <VoiceFulfillment product={product!} />
          ) : null}
        </section>
      ) : (
        <section
          role="status"
          className="border-y border-brand-line py-8"
        >
          <h2 className="type-h3 text-brand-ink">
            No paid access is being claimed on this page.
          </h2>
          <p className="mt-3 max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
            A missing, unpaid, or unavailable Stripe session can land
            here without proving a purchase. If you have a receipt,
            contact support and include the purchase email and offer
            name.
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
        <h2 className="type-h3 text-brand-ink">
          If something doesn&rsquo;t work
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          {digital
            ? "If your download link doesn't work, reply to your receipt email or"
            : "If the line doesn&rsquo;t recognize your number or a call drops, reply to your receipt email or"}{" "}
          <Link
            href="/contact"
            className="editorial-link text-brand-ink"
          >
            send a note via contact
          </Link>{" "}
          with the email and phone number you used at checkout. Unused
          purchases are covered by the{" "}
          <Link
            href="/refund-policy"
            className="editorial-link text-brand-ink"
          >
            refund policy
          </Link>
          .
        </p>
      </section>
    </SeoShell>
  );
}

function DigitalFulfillment({
  product,
}: {
  product: SiteProduct;
  email: string;
}) {
  const downloadHref = `/api/download/${product.slug}`;

  return (
    <div className="text-center">
      <Kicker className="mb-4">Your e-book</Kicker>
      <h2 className="type-h2 text-brand-ink">{product.name}</h2>
      <p className="mt-2 text-sm text-brand-ink-soft">
        {product.deliverable}
      </p>
      <div className="mt-6">
        <LinkButton
          href={downloadHref}
          variant="accent"
          size="large"
        >
          Download {product.name} &mdash; PDF
        </LinkButton>
      </div>
      <p className="mt-3 text-xs text-brand-ink-soft">
        Your download link is good for 30 days. Need it again? Reply
        to your receipt email.
      </p>
      <div className="mt-8 border-t border-brand-line pt-6">
        <p className="text-sm text-brand-ink-soft">
          Prefer to hear the system read aloud?{" "}
          <Link
            href="/readings"
            className="editorial-link text-brand-ink"
          >
            See the voice readings &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}

function VoiceFulfillment({
  product,
}: {
  product: SiteProduct;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
        <p className="font-serif text-lg text-brand-bronze">01</p>
        <h2 className="type-h3 mt-2 text-brand-ink">
          Use your checkout number.
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Your access is tied to the phone number you entered at
          checkout. The reader recognizes that number when you call.
        </p>
      </div>
      <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
        <p className="font-serif text-lg text-brand-bronze">02</p>
        <h2 className="type-h3 mt-2 text-brand-ink">
          Watch for activation instructions.
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Payment confirmation does not prove the phone line has
          recognized your access yet. Wait for the start-here email
          before calling.
        </p>
      </div>
      <div className="border-t border-brand-line pt-4 lg:border-t-0 lg:pt-0">
        <p className="font-serif text-lg text-brand-bronze">03</p>
        <h2 className="type-h3 mt-2 text-brand-ink">
          Then call the reading line.
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          Your session covers up to{" "}
          {"durationMinutes" in product
            ? product.durationMinutes
            : 15}{" "}
          minutes. Start it within{" "}
          {"accessDays" in product ? product.accessDays : 30} days.
        </p>
      </div>
    </div>
  );
}

function activationInstructions(product: SiteProduct): string {
  if ("accessType" in product && product.accessType === "season_pass") {
    return "We are linking your 90-day pass to the phone number you used at checkout. Wait for the start-here email before calling.";
  }
  return `We are linking this reading to the phone number you used at checkout. Wait for the start-here email before calling; after activation, you have ${"accessDays" in product ? product.accessDays : 30} days to begin.`;
}
function ReportFulfillment({ reportToken }: { reportToken: string }) {
  if (!reportToken) {
    return (
      <div className="text-center">
        <Kicker className="mb-4">Your Blueprint</Kicker>
        <h2 className="type-h2 text-brand-ink">One step left.</h2>
        <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
          Your payment went through, but the birth date from checkout
          didn&rsquo;t reach us. Reply to your receipt email with your birth
          date (YYYY-MM-DD) and we&rsquo;ll send your report link.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <Kicker className="mb-4">Your Blueprint</Kicker>
      <h2 className="type-h2 text-brand-ink">It&rsquo;s ready.</h2>
      <p className="mx-auto mt-2 max-w-[32em] text-sm leading-relaxed text-brand-ink-soft">
        Your Personal Card Blueprint was generated from the birth date you
        entered at checkout. Open it now — the same link is in your email.
      </p>
      <div className="mt-6">
        <LinkButton
          href={`/blueprint?token=${reportToken}`}
          variant="accent"
          size="large"
        >
          Open My Personal Blueprint
        </LinkButton>
      </div>
      <p className="mt-3 text-xs text-brand-ink-soft">
        Keep the emailed link — it re-opens your report anytime.
      </p>
    </div>
  );
}
