import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cardology Pro — Birth Card Calculator and Meanings",
    template: "%s · Cardology Pro",
  },
  description:
    "Find your Cardology birth card, browse all 52 birth card meanings, read educational guides, compare compatibility, and learn the 52-card astrology system. Mirror, not forecast.",
  applicationName: SITE_NAME,
  keywords: [
    "cardology",
    "birth card",
    "birth card calculator",
    "52 card astrology",
    "cardology blog",
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
      "Find your Cardology birth card, browse all 52 birth card meanings, read educational guides, compare compatibility, and learn the 52-card astrology system.",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Cardology Pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardology Pro — Birth Card Calculator and Meanings",
    description:
      "Find your Cardology birth card, browse all 52 birth card meanings, read educational guides, compare compatibility, and learn the 52-card astrology system.",
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
        "@id": `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#org` },
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
