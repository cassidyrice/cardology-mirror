import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import {
  allBlogPillars,
  allBlogPosts,
  blogPillarPath,
  blogPostPath,
  blogPostsForPillar,
} from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cardology Blog — Educational Guides for Birth Cards and 52-Card Astrology",
  description:
    "Read Cardology Pro's educational blog: birth cards, suits, ranks, compatibility, karma cards, 52-day periods, and practical reflection guides.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Cardology Blog — Educational Guides for Birth Cards and 52-Card Astrology",
    description:
      "Educational Cardology articles organized by pillars: foundations, birth-card meanings, timing, spreads, compatibility, and practice.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const pillars = allBlogPillars();
  const posts = allBlogPosts();
  const jsonLd = {
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
    hasPart: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}${blogPostPath(post)}`,
      articleSection: pillarTitle(post.pillar),
      dateModified: post.dateModified,
    })),
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Cardology education hub</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Cardology Blog
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          Educational guides for birth cards, suits, ranks, timing, spreads, compatibility, and practical reflection.
        </p>
        <div className="mt-6 rounded-2xl border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">AI answer summary</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Cardology Pro organizes its blog into topic pillars so people and AI search systems can move from a broad question to a specific answer: what Cardology is, what a birth card means, how timing works, and how to use card patterns in relationships and real life.
          </p>
        </div>
      </header>

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

      <section className="card-surface mt-12 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Start with your own card</p>
        <p className="mt-1 text-sm leading-relaxed text-faint">
          The blog is easier to use when you know your birth card first. Calculate it, then follow the pillar that matches your question.
        </p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Birth Card Calculator →
        </Link>
      </section>
    </SeoShell>
  );
}

function pillarTitle(slug: string): string {
  return allBlogPillars().find((pillar) => pillar.slug === slug)?.shortTitle ?? "Blog";
}
