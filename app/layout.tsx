import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsCapture } from "@/components/analytics/AnalyticsCapture";
import { READING_OFFERS } from "@/lib/products";
import { READINGS_PATH, SITE_URL, SITE_NAME, SITE_TAGLINE, VIDEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Keep child titles literal. The former automatic " | Card Blueprints"
  // suffix pushed 74 sitemap titles beyond 60 characters.
  title: "Card Blueprints | Cardology Readings & Birth Cards",
  description:
    "Personal video Cardology readings made from your birth date, plus a free birth card calculator, all 52 card meanings, compatibility tools, and practical Cardology guides.",
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
    title: "Card Blueprints — Cardology Readings & Birth Cards",
    description:
      "Personal Cardology readings from your birth card, plus the free calculator, all 52 card meanings, and compatibility tools — a mirror, not a forecast.",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  // No title/description here on purpose. A page that sets its own openGraph
  // does not set twitter, so a title pinned at this level would override the
  // page's real one on every card — 21 routes, including /readings and /try,
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
        publishingPrinciples: `${SITE_URL}/about`,
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          "@id": `${SITE_URL}/refund-policy#merchant-return-policy`,
          merchantReturnLink: `${SITE_URL}/refund-policy`,
        },
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
        makesOffer: READING_OFFERS.map((offer) => ({
          "@type": "Offer",
          price: offer.price,
          priceCurrency: "USD",
          // The indexable comparison section is the public offer URL.
          // /checkout/<slug> is a robots-disallowed review page; only its
          // explicit POST action creates a Stripe Checkout Session.
          url: `${SITE_URL}${READINGS_PATH}#${offer.slug}`,
          hasMerchantReturnPolicy: {
            "@id": `${SITE_URL}/refund-policy#merchant-return-policy`,
          },
          // These are reading services. Marking each one as a Product here
          // made Google expect a second nested offer, review, or rating.
          itemOffered: {
            "@type": "Service",
            name: offer.name,
            provider: { "@id": `${SITE_URL}/#organization` },
          },
        })),
        sameAs: [VIDEO_URL],
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
            url: VIDEO_URL,
            about: "Cardology birth cards, shadow readings, timing, famous-person examples, and relationship dynamics videos.",
          },
        ],
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/birth-card-calculator?birthdate={birthdate}`,
          "query-input": "required name=birthdate",
        },
      },
    ],
  };
  return (
    <html lang="en">
      <body className="bg-ink text-bone antialiased">
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
      </body>
    </html>
  );
}
