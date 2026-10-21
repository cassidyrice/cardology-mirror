import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy | Card Blueprints",
  description:
    "Refund terms for the Chemistry Check, past purchases, and legacy orders.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = PAGE_UPDATED_DATES["/refund-policy"];

export default function RefundPolicy() {
  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Refund Policy", href: "/refund-policy" },
      ]}
    >
      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Legal</p>
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          Refund Policy
        </h1>
        <p className="mt-4 text-sm text-brand-ink-soft">Last updated: {updatedLabel(UPDATED)}</p>
      </header>

      <div className="max-w-3xl space-y-8 text-base leading-relaxed text-brand-ink">
        <section className="border border-brand-line bg-brand-paper-deep p-5">
          <p className="font-serif text-lg text-brand-ink">
            Card Blueprints sells three readings, the $39 12-Month Timing Map, the $52 Chemistry Check and the $65 Family Snapshot, through
            Stan Store. If something is wrong with your order or your reading,
            email us with the address you used at checkout and we will review it
            personally.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Past purchases</h2>
          <p className="mt-3">
            Products we no longer sell (including the One Question Reading, the
            Blueprint Report and Your Year Ahead) keep the refund and service
            terms they were sold under. Contact us with the checkout email and
            we will locate the order.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Legacy phone-reading orders</h2>
          <p className="mt-3">
            Phone-reading products are no longer sold. Existing purchases keep
            the refund and service rights provided at checkout. If an unused
            purchase, access-recognition problem, or interrupted paid session
            needs review, contact us with the original checkout email and phone
            number. We will review the order and provide restored access or an
            appropriate refund when the service was not delivered as described.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Digital downloads</h2>
          <p className="mt-3">
            Digital products with instant download are refundable if the file is
            corrupt or the download fails. Refunds are not available after a
            successful, complete download unless required by law.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">How to request a refund</h2>
          <ol className="mt-3 space-y-2">
            <li className="border-t border-brand-line pt-3">
              <strong>Reply to your receipt email</strong> with “refund request” in the subject line.
            </li>
            <li className="border-t border-brand-line pt-3">
              Or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-oxblood underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>{" "}
              with the email address used at checkout. For a legacy phone order,
              also include the checkout phone number.
            </li>
          </ol>
          <p className="mt-4 text-sm text-brand-ink-soft">
            Requests are reviewed personally, and approved refunds are processed
            through the original payment method — banks typically post them within 5–10 business days.
          </p>
        </section>

        <div className="border-t border-brand-line pt-6">
          <Link href="/#chemistry-check" className="text-brand-oxblood underline underline-offset-4">
            ← Back to the Chemistry Check
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
