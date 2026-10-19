import type { Metadata } from "next";

import { SeoShell } from "@/components/seo/SeoShell";
import { AccessLink } from "@/components/gate/AccessLink";

export const metadata: Metadata = {
  title: "Open your reading access",
  description: "Activate the reading access link from your purchase email.",
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  return (
    <SeoShell crumb={[{label:"Home",href:"/"},{label:"Reading access",href:"/access"}]}><div className="blueprint-access mx-auto max-w-lg py-12">
      <h1 className="display text-center text-3xl text-brand-ink">Card Blueprints</h1>
      <AccessLink />
    </div></SeoShell>
  );
}
