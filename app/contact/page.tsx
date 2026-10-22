import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton } from "@/components/ui";
import { READING_FOLLOW_UP, READING_RESPONSE_TIME, READING_SUPPORT_EMAIL } from "@/lib/readings-nav";
import { CONTACT_EMAIL, CONTACT_RESPONSE, SITE_URL, VIDEO_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact Card Blueprints",
  description:
    "Contact Card Blueprints for Blueprint support, corrections, Cardology questions, video questions, and partnerships. Say it plainly. Someone reads it.",
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
          A question about your reading? Start here.
        </h1>
        <div className="mt-7 border border-brand-line bg-brand-paper-deep p-5 sm:p-6">
          <Kicker className="mb-2">Quick answer</Kicker>
          <p className="text-base leading-relaxed text-brand-ink-soft">
            {READING_FOLLOW_UP} For questions about a Chemistry Check, email <a href={`mailto:${READING_SUPPORT_EMAIL}`} className="editorial-link">{READING_SUPPORT_EMAIL}</a>. {READING_RESPONSE_TIME}
          </p>
        </div>
      </header>

      <section className="mb-10 border border-brand-line-strong bg-brand-ivory p-5 sm:p-6">
        <h2 className="type-h2 text-brand-ink">Other orders, corrections &amp; questions</h2>
        <p className="mt-3 max-w-[42rem] text-base leading-relaxed text-brand-ink-soft">
          For purchase support, include the purchase email, the offer name, and
          what happened. The real version, not the polite one. Never send payment card details. For a correction,
          include the page URL and the passage in question. We answer purchase,
          refund, and delivery mail within {CONTACT_RESPONSE}.
        </p>
        <LinkButton href={`mailto:${CONTACT_EMAIL}`} variant="primary" size="large" className="mt-5">
          Email {CONTACT_EMAIL}
        </LinkButton>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          ["Legacy phone-order support", "If access from an earlier purchase is not recognized, include the original checkout email, phone number, and a short description of what happened. Short. Nobody needs the saga."],
          ["The reading", "The Chemistry Check reads two people’s cards. Shared strengths. Recurring friction. Where your years cross. Yes, you can ask about that part."],
          ["Corrections", "Send the page URL, the sentence or section in question, and the correction or clarification needed. Finally, a use for being right online."],
          ["Content questions", "Name the card, birthday, calculator, blog guide, or video topic your question is about. Vague questions get vague answers."],
          ["Partnerships", "Describe the collaboration, audience, timeline, and whether it concerns written guides, tools, or video. Skip the pitch deck."],
          ["Video questions", "Use the hosted video channel for playback questions and public video links. It is right there."],
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
            explains how corrections are handled. In public. On purpose.
          </li>
          <li>
            <a href={VIDEO_URL} className="editorial-link text-brand-ink">
              Hosted video channel
            </a>{" "}
            is where the Card Blueprints videos live. Go watch one. Then another.
          </li>
        </ul>
      </section>
    </SeoShell>
  );
}
