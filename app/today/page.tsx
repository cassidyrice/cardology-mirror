import type { Metadata } from "next";

import TodayClient from "@/components/app/TodayClient";
import { AppFeaturePage } from "@/components/seo/AppFeaturePage";
import { SITE_NAME } from "@/lib/site";

const title = "Today's Cardology Calendar";
const description =
  "Cardology birth-card calendar for today: one of 52 playing cards. Same date → same card. Planetary timing, not a shuffle. Not tarot. A mirror, not a forecast.";

export const metadata: Metadata = {
  title: "Today's Cardology Calendar: Fixed Birth-Card Map",
  description,
  alternates: { canonical: "/today" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Today's Cardology Calendar: Fixed Birth-Card Map",
    description,
    url: "/today",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Today on the Cardology birth-card calendar",
      },
    ],
  },
  robots: { index: false, follow: true },
};

export default function TodayPage() {
  return (
    <AppFeaturePage
      title={title}
      description={description}
      canonicalPath="/today"
      eyebrow="Fixed birth-card map"
      note="Same date → same card."
      calculatorLabel="Free birth card calculator"
      showOffer={false}
      points={[
        "Same date → same card. A birthday lands on one of 52 playing cards, every year.",
        "Planetary timing for today sits on that card. A mirror, not a forecast. Not tarot.",
        "No birthday saved here? The free calculator names the card. A saved birthday adds today's timing.",
      ]}
    >
      <TodayClient />
    </AppFeaturePage>
  );
}
