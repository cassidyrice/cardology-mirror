import type { Metadata } from "next";

import SelfClient from "@/components/app/SelfClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";
import { SITE_NAME } from "@/lib/site";

const title = "Cardology Blueprint";
const description =
  "Read the Cardology blueprint as a structured birth-card and ruling-card mirror: core pattern, gifts, shadow, life direction, and growth edge.";

export const metadata: Metadata = {
  title: "Cardology Blueprint: Birth Card and Ruling Card Reading",
  description,
  alternates: { canonical: "/self" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Blueprint: Birth Card and Ruling Card Reading",
    description,
    url: "/self",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  robots: { index: false, follow: true },
};

export default function SelfPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/self"
      eyebrow="Birth-card profile"
      points={[
        "See your birth card and planetary ruling card together.",
        "Use your saved birthday to return to the same personal card map.",
        "Read the traditional meanings, then consider what fits your experience.",
      ]}
    >
      <SelfClient />
    </AppFeaturePage>
  );
}
