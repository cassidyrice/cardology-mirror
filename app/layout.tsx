import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, VIDEO_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cardology Pro | Birth Card Calculator and Meanings",
    template: "%s | Cardology Pro",
  },
  description:
    "Find your Cardology birth card, explore all 52 card meanings, compare compatibility, and learn the 52-card astrology system as a mirror, not a forecast.",
  applicationName: SITE_NAME,
  keywords: [
    "cardology",
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
    title: "Cardology Pro — Birth Card Calculator and Meanings",
    description:
      "Find your Cardology birth card, explore all 52 card meanings, compare compatibility, and learn the 52-card astrology system as a mirror, not a forecast.",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Cardology Pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardology Pro — Birth Card Calculator and Meanings",
    description:
      "Find your Cardology birth card, explore all 52 card meanings, compare compatibility, and learn the 52-card astrology system as a mirror, not a forecast.",
    images: ["/og/default.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
          "self-reflection",
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
            name: "Cardology Pro Videos",
            url: VIDEO_URL,
            about: "Cardology birth cards, shadow readings, timing, and self-reflection videos.",
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
