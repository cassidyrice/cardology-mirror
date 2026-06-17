import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "Cardology Internal Reference",
  description:
    "This internal Cardology reference has moved out of the public SEO index. Read the public Shadow and Karma Guide instead.",
  alternates: { canonical: "/shadow-karma-guide" },
  robots: { index: false, follow: true },
};

export default function CardologyAgentInstructionsPage() {
  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Shadow & Karma Guide", href: "/shadow-karma-guide" },
      ]}
    >
      <p className="oracle-eyebrow mb-4">Reference moved</p>
      <h1 className="display text-4xl leading-none text-[#14110d] sm:text-5xl">
        Cardology shadow and karma guidance now lives in a public guide.
      </h1>
      <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d]">
        The old working-session instruction document is no longer part of the public SEO
        structure. For human-readable definitions of shadow, alignment, support karma,
        challenge karma, environment, and displacement, use the public guide.
      </p>
      <Link href="/shadow-karma-guide" className="ink-button large-button mt-7 inline-flex">
        Read the Shadow & Karma Guide
      </Link>
    </SeoShell>
  );
}
