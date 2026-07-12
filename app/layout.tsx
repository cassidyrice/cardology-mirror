import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, VIDEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Card Blueprints | Readings, Birth Card Calculator and Meanings",
    template: "%s | Card Blueprints",
  },
  description:
    "Personal Cardology readings from your birth card, plus the free birth card calculator, all 52 card meanings, compatibility tools, and the 52-card astrology system — a mirror, not a forecast.",
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Card Blueprints — Readings, Birth Card Calculator and Meanings",
    description:
      "Personal Cardology readings from your birth card, plus the free calculator, all 52 card meanings, and compatibility tools — a mirror, not a forecast.",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Card Blueprints — Readings, Birth Card Calculator and Meanings",
    description:
      "Personal Cardology readings from your birth card, plus the free calculator, all 52 card meanings, and compatibility tools — a mirror, not a forecast.",
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
        makesOffer: [
          { "@type": "Offer", price: 29, priceCurrency: "USD", url: `${SITE_URL}/readings#basic-birth-card-report`, itemOffered: { "@type": "Product", name: "Basic Birth Card Report" } },
          { "@type": "Offer", price: 99, priceCurrency: "USD", url: `${SITE_URL}/readings#one-question-reading`, itemOffered: { "@type": "Product", name: "One-Question Personal Reading" } },
          { "@type": "Offer", price: 199, priceCurrency: "USD", url: `${SITE_URL}/readings#full-deep-dive`, itemOffered: { "@type": "Product", name: "Full Deep Dive Reading" } },
        ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-dvh w-full">{children}</div>
      </body>
    </html>
  );
}
