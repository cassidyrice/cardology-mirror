import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { READER_PHONE_DISPLAY } from "@/lib/offers";
import { offerBySlug, readingOfferFacts } from "@/lib/products";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Review your Cardology reading",
  description: "Review the reading details before continuing to secure checkout.",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ offer: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function CheckoutReviewPage({ params, searchParams }: PageProps) {
  const { offer: slug } = await params;
  const { status } = await searchParams;
  const offer = offerBySlug(slug);

  if (!offer) notFound();

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Readings", href: "/readings" },
        { label: offer.name, href: `/checkout/${offer.slug}` },
      ]}
    >
      <header className="max-w-[42rem] pb-9">
        <Kicker className="mb-4">Review your reading</Kicker>
        <h1 className="type-display text-brand-ink">
          {offer.name} &mdash; {offer.priceLabel}
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">{offer.oneLine}</p>
      </header>

      {status === "unavailable" && (
        <div
          role="alert"
          className="mb-8 border border-brand-oxblood bg-brand-ivory p-5 text-brand-ink"
        >
          <h2 className="type-h3">Secure checkout is temporarily unavailable.</h2>
          <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-brand-ink-soft">
            No checkout session was created in this attempt. Try again in a
            moment, or{" "}
            <Link href="/contact" className="editorial-link text-brand-ink">
              contact Card Blueprints
            </Link>{" "}
            if the problem continues.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:gap-12">
        <section aria-labelledby="reading-details">
          <h2 id="reading-details" className="type-h2 text-brand-ink">
            What you&rsquo;re choosing
          </h2>
          <div className="mt-5 border-y border-brand-line">
            <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <p className="font-medium text-brand-ink">Best for</p>
              <p className="text-sm leading-relaxed text-brand-ink-soft">{offer.bestFor}</p>
            </div>
            <dl>
              {readingOfferFacts(offer).map((fact) => (
                <div
                  key={fact.label}
                  className="grid gap-1 border-t border-brand-line py-4 sm:grid-cols-[7rem_1fr] sm:gap-4"
                >
                  <dt className="font-medium text-brand-ink">{fact.label}</dt>
                  <dd className="text-sm leading-relaxed text-brand-ink-soft">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <aside className="h-fit border border-brand-line bg-brand-paper-deep p-6">
          <Kicker>Before payment</Kicker>
          <h2 className="type-h3 mt-3 text-brand-ink">Use the number you&rsquo;ll call from.</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-ink-soft">
            <p>
              Stripe securely collects your phone number and payment details.
              The AI reader never accepts payment card details by voice.
            </p>
            <p>
              After successful payment, call {READER_PHONE_DISPLAY} from that
              same number. Paid access begins when the line recognizes it.
            </p>
          </div>
          <form
            action={`/checkout/${offer.slug}/session`}
            method="post"
            className="mt-6"
            data-analytics-checkout
          >
            <button type="submit" className="accent-button large-button w-full">
              Continue to Secure Checkout &mdash; {offer.priceLabel}
            </button>
          </form>
          <p className="mt-3 text-center text-xs leading-relaxed text-brand-ink-soft">
            One-time payment. No automatic renewal.
          </p>
        </aside>
      </div>

      <p className="mt-8 text-sm text-brand-ink-soft">
        Need another option?{" "}
        <Link href="/readings" className="editorial-link text-brand-ink">
          Compare all three readings &rarr;
        </Link>
      </p>
    </SeoShell>
  );
}
