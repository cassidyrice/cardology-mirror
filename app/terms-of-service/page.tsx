import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Card Blueprints, its AI voice guide, tools, reports, and readings.",
  alternates: { canonical: "/terms-of-service" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 12, 2026";

export default function TermsOfService() {
  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Terms of Service", href: "/terms-of-service" },
      ]}
    >
      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Legal</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-[#5b5148]">Last updated: {UPDATED}</p>
      </header>

      <div className="max-w-3xl space-y-8 text-base leading-relaxed text-[#3d352d]">
        <section className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
          <p className="font-serif text-lg text-[#14110d]">
            Card Blueprints is for learning, reflection, and entertainment. By
            using the site or buying a product, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">What the service is</h2>
          <p className="mt-3">
            Card Blueprints offers free Cardology tools, written reports, human-written
            deep dives, and a paid AI voice guide. Card lookups use fixed formulas and
            tables. Meanings and spoken explanations are interpretations.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">AI voice guide</h2>
          <p className="mt-3">
            The $99 phone product is delivered by an AI voice guide, not a human reader.
            AI wording can be incomplete or wrong even when the card lookup is correct.
            Check important facts for yourself and do not rely on the guide as your only
            source for an important decision.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Paid access and delivery</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">
              Prices and delivery methods are shown before checkout.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              AI voice access is tied to the phone number used at checkout and lasts 90 days.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Written products need correct birth details and contact information from you.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Do not share paid access, misuse the phone line, or try to bypass payment or security checks.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Refunds and privacy</h2>
          <p className="mt-3">
            The <Link href="/refund-policy" className="text-[#9e3d24] underline underline-offset-4">refund policy</Link>
            {" "}explains when refunds are available. The{" "}
            <Link href="/privacy-policy" className="text-[#9e3d24] underline underline-offset-4">privacy policy</Link>
            {" "}explains what information is collected and why.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Not professional advice</h2>
          <p className="mt-3">
            Card Blueprints does not provide medical, mental-health, legal, financial,
            employment, or other professional advice. Do not use a reading to diagnose
            a person, predict harm, or make a high-stakes decision for someone else.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Your responsibility</h2>
          <p className="mt-3">
            Give only information you have the right to share. If you discuss another
            person, avoid private or sensitive details. You are responsible for how you
            use the site and any choices you make after a reading.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Availability</h2>
          <p className="mt-3">
            We work to keep the site and phone service available, but we cannot promise
            that they will always be online or error-free. Contact us if a paid service
            does not work as described.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Contact</h2>
          <p className="mt-3">
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#9e3d24] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </SeoShell>
  );
}
