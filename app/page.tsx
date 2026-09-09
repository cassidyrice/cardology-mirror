import type { Metadata } from "next";
import Link from "next/link";

import { LandingCalculator } from "@/components/seo/LandingCalculator";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

import "./landing.css";

const HOME_TITLE = "Find Your Birth Card | Card Blueprints";
const HOME_DESCRIPTION =
  "Your birthday adds up to one card. Same date, same card, every time. Type it in and see yours.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Card Blueprints — your birth card as a mirror",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og/default.png"],
  },
};

/** Today's card rotates daily; revalidate so HTML stays fresh for crawlers. */
export const revalidate = 86_400;

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center py-3 sm:py-6">
          <LandingCalculator />
          <p className="mt-6 text-center text-sm">
            <Link
              href="/explore"
              className="text-brand-ink-soft underline underline-offset-4 transition hover:text-brand-ink"
            >
              Explore →
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
