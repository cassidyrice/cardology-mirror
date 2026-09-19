import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OfferCta } from "@/components/seo/OfferCta";
import { SeoShell } from "@/components/seo/SeoShell";
import {
  allBlogPillars,
  blogPillarBySlug,
  blogPillarPath,
  blogPostPath,
  blogPostsForPillar,
  type BlogFaq,
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
    title: pillar.title,
    description: pillar.description,
    alternates: { canonical: blogPillarPath(pillar) },
    openGraph: {
      siteName: SITE_NAME,
      title: pillar.title,
      description: pillar.description,
      url: blogPillarPath(pillar),
      type: "website",
      images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
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
  const jsonLd = [
    {
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
    },
    faqJsonLd(pillar.faqs),
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

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Blog pillar</p>
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          {pillar.title}
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-brand-ink sm:text-2xl">
          {pillar.description}
        </p>
        <div className="mt-6 border border-brand-line bg-brand-paper-deep p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-brand-ink">{pillar.answer}</p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-brand-line bg-brand-paper p-5">
          <p className="oracle-eyebrow mb-2">Definition</p>
          <p className="font-serif text-xl leading-relaxed text-brand-ink">{pillar.definition}</p>
          <p className="mt-4 text-sm leading-relaxed text-brand-ink-soft">{pillar.searchIntent}</p>
        </div>
        <div className="border border-brand-line bg-brand-paper-deep p-5">
          <p className="oracle-eyebrow mb-3">Start here</p>
          <ol className="space-y-3">
            {pillar.startHere.map((link, index) => (
              <li key={link.href} className="flex gap-3">
                <span className="font-serif text-xl text-brand-oxblood">{index + 1}</span>
                <Link href={link.href} className="font-serif text-xl leading-none text-brand-ink hover:text-brand-oxblood">
                  {link.label}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <h2 className="oracle-eyebrow mb-4 mt-12">Guides in this pillar</h2>
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.slug} className="border border-brand-line bg-brand-paper p-5 transition hover:bg-brand-ivory">
              <p className="text-[0.68rem] font-bold uppercase text-brand-oxblood">
                {post.readTime}
              </p>
              <h3 className="mt-2 font-serif text-3xl leading-none text-brand-ink">
                <Link href={blogPostPath(post)} className="hover:text-brand-oxblood">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">{post.dek}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="oracle-eyebrow mb-4">Related tools</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {pillar.relatedTools.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-brand-line bg-brand-paper-deep p-4 text-sm font-bold uppercase text-brand-ink transition hover:bg-brand-ivory"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="oracle-eyebrow mb-4">Glossary</h2>
          <dl className="space-y-4">
            {pillar.glossary.map((item) => (
              <div key={item.term} className="border-t border-brand-line pt-4">
                <dt className="font-serif text-2xl text-brand-ink">
                  {item.href ? <Link href={item.href} className="hover:text-brand-oxblood">{item.term}</Link> : item.term}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-brand-ink-soft">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="oracle-eyebrow mb-4">Related videos</h2>
          <div className="space-y-3">
            {pillar.relatedVideos.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block border border-brand-line bg-brand-paper-deep p-4 transition hover:bg-brand-ivory"
              >
                <span className="font-serif text-xl leading-none text-brand-ink">{link.label}</span>
                {link.note && <span className="mt-1 block text-sm leading-relaxed text-brand-ink-soft">{link.note}</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-4xl leading-none text-brand-ink">Frequently asked questions</h2>
        <FaqList faqs={pillar.faqs} />
      </section>

      <OfferCta className="mt-12" />
    </SeoShell>
  );
}

function FaqList({ faqs }: { faqs: BlogFaq[] }) {
  return (
    <div className="mt-5 space-y-4">
      {faqs.map((faq) => (
        <div key={faq.q} className="border-t border-brand-line pt-4">
          <h3 className="font-serif text-2xl text-brand-ink">{faq.q}</h3>
          <p className="mt-2 text-base leading-relaxed text-brand-ink-soft">{faq.a}</p>
        </div>
      ))}
    </div>
  );
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
