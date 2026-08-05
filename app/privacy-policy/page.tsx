import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn what Card Blueprints collects for the personal video reading, checkout, anonymous funnel analytics, free tools, retention, and privacy requests.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 29, 2026";

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
            <Link href="/" className="text-[#8e321f] underline underline-offset-4">
              cardblueprints.com
            </Link>
            . Questions about this policy can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">What we collect and why</h2>
          <div className="mt-3 space-y-4">
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Video reading purchase information</h3>
              <p className="mt-1">
                When you purchase a reading, checkout collects your name and
                email address, along with the payment time, amount, and
                checkout session. It also collects the birth date the reading
                is for and your optional focus question — the raw material
                your video is made from. Your email is used to deliver the
                private video link. Purchase information is not used for
                marketing, not shared with third parties for advertising, and
                not sold.
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">How your video is made</h3>
              <p className="mt-1">
                Each video reading is produced individually using AI writing,
                voice, and visual tools. The birth date and question you give
                at checkout are processed to create your reading. We do not
                keep a birth-date database — order details live in your Stripe
                receipt and our order records, as described below. Avoid
                sharing medical, legal, financial, account, or other sensitive
                information in your checkout question.
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
                  className="text-[#8e321f] underline underline-offset-4"
                >
                  Stripe
                </a>
                . We do not store your card number, CVV, or full payment details.
                Stripe's own privacy policy governs how they handle your payment
                data. From checkout we may receive your name, email address,
                amount paid, checkout session reference, and the birth date and
                focus question you entered for the reading.
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
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Privacy-conscious site analytics</h3>
              <p className="mt-1">
                We use Cloudflare Web Analytics for page traffic and performance,
                plus a first-party conversion event stream to understand whether
                visitors use the calculator, view the reading, begin checkout, or
                complete a purchase. The event stream
                uses a random identifier created for and reused only within the
                current browser tab. It does not store analytics cookies, birthdays, calculated
                cards, names, email addresses, phone numbers, full referrer URLs,
                IP addresses, or user-agent strings. Cloudflare retains these
                custom events for up to three months. If you begin checkout,
                the same random identifier and non-personal source labels may
                be attached to the Stripe Checkout Session solely to connect a
                completed purchase to the earlier funnel. Stripe may retain
                that checkout metadata under its own transaction-retention
                rules and privacy policy.
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">On-site reading pages</h3>
              <p className="mt-1">
                The on-site reading, story, and deep-dive pages are different:
                they send the birth date to our server so the text can be
                generated for it. That request is processed to build your
                response and is not saved to a database — we operate no birth
                date store. Standard Cloudflare request logs still apply, as
                described below.
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
            <li className="border-t border-[#14110d]/12 pt-2">To make your personal video reading from the birth date and question you gave at checkout.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To send your purchase confirmation and deliver your private video link by email.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To follow up on questions or support requests about a purchase, if you ask.</li>
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
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                Stripe Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Resend</strong> — transactional email delivery.{" "}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                Resend Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>AI providers</strong> — AI processing used to write, voice,
              and produce each video reading.
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Cloudflare</strong> — hosting and edge infrastructure.{" "}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                Cloudflare Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Cookies</h2>
          <p className="mt-3">
            Card Blueprints does not use advertising cookies and does not track
            you across other sites. Cloudflare may set security-related cookies
            (such as{" "}
            <code className="rounded bg-[#14110d]/8 px-1 py-0.5 text-sm">__cf_bm</code>) as
            part of bot protection.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">How long verified records are kept</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">Order records (including the birth date and question given at checkout): up to 400 days for support and accounting.</li>
            <li className="border-t border-brand-line pt-2">Tab-scoped conversion analytics: up to three months.</li>
            <li className="border-t border-brand-line pt-2">Stripe checkout attribution metadata: under Stripe&rsquo;s transaction-retention rules.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Your rights</h2>
          <p className="mt-3">
            You can request that we delete the information tied to your
            purchase at any time by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>{" "}
            with the email address you used at checkout. We will
            confirm deletion within a reasonable time, except for records we must
            keep for legal, tax, fraud, or payment-dispute reasons.
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
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

      </div>
    </SeoShell>
  );
}
