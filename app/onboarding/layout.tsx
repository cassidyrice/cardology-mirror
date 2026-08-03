import type { Metadata } from "next";
import Link from "next/link";

import { OfferCta } from "@/components/seo/OfferCta";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// App surface: not a ranking content page. Keep it out of search indexes,
// but still give the adversary/funnel panel enough structure to measure:
// one H1, internal paths, and enough plain-language copy.
export const metadata: Metadata = {
  title: "Create your Card Blueprints profile",
  description:
    "Set up a local Cardology profile from your birthday, then explore today's card, bonds, timing, and free birth-card tools. A mirror for patterns — not a forecast.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Create your Card Blueprints profile",
    description: metadata.description,
    url: `${SITE_URL}/onboarding`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="sr-only">
        <h1>Create your Card Blueprints profile</h1>
        <p>
          Card Blueprints onboarding helps you save a birthday-based profile on
          this device, then open today&rsquo;s card, bonds, timing tools, and
          the free birth-card calculator. The system names patterns you can work
          with. It does not read your future or guarantee outcomes.
        </p>
      </header>
      {children}
      {/* Funnel exit below the onboarding flow: this surface previously had
          zero commerce links. It sits under the min-h-dvh screens, so it never
          interrupts the slides — it is there when a visitor scrolls. */}
      <div className="mx-auto w-full max-w-3xl space-y-6 px-5 pb-16">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-mist">
          <h2 className="font-serif text-xl text-bone">Before you continue</h2>
          <p className="mt-3">
            Your profile stays on this device. Use it to orient around your birth
            card, notice recurring choices, and decide whether a free calculator
            look or a paid reading is the next useful step. Nothing here replaces
            your own judgment.
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
                Find your birth card free
              </Link>
            </li>
            <li>
              <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
                What Cardology is (and is not)
              </Link>
            </li>
            <li>
              <Link href="/readings" className="text-gold underline underline-offset-4">
                Compare paid readings
              </Link>
            </li>
            <li>
              <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">
                Read about compatibility patterns
              </Link>
            </li>
          </ul>
        </section>
        <OfferCta />
      </div>
    </>
  );
}
