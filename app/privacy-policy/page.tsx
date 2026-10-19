import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyChoices } from "@/components/privacy/PrivacyChoices";
import { SeoShell } from "@/components/seo/SeoShell";
import { CONTACT_EMAIL } from "@/lib/site";

import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy | Card Blueprints",
  description:
    "Learn what Card Blueprints collects for personalized reports, checkout, analytics, free tools, and privacy requests.",
  alternates: { canonical: "/privacy-policy" },
  robots: { index: true, follow: true },
};

const UPDATED = PAGE_UPDATED_DATES["/privacy-policy"];

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
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-brand-ink-soft">Last updated: {updatedLabel(UPDATED)}</p>
      </header>

      <div className="prose max-w-3xl space-y-8 text-base leading-relaxed text-brand-ink">

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Who we are</h2>
          <p className="mt-3">
            Card Blueprints is operated by Cassidy Rice (Cassidy Rice Company). We
            offer personalized Cardology reports, digital products when
            available, and free birth card tools at{" "}
            <Link href="/" className="text-brand-oxblood underline underline-offset-4">
              cardblueprints.com
            </Link>
            . Questions about this policy can be sent to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-oxblood underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">What we collect and why</h2>
          <div className="mt-3 space-y-4">
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Chemistry Check orders</h3>
              <p className="mt-1">
                The Chemistry Check is sold through Stan Store. Stan collects the
                buyer&rsquo;s name, email address and the birth dates you enter,
                and processes the payment. Cass uses those details to prepare your
                reading and email it to you, and to answer your follow-up
                questions. Stan&rsquo;s own privacy policy governs its checkout.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Past orders placed on this site</h3>
              <p className="mt-1">
                Orders placed on this site before October 2026 (including the One
                Question Reading) used Stripe Checkout, which collected the
                buyer&rsquo;s email address. The birth
                date and the question you type before checkout travel with the
                Stripe session as metadata and are used to write your reading
                and to email it to you. Past 52xSeven Blueprint sign-in links
                keep working; that signed token carries your email address, the
                birth date, and an expiry. We do not maintain a separate
                customer database of birth dates or questions, but Stripe
                keeps them on the checkout record, and Stripe, Resend,
                and Cloudflare may process the checkout field, email link, or
                request URL under their retention and logging policies.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Legacy phone-order information</h3>
              <p className="mt-1">
                Phone-reading products are no longer sold. For purchases made
                before retirement, order and access records may include the
                buyer&rsquo;s name, email address, phone number, payment time,
                amount, and checkout session. These records are retained only
                for the original access window, support, accounting, disputes,
                and legal obligations. They are not used for marketing or sold.
              </p>
            </div>

            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Payment information</h3>
              <p className="mt-1">
                Payments are processed by{" "}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-oxblood underline underline-offset-4"
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
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Free tools</h3>
              <p className="mt-1">
                The birth card calculator, compatibility calculator, and period
                tools run entirely in your browser. No birth date you enter into
                these tools is transmitted to our servers or stored.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">No email list</h3>
              <p className="mt-1">
                We no longer collect email addresses for a newsletter, course or
                chat. If you signed up before October 2026 (the free course, the
                Elroy chat or the newsletter), your name and email stay with Resend
                or Buttondown until you ask us to delete them, and you will not be
                sent marketing emails.
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
                  className="text-brand-oxblood underline underline-offset-4"
                >
                  Google Privacy Policy
                </a>{" "}
                and{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-oxblood underline underline-offset-4"
                >
                  How Google uses information from sites that use its services
                </a>
                .
              </p>
              <p className="mt-3">
                We also use PostHog for product analytics after you allow it.
                PostHog may set first-party analytics cookies. We load it only
                after you grant analytics consent, send path-only pageviews
                (no query strings), disable session replay, and strip emails,
                birth dates, and access tokens from event properties. We do
                not identify visitors by email. PostHog&rsquo;s processing is
                governed by the{" "}
                <a
                  href="https://posthog.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-oxblood underline underline-offset-4"
                >
                  PostHog Privacy Policy
                </a>
                .
              </p>
            </div>
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">On-site reading pages</h3>
              <p className="mt-1">
                The on-site reading, story, and deep-dive pages are different:
                they send the birth date to our server so the text can be
                generated for it. That request is processed to build your
                response and is not saved to a database — we operate no birth
                date store. Standard Cloudflare request logs still apply, as
                described below.
              </p>
            </div>
            <div className="border-t border-brand-line pt-4">
              <h3 className="font-bold text-brand-ink">Server logs</h3>
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
          <h2 className="font-serif text-2xl text-brand-ink">How we use your information</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-brand-line pt-2">To prepare your Chemistry Check from the birth dates you enter and email it to you (and to keep past report, sign-in, and download links working).</li>
            <li className="border-t border-brand-line pt-2">To send your purchase confirmation and start-here instructions by email.</li>
            <li className="border-t border-brand-line pt-2">To support and honor legacy phone orders during their original access windows.</li>
            <li className="border-t border-brand-line pt-2">To follow up on questions or support requests about a purchase, if you ask.</li>
          </ul>
          <p className="mt-4">
            We do not send marketing emails unless you explicitly opt in, build
            advertising profiles, or share data with data brokers.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Third-party services</h2>
          <p className="mt-3">
            We use the following services whose privacy policies apply to data
            they process on our behalf:
          </p>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-brand-line pt-2">
              <strong>Stripe</strong> — payment processing.{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Stripe Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>Stan Store</strong> — checkout and payment for the Chemistry Check.{" "}
              <a href="https://assets.stanwith.me/legal/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Stan Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>Resend</strong> — email delivery for past purchases, and contacts who signed up before October 2026.{" "}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Resend Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>xAI</strong> — AI processing for legacy voice orders that
              remain within their original access windows.{" "}
              <a href="https://x.ai/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                xAI Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>Cloudflare</strong> — hosting and edge infrastructure.{" "}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Cloudflare Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>Google Analytics</strong> — optional aggregate website analytics, loaded only after you allow it.{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Google Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>PostHog</strong> — optional product analytics, loaded only after you allow it. Session replay is off.{" "}
              <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                PostHog Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>YouTube</strong> — video thumbnails and playback embeds on the videos hub. YouTube may set cookies if you play a video.{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Google Privacy Policy
              </a>
            </li>
            <li className="border-t border-brand-line pt-2">
              <strong>Buttondown</strong> — holds the newsletter list of people who subscribed before October 2026.{" "}
              <a href="https://buttondown.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-oxblood underline underline-offset-4">
                Buttondown Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section id="privacy-choices">
          <h2 className="font-serif text-2xl text-brand-ink">Privacy choices</h2>
          <PrivacyChoices className="mt-3 text-sm" />
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Cookies</h2>
          <p className="mt-3">
            Card Blueprints does not use advertising cookies and does not track
            you across other sites for advertising. Google Analytics and PostHog
            load only after you allow analytics in{" "}
            <Link href="#privacy-choices" className="text-brand-oxblood underline underline-offset-4">
              Privacy choices
            </Link>
            . First-party conversion events stay in this browser tab
            (sessionStorage) and never include a birth date. Birth dates used
            to continue checkout are also tab-scoped sessionStorage — they are
            not written into URLs, prefetch requests, or analytics locations.
            Cloudflare may set security-related cookies (such as{" "}
            <code className="rounded bg-brand-ink/8 px-1 py-0.5 text-sm">__cf_bm</code>) as
            part of bot protection.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">How long verified records are kept</h2>
          <ul className="mt-3 space-y-2">
            <li className="border-t border-brand-line pt-2">Legacy voice access profiles: through the original purchased window, up to 90 days; no new profiles are created.</li>
            <li className="border-t border-brand-line pt-2">Order records: up to 400 days for support and accounting.</li>
            <li className="border-t border-brand-line pt-2">Tab-scoped conversion analytics: up to three months.</li>
            <li className="border-t border-brand-line pt-2">Google Analytics data: under Google&rsquo;s Analytics data-retention settings for the Card Blueprints property.</li>
            <li className="border-t border-brand-line pt-2">PostHog product analytics: under PostHog&rsquo;s data-retention settings for the Card Blueprints project.</li>
            <li className="border-t border-brand-line pt-2">Stripe checkout attribution metadata: under Stripe&rsquo;s transaction-retention rules.</li>
            <li className="border-t border-brand-line pt-2">Free-course subscriber contacts: until you unsubscribe or request deletion, subject to records we must retain for legal or abuse-prevention reasons.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Your rights</h2>
          <p className="mt-3">
            You can request that we delete the information tied to your
            purchase or past email signup at any time by emailing{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-oxblood underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>{" "}
            with the email address used at checkout and, for a legacy phone
            order, the original checkout phone number. We will
            confirm deletion within a reasonable time, except for records we must
            keep for legal, tax, fraud, or payment-dispute reasons.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Changes to this policy</h2>
          <p className="mt-3">
            If we make material changes to this policy, we will update the date
            at the top. Continued use of the site after a change constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-brand-ink">Contact</h2>
          <p className="mt-3">
            Privacy questions:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-oxblood underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

      </div>
    </SeoShell>
  );
}
