import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { FAIR_USE_COPY } from "@/lib/offers";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service | Card Blueprints",
  description: "Terms for Card Blueprints reports, digital products, AI voice readings, and free Cardology tools.",
  alternates: { canonical: "/terms-of-service" },
  robots: { index: true, follow: true },
};

const UPDATED = "August 6, 2026";

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
        <section className="border border-[#14110d]/15 bg-[#efe8dc]/70 p-5">
          <p className="font-serif text-lg text-[#14110d]">
            Card Blueprints is for learning, reflection, and entertainment. By
            using the site or buying a product, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">What the service is</h2>
          <p className="mt-3">
            Card Blueprints offers free Cardology tools and educational pages,
            an instant personalized Cardology report, a digital e-book, and
            optional paid voice readings delivered by phone. Card lookups use
            fixed formulas and tables — the same birthday always produces the
            same card. Cardology is an esoteric reflection framework;
            interpretations are not facts about you.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">The reader is AI</h2>
          <p className="mt-3">
            Every paid voice reading and the free first-card preview are delivered
            by an AI voice reader, not a human. The Personal Card Blueprint is a
            written deterministic report, not a voice call. AI voice wording can be incomplete or
            wrong even when the card lookup is correct. Check important facts
            for yourself and do not rely on the reader as your only source for
            an important decision.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Paid products</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Personal Card Blueprint ($29)</strong> — one instant
              personalized written report generated from the birth date entered
              at checkout, with a signed return link sent by email.
            </li>

            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Quick Question ($19)</strong> — one single paid voice
              session of up to 5 minutes. Start it within 30 days of purchase.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Complete Reading ($39)</strong> — one single paid voice
              session of up to 15 minutes. Start it within 30 days of purchase.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>90-Day Season Pass ($199)</strong> — a one-time purchase
              covering unlimited personal return calls for 90 days, up to 15
              minutes per session, one active session at a time. The pass does
              not automatically renew and is subject to the fair-use rules
              below.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Voice-reading access is tied to the phone number used at checkout.
              Blueprint access uses its private signed report link; do not share it.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Do not share paid access, misuse the phone line, or try to bypass
              payment or security checks.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Season Pass fair use</h2>
          <p className="mt-3">{FAIR_USE_COPY}</p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Refunds and privacy</h2>
          <p className="mt-3">
            The <Link href="/refund-policy" className="text-[#8e321f] underline underline-offset-4">refund policy</Link>
            {" "}explains when refunds are available. The{" "}
            <Link href="/privacy-policy" className="text-[#8e321f] underline underline-offset-4">privacy policy</Link>
            {" "}explains what information is collected and why.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Not professional advice</h2>
          <p className="mt-3">
            Card Blueprints does not provide medical, mental-health, legal,
            financial, employment, or other professional advice, and no reading
            predicts or guarantees any outcome. Do not use a reading to
            diagnose a person, predict harm, or make a high-stakes decision for
            someone else.
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
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </SeoShell>
  );
}
