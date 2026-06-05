import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";

export const metadata: Metadata = {
  title: "Birth Card Compatibility Calculator — Compare Two Cards",
  description:
    "Free birth card compatibility calculator. Enter two birthdays to see both Cardology birth cards and how their patterns connect.",
  alternates: { canonical: "/birth-card-compatibility-calculator" },
  openGraph: {
    title: "Birth Card Compatibility Calculator",
    description: "Enter two birthdays to see both birth cards and how their patterns connect.",
    url: "/birth-card-compatibility-calculator",
  },
};

export default function CompatibilityCalculatorPage() {
  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Compatibility", href: "/cardology-compatibility" },
        { label: "Calculator", href: "/birth-card-compatibility-calculator" },
      ]}
    >
      <h1 className="display mb-3 text-3xl text-bone">Birth Card Compatibility Calculator</h1>
      <p className="prose-reading mb-6 text-mist">
        Enter two birthdays to find both <strong>birth cards</strong> and a first
        read on how they connect. For the full picture of where two patterns
        share a language and where they pull, open the bonds reading.
      </p>

      <CompatibilityCalculator />

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">How to read the result</h2>
        <p className="prose-reading text-mist">
          The calculator shows each person&rsquo;s birth card and whether they share
          a suit. Same suit means a shared first instinct; different suits mean
          you lead from different places. It&rsquo;s a starting point, not a verdict —
          read more about{" "}
          <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">
            how Cardology compatibility works
          </Link>
          .
        </p>
      </section>

      <div className="card-surface mt-8 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Don&rsquo;t know your card yet?</p>
        <Link
          href="/birth-card-calculator"
          className="mt-3 inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold hover:border-gold"
        >
          Birth Card Calculator →
        </Link>
      </div>
    </SeoShell>
  );
}
