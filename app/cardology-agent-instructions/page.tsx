import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "Cardology Agent Instructions — Shadow, Alignment & Karma Guide",
  description:
    "A markdown instructional guide for generating Cardology shadow patterns, alignment patterns, Challenge Karma meanings, Support Karma meanings, and 52-card shadow interpretations.",
  alternates: { canonical: "/cardology-agent-instructions" },
};

export default function CardologyAgentInstructionsPage() {
  const markdown = fs.readFileSync(
    path.join(process.cwd(), "public", "cardology-agent-instructions.md"),
    "utf8",
  );

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Cardology Agent Instructions", href: "/cardology-agent-instructions" },
      ]}
    >
      <div className="mb-8">
        <p className="eyebrow mb-2 text-gold">Cardology Pro reference</p>
        <h1 className="display mb-3 text-3xl text-bone">
          Cardology Agent Instructions: Shadow, Alignment & Karma Guide
        </h1>
        <p className="prose-reading text-mist">
          This page preserves the full markdown instructional document from the working session, including the established shadow/alignment phrasing, Challenge and Support Karma meanings, special-card handling, January and February examples, and the 52-card shadow guide.
        </p>
        <p className="mt-4">
          <Link
            href="/cardology-agent-instructions.md"
            className="rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink"
          >
            Open the raw Markdown document →
          </Link>
        </p>
      </div>

      <article className="card-surface rounded-2xl p-5 sm:p-8">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-mist">
          {markdown}
        </pre>
      </article>
    </SeoShell>
  );
}
