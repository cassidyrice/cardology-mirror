import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Card Blueprints collects and uses your information.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 3, 2026";
const CONTACT_EMAIL = "therealcassrice@gmail.com";

export default function PrivacyPolicy() {
  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Privacy Policy", href: "/privacy-policy" },
      ]}
    >
      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Legal</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-[#5b5148]">Last updated: {UPDATED}</p>
      </header>

      <div className="prose max-w-3xl space-y-8 text-base leading-relaxed text-[#3d352d]">

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Who we are</h2>
          <p className="mt-3">
            Card Blueprints is operated by Cassidy Rice (Cassidy Rice Company). We
            offer personal Cardology readings and free birth card tools at{" "}
            <Link href="/" className="text-[#9e3d24] underline underline-offset-4">
              cardologypro.com
            </Link>
            . Questions about this policy can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#9e3d24] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">What we collect and why</h2>
          <div className="mt-3 space-y-4">
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Reading intake information</h3>
              <p className="mt-1">
                When you purchase a reading, you submit your email address, one
                or more birth dates, and a question or focus. This information
                is used solely to prepare and deliver your reading. It is not
                used for marketing, not shared with third parties for advertising,
                and not sold.
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Payment information</h3>
              <p className="mt-1">
                Payments are processed by{" "}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9e3d24] underline underline-offset-4"
                >
                  Stripe
                </a>
                . We do not store your card number, CVV, or full payment details.
                Stripe's own privacy policy governs how they handle your payment
                data. We receive only your email address and the amount paid.
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Free tools</h3>
              <p className="mt-1">
                The birth card calculator, compatibility calculator, and period
                tools run entirely in your browser. No birth date you enter into
                these tools is transmitted to our servers or stored.
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Server logs</h3>
              <p className="mt-1">
                Our hosting infrastructure (Cloudflare) may log standard
                technical data such as IP addresses and request metadata for
                security and performance purposes. These logs are governed by
                Cloudflare's privacy policy.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">How we use your information</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">To prepare and deliver the reading you purchased.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To send you the finished reading by email.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To follow up on questions or clarifications about a delivered reading, if you ask.</li>
          </ul>
          <p className="mt-4">
            We do not use your information to send unsolicited marketing emails,
            build advertising profiles, or share data with data brokers.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Third-party services</h2>
          <p className="mt-3">
            We use the following services whose privacy policies apply to data
            they process on our behalf:
          </p>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Stripe</strong> — payment processing.{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#9e3d24] underline underline-offset-4">
                Stripe Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Resend</strong> — transactional email delivery.{" "}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#9e3d24] underline underline-offset-4">
                Resend Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Cloudflare</strong> — hosting and edge infrastructure.{" "}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#9e3d24] underline underline-offset-4">
                Cloudflare Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Cookies</h2>
          <p className="mt-3">
            Card Blueprints does not use tracking cookies or advertising cookies.
            Cloudflare may set security-related cookies (such as{" "}
            <code className="rounded bg-[#14110d]/8 px-1 py-0.5 text-sm">__cf_bm</code>) as
            part of bot protection. These are functional, not advertising.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Your rights</h2>
          <p className="mt-3">
            You can request that we delete the information you provided with
            your reading intake at any time by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#9e3d24] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>{" "}
            with the email address you used at checkout. We will confirm deletion
            within a reasonable time.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Changes to this policy</h2>
          <p className="mt-3">
            If we make material changes to this policy, we will update the date
            at the top. Continued use of the site after a change constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Contact</h2>
          <p className="mt-3">
            Privacy questions:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#9e3d24] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

      </div>
    </SeoShell>
  );
}
