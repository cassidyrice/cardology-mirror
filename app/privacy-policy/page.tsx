import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy | Card Blueprints",
  description:
    "Learn what Card Blueprints collects for personalized reports, checkout, analytics, free tools, and privacy requests.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = "August 8, 2026";

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
            offer personalized Cardology reports, digital products when
            available, and free birth card tools at{" "}
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
              <h3 className="font-bold text-[#14110d]">Personal Card Blueprint information</h3>
              <p className="mt-1">
                Stripe Checkout collects the buyer&rsquo;s email address and the birth
                date entered for the Personal Card Blueprint. The birth date is
                used to generate the deterministic report and is included in a
                signed access token sent in the transactional email. We do not
                maintain a separate customer birth-date database, but Stripe,
                Resend, and Cloudflare may process the checkout field, email link,
                or request URL under their retention and logging policies.
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Legacy phone-order information</h3>
              <p className="mt-1">
                Phone-reading products are no longer sold. For purchases made
                before retirement, order and access records may include the
                buyer&rsquo;s name, email address, phone number, payment time,
                amount, and checkout session. These records are retained only
                for the original access window, support, accounting, disputes,
                and legal obligations. They are not used for marketing or sold.
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
                the Blueprint birth date, amount paid, and checkout session
                reference. Historical orders may retain the phone number that
                was collected when those products were available.
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
              <h3 className="font-bold text-[#14110d]">Free course and email list</h3>
              <p className="mt-1">
                When you request the free Read Your Birth Card course, we collect
                the name and email address you submit. We use them to create a
                Resend contact, deliver your signed course access link, and send
                occasional Card Blueprints educational or product emails under
                the consent shown on the signup form. You can unsubscribe from
                marketing emails at any time.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Privacy-conscious site analytics</h3>
              <p className="mt-1">
                We use Cloudflare Web Analytics for page traffic and performance,
                plus a first-party conversion event stream to understand whether
                visitors use the calculator, view the Blueprint offer, begin
                checkout, or complete a purchase. The event stream
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
              <p className="mt-3">
                We also use Google Analytics 4 (GA4) to measure aggregate traffic
                and conversion events across the main site and compatibility
                pages. GA4 may set Google analytics cookies and process standard
                device and usage signals. We configure the tag with IP anonymization
                where available, disable automatic first-hit pageviews in favor of
                path-based SPA pageviews, and strip sensitive query parameters
                (such as access tokens, emails, and birth dates) before they are
                sent as page locations. We do not intentionally send names,
                emails, phone numbers, birth dates, or signed access tokens to
                Google. Google&rsquo;s processing is governed by the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8e321f] underline underline-offset-4"
                >
                  Google Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8e321f] underline underline-offset-4"
                >
                  How Google uses information from sites that use its services
                </a>
                .
              </p>
            </div>
            <div className="border-t border-[#14110d]/12 pt-4">
              <h3 className="font-bold text-[#14110d]">Elroy micro-reading</h3>
              <p className="mt-1">
                Elroy is an on-site chat guide. After you see your free birth
                card, you may choose to request a short personalized micro-reading.
                That request sends the birth date you enter to our server for one
                response only so the reading can be built. We do not keep an
                application birth-date database. We collect the email you submit,
                with your consent, to add you to the Card Blueprints contact list,
                show the reading in chat, and email you a copy. Resend delivers
                that message and future educational or product emails you opt into.
                Analytics events for Elroy do not include birth date, card, or
                email.
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
            <li className="border-t border-[#14110d]/12 pt-2">To generate and deliver the Personal Card Blueprint and its signed return link.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To send your purchase confirmation and start-here instructions by email.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To deliver the free course and, when you explicitly request it, send occasional Card Blueprints educational and product emails.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To support and honor legacy phone orders during their original access windows.</li>
            <li className="border-t border-[#14110d]/12 pt-2">To follow up on questions or support requests about a purchase, if you ask.</li>
          </ul>
          <p className="mt-4">
            We do not send marketing emails unless you explicitly opt in, build
            advertising profiles, or share data with data brokers.
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
              <strong>Resend</strong> — transactional email delivery and management of contacts who request the free course.{" "}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                Resend Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>xAI</strong> — AI processing for legacy voice orders that
              remain within their original access windows.{" "}
              <a href="https://x.ai/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                xAI Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Cloudflare</strong> — hosting and edge infrastructure.{" "}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                Cloudflare Privacy Policy
              </a>
            </li>
            <li className="border-t border-[#14110d]/12 pt-2">
              <strong>Google Analytics</strong> — aggregate website analytics.{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#8e321f] underline underline-offset-4">
                Google Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Cookies</h2>
          <p className="mt-3">
            Card Blueprints does not use advertising cookies and does not track
            you across other sites for advertising. Google Analytics may set its
            own first-party analytics cookies (for example{" "}
            <code className="rounded bg-[#14110d]/8 px-1 py-0.5 text-sm">_ga</code>
            ) to distinguish sessions. Cloudflare may set security-related cookies
            (such as{" "}
            <code className="rounded bg-[#14110d]/8 px-1 py-0.5 text-sm">__cf_bm</code>) as
            part of bot protection. Our first-party conversion stream does not
            set its own analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">How long verified records are kept</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-[#14110d]/12 pt-2">Legacy voice access profiles: through the original purchased window, up to 90 days; no new profiles are created.</li>
            <li className="border-t border-[#14110d]/12 pt-2">Order records: up to 400 days for support and accounting.</li>
            <li className="border-t border-brand-line pt-2">Tab-scoped conversion analytics: up to three months.</li>
            <li className="border-t border-brand-line pt-2">Google Analytics data: under Google&rsquo;s Analytics data-retention settings for the Card Blueprints property.</li>
            <li className="border-t border-brand-line pt-2">Stripe checkout attribution metadata: under Stripe&rsquo;s transaction-retention rules.</li>
            <li className="border-t border-brand-line pt-2">Free-course subscriber contacts: until you unsubscribe or request deletion, subject to records we must retain for legal or abuse-prevention reasons.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#14110d]">Your rights</h2>
          <p className="mt-3">
            You can request that we delete the information tied to your
            purchase or free-course signup at any time by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#8e321f] underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>{" "}
            with the email address used at checkout and, for a legacy phone
            order, the original checkout phone number. We will
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
