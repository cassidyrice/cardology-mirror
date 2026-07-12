import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import {
  allBlogPosts,
  blogPillarBySlug,
  blogPillarPath,
  blogPostBySlug,
  blogPostPath,
  relatedBlogPosts,
  type BlogFaq,
  type BlogPost,
} from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return allBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) return {};
  const seoTitle = post.seoTitle ?? post.title;

  return {
    title: seoTitle,
    description: post.description,
    alternates: { canonical: blogPostPath(post) },
    keywords: post.keywords,
    openGraph: {
      title: seoTitle,
      description: post.description,
      url: blogPostPath(post),
      type: "article",
      images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: post.description,
      images: ["/og/default.png"],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) notFound();

  const pillar = blogPillarBySlug(post.pillar);
  if (!pillar) notFound();

  const related = relatedBlogPosts(post);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      articleSection: pillar.title,
      keywords: post.keywords.join(", "),
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      image: `${SITE_URL}/og/default.png`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${blogPostPath(post)}` },
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/og/default.png` },
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["[data-ai-summary]", "header p"],
      },
      isPartOf: {
        "@type": "Blog",
        name: `${SITE_NAME} Blog`,
        url: `${SITE_URL}/blog`,
      },
    },
    breadcrumbJsonLd([
      { name: "Home", item: SITE_URL },
      { name: "Blog", item: `${SITE_URL}/blog` },
      { name: pillar.shortTitle, item: `${SITE_URL}${blogPillarPath(pillar)}` },
      { name: post.title, item: `${SITE_URL}${blogPostPath(post)}` },
    ]),
    faqJsonLd(post.faqs),
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
        { label: pillar.shortTitle, href: blogPillarPath(pillar) },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        <header className="max-w-3xl pb-8">
          <p className="oracle-eyebrow mb-4">
            {pillar.title} · {post.readTime}
          </p>
          <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
            {post.dek}
          </p>
          <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5" data-ai-summary>
            <p className="oracle-eyebrow mb-2">Direct answer</p>
            <p className="text-base leading-relaxed text-[#3d352d]">{post.answer}</p>
          </div>
        </header>

        <nav className="mb-10 border-y border-[#14110d]/15 py-4">
          <p className="oracle-eyebrow mb-3">On this page</p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {post.sections.map((section) => (
              <li key={section.heading}>
                <a href={`#${slugify(section.heading)}`} className="text-[#5b5148] underline underline-offset-4 hover:text-[#14110d]">
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          {post.sections.map((section) => (
            <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-10">
              <h2 className="font-serif text-4xl leading-none text-[#14110d]">{section.heading}</h2>
              <div className="mt-4 space-y-4 font-serif text-lg leading-relaxed text-[#3d352d]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.links && section.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#9e3d24] transition hover:bg-[#eadfcd]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <ReadingBridge variant="general" className="mt-12" />

        <section className="mt-12 border-t border-[#14110d]/15 pt-8">
          <h2 className="font-serif text-4xl leading-none text-[#14110d]">Frequently asked questions</h2>
          <FaqList faqs={post.faqs} />
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="card-surface rounded-2xl p-5">
            <p className="font-serif text-base text-bone">Core pages to use next</p>
            <ul className="mt-3 space-y-2 text-sm">
              {post.coreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gold underline underline-offset-4">
                    {link.label}
                  </Link>
                  {link.note && <span className="text-faint"> — {link.note}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
            <p className="oracle-eyebrow mb-3">Related guides</p>
            <ul className="space-y-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={blogPostPath(item)} className="font-serif text-xl leading-none text-[#14110d] hover:text-[#9e3d24]">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-[#5b5148]">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </SeoShell>
  );
}

function FaqList({ faqs }: { faqs: BlogFaq[] }) {
  return (
    <div className="mt-5 space-y-4">
      {faqs.map((faq) => (
        <div key={faq.q} className="border-t border-[#14110d]/15 pt-4">
          <h3 className="font-serif text-2xl text-[#14110d]">{faq.q}</h3>
          <p className="mt-2 text-base leading-relaxed text-[#5b5148]">{faq.a}</p>
        </div>
      ))}
    </div>
  );
}

function breadcrumbJsonLd(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function faqJsonLd(faqs: BlogFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
