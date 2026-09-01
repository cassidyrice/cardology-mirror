import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AnalyticsCapture } from "@/components/analytics/AnalyticsCapture";
import { GoogleAnalyticsBoundary } from "@/components/analytics/GoogleAnalyticsBoundary";
import { PostHogBoundary } from "@/components/analytics/PostHogBoundary";
import { ElroyLauncher } from "@/components/elroy/ElroyLauncher";
import { resolveGaMeasurementId } from "@/lib/ga4";
import { resolvePosthogHost, resolvePosthogKey } from "@/lib/posthog";
import { merchantReturnPolicy } from "@/lib/product-schema";
import { CONTACT_EMAIL, SITE_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// Geometric sans for the brand wordmark only (--font-logo in globals.css).
const logoFont = Montserrat({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-logo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Keep child titles literal. The former automatic " | Card Blueprints"
  // suffix pushed 74 sitemap titles beyond 60 characters.
  title: "Card Blueprints | Birth Cards & Cardology",
  description:
    "Free birth card calculator (playing cards, not tarot), 52 meanings, compatibility, and the instant $9 Deep Dive.",
  icons: { icon: "/icon.svg" },
  applicationName: SITE_NAME,
  keywords: [
    "cardology",
    "cardology reading",
    "birth card reading",
    "birth card",
    "birth card calculator",
    "52 card astrology",
    "cardology blog",
    "cardology videos",
    "cardology meanings",
    "cardology compatibility",
    "ruling card",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Card Blueprints — Birth Cards & Cardology",
    description:
      "Find your playing-card birth card free (not tarot). Optional $9 Deep Dive — a mirror, not a forecast.",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  // No title/description here on purpose. A page that sets its own openGraph
  // does not set twitter, so a title pinned at this level would override the
  // page's real one on every card and long-tail route.
  // shared the homepage title. Omitting them lets Twitter fall back to og:*.
  twitter: {
    card: "summary_large_image",
    images: ["/og/default.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/og/default.png` },
        description: SITE_TAGLINE,
        email: CONTACT_EMAIL,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT_EMAIL,
          url: `${SITE_URL}/contact`,
        },
        publishingPrinciples: `${SITE_URL}/editorial-policy`,
        // Full return-policy object lives here for Organization identity.
        // Product/Offer markup belongs only on /products/* pages — global
        // makesOffer Products missing image/availability/shipping are what
        // Search Console flags as invalid merchant listings.
        hasMerchantReturnPolicy: merchantReturnPolicy(),
        knowsAbout: [
          "Cardology",
          "birth cards",
          "52-card astrology",
          "playing card symbolism",
          "Cardology compatibility",
          "52-day periods",
          "relationship dynamics",
          "public figure birth card profiles",
        ],
        sameAs: [`${SITE_URL}/videos`],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
        hasPart: [
          {
            "@type": "WebSite",
            name: "Card Blueprints Videos",
            url: `${SITE_URL}/videos`,
            about: "Cardology birth cards, shadow readings, timing, famous-person examples, and relationship dynamics videos.",
          },
        ],
      },
    ],
  };
  const gaMeasurementId = resolveGaMeasurementId();
  const posthogKey = resolvePosthogKey();
  const posthogHost = resolvePosthogHost();

  return (
    <html lang="en" className={logoFont.variable}>
      <body className="bg-ink text-bone antialiased">
        <GoogleAnalyticsBoundary measurementId={gaMeasurementId} />
        <PostHogBoundary apiKey={posthogKey} host={posthogHost} />
        <AnalyticsCapture />
        {/* Literal tag instead of metadata `alternates.types`: React hoists
            <link> into <head>, so the feed stays discoverable on every page.
            Pages that set their own `alternates` (canonical) shallow-replace
            a layout-level alternates.types, which silently dropped this. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} — Cardology Blog`}
          href={`${SITE_URL}/feed.xml`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-dvh w-full">{children}</div>
        <ElroyLauncher />
      </body>
    </html>
  );
}
