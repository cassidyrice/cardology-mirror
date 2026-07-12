import type { Metadata } from "next";

import { OfferCta } from "@/components/seo/OfferCta";

// App surface: not a content page. Keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Funnel exit below the onboarding flow: this surface previously had
          zero commerce links. It sits under the min-h-dvh screens, so it never
          interrupts the slides — it is there when a visitor scrolls. */}
      <div className="mx-auto w-full max-w-3xl px-5 pb-16">
        <OfferCta />
      </div>
    </>
  );
}
