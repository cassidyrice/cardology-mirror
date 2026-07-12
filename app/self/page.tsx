import type { Metadata } from "next";

import SelfClient from "@/components/app/SelfClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Cardology Blueprint";
const description =
  "Read the Cardology blueprint as a structured birth-card and ruling-card mirror: core pattern, gifts, shadow, life direction, and growth edge.";

export const metadata: Metadata = {
  title: "Cardology Blueprint: Birth Card and Ruling Card Reading",
  description,
  alternates: { canonical: "/self" },
  openGraph: {
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
        "A secondary profile view after the public birth-card calculator and meaning pages.",
        "A personalized birth-card and ruling-card reading when a local profile is present.",
        "Clear language that frames the result as reflective structure rather than destiny.",
      ]}
    >
      <SelfClient />
    </AppFeaturePage>
  );
}
