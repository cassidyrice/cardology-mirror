import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL, READINGS_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Read the Card Blueprints refund policy for the personal video reading — refunds before delivery, delivery problems, and how to request a refund.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "August 5, 2026";

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
            Card Blueprints sells one reading: the $99 Personal Video Reading,
            made for you after checkout and delivered as a private video link
            by email. The refund rule depends on whether your video has been
            delivered.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Before your video is delivered</h2>
          <p className="mt-3">
            If your video has not been delivered yet, you can ask for a full
            refund for any reason — simply reply to your receipt or use the{" "}
            <Link href="/contact" className="text-[#8e321f] underline underline-offset-4">
              contact page
            </Link>
            . Include the email you used at checkout. If the promised 48-hour
            delivery window ever passes without a video, the purchase is
            refunded in full on request.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">After your video is delivered</h2>
          <p className="mt-3">
            Once the private video link has been sent, the reading has been
            made and refunds are limited. If the video does not play, the link
            does not work, or the reading was not delivered as described,
            contact us — we will review the order and redeliver, repair, or
            refund when the reading was not delivered as promised.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">How to request a refund</h2>
          <ol className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-3">
              <strong>Reply to your Stripe receipt email</strong> with &ldquo;refund request&rdquo; in the subject line.
            </li>
            <li className="border-t border-[#14110d]/12 pt-3">
              Or email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>{" "}
              with the email address you used at checkout.
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
