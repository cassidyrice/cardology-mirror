import type { Metadata } from "next";

import TodayClient from "@/components/app/TodayClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Daily Card Reading";
const description =
  "Use Card Blueprints's daily card reading to understand today's active card, birth-card lens, ruling-card lens, pressure pattern, and grounded prompt.";

export const metadata: Metadata = {
  title: "Daily Card Reading: Your Cardology Card for Today",
  description,
  alternates: { canonical: "/today" },
  openGraph: {
    title: "Daily Card Reading: Your Cardology Card for Today",
    description,
    url: "/today",
  },
  robots: { index: false, follow: true },
};

export default function TodayPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/today"
      eyebrow="Personalized tool"
      points={[
        "A daily timing view for the card pattern active right now.",
        "A personalized daily card view when a local profile exists on this device.",
        "A direct path from today's card into your birth-card and ruling-card pattern.",
      ]}
    >
      <TodayClient />
    </AppFeaturePage>
  );
}
