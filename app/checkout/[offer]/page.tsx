import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheckoutContinueForm } from "@/components/checkout/CheckoutContinueForm";
import { CheckoutShell } from "@/components/checkout/CheckoutShell";
import { Kicker } from "@/components/ui";
import {
  publicProductBySlug,
  digitalOfferFacts,
  instantReportFacts,
  type DigitalOfferFact,
  type InstantReportFact,
  isDigitalDownload,
  isInstantReport,
} from "@/lib/products";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Review your purchase",
  description:
    "Review the details before continuing to secure checkout.",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ offer: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function CheckoutReviewPage({
  params,
  searchParams,
}: PageProps) {
  const { offer: slug } = await params;
  const { status } = await searchParams;
  const product = publicProductBySlug(slug);

  if (!product) notFound();

  const isDigital = isDigitalDownload(product);
  const isReport = isInstantReport(product);
  const unavailable = isDigital && !product.available;
  const facts: (DigitalOfferFact | InstantReportFact)[] =
    isDigital
      ? digitalOfferFacts(product)
      : instantReportFacts(product);

  return (
    <CheckoutShell
      crumb={[
        { label: "Personal Card Blueprint", href: "/products/personal-card-blueprint" },
        { label: "Review purchase", href: `/checkout/${product.slug}` },
      ]}
    >
      <header className="max-w-[42rem] pb-6">
        <Kicker className="mb-3">
          {isDigital || isReport ? "Review your purchase" : "Review your reading"}
        </Kicker>
        <h1 className="font-serif text-3xl leading-tight text-brand-ink sm:text-4xl">
          {product.name} — {product.priceLabel}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-brand-ink-soft">
          {product.oneLine}
        </p>
      </header>

      {(status === "unavailable" || unavailable) && (
        <div
          role="alert"
          className="mb-8 border border-brand-oxblood bg-brand-ivory p-5 text-brand-ink"
        >
          <h2 className="type-h3">
            {unavailable
              ? "This product is not on sale yet."
              : "Secure checkout is temporarily unavailable."}
          </h2>
          <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-brand-ink-soft">
            No checkout session was created. {unavailable
              ? "Secure download fulfillment must be live before sales open."
              : "Try again in a moment."}{" "}
            <Link href="/contact" className="editorial-link text-brand-ink">
              contact Card Blueprints
            </Link>{" "}
            if the problem continues.
          </p>
        </div>
      )}

      <aside className="h-fit max-w-md border border-brand-line bg-brand-paper-deep p-6">
        <Kicker>Before payment</Kicker>
        <h2 className="type-h3 mt-3 text-brand-ink">
          {product.name} — {product.priceLabel}
          {isReport || isDigital ? " plus applicable tax" : ""}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-ink-soft">
          {isDigital ? (
            <>
              <p>
                Stripe securely collects your payment details. After
                successful payment, you&rsquo;ll receive a secure download
                link by email — and right here on the confirmation page.
              </p>
              <p>
                Your download link works for {isDigitalDownload(product)
                  ? product.redownloadDays
                  : 30} days. Save the PDF somewhere safe.
              </p>
            </>
          ) : (
            <>
              <p>
                Stripe collects payment and the birth date your Blueprint
                should be built from. If you came from the calculator, that
                date is kept in this browser tab — never in the address bar.
              </p>
              <p>
                After payment, the written report opens immediately on the
                confirmation page, and a return link is emailed to you.
              </p>
            </>
          )}
          <p>
            Wrong date, duplicate charge, or a failed delivery: we correct or
            refund. See the{" "}
            <Link href="/refund-policy" className="editorial-link text-brand-ink">
              refund policy
            </Link>
            .
          </p>
        </div>

        {unavailable ? (
          <p className="mt-6 border-t border-brand-line pt-4 text-center text-sm font-semibold text-brand-ink">
            Checkout closed
          </p>
        ) : (
          <CheckoutContinueForm
            slug={product.slug}
            priceLabel={product.priceLabel}
          />
        )}
        <p className="mt-3 text-center text-xs leading-relaxed text-brand-ink-soft">
          {unavailable
            ? "No payment is being collected."
            : "One-time payment. No automatic renewal. Plus applicable tax."}
        </p>
        <dl className="mt-6 border-t border-brand-line pt-4 text-xs leading-relaxed text-brand-ink-soft">
          {facts.slice(0, 3).map((fact) => (
            <div key={fact.label} className="mt-2 grid grid-cols-[6rem_1fr] gap-2">
              <dt className="font-medium text-brand-ink">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <p className="mt-8 text-sm text-brand-ink-soft">
        Need another option?{" "}
        {isDigital ? (
          <Link href="/products/personal-card-blueprint" className="editorial-link text-brand-ink">
            Get your Personal Card Blueprint →
          </Link>
        ) : (
          <Link href="/birth-card-calculator" className="editorial-link text-brand-ink">
            Find your birth card free →
          </Link>
        )}
      </p>
    </CheckoutShell>
  );
}
