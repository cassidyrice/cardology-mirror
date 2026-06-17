import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL, VIDEO_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact Cardology Pro",
  description:
    "Contact Cardology Pro for reading requests, corrections, Cardology content questions, video questions, partnerships, and public site feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Cardology Pro",
    url: `${SITE_URL}/contact`,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Contact</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Send Cardology Pro corrections, questions, and partnership notes through the public channels.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Use this page to identify the right kind of message for Cardology Pro:
            correction requests, content questions, video questions, or partnership
            inquiries. Official direct intake details can be added here when a public
            inbox or form is configured.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          ["Reading requests", "Include the reading option, birth date, and question or focus area if you are requesting a $99 or $199 personal reading."],
          ["Corrections", "Send the page URL, the sentence or section in question, and the correction or clarification needed."],
          ["Content questions", "Share the card, birthday, calculator, blog guide, or video topic your question is about."],
          ["Partnerships", "Describe the collaboration, audience, timeline, and whether it concerns written guides, tools, or video."],
          ["Video questions", "Use the hosted video channel for playback-specific context and public video links."],
        ].map(([title, body]) => (
          <article key={title} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
            <h2 className="font-serif text-2xl leading-none text-[#14110d]">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
        <h2 className="font-serif text-3xl text-[#14110d]">Public channels</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#5b5148]">
          <li>
            <Link href="/editorial-policy" className="text-[#9e3d24] underline underline-offset-4">
              Editorial policy
            </Link>{" "}
            explains the site&rsquo;s claim boundaries and correction posture.
          </li>
          <li>
            <a href={VIDEO_URL} className="text-[#9e3d24] underline underline-offset-4">
              Hosted video channel
            </a>{" "}
            is the public destination for watching Cardology Pro videos.
          </li>
        </ul>
      </section>
    </SeoShell>
  );
}
