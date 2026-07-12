import type { Metadata } from "next";

import { AccessLink } from "@/components/gate/AccessLink";

export const metadata: Metadata = {
  title: "Open your reading access",
  description: "Activate the reading access link from your purchase email.",
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-lg px-6 pt-24">
      <h1 className="display text-center text-3xl text-bone">Card Blueprints</h1>
      <AccessLink />
    </main>
  );
}
