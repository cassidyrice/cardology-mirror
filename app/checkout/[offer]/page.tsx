import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoShell } from "@/components/seo/SeoShell";
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
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Personal Card Blueprint", href: "/products/personal-card-blueprint" },
        { label: product.name, href: `/checkout/${product.slug}` },
      ]}
    >
      <header className="max-w-[42rem] pb-9">
        <Kicker className="mb-4">
          {isDigital || isReport ? "Review your purchase" : "Review your reading"}
        </Kicker>
        <h1 className="type-display text-brand-ink">
          {product.name} &mdash; {product.priceLabel}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
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

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:gap-12">
        <section aria-labelledby="details">
          <h2 id="details" className="type-h2 text-brand-ink">
            What you&rsquo;re choosing
          </h2>
          <div className="mt-5 border-y border-brand-line">
            <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <p className="font-medium text-brand-ink">Best for</p>
              <p className="text-sm leading-relaxed text-brand-ink-soft">
                {product.bestFor}
              </p>
            </div>
            <dl>
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="grid gap-1 border-t border-brand-line py-4 sm:grid-cols-[7rem_1fr] sm:gap-4"
                >
                  <dt className="font-medium text-brand-ink">
                    {fact.label}
                  </dt>
                  <dd className="text-sm leading-relaxed text-brand-ink-soft">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <aside className="h-fit border border-brand-line bg-brand-paper-deep p-6">
          <Kicker>Before payment</Kicker>

          {isDigital ? (
            <>
              <h2 className="type-h3 mt-3 text-brand-ink">
                Instant download after checkout.
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-ink-soft">
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
              </div>
            </>
          ) : (
            <>
              <h2 className="type-h3 mt-3 text-brand-ink">
                Your report generates the moment you pay.
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-ink-soft">
                <p>
                  Stripe collects your payment details and asks for the birth
                  date your Blueprint should be built from.
                </p>
                <p>
                  After payment, your personalized report opens immediately on
                  the confirmation page, and a return link is emailed to you.
                  No phone call, no waiting.
                </p>
              </div>
            </>
          )}

          {unavailable ? (
            <p className="mt-6 border-t border-brand-line pt-4 text-center text-sm font-semibold text-brand-ink">
              Checkout closed
            </p>
          ) : (
            <form
              action={`/checkout/${product.slug}/session`}
              method="post"
              className="mt-6"
              data-analytics-checkout
            >
              <button
                type="submit"
                className="accent-button large-button w-full"
              >
                Continue to Secure Checkout &mdash; {product.priceLabel}
              </button>
            </form>
          )}
          <p className="mt-3 text-center text-xs leading-relaxed text-brand-ink-soft">
            {unavailable
              ? "No payment is being collected."
              : "One-time payment. No automatic renewal."}
          </p>
        </aside>
      </div>

      <p className="mt-8 text-sm text-brand-ink-soft">
        Need another option?{" "}
        {isDigital ? (
          <Link href="/products/personal-card-blueprint" className="editorial-link text-brand-ink">
            Get your Personal Card Blueprint &rarr;
          </Link>
        ) : (
          <Link href="/birth-card-calculator" className="editorial-link text-brand-ink">
            Find your birth card free &rarr;
          </Link>
        )}
      </p>
    </SeoShell>
  );
}