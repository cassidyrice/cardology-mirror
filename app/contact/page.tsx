import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { CONTACT_EMAIL, SITE_URL, VIDEO_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact Card Blueprints",
  description:
    "Contact Card Blueprints for Blueprint support, corrections, Cardology questions, video questions, and partnerships.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Card Blueprints",
    url: `${SITE_URL}/contact`,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <Kicker className="mb-4">Contact</Kicker>
        <h1 className="type-display text-brand-ink">
          Get help with a Blueprint, correction, or partnership.
        </h1>
        <div className="mt-7 border border-brand-line bg-brand-paper-deep p-5 sm:p-6">
          <Kicker className="mb-2">Quick answer</Kicker>
          <p className="text-base leading-relaxed text-brand-ink-soft">
            Buying a Blueprint?{" "}
            <Link href="/products/personal-card-blueprint" className="editorial-link text-brand-ink">
              Review what is included
            </Link>
            . Your report appears immediately after successful checkout and a
            return link is sent to your email.
          </p>
        </div>
      </header>

      <section className="mb-10 border border-brand-line-strong bg-brand-ivory p-5 sm:p-6">
        <h2 className="type-h2 text-brand-ink">Email Card Blueprints</h2>
        <p className="mt-3 max-w-[42rem] text-base leading-relaxed text-brand-ink-soft">
          For purchase support, include the purchase email, offer name, and
          what happened. Never send payment card details. For a correction,
          include the page URL and the passage in question.
        </p>
        <LinkButton href={`mailto:${CONTACT_EMAIL}`} variant="primary" size="large" className="mt-5">
          Email {CONTACT_EMAIL}
        </LinkButton>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          ["Legacy phone-order support", "If access from an earlier purchase is not recognized, include the original checkout email, phone number, and a short description of what happened."],
          ["Blueprint questions", "Ask what the $13 Personal Card Blueprint includes, how birth-date input works, or how to reopen a paid report."],
          ["Corrections", "Send the page URL, the sentence or section in question, and the correction or clarification needed."],
          ["Content questions", "Share the card, birthday, calculator, blog guide, or video topic your question is about."],
          ["Partnerships", "Describe the collaboration, audience, timeline, and whether it concerns written guides, tools, or video."],
          ["Video questions", "Use the hosted video channel for playback-specific context and public video links."],
        ].map(([title, body]) => (
          <article key={title} className="border border-brand-line bg-brand-ivory p-5">
            <h2 className="type-h3 text-brand-ink">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">{body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 border border-brand-line bg-brand-paper-deep p-5 sm:p-6">
        <h2 className="type-h2 text-brand-ink">Public channels</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-brand-ink-soft">
          <li>
            <Link href="/editorial-policy" className="editorial-link text-brand-ink">
              Editorial policy
            </Link>{" "}
            explains how corrections are handled.
          </li>
          <li>
            <a href={VIDEO_URL} className="editorial-link text-brand-ink">
              Hosted video channel
            </a>{" "}
            is the public destination for watching Card Blueprints videos.
          </li>
        </ul>
      </section>
    </SeoShell>
  );
}
