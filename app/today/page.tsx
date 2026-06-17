import type { Metadata } from "next";

import TodayClient from "@/components/app/TodayClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";

const title = "Daily Card Reading";
const description =
  "Use Cardology Pro's daily card reading to reflect on today's active card, birth-card lens, ruling-card lens, and a grounded prompt. It is a mirror for pattern recognition, not a forecast.";

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
        "A secondary tool for how Cardology Pro treats a daily card as reflection, not prediction.",
        "A personalized daily card view when a local profile exists on this device.",
        "A direct path to create a profile without sending returning visitors away from the website.",
      ]}
    >
      <TodayClient />
    </AppFeaturePage>
  );
}
