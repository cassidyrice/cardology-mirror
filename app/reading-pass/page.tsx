import type { Metadata } from "next";
import Link from "next/link";

import { ReadingPassInteractivePanel } from "@/components/checkout/ReadingPassPortal";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { SUGGESTED_QUESTIONS_FILENAME, SUGGESTED_QUESTIONS_PDF_PATH } from "@/lib/suggested-questions";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your 48-Hour Reading Pass | Card Blueprints",
  description:
    "Download your Suggested Questions Guide and submit up to 3 questions within 48 hours of purchase for The Card Blueprint Reading.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReadingPassPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token.trim() : "";

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-main">
        <div className="wrap section-stack">
          <header className="measure">
            <p className="kicker">The Card Blueprint Reading · Private Pass</p>
            <h1 className="page-h1">Your 48-Hour Reading Pass</h1>
            <p className="lede">
              Download your Suggested Questions Guide below, or ask up to 3 questions in your own words over the 48 hours following purchase. Every answer is reviewed by Cass and delivered privately.
            </p>
          </header>

          {token ? (
            <ReadingPassInteractivePanel passToken={token} />
          ) : (
            <section className="qr-composer measure">
              <p className="qr-eyebrow">Private Link Required</p>
              <h2 className="qr-title">Open the Reading Pass link from your receipt.</h2>
              <p className="qr-sub">
                Right after checkout, we email (and text, if you chose SMS) your signed Reading Pass link so you can submit up to 3 questions within 48 hours.
              </p>
              <div className="qr-pass-actions qr-mt-3">
                <a
                  href={SUGGESTED_QUESTIONS_PDF_PATH}
                  download={SUGGESTED_QUESTIONS_FILENAME}
                  className="quiet-button"
                >
                  Download Suggested Questions (.pdf)
                </a>
                <Link href="/#readings" className="accent-button">
                  Book The Card Blueprint Reading — $99
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
