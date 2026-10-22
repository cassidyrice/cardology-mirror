import Link from "next/link";

import { SectionShell } from "@/components/ui";

export function AboutCassSection() {
  return (
    <SectionShell tone="paperDeep" pad="small" width="narrow">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,5rem)_1fr] sm:items-start sm:gap-8">
        <img
          src="/share-cards/faces/8-of-diamonds.png"
          alt="Eight of Diamonds"
          width={1000}
          height={1500}
          loading="lazy"
          decoding="async"
          className="mx-auto w-16 rounded-[3px] border border-brand-line sm:mx-0 sm:w-full"
        />
        <div>
          <h2 className="type-h2">Who did this</h2>
          <p className="mt-4 max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
            I&rsquo;m Cass. At five, someone told me I was the Eight of Diamonds. I never let it go.
            I spent the years since figuring out how the deck actually works, then built the math so
            anyone can check it. The calculation is fixed. The reading is the craft.
          </p>
          <p className="mt-4">
            <Link href="/about" className="editorial-link text-brand-ink">
              More about me, if you&rsquo;re curious →
            </Link>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
