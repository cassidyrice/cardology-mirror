import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL, READINGS_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Card Blueprints refund terms for personal readings and reports.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 12, 2026";

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

        <section className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
          <p className="font-serif text-lg text-[#14110d]">
            Card Blueprints sells both written products and instant AI voice
            access. The refund rule depends on which product you bought and
            whether delivery or use has started.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">AI voice access — before the first paid call</h2>
          <p className="mt-3">
            If you have not used the paid AI voice access, ask for a full refund
            by replying to your receipt or using the{" "}
            <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">
              contact page
            </Link>
            . Include the phone number and email used at checkout.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">AI voice access — after use begins</h2>
          <p className="mt-3">
            Once a paid call has been used, refunds are limited because the service
            has started. If the line did not work, access was not recognized, or a
            technical problem stopped the paid service, contact us. We will review
            the call-access record and offer restored access, a partial refund, or
            a full refund when the service was not delivered.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Written products — before work begins</h2>
          <p className="mt-3">
            If you contact us before work starts on a custom written reading,
            you will receive a full refund. Reply to your receipt or use the{" "}
            <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">
              contact page
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Written products — after work begins</h2>
          <p className="mt-3">
            Once a custom written reading is underway, refunds are limited because
            the work cannot be reassigned. If something is unclear or a promised
            part is missing, contact us. Clarifications are free, and a partial or
            full refund may be offered when the product was not delivered as described.
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
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#9e3d24] underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>{" "}
              with the email address you used at checkout.
            </li>
          </ol>
          <p className="mt-4 text-sm text-[#5b5148]">
            Refunds are processed through Stripe within 5–10 business days
            depending on your bank.
          </p>
        </section>

        <div className="border-t border-[#14110d]/15 pt-6">
          <Link href={READINGS_PATH} className="text-[#9e3d24] underline underline-offset-4">
            ← Back to readings
          </Link>
        </div>

      </div>
    </SeoShell>
  );
}
