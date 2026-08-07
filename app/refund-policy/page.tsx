import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy | Card Blueprints",
  description:
    "Refund terms for the Personal Card Blueprint, digital downloads, and legacy orders.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "August 6, 2026";

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
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Refund Policy
        </h1>
        <p className="mt-4 text-sm text-[#5b5148]">Last updated: {UPDATED}</p>
      </header>

      <div className="max-w-3xl space-y-8 text-base leading-relaxed text-[#3d352d]">
        <section className="border border-[#14110d]/15 bg-[#efe8dc]/70 p-5">
          <p className="font-serif text-lg text-[#14110d]">
            Card Blueprints sells the $29 Personal Card Blueprint. Refund
            eligibility depends on whether the personalized report was delivered
            and accessible. The digital-download policy applies only when an
            e-book sale is explicitly open.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Personal Card Blueprint</h2>
          <div className="mt-3 space-y-3">
            <p>
              The Personal Card Blueprint is generated immediately from the
              birth date entered at Stripe Checkout and delivered through a
              signed access link. Because it is personalized and delivered
              instantly, a completed, accessible Blueprint is generally final.
            </p>
            <p>
              If the report cannot be generated, its access link does not work,
              the checkout birth date was entered incorrectly, or you were
              charged more than once for the same intended purchase, contact us.
              We will correct the report, restore access, or issue an appropriate
              refund when the problem cannot be resolved.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Legacy phone-reading orders</h2>
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
          <h2 className="font-serif text-2xl text-[#14110d]">Digital downloads</h2>
          <p className="mt-3">
            Digital products with instant download are refundable if the file is
            corrupt or the download fails. Refunds are not available after a
            successful, complete download unless required by law.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">How to request a refund</h2>
          <ol className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-3">
              <strong>Reply to your Stripe receipt email</strong> with “refund request” in the subject line.
            </li>
            <li className="border-t border-[#14110d]/12 pt-3">
              Or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>{" "}
              with the email address used at checkout. For a legacy phone order,
              also include the checkout phone number.
            </li>
          </ol>
          <p className="mt-4 text-sm text-[#5b5148]">
            Requests are reviewed personally, and approved refunds are processed
            through Stripe — banks typically post them within 5–10 business days.
          </p>
        </section>

        <div className="border-t border-[#14110d]/15 pt-6">
          <Link href="/products/personal-card-blueprint" className="text-[#8e321f] underline underline-offset-4">
            ← Back to Personal Card Blueprint
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
