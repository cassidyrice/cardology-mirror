import Image from "next/image";

import { LinkButton, SectionShell } from "@/components/ui";
import { TESTIMONIALS, testimonialByline } from "@/lib/testimonials";

const TIFFANY = TESTIMONIALS.find((t) => t.author === "Tiffany")!;

/** Spec quote is the short Tiffany line; full review stays in testimonials.ts. */
const TIFFANY_HOME_QUOTE =
  "I bought the Deep Dive, found out I was the Five of Clubs, and a lot of my life stopped looking random.";

export function DeepDiveSection() {
  return (
    <SectionShell tone="paperDeep">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,14rem)_1fr] lg:items-center lg:gap-14">
        <Image
          src="/og/products/deep-dive-cover.png"
          alt="Birth Card Deep Dive PDF cover"
          width={600}
          height={800}
          className="mx-auto w-48 border border-brand-line shadow-[0_12px_40px_rgba(20,17,13,0.14)] lg:mx-0 lg:w-full"
        />
        <div>
          <h2 className="type-h2">Your card, written out. $9.</h2>
          <p className="mt-4 max-w-[34em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
            Seven pages on your card and the full System Guide. Read it in ten minutes, keep it forever.
          </p>
          <figure className="mt-6 max-w-[34em]">
            <blockquote className="text-[0.95rem] leading-relaxed text-brand-ink-soft">
              &ldquo;{TIFFANY_HOME_QUOTE}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-bronze">
              {testimonialByline(TIFFANY)}
            </figcaption>
          </figure>
          <p className="mt-6">
            <LinkButton href="/products/birth-card-deep-dive" variant="accent">
              Get the Deep Dive
            </LinkButton>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
