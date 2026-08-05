import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Card Blueprints, its personal video readings, and free Cardology tools.",
  alternates: { canonical: "/terms-of-service" },
  robots: { index: true, follow: true },
};

const UPDATED = "August 5, 2026";

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
            using the site or buying a reading, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">What the service is</h2>
          <p className="mt-3">
            Card Blueprints offers free Cardology tools and educational pages,
            plus one paid reading: a personally-made video reading delivered by
            email. Card lookups use fixed formulas and tables — the same
            birthday always produces the same card. Cardology is an esoteric
            reflection framework; meanings and spoken explanations are
            interpretations, not facts about you.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Made with AI</h2>
          <p className="mt-3">
            Each video reading is written and voiced with AI and produced
            individually for the person who ordered it — not read live by a
            human. AI wording can be incomplete or wrong even when the card
            lookup is correct. Check important facts for yourself and do not
            rely on a reading as your only source for an important decision.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">The paid reading</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Personal Video Reading ($99)</strong> — one
              personally-made video reading, at least five minutes long, made
              from the birth date (and optional question) you enter at
              checkout and delivered as a private video link to your checkout
              email within 48 hours.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              One payment buys one video. There is no subscription and nothing
              renews automatically.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Give only information you have the right to share at checkout.
              If the reading is for another person, avoid private or sensitive
              details in your question.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Do not try to bypass payment or security checks, or misuse the
              private delivery links.
            </li>
          </ul>
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
            We work to keep the site available and to deliver every video inside
            the promised window, but we cannot promise that the site will always
            be online or error-free. Contact us if a paid service is not
            delivered as described.
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
