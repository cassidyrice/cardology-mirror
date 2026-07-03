import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { READINGS_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Cardology Pro refund terms for personal readings and reports.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 3, 2026";
const CONTACT_EMAIL = "therealcassrice@gmail.com";

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
            Every Cardology Pro reading is custom written for your specific birth
            details and question. It cannot be restocked or resold. Our refund
            terms reflect that reality while keeping things simple and fair.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Before work begins — full refund</h2>
          <p className="mt-3">
            If you contact us before Cass has started working on your reading,
            you will receive a full refund. Simply reply to your receipt email
            or send a note via the{" "}
            <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">
              contact page
            </Link>
            . There is no time limit for this — if no intake has been received
            and no work has started, the refund is straightforward.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">After work begins — limited</h2>
          <p className="mt-3">
            Once Cass has received your intake details and begun the reading,
            refunds are limited because the work cannot be undone or reassigned.
            If you are unhappy with a completed reading, contact us and we will
            work toward a fair resolution — including a partial refund or a
            follow-up clarification at no charge, depending on the circumstances.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Clarifications — always free</h2>
          <p className="mt-3">
            If anything in a delivered reading is unclear or you feel a point
            was missed, ask. Clarifications are always free — just reply to the
            reading email or use the{" "}
            <Link href="/contact" className="text-[#9e3d24] underline underline-offset-4">
              contact page
            </Link>{" "}
            and reference your purchase.
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
