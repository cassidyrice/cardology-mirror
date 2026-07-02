import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import {
  allBlogPillars,
  allBlogPosts,
  blogPillarPath,
  blogPostPath,
  blogPostsForPillar,
} from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cardology Blog: Birth Cards and 52-Card Astrology",
  description:
    "Read Cardology Pro guides on birth cards, suits, ranks, compatibility, karma cards, famous-person profiles, 52-day periods, and real-life dynamics.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Cardology Blog: Birth Cards and 52-Card Astrology",
    description:
      "Educational Cardology articles organized by pillars: foundations, birth-card meanings, timing, spreads, compatibility, and practice.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const pillars = allBlogPillars();
  const posts = allBlogPosts();
  const faqs = [
    {
      q: "Where should beginners start on the Cardology blog?",
      a: "Start with the Cardology Foundations pillar, then calculate your birth card and read the matching card meaning page.",
    },
    {
      q: "Are Cardology Pro articles predictions?",
      a: "The guides read cards as pattern language for people, relationships, timing, and repeated behavior.",
    },
    {
      q: "How are the Cardology guides organized?",
      a: "The blog is organized into pillars for foundations, birth-card meanings, timing and spreads, and relationships and practice.",
    },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cardology Blog",
      description: metadata.description,
      url: `${SITE_URL}/blog`,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: post.title,
          url: `${SITE_URL}${blogPostPath(post)}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Cardology education hub</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Cardology Blog
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          Guides for birth cards, suits, ranks, timing, famous-person profiles, compatibility, karma cards, and the dynamics people keep repeating.
        </p>
        <div className="mt-6 rounded-2xl border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Start with the basics, then follow the pattern into real life: what a card means, how two cards interact, what a timing card is pressing on, and why the same relationship dynamic keeps showing up.
          </p>
        </div>
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        {[
          ["New to Cardology?", "Start with What Is Cardology.", "/what-is-cardology"],
          ["Know your birthday?", "Use the Birth Card Calculator.", "/birth-card-calculator"],
          ["Comparing two people?", "Use the Compatibility Calculator.", "/birth-card-compatibility-calculator"],
          ["Want it read for you?", "Choose a personal reading.", "/readings"],
        ].map(([label, text, href]) => (
          <Link key={href} href={href} className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 transition hover:bg-[#fffaf0]">
            <span className="oracle-eyebrow block text-[#9e3d24]">{label}</span>
            <span className="mt-2 block font-serif text-xl leading-none text-[#14110d]">{text}</span>
          </Link>
        ))}
      </section>

      <section className="mt-4">
        <h2 className="oracle-eyebrow mb-4">Pillar pages</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Link
              key={pillar.slug}
              href={blogPillarPath(pillar)}
              className="block border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5 transition hover:bg-[#fffaf0]"
            >
              <p className="font-serif text-2xl text-[#14110d]">{pillar.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">{pillar.description}</p>
              <p className="mt-4 text-[0.68rem] font-bold uppercase text-[#9e3d24]">
                {blogPostsForPillar(pillar.slug).length} guides
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="oracle-eyebrow mb-4">Educational articles</h2>
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.slug} className="border-t border-[#14110d]/15 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase text-[#9e3d24]">
                    {pillarTitle(post.pillar)} · {post.readTime}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl leading-none text-[#14110d]">
                    <Link href={blogPostPath(post)} className="hover:text-[#9e3d24]">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5b5148]">
                    {post.description}
                  </p>
                </div>
                <Link href={blogPostPath(post)} className="paper-button small-button shrink-0">
                  Read guide
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ReadingBridge variant="general" className="mt-12" />

      <section className="mt-12 border-t border-[#14110d]/15 pt-8">
        <h2 className="font-serif text-4xl leading-none text-[#14110d]">Frequently asked questions</h2>
        <div className="mt-5 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-[#14110d]/15 pt-4">
              <h3 className="font-serif text-2xl text-[#14110d]">{faq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-[#5b5148]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </SeoShell>
  );
}

function pillarTitle(slug: string): string {
  return allBlogPillars().find((pillar) => pillar.slug === slug)?.shortTitle ?? "Blog";
}
