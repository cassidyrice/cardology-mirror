import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "Cardology Internal Reference",
  description:
    "Cardology shadow, alignment, support karma, challenge karma, environment, and displacement definitions now live in the Shadow and Karma Guide.",
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
        Shadow and karma guidance now lives in the guide.
      </h1>
      <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d]">
        For clear definitions of shadow, alignment, support karma, challenge karma,
        environment, and displacement, use the Shadow and Karma Guide.
      </p>
      <Link href="/shadow-karma-guide" className="ink-button large-button mt-7 inline-flex">
        Read the Shadow & Karma Guide
      </Link>
    </SeoShell>
  );
}
