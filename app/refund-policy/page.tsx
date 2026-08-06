import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL, READINGS_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy | Card Blueprints",
  description:
    "Read the Card Blueprints refund policy for AI voice readings, unused sessions, access problems, interrupted calls, and refund requests.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 29, 2026";

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
            Card Blueprints sells voice readings — a $19 Quick Question, a $39
            Complete Reading, and a $199 90-Day Season Pass. The refund rule
            depends on whether your paid access has been used.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Before the first paid session</h2>
          <p className="mt-3">
            If you have not used any paid session, ask for a full refund by
            replying to your receipt or using the{" "}
            <Link href="/contact" className="text-[#8e321f] underline underline-offset-4">
              contact page
            </Link>
            . Include the phone number and email used at checkout. This applies
            to all three readings, including the Season Pass.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">After paid use begins</h2>
          <p className="mt-3">
            Once a paid session has been used, refunds are limited because the
            service has started. If the line did not work, your access was not
            recognized, or a technical problem interrupted a paid call, contact
            us. We will review the access record and offer restored access, a
            partial refund, or a full refund when the service was not delivered
            as described.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">How to request a refund</h2>
          <ol className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-3">
              <strong>Reply to your Stripe receipt email</strong> with "refund request" in the subject line.
            </li>
            <li className="border-t border-[#14110d]/12 pt-3">
              Or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>{" "}
              with the email address and phone number you used at checkout.
            </li>
          </ol>
          <p className="mt-4 text-sm text-[#5b5148]">
            Requests are reviewed personally, and approved refunds are processed
            through Stripe — banks typically post them within 5–10 business days.
          </p>
        </section>

        <div className="border-t border-[#14110d]/15 pt-6">
          <Link href={READINGS_PATH} className="text-[#8e321f] underline underline-offset-4">
            ← Back to readings
          </Link>
        </div>

      </div>
    </SeoShell>
  );
}
