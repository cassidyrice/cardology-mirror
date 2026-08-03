import type { Metadata } from "next";
import Link from "next/link";

import { AccessLink } from "@/components/gate/AccessLink";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Open your reading access",
  description:
    "Activate the reading access link from your purchase email, or find your free birth card and compare paid readings.",
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Open your reading access",
    description: metadata.description,
    url: `${SITE_URL}/access`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <main className="mx-auto min-h-[60vh] max-w-lg px-6 pt-24 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-mist">
        Card Blueprints
      </p>
      <h1 className="display mt-3 text-center text-3xl text-bone">
        Open your reading access
      </h1>
      <p className="mt-4 text-center text-sm leading-relaxed text-mist">
        Use the secure link from your purchase email to unlock the reading you
        already paid for. If that link is missing or incomplete, you can still
        enter with the access code from the same email — or start free with your
        birth card.
      </p>
      <p className="mt-3 text-center text-sm leading-relaxed text-mist">
        This page never takes payment and never asks for card details. It only
        opens access you already own, or points you to the free birth-card
        calculator and the readings page if you still need to choose a reading.
        If something looks wrong with a receipt, contact support with the email
        and phone number used at checkout. Keep the purchase email handy so you
        can reopen the original access link or enter the access code without
        any guessing.
      </p>
      <AccessLink />
      <nav
        aria-label="Helpful next steps"
        className="mt-10 border-t border-white/10 pt-8 text-center"
      >
        <p className="text-xs uppercase tracking-[0.12em] text-mist">
          Need another path?
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <Link
              href="/birth-card-calculator"
              className="text-bone underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Find your birth card free
            </Link>
          </li>
          <li>
            <Link
              href="/readings"
              className="text-bone underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Compare the paid readings
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className="text-bone underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Contact support about a purchase
            </Link>
          </li>
          <li>
            <Link
              href="/refund-policy"
              className="text-bone underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              Read the refund policy
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
