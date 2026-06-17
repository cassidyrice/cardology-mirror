import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoShell } from "@/components/seo/SeoShell";
import {
  allBlogPillars,
  blogPillarBySlug,
  blogPillarPath,
  blogPostPath,
  blogPostsForPillar,
} from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return allBlogPillars().map((pillar) => ({ slug: pillar.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pillar = blogPillarBySlug(slug);
  if (!pillar) return {};

  return {
    title: `${pillar.title} — Cardology Blog Pillar`,
    description: pillar.description,
    alternates: { canonical: blogPillarPath(pillar) },
    openGraph: {
      title: `${pillar.title} — Cardology Blog Pillar`,
      description: pillar.description,
      url: blogPillarPath(pillar),
      type: "website",
    },
  };
}

export default async function BlogPillarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pillar = blogPillarBySlug(slug);
  if (!pillar) notFound();

  const posts = blogPostsForPillar(pillar.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pillar.title,
    description: pillar.description,
    url: `${SITE_URL}${blogPillarPath(pillar)}`,
    isPartOf: {
      "@type": "Blog",
      name: `${SITE_NAME} Blog`,
      url: `${SITE_URL}/blog`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}${blogPostPath(post)}`,
        name: post.title,
      })),
    },
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
        { label: pillar.shortTitle, href: blogPillarPath(pillar) },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Blog pillar</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          {pillar.title}
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          {pillar.description}
        </p>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Search intent</p>
          <p className="text-base leading-relaxed text-[#3d352d]">{pillar.searchIntent}</p>
        </div>
      </header>

      <section>
        <h2 className="oracle-eyebrow mb-4">Guides in this pillar</h2>
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.slug} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5 transition hover:bg-[#fffaf0]">
              <p className="text-[0.68rem] font-bold uppercase text-[#9e3d24]">
                {post.readTime}
              </p>
              <h3 className="mt-2 font-serif text-3xl leading-none text-[#14110d]">
                <Link href={blogPostPath(post)} className="hover:text-[#9e3d24]">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{post.dek}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="oracle-eyebrow mb-4">Core site pages</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {pillar.coreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </SeoShell>
  );
}
