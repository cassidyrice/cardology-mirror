import type { Metadata } from "next";

import { LiveDashboard } from "@/components/ops/LiveDashboard";

export const metadata: Metadata = {
  title: "Live · Card Blueprints ops",
  robots: { index: false, follow: false, nocache: true },
};

/** Private live funnel board. Needs ?t=<LIVE_DASH_TOKEN> once; the token is kept in sessionStorage. */
export default function OpsLivePage() {
  return <LiveDashboard />;
}
