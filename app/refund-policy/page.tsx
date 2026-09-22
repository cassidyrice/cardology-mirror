import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ONE_QUESTION_TURNAROUND } from "@/lib/deep-dive";
import { CONTACT_EMAIL } from "@/lib/site";

import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy | Card Blueprints",
  description:
    "Refund terms for the One Question Reading, past digital purchases, and legacy orders.",
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
            Card Blueprints sells the $13 One Question Reading, a written reading
            built from the birth date and the question entered before checkout.
            Reply to your receipt before it is written and we fix a wrong date
            or reword the question at no charge. Once it has been sent, we
            refund in full if the reading did not use the date and question you
            gave us. The digital-download policy applies only when an e-book
            sale is explicitly open.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">One Question Reading</h2>
          <div className="mt-3 space-y-3">
            <p>
              The One Question Reading is written for the birth date and the
              question you enter before Stripe Checkout and emailed within{" "}
              {ONE_QUESTION_TURNAROUND}. If the wrong birth date was entered, or you want to
              reword the question, reply to your receipt before it is written:
              we use the corrected details at no charge. December 31 is the
              Joker and sits outside the 52-card calendar; the reading says so
              up front and reads the year from the Joker's position.
            </p>
            <p>
              If the reading does not arrive within {ONE_QUESTION_TURNAROUND}, the wrong
              card was read, a corrected birth date was not used, or you were
              charged more than once for the same intended purchase, contact us.
              We will rewrite it or issue a full refund.
            </p>
          </div>
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
              <strong>Reply to your Stripe receipt email</strong> with “refund request” in the subject line.
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
            through Stripe — banks typically post them within 5–10 business days.
          </p>
        </section>

        <div className="border-t border-brand-line pt-6">
          <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
            ← Back to the One Question Reading
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
