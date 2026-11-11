import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service | Card Blueprints",
  description:
    "Terms for The Card Blueprint Reading, 48-hour Reading Pass, past purchases, and free Cardology tools.",
  alternates: { canonical: "/terms-of-service" },
  robots: { index: true, follow: true },
};

const UPDATED = PAGE_UPDATED_DATES["/terms-of-service"];

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
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-brand-ink-soft">Last updated: {updatedLabel(UPDATED)}</p>
      </header>

      <div className="max-w-3xl space-y-8 text-base leading-relaxed text-brand-ink">
        <section className="border border-brand-line bg-brand-paper-deep p-5">
          <p className="font-serif text-lg text-brand-ink">
            Card Blueprints is for learning, reflection, and entertainment. By
            using the site or buying a product, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">What the service is</h2>
          <p className="mt-3">
            Card Blueprints offers free Cardology tools and educational pages,
            plus one personal written reading—The Card Blueprint Reading—sold
            directly on this site through embedded Stripe Checkout. Card lookups
            use fixed formulas and tables: the same birthday always produces the
            same card. Cardology is an esoteric reflection framework;
            interpretations are not facts about you.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Paid products</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-brand-line pt-2">
              <strong>The Card Blueprint Reading ($99)</strong> — a one-time
              purchase with no renewal. Immediately after payment you receive a
              download of the Suggested Questions Guide plus a 48-hour Reading
              Pass window from purchase to submit up to 3 questions per order
              (solo timing or two-person compatibility with a second birthday).
              Every submitted question is personally reviewed and approved by
              Cass and delivered privately by email or text message within 48
              hours (almost all in under 24 hours). Interpretive, not advice: it
              does not predict events and does not replace a professional.
            </li>
            <li className="border-t border-brand-line pt-2">
              Reading Pass links, sign-in links, and past report links use
              private signed URLs. Do not share paid access or try to bypass
              payment or security checks. Purchases of earlier or retired
              products (the Blueprint Report, Your Year Ahead, the Personal Card
              Blueprint, and earlier written readings) keep their existing access
              links and original terms.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Legacy orders</h2>
          <p className="mt-3">
            Phone-reading products are no longer sold. If you bought one before
            retirement, its original access period, support, and refund terms
            remain in effect. Contact support using the email and phone number
            from the original checkout so the order can be located.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Refunds and privacy</h2>
          <p className="mt-3">
            The <Link href="/refund-policy" className="text-brand-oxblood underline underline-offset-4">refund policy</Link>{" "}
            explains when refunds are available. The{" "}
            <Link href="/privacy-policy" className="text-brand-oxblood underline underline-offset-4">privacy policy</Link>{" "}
            explains what information is collected and why.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Not professional advice</h2>
          <p className="mt-3">
            Card Blueprints does not provide medical, mental-health, legal,
            financial, employment, or other professional advice, and no report
            predicts or guarantees any outcome. Do not use the site to diagnose
            a person, predict harm, or make a high-stakes decision for someone
            else.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Your responsibility</h2>
          <p className="mt-3">
            Give only information you have the right to share. If you enter
            another person&rsquo;s birth date, avoid adding private or sensitive
            details. You are responsible for how you use the site and any
            choices you make afterward.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Availability</h2>
          <p className="mt-3">
            We work to keep the site and paid report access available, but we
            cannot promise they will always be online or error-free. Contact us
            if a paid product does not work as described.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Contact</h2>
          <p className="mt-3">
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-oxblood underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </SeoShell>
  );
}
