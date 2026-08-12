import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service | Card Blueprints",
  description:
    "Terms for the Personal Card Blueprint, digital products, and free Cardology tools.",
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
            the Personal Card Blueprint, and digital products when explicitly
            marked available. Card lookups use fixed formulas and tables — the
            same birthday always produces the same card. Cardology is an
            esoteric reflection framework; interpretations are not facts about
            you.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Paid products</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Personal Card Blueprint ($13)</strong> — one instant
              personalized written report generated from the birth date entered
              at checkout, with a signed return link sent by email.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              Blueprint access uses a private signed report link. Do not share
              paid access or try to bypass payment or security checks.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Legacy orders</h2>
          <p className="mt-3">
            Phone-reading products are no longer sold. If you bought one before
            retirement, its original access period, support, and refund terms
            remain in effect. Contact support using the email and phone number
            from the original checkout so the order can be located.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Refunds and privacy</h2>
          <p className="mt-3">
            The <Link href="/refund-policy" className="text-[#8e321f] underline underline-offset-4">refund policy</Link>{" "}
            explains when refunds are available. The{" "}
            <Link href="/privacy-policy" className="text-[#8e321f] underline underline-offset-4">privacy policy</Link>{" "}
            explains what information is collected and why.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Not professional advice</h2>
          <p className="mt-3">
            Card Blueprints does not provide medical, mental-health, legal,
            financial, employment, or other professional advice, and no report
            predicts or guarantees any outcome. Do not use the site to diagnose
            a person, predict harm, or make a high-stakes decision for someone
            else.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Your responsibility</h2>
          <p className="mt-3">
            Give only information you have the right to share. If you enter
            another person&rsquo;s birth date, avoid adding private or sensitive
            details. You are responsible for how you use the site and any
            choices you make afterward.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Availability</h2>
          <p className="mt-3">
            We work to keep the site and paid report access available, but we
            cannot promise they will always be online or error-free. Contact us
            if a paid product does not work as described.
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
