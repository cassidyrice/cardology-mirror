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
import { SITE_NAME, SITE_URL, BIRTHDAY_DIRECTORY_PATH, COMPATIBILITY_DIRECTORY_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cardology Blog: Birth Cards and 52-Card Astrology",
  description:
    "Card Blueprints guides on birth cards, suits, ranks, compatibility, karma cards, famous people, 52-day periods, and the dynamics you keep repeating.",
  alternates: { canonical: "/blog" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Blog: Birth Cards and 52-Card Astrology",
    description:
      "Cardology articles by pillar: foundations, birth-card meanings, timing, spreads, compatibility, practice. Start with the one you are avoiding.",
    url: "/blog",
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function BlogIndexPage() {
  const pillars = allBlogPillars();
  const posts = allBlogPosts();
  const faqs = [
    {
      q: "Where should beginners start on the Cardology blog?",
      a: "Start with the Cardology Foundations pillar. Then calculate your birth card. Then read the matching card meaning page. Skip ahead and you end up rereading it anyway.",
    },
    {
      q: "Are Card Blueprints articles predictions?",
      a: "No. The guides read cards as pattern language for people, relationships, timing, and repeated behavior. They describe. They do not schedule.",
    },
    {
      q: "How are the Cardology guides organized?",
      a: "Four pillars. Foundations. Birth-card meanings. Timing and spreads. Relationships and practice. Very organized. Unlike your camera roll.",
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
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-6xl">
          Cardology Blog
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-brand-ink sm:text-2xl">
          Guides for birth cards, suits, ranks, timing, famous-person profiles, compatibility, and karma cards. Plus the dynamics people keep repeating. You know which one is yours.
        </p>
        <div className="mt-6 rounded-2xl border border-brand-line bg-brand-paper-deep p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-brand-ink">
            Start with the basics. Then follow the pattern into real life. What a card means. How two cards interact. What a timing card is pressing on. Why the same relationship dynamic keeps showing up. It is not the other person every time.
          </p>
        </div>
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        {[
          ["New to Cardology?", "Start with the beginners path. No shame.", "/cardology-for-beginners", false],
          ["Find your birth card", "Free calculator. Playing cards, not tarot.", "/birth-card-calculator", false],
          ["Know your birthday?", "Look up any date. Yes, theirs too.", BIRTHDAY_DIRECTORY_PATH, true],
          ["Comparing two people?", "Browse every card pairing. Including that one.", COMPATIBILITY_DIRECTORY_PATH, true],
          ["Playing cards birthday chart", "52-card astrology and the full date grid.", "/52-card-astrology-explained", false],
          ["Bring it back to your life", "The Chemistry Check: two people’s cards, read together, by Cass.", "/#readings", false],
        ].map(([label, text, href, external]) =>
          external ? (
            <a
              key={String(href)}
              href={String(href)}
              className="border border-brand-line bg-brand-paper-deep p-4 transition hover:bg-brand-ivory"
            >
              <span className="oracle-eyebrow block text-brand-oxblood">{label}</span>
              <span className="mt-2 block font-serif text-xl leading-none text-brand-ink">{text}</span>
            </a>
          ) : (
            <Link
              key={String(href)}
              href={String(href)}
              className="border border-brand-line bg-brand-paper-deep p-4 transition hover:bg-brand-ivory"
            >
              <span className="oracle-eyebrow block text-brand-oxblood">{label}</span>
              <span className="mt-2 block font-serif text-xl leading-none text-brand-ink">{text}</span>
            </Link>
          ),
        )}
      </section>

      <section className="mt-4">
        <h2 className="oracle-eyebrow mb-4">Pillar pages. Start with one.</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Link
              key={pillar.slug}
              href={blogPillarPath(pillar)}
              className="block border border-brand-line bg-brand-paper p-5 transition hover:bg-brand-ivory"
            >
              <p className="font-serif text-2xl text-brand-ink">{pillar.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{pillar.description}</p>
              <p className="mt-4 text-[0.68rem] font-bold uppercase text-brand-oxblood">
                {blogPostsForPillar(pillar.slug).length} guides
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="oracle-eyebrow mb-4">Every guide. Pick the one that stings.</h2>
        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.slug} className="border-t border-brand-line pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase text-brand-oxblood">
                    {pillarTitle(post.pillar)} · {post.readTime}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl leading-none text-brand-ink">
                    <Link href={blogPostPath(post)} className="hover:text-brand-oxblood">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink-soft">
                    {post.description}
                  </p>
                </div>
                <Link href={blogPostPath(post)} className="paper-button small-button shrink-0">
                  Read this one
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section className="mt-12 border-t border-brand-line pt-8">
        <h2 className="font-serif text-4xl leading-none text-brand-ink">Frequently asked questions</h2>
        <div className="mt-5 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-brand-line pt-4">
              <h3 className="font-serif text-2xl text-brand-ink">{faq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-brand-ink-soft">{faq.a}</p>
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
