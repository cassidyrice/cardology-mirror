import Link from "next/link";

import { latestHomeBlogPosts } from "@/lib/home-blog";
import { SectionShell } from "@/components/ui";

export function LatestBlogSection() {
  const posts = latestHomeBlogPosts(3);

  return (
    <SectionShell tone="paper">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="type-h2">Read</h2>
        <Link href="/blog" className="editorial-link text-sm text-brand-ink">
          All articles →
        </Link>
      </div>
      <ul className="mt-8 grid gap-8 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={post.href} className="group block">
              {post.imageSrc ? (
                <img
                  src={post.imageSrc}
                  alt=""
                  width={1200}
                  height={630}
                  loading="lazy"
                  decoding="async"
                  className="mb-4 aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <p className="type-eyebrow text-brand-bronze">{post.category}</p>
              <h3 className="mt-2 font-serif text-xl leading-snug text-brand-ink transition group-hover:text-brand-oxblood">
                {post.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{post.hook}</p>
              <p className="mt-2 text-xs text-brand-ink-faint">{post.readTime}</p>
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
